import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const available = searchParams.get("available");

    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (available === "true") {
      where.isAvailable = true;
    }

    const items = await prisma.storeItem.findMany({
      where,
      orderBy: [
        { category: "asc" },
        { price: "asc" }
      ]
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching store items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
