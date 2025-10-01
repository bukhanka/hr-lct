import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/campaigns/[id]/assets/upload - Upload files
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params;
    const formData = await request.formData();
    
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    // TODO: Upload to storage (S3, Cloudinary, etc.)
    // TODO: Save metadata to database
    // For MVP, we'll just return a mock success response

    const mockAsset = {
      id: `asset_${Date.now()}`,
      campaignId,
      type,
      fileName: file.name,
      fileUrl: `/uploads/${campaignId}/${file.name}`, // Mock URL
      fileSize: file.size,
      generatedBy: "manual",
      usedIn: [],
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(mockAsset, { status: 201 });
  } catch (error) {
    console.error("[Upload API] Error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
