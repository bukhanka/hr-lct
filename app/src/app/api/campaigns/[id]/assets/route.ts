import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/campaigns/[id]/assets - Get all assets for campaign
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params;

    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // For MVP, return mock data
    // In production, this would query a CampaignAsset table
    const mockAssets = [
      {
        id: "asset_1",
        type: "image",
        fileName: "mission_icon_space.svg",
        fileUrl: "/themes/galactic-academy/icon.svg",
        fileSize: 12500,
        generatedBy: "ai_gemini",
        usedIn: ["mission_1", "mission_3"],
        createdAt: new Date().toISOString(),
      },
      {
        id: "asset_2",
        type: "image",
        fileName: "campaign_background.jpg",
        fileUrl: "/themes/galactic-academy/background.svg",
        fileSize: 450000,
        generatedBy: "manual",
        usedIn: ["campaign_theme"],
        createdAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      assets: mockAssets,
      total: mockAssets.length,
    });
  } catch (error) {
    console.error("[Assets API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

// POST /api/campaigns/[id]/assets - Create new asset (from AI generation)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json();

    const { type, fileUrl, fileName, generatedBy, prompt } = body;

    // TODO: Save to database
    // const asset = await prisma.campaignAsset.create({
    //   data: {
    //     campaignId,
    //     type,
    //     fileUrl,
    //     fileName,
    //     fileSize: 0, // Would be calculated from actual file
    //     generatedBy,
    //     prompt,
    //     usedIn: [],
    //   },
    // });

    // Mock response for MVP
    const mockAsset = {
      id: `asset_${Date.now()}`,
      campaignId,
      type,
      fileUrl,
      fileName,
      fileSize: 100000,
      generatedBy,
      prompt,
      usedIn: [],
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(mockAsset, { status: 201 });
  } catch (error) {
    console.error("[Assets API] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 }
    );
  }
}
