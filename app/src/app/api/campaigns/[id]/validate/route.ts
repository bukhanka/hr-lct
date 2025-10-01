import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  missionId?: string;
  missionName?: string;
  suggestion?: string;
}

// POST /api/campaigns/[id]/validate - Validate campaign structure
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get campaign with missions and dependencies
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        missions: {
          include: {
            dependenciesFrom: true,
            dependenciesTo: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const issues: ValidationIssue[] = [];

    // Check 1: Empty campaign
    if (campaign.missions.length === 0) {
      issues.push({
        type: 'warning',
        severity: 'high',
        message: 'Кампания не содержит миссий',
        suggestion: 'Добавьте хотя бы одну миссию для запуска кампании',
      });
    }

    // Check 2: Orphaned missions (missions with no incoming or outgoing connections)
    const connectedMissionIds = new Set<string>();
    campaign.missions.forEach((mission) => {
      mission.dependenciesFrom.forEach(dep => {
        connectedMissionIds.add(dep.sourceMissionId);
        connectedMissionIds.add(dep.targetMissionId);
      });
    });

    const orphanedMissions = campaign.missions.filter(
      (mission) => 
        campaign.missions.length > 1 && 
        !connectedMissionIds.has(mission.id)
    );

    orphanedMissions.forEach((mission) => {
      issues.push({
        type: 'warning',
        severity: 'medium',
        message: `Миссия "${mission.name}" не связана с другими миссиями`,
        missionId: mission.id,
        missionName: mission.name,
        suggestion: 'Создайте зависимости для формирования воронки',
      });
    });

    // Check 3: Circular dependencies
    const detectCycles = () => {
      const graph = new Map<string, string[]>();
      campaign.missions.forEach((mission) => {
        graph.set(mission.id, mission.dependenciesFrom.map(dep => dep.targetMissionId));
      });

      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      const cycles: string[][] = [];

      const dfs = (missionId: string, path: string[]): boolean => {
        if (recursionStack.has(missionId)) {
          const cycleStart = path.indexOf(missionId);
          cycles.push(path.slice(cycleStart));
          return true;
        }

        if (visited.has(missionId)) {
          return false;
        }

        visited.add(missionId);
        recursionStack.add(missionId);
        path.push(missionId);

        const neighbors = graph.get(missionId) || [];
        for (const neighbor of neighbors) {
          dfs(neighbor, [...path]);
        }

        recursionStack.delete(missionId);
        return false;
      };

      campaign.missions.forEach((mission) => {
        if (!visited.has(mission.id)) {
          dfs(mission.id, []);
        }
      });

      return cycles;
    };

    const cycles = detectCycles();
    if (cycles.length > 0) {
      cycles.forEach((cycle, index) => {
        const missionNames = cycle.map(id => 
          campaign.missions.find(m => m.id === id)?.name || id
        ).join(' → ');
        
        issues.push({
          type: 'error',
          severity: 'critical',
          message: `Обнаружена циклическая зависимость: ${missionNames}`,
          suggestion: 'Удалите одну из зависимостей для разрыва цикла',
        });
      });
    }

    // Check 4: Missions with no rewards
    const missionsWithNoRewards = campaign.missions.filter(
      (mission) => mission.experienceReward === 0 && mission.manaReward === 0
    );

    if (missionsWithNoRewards.length > 0) {
      missionsWithNoRewards.forEach((mission) => {
        issues.push({
          type: 'warning',
          severity: 'low',
          message: `Миссия "${mission.name}" не даёт наград`,
          missionId: mission.id,
          missionName: mission.name,
          suggestion: 'Добавьте XP илиману для мотивации пользователей',
        });
      });
    }

    // Check 5: Entry points (missions with no dependencies)
    const entryPointMissions = campaign.missions.filter(
      (mission) => mission.dependenciesTo.length === 0
    );

    if (entryPointMissions.length === 0 && campaign.missions.length > 0) {
      issues.push({
        type: 'error',
        severity: 'high',
        message: 'Нет стартовой миссии (все миссии имеют зависимости)',
        suggestion: 'Создайте хотя бы одну миссию без входящих зависимостей',
      });
    } else if (entryPointMissions.length > 5) {
      issues.push({
        type: 'info',
        severity: 'low',
        message: `Много стартовых миссий (${entryPointMissions.length})`,
        suggestion: 'Рассмотрите объединение некоторых путей для лучшего UX',
      });
    }

    // Check 6: Dead ends (missions with no outgoing connections)
    const deadEndMissions = campaign.missions.filter(
      (mission) => mission.dependenciesFrom.length === 0 && campaign.missions.length > 1
    );

    if (deadEndMissions.length > 3) {
      issues.push({
        type: 'info',
        severity: 'low',
        message: `Много финальных миссий (${deadEndMissions.length})`,
        suggestion: 'Рассмотрите создание единой финальной миссии',
      });
    }

    // Check 7: Missing descriptions
    const missionsWithoutDescription = campaign.missions.filter(
      (mission) => !mission.description || mission.description.trim() === ''
    );

    if (missionsWithoutDescription.length > 0) {
      missionsWithoutDescription.forEach((mission) => {
        issues.push({
          type: 'warning',
          severity: 'low',
          message: `Миссия "${mission.name}" не имеет описания`,
          missionId: mission.id,
          missionName: mission.name,
          suggestion: 'Добавьте описание для лучшего понимания пользователями',
        });
      });
    }

    // Calculate overall health score
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;

    const healthScore = Math.max(0, 100 - (
      criticalCount * 30 + 
      highCount * 15 + 
      mediumCount * 5 + 
      lowCount * 2
    ));

    return NextResponse.json({
      isValid: criticalCount === 0 && highCount === 0,
      healthScore,
      issues,
      summary: {
        totalMissions: campaign.missions.length,
        totalIssues: issues.length,
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        entryPoints: entryPointMissions.length,
        deadEnds: deadEndMissions.length,
        orphaned: orphanedMissions.length,
      },
    });
  } catch (error) {
    console.error("Error validating campaign:", error);
    return NextResponse.json(
      { error: "Failed to validate campaign" },
      { status: 500 }
    );
  }
}
