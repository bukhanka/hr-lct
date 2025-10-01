import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { generateNarrative, NarrativeRequest } from "@/lib/ai/text-generator";

// POST /api/ai/generate-narrative - Generate campaign narrative using Gemini AI
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as NarrativeRequest;

    if (!body.campaignType || !body.theme) {
      return NextResponse.json(
        { error: "Campaign type and theme are required" },
        { status: 400 }
      );
    }

    const result = await generateNarrative(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating narrative:", error);
    return NextResponse.json(
      { error: "Failed to generate narrative" },
      { status: 500 }
    );
  }
}
