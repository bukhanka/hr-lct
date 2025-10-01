import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { MissionStatus } from "@/generated/prisma";

interface RouteParams {
  params: Promise<{ id: string; userId: string }>;
}

/**
 * DELETE /api/campaigns/[id]/participants/[userId]
 * Удалить участника из кампании
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id: campaignId, userId } = await params;

    if (!session || (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Удаляем все миссии пользователя в этой кампании
    await prisma.userMission.deleteMany({
      where: {
        userId,
        mission: {
          campaignId,
        },
      },
    });

    // Удаляем назначение на кампанию
    await prisma.userCampaignVariant.delete({
      where: {
        userId_campaignId: {
          userId,
          campaignId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing participant:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/campaigns/[id]/participants/[userId]
 * Управление статусом участника (сброс прогресса, разблокировка миссий)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id: campaignId, userId } = await params;

    if (!session || (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "reset_progress":
        // Сбрасываем прогресс по всем миссиям
        await prisma.userMission.updateMany({
          where: {
            userId,
            mission: {
              campaignId,
            },
          },
          data: {
            status: MissionStatus.LOCKED,
            startedAt: null,
            completedAt: null,
            submission: null,
          },
        });

        // Разблокируем первые миссии (без зависимостей)
        const missions = await prisma.mission.findMany({
          where: { campaignId },
          include: {
            dependenciesTo: true,
          },
        });

        for (const mission of missions) {
          if (mission.dependenciesTo.length === 0) {
            await prisma.userMission.updateMany({
              where: {
                userId,
                missionId: mission.id,
              },
              data: {
                status: MissionStatus.AVAILABLE,
              },
            });
          }
        }

        // Обнуляем опыт и ману пользователя (опционально)
        await prisma.user.update({
          where: { id: userId },
          data: {
            experience: 0,
            mana: 0,
            currentRank: 1,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Прогресс сброшен",
        });

      case "unlock_all":
        // Разблокируем все миссии
        await prisma.userMission.updateMany({
          where: {
            userId,
            mission: {
              campaignId,
            },
          },
          data: {
            status: MissionStatus.AVAILABLE,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Все миссии разблокированы",
        });

      case "complete_all":
        // Помечаем все миссии как выполненные (для тестирования)
        const allMissions = await prisma.mission.findMany({
          where: { campaignId },
        });

        for (const mission of allMissions) {
          await prisma.userMission.updateMany({
            where: {
              userId,
              missionId: mission.id,
            },
            data: {
              status: MissionStatus.COMPLETED,
              completedAt: new Date(),
            },
          });
        }

        return NextResponse.json({
          success: true,
          message: "Все миссии выполнены",
        });

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error updating participant:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

