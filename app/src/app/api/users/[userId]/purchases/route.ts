import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { userId } = await params;
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can only see their own purchases, or architects can see any user's purchases
    if ((session as any)?.user?.id !== userId && (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const purchases = await prisma.userPurchase.findMany({
      where: { userId },
      include: {
        item: true
      },
      orderBy: { purchasedAt: "desc" }
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("Error fetching user purchases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
