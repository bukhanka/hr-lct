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

    // Users can only see their own notifications, or architects can see any user's notifications
    if ((session as any)?.user?.id !== userId && (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.userNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit
    });

    const unreadCount = await prisma.userNotification.count({
      where: { userId, isRead: false }
    });

    return NextResponse.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { userId } = await params;
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can only update their own notifications
    if ((session as any)?.user?.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    let updateResult;

    if (markAllAsRead) {
      // Mark all notifications as read
      updateResult = await prisma.userNotification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      updateResult = await prisma.userNotification.updateMany({
        where: { 
          id: { in: notificationIds },
          userId // Ensure user can only update their own notifications
        },
        data: { isRead: true }
      });
    } else {
      return NextResponse.json(
        { error: "Either notificationIds or markAllAsRead must be provided" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedCount: updateResult.count
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
