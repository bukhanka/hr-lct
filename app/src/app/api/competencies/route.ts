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

    const competencies = await prisma.competency.findMany({
      orderBy: { name: "asc" }
    });

    return NextResponse.json(competencies);
  } catch (error) {
    console.error("Error fetching competencies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session || (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, iconUrl } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Competency name is required" },
        { status: 400 }
      );
    }

    const competency = await prisma.competency.create({
      data: {
        name,
        iconUrl
      }
    });

    return NextResponse.json(competency);
  } catch (error) {
    console.error("Error creating competency:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
