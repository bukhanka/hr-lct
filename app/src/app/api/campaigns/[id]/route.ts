import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id } = await params;
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        missions: {
          include: {
            dependenciesFrom: true,
            dependenciesTo: true,
            competencies: {
              include: {
                competency: true
              }
            }
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id } = await params;
    
    if (!session || session.user.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, theme, startDate, endDate } = body;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        name,
        description,
        theme,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        missions: true
      }
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id } = await params;
    
    if (!session || session.user.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.campaign.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
