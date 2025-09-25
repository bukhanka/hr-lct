import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session || (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { sourceMissionId, targetMissionId } = body;

    if (!sourceMissionId || !targetMissionId) {
      return NextResponse.json(
        { error: "Source and target mission IDs are required" },
        { status: 400 }
      );
    }

    // Check if dependency already exists
    const existingDependency = await prisma.missionDependency.findFirst({
      where: {
        sourceMissionId,
        targetMissionId
      }
    });

    if (existingDependency) {
      return NextResponse.json(
        { error: "Dependency already exists" },
        { status: 400 }
      );
    }

    const dependency = await prisma.missionDependency.create({
      data: {
        sourceMissionId,
        targetMissionId
      },
      include: {
        sourceMission: true,
        targetMission: true
      }
    });

    return NextResponse.json(dependency);
  } catch (error) {
    console.error("Error creating mission dependency:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session || (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sourceMissionId = searchParams.get("sourceMissionId");
    const targetMissionId = searchParams.get("targetMissionId");

    if (!sourceMissionId || !targetMissionId) {
      return NextResponse.json(
        { error: "Source and target mission IDs are required" },
        { status: 400 }
      );
    }

    await prisma.missionDependency.deleteMany({
      where: {
        sourceMissionId,
        targetMissionId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting mission dependency:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
