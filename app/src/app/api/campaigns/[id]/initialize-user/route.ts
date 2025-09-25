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
    const { id: campaignId } = await params;
    
    if (!session || (session as { user: { role: string } }).user.role !== "cadet") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    // Use session user ID if not provided
    const targetUserId = userId || (session as { user: { id: string } }).user.id;

    // Get all missions for this campaign
    const missions = await prisma.mission.findMany({
      where: { campaignId },
      include: {
        dependenciesTo: true // Dependencies that this mission depends on
      },
      orderBy: { positionY: "asc" }
    });

    if (missions.length === 0) {
      return NextResponse.json({ error: "No missions found in campaign" }, { status: 404 });
    }

    // Create or update user missions
    const userMissions = [];
    
    for (const mission of missions) {
      // Determine initial status
      let status: MissionStatus;
      
      if (mission.dependenciesTo.length === 0) {
        // No dependencies, so it's available
        status = MissionStatus.AVAILABLE;
      } else {
        // Has dependencies, so it's locked initially
        status = MissionStatus.LOCKED;
      }

      // Create or update the user mission
      const userMission = await prisma.userMission.upsert({
        where: {
          userId_missionId: {
            userId: targetUserId,
            missionId: mission.id
          }
        },
        update: {
          // Don't update status if mission already exists and is completed
          status: status === MissionStatus.AVAILABLE ? MissionStatus.AVAILABLE : undefined
        },
        create: {
          userId: targetUserId,
          missionId: mission.id,
          status: status
        },
        include: {
          mission: {
            include: {
              campaign: true,
              competencies: {
                include: {
                  competency: true
                }
              }
            }
          }
        }
      });

      userMissions.push(userMission);
    }

    return NextResponse.json({
      success: true,
      message: `Initialized ${userMissions.length} missions for user`,
      userMissions
    });
  } catch (error) {
    console.error("Error initializing user missions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
