import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session || (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await seedDatabase();
    
    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: result
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
