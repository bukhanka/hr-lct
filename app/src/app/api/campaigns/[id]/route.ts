import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  console.log("=== CAMPAIGNS GET STARTED ===");
  try {
    const session = await getServerSession(authConfig);
    const { id } = await params;
    console.log("CAMPAIGNS GET session:", (session as { user?: { id: string; role: string } })?.user);
    console.log("[api/campaigns/[id]][GET] incoming request", {
      campaignId: id,
      hasSession: !!session,
      sessionUserId: (session as { user?: { id: string; role: string } })?.user?.id,
      sessionRole: (session as { user?: { id: string; role: string } })?.user?.role,
    });
    
    if (!session) {
      console.warn("[api/campaigns/[id]][GET] unauthorized", {
        campaignId: id,
      });
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
    console.log("[api/campaigns/[id]][GET] fetched campaign", {
      campaignId: id,
      missionCount: campaign?.missions.length,
    });

    if (!campaign) {
      console.warn("[api/campaigns/[id]][GET] campaign not found", {
        campaignId: id,
      });
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[api/campaigns/[id]][GET] error fetching campaign", error);
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
    console.log("[api/campaigns/[id]][PUT] incoming request", {
      campaignId: id,
      hasSession: !!session,
      sessionUserId: (session as { user?: { id: string; role: string } })?.user?.id,
      sessionRole: (session as { user?: { id: string; role: string } })?.user?.role,
    });
    
    if (!session || (session as { user: { role: string } }).user.role !== "architect") {
      console.warn("[api/campaigns/[id]][PUT] permission denied", {
        campaignId: id,
        reason: !session ? "NO_SESSION" : "ROLE_MISMATCH",
        sessionRole: (session as { user?: { id: string; role: string } })?.user?.role,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, theme, startDate, endDate } = body;
    console.log("[api/campaigns/[id]][PUT] updating campaign", {
      campaignId: id,
      payload: { name, hasDescription: !!description, hasTheme: !!theme, startDate, endDate },
    });

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
    console.log("[api/campaigns/[id]][PUT] campaign updated", {
      campaignId: id,
      missionCount: campaign.missions.length,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[api/campaigns/[id]][PUT] error updating campaign", error);
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
    console.log("[api/campaigns/[id]][DELETE] incoming request", {
      campaignId: id,
      hasSession: !!session,
      sessionUserId: (session as { user?: { id: string; role: string } })?.user?.id,
      sessionRole: (session as { user?: { id: string; role: string } })?.user?.role,
    });
    
    if (!session || (session as { user: { role: string } }).user.role !== "architect") {
      console.warn("[api/campaigns/[id]][DELETE] permission denied", {
        campaignId: id,
        reason: !session ? "NO_SESSION" : "ROLE_MISMATCH",
        sessionRole: (session as { user?: { id: string; role: string } })?.user?.role,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.campaign.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/campaigns/[id]][DELETE] error deleting campaign", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
