import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQRCode, generateQRData } from "@/lib/qr-generator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/missions/[id]/qr-code - Generate QR code for offline mission
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: missionId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "image"; // 'image' or 'data'
    const eventId = searchParams.get("eventId");

    // Get mission to verify it's an offline event
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    if (mission.missionType !== "ATTEND_OFFLINE") {
      return NextResponse.json(
        { error: "QR codes are only for offline missions" },
        { status: 400 }
      );
    }

    if (format === "data") {
      // Return QR data as JSON
      const qrData = generateQRData(missionId, eventId || undefined);
      return NextResponse.json(qrData);
    } else {
      // Generate and return QR code image
      const qrCodeDataUrl = await generateQRCode(missionId, eventId || undefined);

      // Return as image
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
