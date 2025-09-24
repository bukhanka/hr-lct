import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { MissionStatus } from "@/generated/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id: missionId } = await params;
    
    if (!session || session.user.role !== "cadet") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { submission } = body;

    // Get the mission details
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        competencies: {
          include: {
            competency: true
          }
        }
      }
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    // Check if user has access to this mission
    const userMission = await prisma.userMission.findUnique({
      where: {
        userId_missionId: {
          userId: session.user.id,
          missionId: missionId
        }
      }
    });

    if (!userMission) {
      return NextResponse.json({ error: "Mission not accessible" }, { status: 403 });
    }

    if (userMission.status === MissionStatus.COMPLETED) {
      return NextResponse.json({ error: "Mission already completed" }, { status: 400 });
    }

    if (userMission.status === MissionStatus.LOCKED) {
      return NextResponse.json({ error: "Mission is locked" }, { status: 400 });
    }

    // Determine the new status based on confirmation type
    const newStatus = mission.confirmationType === "AUTO" 
      ? MissionStatus.COMPLETED 
      : MissionStatus.PENDING_REVIEW;

    // Update the user mission
    const updatedUserMission = await prisma.userMission.update({
      where: {
        userId_missionId: {
          userId: session.user.id,
          missionId: missionId
        }
      },
      data: {
        status: newStatus,
        submission: submission || null,
        completedAt: newStatus === MissionStatus.COMPLETED ? new Date() : null
      }
    });

    // If auto-completed, update user stats and unlock next missions
    if (newStatus === MissionStatus.COMPLETED) {
      await processCompletedMission(session.user.id, mission);
    }

    return NextResponse.json(updatedUserMission);
  } catch (error) {
    console.error("Error submitting mission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function processCompletedMission(userId: string, mission: any) {
  // Update user experience and mana
  await prisma.user.update({
    where: { id: userId },
    data: {
      experience: { increment: mission.experienceReward },
      mana: { increment: mission.manaReward }
    }
  });

  // Update user competencies
  for (const missionComp of mission.competencies) {
    await prisma.userCompetency.upsert({
      where: {
        userId_competencyId: {
          userId: userId,
          competencyId: missionComp.competencyId
        }
      },
      update: {
        points: { increment: missionComp.points }
      },
      create: {
        userId: userId,
        competencyId: missionComp.competencyId,
        points: missionComp.points
      }
    });
  }

  // Find and unlock dependent missions
  const dependentMissions = await prisma.missionDependency.findMany({
    where: { sourceMissionId: mission.id },
    include: {
      targetMission: {
        include: {
          dependenciesTo: {
            include: {
              sourceMission: {
                include: {
                  userMissions: {
                    where: { userId: userId }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  for (const dependency of dependentMissions) {
    const targetMission = dependency.targetMission;
    
    // Check if all dependencies are completed
    const allDependenciesCompleted = targetMission.dependenciesTo.every(dep => 
      dep.sourceMission.userMissions.some(um => 
        um.userId === userId && um.status === MissionStatus.COMPLETED
      )
    );

    if (allDependenciesCompleted) {
      // Unlock the target mission
      await prisma.userMission.upsert({
        where: {
          userId_missionId: {
            userId: userId,
            missionId: targetMission.id
          }
        },
        update: {
          status: MissionStatus.AVAILABLE
        },
        create: {
          userId: userId,
          missionId: targetMission.id,
          status: MissionStatus.AVAILABLE
        }
      });
    }
  }
}
