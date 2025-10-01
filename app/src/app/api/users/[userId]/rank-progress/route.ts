import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { getUserRankProgress, checkAndPromoteRank } from "@/lib/ranks";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// GET /api/users/[userId]/rank-progress - Get user rank progress
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    const rankProgress = await getUserRankProgress(userId);

    if (!rankProgress) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(rankProgress);
  } catch (error) {
    console.error("Error fetching rank progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/users/[userId]/rank-progress - Manually trigger rank check
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    const rankResult = await checkAndPromoteRank(userId);

    if (!rankResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(rankResult);
  } catch (error) {
    console.error("Error checking rank:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}