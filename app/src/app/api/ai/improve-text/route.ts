import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { improveText, TextImproveRequest } from "@/lib/ai/text-generator";

// POST /api/ai/improve-text - Improve text using Gemini AI
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as TextImproveRequest;

    if (!body.text || body.text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const result = await improveText(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error improving text:", error);
    return NextResponse.json(
      { error: "Failed to improve text" },
      { status: 500 }
    );
  }
}
