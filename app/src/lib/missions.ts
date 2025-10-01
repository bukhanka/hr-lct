import { prisma } from "@/lib/prisma";
import { MissionStatus } from "@/generated/prisma";

/**
 * Unlocks missions that depend on the completed mission
 * Creates NEW_MISSION_AVAILABLE notifications for unlocked missions
 */
export async function unlockDependentMissions(userId: string, completedMissionId: string) {
  // Find missions that depend on the completed mission
  const directDependencies = await prisma.missionDependency.findMany({
    where: { sourceMissionId: completedMissionId },
    select: {
      targetMissionId: true,
      targetMission: true
    }
  });

  if (directDependencies.length === 0) {
    return [];
  }

  const targetMissionIds = Array.from(new Set(directDependencies.map(dep => dep.targetMissionId)));
  const unlockedMissions: string[] = [];

  // For each target mission, check if ALL its dependencies are completed
  for (const targetId of targetMissionIds) {
    // Get all dependencies for this target mission
    const allDependencies = await prisma.missionDependency.findMany({
      where: { targetMissionId: targetId },
      select: { sourceMissionId: true }
    });

    const requiredMissionIds = allDependencies.map(dep => dep.sourceMissionId);

    // Check user's completion status for all required missions
    const userMissionStatuses = await prisma.userMission.findMany({
      where: {
        userId,
        missionId: { in: requiredMissionIds }
      },
      select: {
        missionId: true,
        status: true
      }
    });

    const statusByMissionId = new Map(userMissionStatuses.map(um => [um.missionId, um.status]));

    // Check if ALL dependencies are COMPLETED
    const allDependenciesCompleted = requiredMissionIds.every(
      missionId => statusByMissionId.get(missionId) === MissionStatus.COMPLETED
    );

    if (allDependenciesCompleted) {
      // Unlock the mission
      const unlockedMission = await prisma.userMission.upsert({
        where: {
          userId_missionId: {
            userId,
            missionId: targetId
          }
        },
        update: {
          status: MissionStatus.AVAILABLE
        },
        create: {
          userId,
          missionId: targetId,
          status: MissionStatus.AVAILABLE
        },
        include: {
          mission: true
        }
      });

      unlockedMissions.push(targetId);

      // Create notification for unlocked mission
      await prisma.userNotification.create({
        data: {
          userId,
          type: "NEW_MISSION_AVAILABLE",
          title: "Новая миссия доступна!",
          message: `Миссия "${unlockedMission.mission.name}" теперь доступна для прохождения`,
          metadata: {
            missionId: targetId,
            missionName: unlockedMission.mission.name
          }
        }
      });
    }
  }

  return unlockedMissions;
}

/**
 * Awards experience, mana, and competency points for completing a mission
 */
export async function awardMissionRewards(userId: string, mission: any) {
  // Update user experience and mana
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      experience: { increment: mission.experienceReward || 0 },
      mana: { increment: mission.manaReward || 0 }
    }
  });

  // Award competency points
  if (mission.competencies && mission.competencies.length > 0) {
    for (const competency of mission.competencies) {
      await prisma.userCompetency.upsert({
        where: {
          userId_competencyId: {
            userId: userId,
            competencyId: competency.competencyId
          }
        },
        update: {
          points: { increment: competency.points }
        },
        create: {
          userId: userId,
          competencyId: competency.competencyId,
          points: competency.points
        }
      });
    }
  }

  // Create notification for mission completion
  await prisma.userNotification.create({
    data: {
      userId,
      type: "MISSION_COMPLETED",
      title: "Миссия выполнена!",
      message: `Вы получили ${mission.experienceReward} опыта и ${mission.manaReward} маны`,
      metadata: {
        missionId: mission.id,
        missionName: mission.name,
        experienceReward: mission.experienceReward,
        manaReward: mission.manaReward
      }
    }
  });

  return updatedUser;
}
