import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/campaigns/[id]/ranks/[rankId]
 * Update a specific rank
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rankId: string }> }
) {
  try {
    const { rankId } = await params;
    const body = await req.json();

    const {
      level,
      name,
      title,
      description,
      iconUrl,
      minExperience,
      minMissions,
      requiredCompetencies,
      rewards,
    } = body;

    // Check if rank exists
    const existingRank = await prisma.rank.findUnique({
      where: { id: rankId },
    });

    if (!existingRank) {
      return NextResponse.json({ error: "Rank not found" }, { status: 404 });
    }

    // Update rank
    const updatedRank = await prisma.rank.update({
      where: { id: rankId },
      data: {
        ...(level !== undefined && { level: parseInt(level) }),
        ...(name !== undefined && { name }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(iconUrl !== undefined && { iconUrl }),
        ...(minExperience !== undefined && { minExperience: parseInt(minExperience) }),
        ...(minMissions !== undefined && { minMissions: parseInt(minMissions) }),
        ...(requiredCompetencies !== undefined && { requiredCompetencies }),
        ...(rewards !== undefined && { rewards }),
      },
    });

    return NextResponse.json(updatedRank);
  } catch (error) {
    console.error("Error updating rank:", error);
    return NextResponse.json(
      { error: "Failed to update rank" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/campaigns/[id]/ranks/[rankId]
 * Delete a specific rank
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rankId: string }> }
) {
  try {
    const { rankId } = await params;

    // Check if rank exists
    const existingRank = await prisma.rank.findUnique({
      where: { id: rankId },
    });

    if (!existingRank) {
      return NextResponse.json({ error: "Rank not found" }, { status: 404 });
    }

    await prisma.rank.delete({
      where: { id: rankId },
    });

    return NextResponse.json({
      message: "Rank deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting rank:", error);
    return NextResponse.json(
      { error: "Failed to delete rank" },
      { status: 500 }
    );
  }
}

