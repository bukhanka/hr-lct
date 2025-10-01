/**
 * A/B Testing utilities for campaign variants
 */

import { prisma } from "./prisma";

/**
 * Assign user to campaign variant using balanced distribution
 */
export async function assignUserToVariant(userId: string, campaignId: string) {
  // Check if already assigned
  const existing = await prisma.userCampaignVariant.findUnique({
    where: {
      userId_campaignId: {
        userId,
        campaignId,
      },
    },
  });

  if (existing) {
    return existing;
  }

  // Get campaign and variants
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      variants: {
        where: { isActive: true },
      },
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // If no variants, assign to original
  if (campaign.variants.length === 0) {
    return prisma.userCampaignVariant.create({
      data: {
        userId,
        campaignId,
      },
    });
  }

  // Balanced distribution
  const allCampaigns = [campaign, ...campaign.variants];
  const distribution = await Promise.all(
    allCampaigns.map(async (c) => ({
      campaignId: c.id,
      count: await prisma.userCampaignVariant.count({
        where: { campaignId: c.id },
      }),
    }))
  );

  const targetCampaign = distribution.reduce((min, curr) =>
    curr.count < min.count ? curr : min
  );

  return prisma.userCampaignVariant.create({
    data: {
      userId,
      campaignId: targetCampaign.campaignId,
    },
  });
}

/**
 * Get variant analytics
 */
export async function getVariantAnalytics(variantId: string) {
  const userMissions = await prisma.userMission.findMany({
    where: {
      mission: {
        campaignId: variantId,
      },
    },
    include: {
      mission: true,
    },
  });

  const uniqueUsers = new Set(userMissions.map((um) => um.userId)).size;
  const completedMissions = userMissions.filter(
    (um) => um.status === "COMPLETED"
  ).length;
  const totalMissions = userMissions.length;

  const completionRate =
    totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

  const completedWithTime = userMissions.filter(
    (um) => um.status === "COMPLETED" && um.startedAt && um.completedAt
  );

  const avgTimeToComplete =
    completedWithTime.length > 0
      ? completedWithTime.reduce((sum, um) => {
          const time =
            new Date(um.completedAt!).getTime() -
            new Date(um.startedAt!).getTime();
          return sum + time;
        }, 0) / completedWithTime.length
      : 0;

  return {
    uniqueUsers,
    totalMissions,
    completedMissions,
    completionRate: Math.round(completionRate * 100) / 100,
    avgTimeToCompleteMs: Math.round(avgTimeToComplete),
    avgTimeToCompleteHours: Math.round(avgTimeToComplete / 1000 / 60 / 60),
  };
}

/**
 * Compare variants and determine winner
 */
export async function compareVariants(campaignId: string) {
  const variants = await prisma.campaign.findMany({
    where: {
      OR: [{ id: campaignId }, { parentCampaignId: campaignId }],
    },
  });

  const analytics = await Promise.all(
    variants.map(async (variant) => ({
      variant,
      analytics: await getVariantAnalytics(variant.id),
    }))
  );

  // Sort by completion rate
  analytics.sort(
    (a, b) => b.analytics.completionRate - a.analytics.completionRate
  );

  const winner = analytics[0];
  const improvement =
    analytics.length > 1
      ? ((winner.analytics.completionRate - analytics[1].analytics.completionRate) /
          analytics[1].analytics.completionRate) *
        100
      : 0;

  return {
    winner: winner.variant,
    winnerAnalytics: winner.analytics,
    improvement: Math.round(improvement * 100) / 100,
    allVariants: analytics,
  };
}

/**
 * Calculate statistical significance (Chi-square test)
 */
export function calculateSignificance(
  variant1: { completed: number; total: number },
  variant2: { completed: number; total: number }
): { significant: boolean; pValue: number; confidence: number } {
  // Chi-square test for proportions
  const n1 = variant1.total;
  const n2 = variant2.total;
  const p1 = variant1.completed / n1;
  const p2 = variant2.completed / n2;

  if (n1 === 0 || n2 === 0) {
    return { significant: false, pValue: 1, confidence: 0 };
  }

  const pooledP = (variant1.completed + variant2.completed) / (n1 + n2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));
  const z = Math.abs((p1 - p2) / se);

  // Approximate p-value from z-score
  const pValue = 2 * (1 - normalCDF(z));
  const confidence = (1 - pValue) * 100;

  return {
    significant: pValue < 0.05,
    pValue: Math.round(pValue * 10000) / 10000,
    confidence: Math.round(confidence * 100) / 100,
  };
}

// Helper: Normal CDF approximation
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}
