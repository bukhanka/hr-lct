import { NextResponse } from "next/server";
import { THEME_PRESETS } from "@/data/theme-presets";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { funnelType, personaId, preferredThemeId } = body || {};

    // Find matching theme preset
    const preset = preferredThemeId
      ? THEME_PRESETS.find((theme) => theme.id === preferredThemeId)
      : THEME_PRESETS.find((theme) =>
          funnelType ? theme.recommendedFunnel.includes(funnelType) : true
        ) || THEME_PRESETS[0]; // Fallback to first theme

    // Simulate AI processing delay
    const responseDelay = 800 + Math.random() * 1200;
    await new Promise((resolve) => setTimeout(resolve, responseDelay));

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      personaId,
      suggestion: {
        ...preset.config,
        // Optionally adapt to persona if provided
        personas: personaId ? [personaId] : preset.config.personas,
      },
    });
  } catch (error) {
    console.error("[api/ai/theme-suggestion] error", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}


