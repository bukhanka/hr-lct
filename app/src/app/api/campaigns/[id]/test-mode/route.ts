import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { initializeTestMode } from "@/lib/testMode";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  console.log("=== TEST-MODE POST STARTED ===");
  let campaignId: string = "";
  let userId: string = "u-architect-1"; // Fixed mock user for demo
  let session: any;
  
  try {
    console.log("[DEBUG] Getting server session...");
    session = await getServerSession(authConfig);
    console.log("[DEBUG] Session result:", JSON.stringify(session, null, 2));
    
    console.log("[DEBUG] Awaiting params...");
    const paramsData = await params;
    campaignId = paramsData.id;
    console.log("[DEBUG] Campaign ID from params:", campaignId);
    
    console.log("TEST-MODE session:", (session as any)?.user);
    console.log("[api/campaigns/[id]/test-mode][POST] incoming request", {
      campaignId,
      hasSession: !!session,
      sessionUserId: (session as any)?.user.id,
      sessionRole: (session as any)?.user.role,
      fullSession: session,
    });
    
    console.log("[api/campaigns/[id]/test-mode][POST] initializing test mode", {
      campaignId,
      userId: userId,
      sessionData: (session as any)?.user || "no session",
    });
    // Check database connection first
    try {
      console.log("[DEBUG] Checking database connection...");
      await prisma.$queryRaw`SELECT 1`;
      console.log("[DEBUG] Database connection OK");
    } catch (dbError) {
      console.error("[DEBUG] Database connection ERROR:", dbError);
      throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }

    console.log("[DEBUG] About to call initializeTestMode...");
    const initialized = await initializeTestMode(userId, campaignId);
    console.log("[DEBUG] initializeTestMode completed, result:", JSON.stringify(initialized, null, 2));

    if (initialized.missions.length === 0) {
      console.warn("[api/campaigns/[id]/test-mode][POST] no missions found", {
        campaignId,
        userId: userId,
      });
      return NextResponse.json({ error: "No missions found in campaign" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Test mode initialized with ${initialized.missions.length} missions`,
      state: initialized
    });
  } catch (error) {
    console.error("[DEBUG] CRITICAL ERROR in test-mode POST:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      meta: (error as any)?.meta,
      campaignId,
      userId: userId || "unknown",
    });
    console.error("[api/campaigns/[id]/test-mode][POST] error initializing test mode", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
        debugInfo: {
          campaignId,
          userId: userId,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params;
    const userId = "u-architect-1"; // Fixed mock user for demo
    
    console.log("[api/campaigns/[id]/test-mode][DELETE] incoming request", {
      campaignId,
      userId: userId,
    });

    const missions = await prisma.mission.findMany({
      where: { campaignId },
      select: { id: true }
    });

    await prisma.userMission.deleteMany({
      where: {
        userId: userId,
        missionId: {
          in: missions.map(m => m.id)
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Test mode cleared"
    });
  } catch (error) {
    console.error("[api/campaigns/[id]/test-mode][DELETE] error clearing test mode", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
