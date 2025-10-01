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
    console.log("CAMPAIGNS GET session:", (session as any)?.user);
    console.log("[api/campaigns/[id]][GET] incoming request", {
      campaignId: id,
      hasSession: !!session,
      sessionUserId: (session as any)?.user.id,
      sessionRole: (session as any)?.user.role,
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
      hasThemeConfig: !!campaign?.themeConfig,
      themeConfig: campaign?.themeConfig,
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
      sessionUserId: (session as any)?.user.id,
      sessionRole: (session as any)?.user.role,
    });
    
    if (!session || (session as any)?.user?.role !== "architect") {
      console.warn("[api/campaigns/[id]][PUT] permission denied", {
        campaignId: id,
        reason: !session ? "NO_SESSION" : "ROLE_MISMATCH",
        sessionRole: (session as any)?.user.role,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      theme, 
      themeConfig, 
      startDate, 
      endDate,
      // Business Context fields
      businessGoal,
      targetAudience,
      successMetrics,
      companyContext,
      briefCompleted,
    } = body;
    console.log("[api/campaigns/[id]][PUT] updating campaign", {
      campaignId: id,
      payload: { 
        name, 
        hasDescription: !!description, 
        hasTheme: !!theme, 
        hasThemeConfig: !!themeConfig, 
        startDate, 
        endDate,
        hasBriefData: !!(businessGoal || targetAudience || successMetrics || companyContext),
        briefCompleted,
      },
      themeConfig,
    });

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        name,
        description,
        theme,
        themeConfig,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        // Business Context
        businessGoal: businessGoal !== undefined ? businessGoal : undefined,
        targetAudience: targetAudience !== undefined ? targetAudience : undefined,
        successMetrics: successMetrics !== undefined ? successMetrics : undefined,
        companyContext: companyContext !== undefined ? companyContext : undefined,
        briefCompleted: briefCompleted !== undefined ? briefCompleted : undefined,
      },
      include: {
        missions: true
      }
    });
    console.log("[api/campaigns/[id]][PUT] campaign updated", {
      campaignId: id,
      missionCount: campaign.missions.length,
      hasThemeConfig: !!campaign.themeConfig,
      themeConfigSaved: campaign.themeConfig,
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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id } = await params;
    
    if (!session || (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    // Проверяем уникальность slug
    const existing = await prisma.campaign.findUnique({
      where: { slug },
    });

    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: "Этот slug уже используется другой кампанией" },
        { status: 409 }
      );
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: { slug },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[api/campaigns/[id]][PATCH] error updating slug", error);
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
      sessionUserId: (session as any)?.user.id,
      sessionRole: (session as any)?.user.role,
    });
    
    if (!session || (session as any)?.user?.role !== "architect") {
      console.warn("[api/campaigns/[id]][DELETE] permission denied", {
        campaignId: id,
        reason: !session ? "NO_SESSION" : "ROLE_MISMATCH",
        sessionRole: (session as any)?.user.role,
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
