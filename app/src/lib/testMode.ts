import { prisma } from "@/lib/prisma";
import { MissionStatus, UserRole } from "@/generated/prisma";
import type { Prisma } from "@prisma/client";
import type { TestModeState, TestMissionStatus, TestModeSummary, TestModeMission } from "@/types/testMode";

type MissionWithCompetencies = Awaited<ReturnType<typeof prisma.mission.findUnique>>;

const CAMPAIGN_MISSION_INCLUDE = {
  dependenciesFrom: {
    include: {
      targetMission: true
    }
  },
  dependenciesTo: {
    include: {
      sourceMission: {
        include: {
          userMissions: true
        }
      }
    }
  },
  competencies: {
    include: {
      competency: true
    }
  }
} as any; // satisfies Prisma.MissionInclude;

const TEST_USER_MISSION_INCLUDE = {
  mission: {
    include: {
      dependenciesFrom: {
        include: {
          targetMission: true
        }
      },
      dependenciesTo: {
        include: {
          sourceMission: {
            include: {
              userMissions: true
            }
          }
        }
      },
      competencies: {
        include: {
          competency: true
        }
      }
    }
  }
} as any; // satisfies Prisma.UserMissionInclude;

export async function applyMissionCompletion(
  userId: string,
  mission: MissionWithCompetencies | null,
  options?: { awardRewards?: boolean }
) {
  if (!mission) {
    return;
  }

  const shouldAward = options?.awardRewards ?? true;

  if (shouldAward) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        experience: { increment: mission.experienceReward },
        mana: { increment: mission.manaReward }
      }
    });

    for (const missionComp of (mission as any)?.competencies ?? []) {
      await prisma.userCompetency.upsert({
        where: {
          userId_competencyId: {
            userId,
            competencyId: missionComp.competencyId
          }
        },
        update: {
          points: { increment: missionComp.points }
        },
        create: {
          userId,
          competencyId: missionComp.competencyId,
          points: missionComp.points
        }
      });
    }
  }

  const dependentMissions = await prisma.missionDependency.findMany({
    where: { sourceMissionId: mission.id },
    include: {
      targetMission: CAMPAIGN_MISSION_INCLUDE
    }
  });

  for (const dependency of dependentMissions) {
    const targetMission = dependency.targetMission;
    const allDependenciesCompleted = (targetMission as any)?.dependenciesTo?.every((dep: any) =>
      (dep as any)?.sourceMission?.userMissions?.some((um: any) =>
        um.userId === userId && um.status === MissionStatus.COMPLETED
      )
    );

    if (allDependenciesCompleted) {
      await prisma.userMission.upsert({
        where: {
          userId_missionId: {
            userId,
            missionId: targetMission.id
          }
        },
        update: {
          status: MissionStatus.AVAILABLE
        },
        create: {
          userId,
          missionId: targetMission.id,
          status: MissionStatus.AVAILABLE
        }
      });
    }
  }
}

export async function initializeTestMode(userId: string, campaignId: string): Promise<TestModeState> {
  console.log("[DEBUG] Starting transaction for initializeTestMode");
  return prisma.$transaction(async tx => {
    console.log("[lib/testMode] initializeTestMode start", {
      userId,
      campaignId,
    });
    
    console.log("[DEBUG] Querying user record...");
    let userRecord = await tx.user.findUnique({
      where: { id: userId }
    });
    console.log("[DEBUG] User query result:", JSON.stringify(userRecord, null, 2));
    
    if (!userRecord) {
      console.log("[lib/testMode] User not found, creating mock user for test mode", {
        userId,
        campaignId,
      });
      
      // Create mock user for test mode
      userRecord = await tx.user.create({
        data: {
          id: userId,
          email: "architect@example.com", // Mock email
          displayName: "Елена Архитектор", // Mock name - correct field name
          role: UserRole.ARCHITECT, // Use enum value
          experience: 0,
          mana: 100
        }
      });
      
      console.log("[lib/testMode] Created mock user:", {
        userId: userRecord.id,
        displayName: userRecord.displayName,
        role: userRecord.role,
      });
    } else {
      console.log("[lib/testMode] initializeTestMode found existing user", {
        userId,
        campaignId,
        role: userRecord.role,
        experience: userRecord.experience,
      });
    }
    console.log("[DEBUG] Querying missions for campaign...");
    const missions = await tx.mission.findMany({
      where: { campaignId },
      include: CAMPAIGN_MISSION_INCLUDE,
      orderBy: { positionY: "asc" }
    });
    console.log("[DEBUG] Missions query result:", {
      missionCount: missions.length,
      missionIds: missions.map(m => m.id),
      campaignId: campaignId
    });
    console.log("[lib/testMode] initializeTestMode loaded missions", {
      userId,
      campaignId,
      missionCount: missions.length,
    });

    if (missions.length === 0) {
      console.warn("[lib/testMode] initializeTestMode no missions", {
        userId,
        campaignId,
      });
      return { missions: [], summary: emptySummary() } satisfies TestModeState;
    }

    console.log("[DEBUG] Starting Promise.all for mission processing...");
    await Promise.all(
      missions.map(async (mission, index) => {
        console.log(`[DEBUG] Processing mission ${index + 1}/${missions.length}: ${mission.id}`);
        console.log("[lib/testMode] initializeTestMode processing mission", {
          userId,
          campaignId,
          missionId: mission.id,
          missionName: mission.name,
          dependencyCount: mission.dependenciesTo.length,
        });
        const isRoot = mission.dependenciesTo.length === 0;
        const defaultStatus = isRoot ? MissionStatus.AVAILABLE : MissionStatus.LOCKED;
        console.log(`[DEBUG] Mission ${mission.id} - isRoot: ${isRoot}, defaultStatus: ${defaultStatus}`);

        console.log(`[DEBUG] Checking existing userMission for mission ${mission.id}...`);
        const existing = await tx.userMission.findUnique({
          where: {
            userId_missionId: {
              userId,
              missionId: mission.id
            }
          }
        });
        console.log(`[DEBUG] Existing userMission result for ${mission.id}:`, existing);

        const nextStatus = existing && existing.status !== MissionStatus.LOCKED
          ? existing.status
          : defaultStatus;
        console.log("[lib/testMode] initializeTestMode upserting userMission", {
          userId,
          missionId: mission.id,
          defaultStatus,
          existingStatus: existing?.status,
          nextStatus,
        });

        try {
          console.log(`[DEBUG] About to upsert userMission for ${mission.id}...`);
          const upsertResult = await tx.userMission.upsert({
            where: {
              userId_missionId: {
                userId,
                missionId: mission.id
              }
            },
            update: {
              status: nextStatus,
              ...(nextStatus === MissionStatus.COMPLETED
                ? {}
                : {
                    startedAt: null,
                    completedAt: null,
                    submission: null
                  })
            },
            create: {
              userId,
              missionId: mission.id,
              status: nextStatus
            }
          });
          console.log(`[DEBUG] Upsert successful for ${mission.id}:`, upsertResult);
        } catch (error) {
          console.error(`[DEBUG] ERROR during upsert for mission ${mission.id}:`, error);
          throw error;
        }
      })
    );
    console.log("[DEBUG] Promise.all completed successfully");

    console.log("[DEBUG] Getting final test mode state...");
    const state = await getTestModeState(userId, campaignId, tx);
    console.log("[DEBUG] Final state result:", JSON.stringify(state, null, 2));
    console.log("[lib/testMode] initializeTestMode returning state", {
      userId,
      campaignId,
      summary: state.summary,
    });
    return state;
  }, {
    timeout: 30000, // 30 second timeout
  }).catch(error => {
    console.error("[DEBUG] TRANSACTION ERROR in initializeTestMode:", {
      error: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      userId,
      campaignId
    });
    throw error;
  });
}

export async function getTestModeState(
  userId: string,
  campaignId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<TestModeState> {
  console.log("[lib/testMode] getTestModeState called", {
    userId,
    campaignId,
    inTransaction: client !== prisma,
  });
  
  console.log("[DEBUG] Querying userMissions...");
  const missionsRaw = await client.userMission.findMany({
    where: {
      userId,
      mission: { campaignId }
    },
    include: TEST_USER_MISSION_INCLUDE,
    orderBy: {
      mission: {
        positionY: "asc"
      }
    }
  });
  console.log("[DEBUG] UserMissions query result:", {
    count: missionsRaw.length,
    userMissionIds: missionsRaw.map(m => m.id)
  });

  console.log("[DEBUG] Mapping missions...");
  const missions: TestModeMission[] = missionsRaw.map((mission, index) => {
    console.log(`[DEBUG] Mapping mission ${index + 1}/${missionsRaw.length}: ${mission.mission?.name || 'UNNAMED'}`);
    return {
      id: mission.id,
      missionId: mission.missionId,
      status: mission.status as TestMissionStatus,
      mission: {
        id: mission.mission.id,
        name: mission.mission.name,
        description: mission.mission.description,
        missionType: mission.mission.missionType,
        experienceReward: mission.mission.experienceReward ?? 0,
        manaReward: mission.mission.manaReward ?? 0,
        confirmationType: mission.mission.confirmationType,
        minRank: mission.mission.minRank,
        dependenciesFrom: mission.mission.dependenciesFrom,
        dependenciesTo: mission.mission.dependenciesTo,
        competencies: mission.mission.competencies?.map(comp => ({
          competencyId: comp.competencyId,
          competency: comp.competency,
          points: comp.points ?? 0
        })) ?? []
      }
    };
  });

  console.log("[DEBUG] Computing summary...");
  const summary = summarizeMissions(missions);
  console.log("[lib/testMode] getTestModeState computed state", {
    userId,
    campaignId,
    missionCount: missions.length,
    summary,
  });
  return { missions, summary };
}

function summarizeMissions(missions: TestModeState["missions"]): TestModeSummary {
  return missions.reduce<TestModeSummary>(
    (acc, mission) => {
      acc.total += 1;
      switch (mission.status) {
        case MissionStatus.COMPLETED:
          acc.completed += 1;
          break;
        case MissionStatus.AVAILABLE:
          acc.available += 1;
          break;
        case MissionStatus.LOCKED:
          acc.locked += 1;
          break;
        default:
          acc.pending += 1;
      }
      return acc;
    },
    emptySummary()
  );
}

function emptySummary(): TestModeSummary {
  return {
    total: 0,
    completed: 0,
    available: 0,
    locked: 0,
    pending: 0
  };
}
