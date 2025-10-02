import { prisma } from "@/lib/prisma";

/**
 * Get ranks for user (campaign-specific or global)
 * @param userId - User ID
 * @param campaignId - Optional campaign ID to get campaign-specific ranks
 */
async function getRanksForUser(userId: string, campaignId?: string | null) {
  if (campaignId) {
    // Try to get campaign-specific ranks
    const campaignRanks = await prisma.rank.findMany({
      where: { campaignId },
      orderBy: { level: "asc" },
    });

    if (campaignRanks.length > 0) {
      return campaignRanks;
    }
  }

  // Fallback to global ranks
  return prisma.rank.findMany({
    where: { campaignId: null },
    orderBy: { level: "asc" },
  });
}

/**
 * Check if user can rank up and promote them automatically
 * Creates notifications for rank-up or readiness to rank up
 * @param userId - User ID
 * @param campaignId - Optional campaign ID to use campaign-specific ranks
 */
export async function checkAndPromoteRank(userId: string, campaignId?: string | null) {
  // Get current user data with competencies
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      competencies: {
        include: {
          competency: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  // Get ranks for this user/campaign
  const allRanks = await getRanksForUser(userId, campaignId);
  
  // Get next rank
  const nextRank = allRanks.find(r => r.level === user.currentRank + 1);

  if (!nextRank) {
    // User is already at max rank
    return null;
  }

  // Check experience requirement
  const hasEnoughExperience = user.experience >= nextRank.minExperience;

  // Check missions requirement
  const completedMissionsCount = await prisma.userMission.count({
    where: {
      userId,
      status: "COMPLETED"
    }
  });
  const hasEnoughMissions = completedMissionsCount >= nextRank.minMissions;

  // Check competency requirements
  let hasRequiredCompetencies = true;
  if (nextRank.requiredCompetencies && typeof nextRank.requiredCompetencies === 'object') {
    const requiredComps = nextRank.requiredCompetencies as Record<string, number>;
    
    for (const [compName, requiredPoints] of Object.entries(requiredComps)) {
      const userComp = user.competencies.find(uc => uc.competency.name === compName);
      if (!userComp || userComp.points < requiredPoints) {
        hasRequiredCompetencies = false;
        break;
      }
    }
  }

  const canPromote = hasEnoughExperience && hasEnoughMissions && hasRequiredCompetencies;

  if (canPromote) {
    // Promote user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        currentRank: nextRank.level,
        // Award rank-up rewards if any
        ...(nextRank.rewards && typeof nextRank.rewards === 'object' 
          ? {
              mana: { 
                increment: (nextRank.rewards as any).mana || 0 
              }
            }
          : {})
      }
    });

    // Create RANK_UP notification
    await prisma.userNotification.create({
      data: {
        userId,
        type: "RANK_UP",
        title: `Поздравляем! Новый ранг: ${nextRank.name}`,
        message: `Вы достигли ранга "${nextRank.name}" - ${nextRank.title}!`,
        metadata: {
          rankId: nextRank.id,
          rankLevel: nextRank.level,
          rankName: nextRank.name,
          rankTitle: nextRank.title,
          rewards: nextRank.rewards
        }
      }
    });

    return {
      promoted: true,
      newRank: nextRank,
      user: updatedUser
    };
  } else {
    // Check if user is close to ranking up and notify
    if (hasEnoughExperience && hasEnoughMissions && !hasRequiredCompetencies) {
      // User needs only competencies
      const existingNotification = await prisma.userNotification.findFirst({
        where: {
          userId,
          type: "RANK_UP",
          isRead: false,
          metadata: {
            path: ["readyToPromote"],
            equals: true
          }
        }
      });

      if (!existingNotification) {
        await prisma.userNotification.create({
          data: {
            userId,
            type: "RANK_UP",
            title: "Почти готовы к повышению!",
            message: `Прокачайте компетенции для достижения ранга "${nextRank.name}"`,
            metadata: {
              rankId: nextRank.id,
              rankName: nextRank.name,
              readyToPromote: true,
              missingCompetencies: nextRank.requiredCompetencies
            }
          }
        });
      }
    }

    return {
      promoted: false,
      nextRank,
      requirements: {
        experience: {
          current: user.experience,
          required: nextRank.minExperience,
          met: hasEnoughExperience
        },
        missions: {
          current: completedMissionsCount,
          required: nextRank.minMissions,
          met: hasEnoughMissions
        },
        competencies: {
          met: hasRequiredCompetencies,
          required: nextRank.requiredCompetencies
        }
      }
    };
  }
}

/**
 * Get all ranks with user's progress
 * @param userId - User ID
 * @param campaignId - Optional campaign ID to get campaign-specific ranks
 */
export async function getUserRankProgress(userId: string, campaignId?: string | null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      competencies: {
        include: {
          competency: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  const ranks = await getRanksForUser(userId, campaignId);

  // Count missions for this campaign if specified
  const completedMissionsCount = await prisma.userMission.count({
    where: {
      userId,
      status: "COMPLETED",
      ...(campaignId && {
        mission: {
          campaignId,
        },
      }),
    },
  });

  const currentRank = ranks.find(r => r.level === user.currentRank);
  const nextRank = ranks.find(r => r.level === user.currentRank + 1);

  // Build competencies map
  const competenciesMap: Record<string, number> = {};
  user.competencies.forEach(uc => {
    competenciesMap[uc.competency.name] = uc.points;
  });

  // Check if ready for promotion to next rank
  let isReadyForPromotion = false;
  const missingRequirements: string[] = [];

  if (nextRank) {
    const hasEnoughExperience = user.experience >= nextRank.minExperience;
    const hasEnoughMissions = completedMissionsCount >= nextRank.minMissions;

    if (!hasEnoughExperience) {
      missingRequirements.push(`Нужно ещё ${nextRank.minExperience - user.experience} опыта`);
    }

    if (!hasEnoughMissions) {
      missingRequirements.push(`Нужно выполнить ещё ${nextRank.minMissions - completedMissionsCount} миссий`);
    }

    let hasRequiredCompetencies = true;
    if (nextRank.requiredCompetencies && typeof nextRank.requiredCompetencies === 'object') {
      const requiredComps = nextRank.requiredCompetencies as Record<string, number>;
      
      for (const [compName, requiredPoints] of Object.entries(requiredComps)) {
        const userPoints = competenciesMap[compName] || 0;
        if (userPoints < requiredPoints) {
          hasRequiredCompetencies = false;
          missingRequirements.push(`${compName}: ${userPoints}/${requiredPoints} очков`);
        }
      }
    }

    isReadyForPromotion = hasEnoughExperience && hasEnoughMissions && hasRequiredCompetencies;
  }

  return {
    currentRank: currentRank || null,
    nextRank: nextRank || null,
    progress: {
      experience: user.experience || 0,
      missionsCompleted: completedMissionsCount || 0,
      competencies: competenciesMap,
      nextRankExperience: nextRank?.minExperience || 0,
      nextRankMissions: nextRank?.minMissions || 0,
      progressPercentage: nextRank ? Math.min(100, (user.experience / nextRank.minExperience) * 100) : 100
    },
    isReadyForPromotion,
    missingRequirements,
    campaignId: campaignId || null,
    isCustomRanks: campaignId ? ranks.some(r => r.campaignId === campaignId) : false,
    allRanks: ranks.map(rank => {
      const isUnlocked = rank.level <= user.currentRank;
      const hasEnoughExperience = user.experience >= rank.minExperience;
      const hasEnoughMissions = completedMissionsCount >= rank.minMissions;

      let hasRequiredCompetencies = true;
      if (rank.requiredCompetencies && typeof rank.requiredCompetencies === 'object') {
        const requiredComps = rank.requiredCompetencies as Record<string, number>;
        
        for (const [compName, requiredPoints] of Object.entries(requiredComps)) {
          const userComp = user.competencies.find(uc => uc.competency.name === compName);
          if (!userComp || userComp.points < requiredPoints) {
            hasRequiredCompetencies = false;
            break;
          }
        }
      }

      return {
        ...rank,
        isUnlocked,
        isCurrent: rank.level === user.currentRank,
        canUnlock: hasEnoughExperience && hasEnoughMissions && hasRequiredCompetencies,
        progress: {
          experience: {
            current: user.experience,
            required: rank.minExperience,
            percentage: Math.min(100, (user.experience / rank.minExperience) * 100)
          },
          missions: {
            current: completedMissionsCount,
            required: rank.minMissions,
            percentage: Math.min(100, (completedMissionsCount / rank.minMissions) * 100)
          },
          competencies: hasRequiredCompetencies
        }
      };
    })
  };
}
