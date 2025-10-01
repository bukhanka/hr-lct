import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MissionStatus } from "@/generated/prisma";

/**
 * POST /api/auth/register
 * Регистрация нового кадета через invite-ссылку кампании
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName, campaignId, campaignSlug } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email обязателен" },
        { status: 400 }
      );
    }

    // Проверяем, не существует ли уже пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже зарегистрирован" },
        { status: 409 }
      );
    }

    // Находим кампанию по ID или slug
    let campaign;
    if (campaignId) {
      campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });
    } else if (campaignSlug) {
      campaign = await prisma.campaign.findUnique({
        where: { slug: campaignSlug },
      });
    }

    if (!campaign) {
      return NextResponse.json(
        { error: "Кампания не найдена" },
        { status: 404 }
      );
    }

    // Создаем нового пользователя
    const newUser = await prisma.user.create({
      data: {
        email,
        displayName: displayName || email.split("@")[0],
        role: "CADET",
        experience: 0,
        mana: 0,
        currentRank: 1,
      },
    });

    // Назначаем пользователя на кампанию
    await prisma.userCampaignVariant.create({
      data: {
        userId: newUser.id,
        campaignId: campaign.id,
      },
    });

    // Инициализируем миссии для пользователя
    const missions = await prisma.mission.findMany({
      where: { campaignId: campaign.id },
      include: {
        dependenciesTo: true,
      },
      orderBy: { positionY: "asc" },
    });

    for (const mission of missions) {
      // Миссии без зависимостей доступны сразу
      const status = mission.dependenciesTo.length === 0 
        ? MissionStatus.AVAILABLE 
        : MissionStatus.LOCKED;

      await prisma.userMission.create({
        data: {
          userId: newUser.id,
          missionId: mission.id,
          status,
        },
      });
    }

    // Создаем welcome notification
    await prisma.userNotification.create({
      data: {
        userId: newUser.id,
        type: "MISSION_COMPLETED", // используем существующий тип
        title: "🚀 Добро пожаловать на борт!",
        message: `Кадет ${newUser.displayName}, ваше путешествие начинается. Выполните первую миссию и получите награды!`,
        metadata: {
          campaignId: campaign.id,
          isWelcome: true,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.displayName,
        },
        campaign: {
          id: campaign.id,
          name: campaign.name,
          slug: campaign.slug,
          theme: campaign.theme,
        },
        missionsInitialized: missions.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Ошибка при регистрации" },
      { status: 500 }
    );
  }
}

