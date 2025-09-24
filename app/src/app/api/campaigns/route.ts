import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await prisma.campaign.findMany({
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
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    console.log("[API /api/campaigns] session", session?.user?.id, session?.user?.role);
    
    if (!session || session.user.role !== "architect") {
      console.warn("[API /api/campaigns] forbidden", { hasSession: Boolean(session), role: session?.user?.role });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, theme, startDate, endDate } = body;
    console.log("[API /api/campaigns] payload", body);

    if (!name) {
      return NextResponse.json(
        { error: "Campaign name is required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
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

    console.log("[API /api/campaigns] created", campaign.id);

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[API /api/campaigns] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
