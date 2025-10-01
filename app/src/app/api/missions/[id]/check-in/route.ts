import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseQRData, verifyQRData, QRPayload } from "@/lib/qr-generator";
import { awardMissionRewards, unlockDependentMissions } from "@/lib/missions";
import { checkAndPromoteRank } from "@/lib/ranks";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/missions/[id]/check-in - Check in to offline mission using QR code
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: missionId } = await params;
    const body = await request.json();
    const { qrData, userId } = body;

    // For officers checking in users
    const targetUserId = userId || (session as any).user.id;

    // Verify user has permission (either checking themselves in, or is an officer)
    if (
      targetUserId !== (session as any).user.id &&
      (session as any).user.role !== "OFFICER" &&
      (session as any).user.role !== "ARCHITECT"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get mission
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        competencies: {
          include: {
            competency: true,
          },
        },
      },
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    if (mission.missionType !== "ATTEND_OFFLINE") {
      return NextResponse.json(
        { error: "This mission is not an offline event" },
        { status: 400 }
      );
    }

    // Parse and verify QR data if provided
    if (qrData) {
      let parsedQR: QRPayload | null = null;

      if (typeof qrData === "string") {
        parsedQR = parseQRData(qrData);
      } else {
        parsedQR = qrData as QRPayload;
      }

      if (!parsedQR) {
        return NextResponse.json(
          { error: "Invalid QR code format" },
          { status: 400 }
        );
      }

      // Verify QR signature and expiration
      const payload = mission.payload as any;
      const checkInWindow = payload?.checkInWindow || 24 * 60 * 60 * 1000; // Default 24 hours

      const verification = verifyQRData(parsedQR, { maxAge: checkInWindow });

      if (!verification.valid) {
        return NextResponse.json(
          { error: verification.error || "Invalid QR code" },
          { status: 400 }
        );
      }

      // Verify mission ID matches
      if (parsedQR.missionId !== missionId) {
        return NextResponse.json(
          { error: "QR code is for a different mission" },
          { status: 400 }
        );
      }
    }

    // Check if user already completed this mission
    const existingUserMission = await prisma.userMission.findUnique({
      where: {
        userId_missionId: {
          userId: targetUserId,
          missionId: missionId,
        },
      },
    });

    if (existingUserMission?.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Mission already completed" },
        { status: 400 }
      );
    }

    // Mark mission as completed
    const userMission = await prisma.userMission.upsert({
      where: {
        userId_missionId: {
          userId: targetUserId,
          missionId: missionId,
        },
      },
      update: {
        status: "COMPLETED",
        completedAt: new Date(),
        submission: {
          type: "check-in",
          attendedAt: new Date().toISOString(),
          checkedInBy: (session as any).user.id,
          qrVerified: !!qrData,
        },
      },
      create: {
        userId: targetUserId,
        missionId: missionId,
        status: "COMPLETED",
        completedAt: new Date(),
        submission: {
          type: "check-in",
          attendedAt: new Date().toISOString(),
          checkedInBy: (session as any).user.id,
          qrVerified: !!qrData,
        },
      },
    });

    // Award rewards
    await awardMissionRewards(targetUserId, mission);

    // Unlock dependent missions
    const unlockedMissions = await unlockDependentMissions(targetUserId, missionId);

    // Check and promote rank
    const rankResult = await checkAndPromoteRank(targetUserId);

    return NextResponse.json({
      success: true,
      userMission,
      unlockedMissions: unlockedMissions.length,
      rankUp: rankResult?.promoted || false,
      newRank: rankResult?.promoted ? rankResult.newRank : undefined,
    });
  } catch (error) {
    console.error("Error checking in to mission:", error);
    return NextResponse.json(
      { error: "Failed to check in" },
      { status: 500 }
    );
  }
}
