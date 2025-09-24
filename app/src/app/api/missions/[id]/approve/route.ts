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
    
    if (!session || session.user.role !== "officer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, approved, comment } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

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

    // Get the user mission
    const userMission = await prisma.userMission.findUnique({
      where: {
        userId_missionId: {
          userId: userId,
          missionId: missionId
        }
      }
    });

    if (!userMission) {
      return NextResponse.json({ error: "User mission not found" }, { status: 404 });
    }

    if (userMission.status !== MissionStatus.PENDING_REVIEW) {
      return NextResponse.json({ error: "Mission is not pending review" }, { status: 400 });
    }

    // Update the mission status
    const newStatus = approved ? MissionStatus.COMPLETED : MissionStatus.AVAILABLE;
    
    const updatedUserMission = await prisma.userMission.update({
      where: {
        userId_missionId: {
          userId: userId,
          missionId: missionId
        }
      },
      data: {
        status: newStatus,
        completedAt: approved ? new Date() : null,
        submission: comment ? { 
          ...userMission.submission as any, 
          officerComment: comment 
        } : userMission.submission
      }
    });

    // If approved, process rewards and unlock next missions
    if (approved) {
      await processCompletedMission(userId, mission);
    }

    return NextResponse.json(updatedUserMission);
  } catch (error) {
    console.error("Error approving mission:", error);
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
