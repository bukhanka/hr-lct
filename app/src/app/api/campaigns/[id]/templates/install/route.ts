import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/campaigns/[id]/templates/install - Install template
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      );
    }

    // TODO: Load template definition from database or config
    // TODO: Copy all template assets to campaign
    // TODO: Update campaign theme config with template assets

    // Mock template installation
    const templateAssets = {
      "space-academy": [
        { type: "image", fileName: "icon_mission_1.svg", fileUrl: "/themes/galactic-academy/icon.svg" },
        { type: "image", fileName: "icon_mission_2.svg", fileUrl: "/themes/galactic-academy/icon.svg" },
        { type: "audio", fileName: "bg_music.mp3", fileUrl: "/sounds/space_ambient.mp3" },
      ],
      "corporate-track": [
        { type: "image", fileName: "corporate_bg.jpg", fileUrl: "/themes/corporate-metropolis/background.svg" },
        { type: "audio", fileName: "corporate_music.mp3", fileUrl: "/sounds/corporate.mp3" },
      ],
    };

    const assets = templateAssets[templateId as keyof typeof templateAssets] || [];

    return NextResponse.json({
      success: true,
      message: "Template installed successfully",
      assetsInstalled: assets.length,
      assets,
    });
  } catch (error) {
    console.error("[Template Install] Error:", error);
    return NextResponse.json(
      { error: "Failed to install template" },
      { status: 500 }
    );
  }
}
