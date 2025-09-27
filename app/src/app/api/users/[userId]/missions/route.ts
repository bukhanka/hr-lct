import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { userId } = await params;
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can only see their own missions, or architects can see any user's missions
    if ((session as any)?.user?.id !== userId && (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let userMissions = await prisma.userMission.findMany({
      where: { userId },
      include: {
        mission: {
          include: {
            campaign: true,
            competencies: {
              include: {
                competency: true
              }
            },
            dependenciesFrom: true,
            dependenciesTo: true
          }
        }
      },
      orderBy: { mission: { positionY: "asc" } }
    });

    // Auto-initialize user in campaigns if no missions found
    if (userMissions.length === 0) {
      console.log(`[API] Auto-initializing user ${userId} in campaigns...`);
      
      // Get all missions from all campaigns
      const allMissions = await prisma.mission.findMany({
        include: {
          dependenciesTo: true
        },
        orderBy: { positionY: "asc" }
      });

      // Create user missions for all missions
      const userMissionData = allMissions.map(mission => ({
        userId,
        missionId: mission.id,
        status: mission.dependenciesTo.length === 0 ? "AVAILABLE" : "LOCKED"
      }));

      if (userMissionData.length > 0) {
        await prisma.userMission.createMany({
          data: userMissionData,
          skipDuplicates: true
        });

        // Fetch the newly created user missions
        userMissions = await prisma.userMission.findMany({
          where: { userId },
          include: {
            mission: {
              include: {
                campaign: true,
                competencies: {
                  include: {
                    competency: true
                  }
                },
                dependenciesFrom: true,
                dependenciesTo: true
              }
            }
          },
          orderBy: { mission: { positionY: "asc" } }
        });
      }
    }

    return NextResponse.json(userMissions);
  } catch (error) {
    console.error("Error fetching user missions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
