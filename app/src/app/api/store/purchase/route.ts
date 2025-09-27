import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId } = body;
    const userId = (session as any)?.user?.id;

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Get the item
    const item = await prisma.storeItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (!item.isAvailable) {
      return NextResponse.json({ error: "Item is not available" }, { status: 400 });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has enough mana
    if (user.mana < item.price) {
      return NextResponse.json(
        { 
          error: "Insufficient mana", 
          required: item.price, 
          available: user.mana 
        },
        { status: 400 }
      );
    }

    // Check if user already owns this item (prevent duplicates for unique items)
    const existingPurchase = await prisma.userPurchase.findFirst({
      where: {
        userId,
        itemId
      }
    });

    if (existingPurchase && (item.category === "BADGE" || item.category === "AVATAR")) {
      return NextResponse.json(
        { error: "You already own this item" },
        { status: 400 }
      );
    }

    // Perform the purchase in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct mana from user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { mana: { decrement: item.price } }
      });

      // Create purchase record
      const purchase = await tx.userPurchase.create({
        data: {
          userId,
          itemId
        },
        include: {
          item: true
        }
      });

      // Create notification
      await tx.userNotification.create({
        data: {
          userId,
          type: "PURCHASE_SUCCESS",
          title: "Покупка успешно завершена!",
          message: `Вы приобрели "${item.name}" за ${item.price} маны.`,
          metadata: { 
            itemId, 
            itemName: item.name, 
            price: item.price 
          }
        }
      });

      return { purchase, updatedUser };
    });

    return NextResponse.json({
      success: true,
      purchase: result.purchase,
      remainingMana: result.updatedUser.mana
    });

  } catch (error) {
    console.error("Error processing purchase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
