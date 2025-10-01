import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma";

/**
 * GET /api/users/leaderboard
 * Returns global leaderboard sorted by experience
 * Optional query params:
 * - limit: number of users to return (default: 50)
 * - campaignId: filter by specific campaign
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const campaignId = searchParams.get("campaignId");

    // Build where clause
    const where: any = {
      role: UserRole.CADET, // Only show cadets in leaderboard
    };

    // If campaignId is specified, only show users who have missions in that campaign
    if (campaignId) {
      where.userMissions = {
        some: {
          mission: {
            campaignId: campaignId,
          },
        },
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        displayName: true,
        experience: true,
        currentRank: true,
        avatarUrl: true,
        userMissions: {
          where: {
            status: "COMPLETED",
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        experience: "desc",
      },
      take: limit,
    });

    // Format response
    const leaderboard = users.map((user, index) => ({
      id: user.id,
      displayName: user.displayName || "Кадет",
      experience: user.experience,
      currentRank: user.currentRank,
      avatarUrl: user.avatarUrl,
      completedMissions: user.userMissions.length,
      position: index + 1,
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("[API] Failed to fetch leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

