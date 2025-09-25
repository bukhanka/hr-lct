import { prisma } from "./prisma";

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Create basic competencies
    const competencies = [
      { name: "Аналитическое мышление", iconUrl: null },
      { name: "Командная работа", iconUrl: null },
      { name: "Лидерство", iconUrl: null },
      { name: "Стрессоустойчивость", iconUrl: null },
      { name: "Коммуникация", iconUrl: null },
      { name: "Креативность", iconUrl: null },
      { name: "Адаптивность", iconUrl: null },
      { name: "Техническая грамотность", iconUrl: null },
    ];

    const createdCompetencies = [];
    for (const competency of competencies) {
      const existing = await prisma.competency.findFirst({
        where: { name: competency.name }
      });
      
      const created = existing || await prisma.competency.create({
        data: competency
      });
      
      createdCompetencies.push(created);
    }

    console.log(`📚 Created ${createdCompetencies.length} competencies`);

    // Create demo campaigns with missions
    const campaigns = await createDemoCampaigns(createdCompetencies);
    
    console.log("✅ Database seeded successfully");
    
    return {
      competencies: competencies.length,
      campaigns: campaigns.length
    };
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    throw error;
  }
}

async function createDemoCampaigns(competencies: Array<{ id: string; name: string }>) {
  const campaigns = [];

  // 1. Линейная воронка "Путь в космос"
  const spaceJourney = await createSpaceJourneyCampaign(competencies);
  campaigns.push(spaceJourney);

  // 2. Воронка с ветвлением "Академия кадетов"
  const academy = await createAcademyCampaign(competencies);
  campaigns.push(academy);

  // 3. Параллельные пути "Специализация"
  const specialization = await createSpecializationCampaign(competencies);
  campaigns.push(specialization);

  return campaigns;
}

// Линейная воронка: A → B → C → D → E
async function createSpaceJourneyCampaign(competencies: Array<{ id: string; name: string }>) {
  console.log("🚀 Creating 'Путь в космос' campaign...");

  const campaign = await prisma.campaign.create({
    data: {
      name: "Путь в космос",
      description: "Линейная воронка отбора кандидатов в космонавты. Каждый шаг открывает следующий уровень подготовки.",
      theme: "cosmic",
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    }
  });

  // const missions = await prisma.mission.createMany({
  await prisma.mission.createMany({
    data: [
      {
        campaignId: campaign.id,
        name: "Досье кадета",
        description: "Командир, для начала вашего звездного пути загрузите персональное досье в центральный архив флота. Это первый шаг к великим открытиям!",
        missionType: "FILE_UPLOAD",
        experienceReward: 50,
        manaReward: 25,
        positionX: 400,
        positionY: 100,
        confirmationType: "AUTO",
        minRank: 1
      },
      {
        campaignId: campaign.id,
        name: "Космический симулятор",
        description: "Пройдите базовый тренинг на симуляторе звездолета. Покажите, что готовы к полетам между планетами!",
        missionType: "QUIZ",
        experienceReward: 75,
        manaReward: 35,
        positionX: 400,
        positionY: 250,
        confirmationType: "AUTO",
        minRank: 1
      },
      {
        campaignId: campaign.id,
        name: "Встреча с командиром",
        description: "Явитесь на брифинг в командный центр. Личное собеседование с капитаном флота - честь для любого кадета!",
        missionType: "OFFLINE_EVENT",
        experienceReward: 100,
        manaReward: 50,
        positionX: 400,
        positionY: 400,
        confirmationType: "QR_SCAN",
        minRank: 1
      },
      {
        campaignId: campaign.id,
        name: "Творческое задание",
        description: "Создайте презентацию 'Моя планета через 100 лет'. Покажите креативность и видение будущего нашей галактики!",
        missionType: "CUSTOM",
        experienceReward: 125,
        manaReward: 60,
        positionX: 400,
        positionY: 550,
        confirmationType: "MANUAL_REVIEW",
        minRank: 2
      },
      {
        campaignId: campaign.id,
        name: "Выпуск из академии",
        description: "Финальная церемония посвящения в кадеты космического флота. Получите звание и откройте путь к звездам!",
        missionType: "OFFLINE_EVENT",
        experienceReward: 200,
        manaReward: 100,
        positionX: 400,
        positionY: 700,
        confirmationType: "MANUAL_REVIEW",
        minRank: 3
      }
    ]
  });

  // Get created missions to create dependencies
  const createdMissions = await prisma.mission.findMany({
    where: { campaignId: campaign.id },
    orderBy: { positionY: 'asc' }
  });

  // Create linear dependencies: [0] → [1] → [2] → [3] → [4]
  const dependencies = [];
  for (let i = 0; i < createdMissions.length - 1; i++) {
    dependencies.push({
      sourceMissionId: createdMissions[i].id,
      targetMissionId: createdMissions[i + 1].id
    });
  }

  await prisma.missionDependency.createMany({
    data: dependencies
  });

  // Add competency mappings
  const competencyMappings = [
    { missionId: createdMissions[1].id, competencyId: competencies[7].id, points: 3 }, // Tech literacy
    { missionId: createdMissions[2].id, competencyId: competencies[4].id, points: 5 }, // Communication
    { missionId: createdMissions[3].id, competencyId: competencies[5].id, points: 4 }, // Creativity
    { missionId: createdMissions[4].id, competencyId: competencies[2].id, points: 5 }, // Leadership
  ];

  await prisma.missionCompetency.createMany({
    data: competencyMappings
  });

  console.log(`✅ Created linear campaign with ${createdMissions.length} missions`);
  return campaign;
}

// Воронка с ветвлением: Start → Choice → Branch A/B → Merge → Final
async function createAcademyCampaign(competencies: Array<{ id: string; name: string }>) {
  console.log("🏫 Creating 'Академия кадетов' campaign...");

  const campaign = await prisma.campaign.create({
    data: {
      name: "Академия кадетов",
      description: "Воронка с выбором специализации. После общей подготовки кадеты выбирают путь пилота или инженера.",
      theme: "academy",
      startDate: new Date(),
      endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
    }
  });

  // const missions = await prisma.mission.createMany({
  await prisma.mission.createMany({
    data: [
      // Start
      {
        campaignId: campaign.id,
        name: "Вступительные испытания",
        description: "Пройдите базовые тесты для поступления в академию. Оценим ваши начальные навыки и потенциал.",
        missionType: "QUIZ",
        experienceReward: 60,
        manaReward: 30,
        positionX: 400,
        positionY: 100,
        confirmationType: "AUTO",
        minRank: 1
      },
      // Choice point
      {
        campaignId: campaign.id,
        name: "Выбор специализации",
        description: "Изучите доступные направления и выберите свой путь: станете ли вы пилотом или инженером?",
        missionType: "CUSTOM",
        experienceReward: 40,
        manaReward: 20,
        positionX: 400,
        positionY: 250,
        confirmationType: "AUTO",
        minRank: 1
      },
      // Branch A - Pilot path
      {
        campaignId: campaign.id,
        name: "Летная подготовка",
        description: "Специализация пилота: управление звездолетом, навигация в космосе, экстренные маневры.",
        missionType: "QUIZ",
        experienceReward: 80,
        manaReward: 40,
        positionX: 250,
        positionY: 400,
        confirmationType: "AUTO",
        minRank: 1
      },
      // Branch B - Engineer path  
      {
        campaignId: campaign.id,
        name: "Техническая подготовка",
        description: "Специализация инженера: ремонт систем, диагностика оборудования, проектирование модулей.",
        missionType: "CUSTOM",
        experienceReward: 80,
        manaReward: 40,
        positionX: 550,
        positionY: 400,
        confirmationType: "MANUAL_REVIEW",
        minRank: 1
      },
      // Merge point
      {
        campaignId: campaign.id,
        name: "Совместные учения",
        description: "Пилоты и инженеры работают в команде. Посетите общие тренировки для синхронизации навыков.",
        missionType: "OFFLINE_EVENT",
        experienceReward: 100,
        manaReward: 50,
        positionX: 400,
        positionY: 550,
        confirmationType: "QR_SCAN",
        minRank: 2
      },
      // Final
      {
        campaignId: campaign.id,
        name: "Выпускной проект",
        description: "Финальное задание: создайте совместный проект, демонстрирующий мастерство вашей специализации.",
        missionType: "CUSTOM",
        experienceReward: 150,
        manaReward: 75,
        positionX: 400,
        positionY: 700,
        confirmationType: "MANUAL_REVIEW",
        minRank: 2
      }
    ]
  });

  const createdMissions = await prisma.mission.findMany({
    where: { campaignId: campaign.id },
    orderBy: { positionY: 'asc' }
  });

  // Create branching dependencies
  const dependencies = [
    { sourceMissionId: createdMissions[0].id, targetMissionId: createdMissions[1].id }, // Start → Choice
    { sourceMissionId: createdMissions[1].id, targetMissionId: createdMissions[2].id }, // Choice → Pilot
    { sourceMissionId: createdMissions[1].id, targetMissionId: createdMissions[3].id }, // Choice → Engineer
    { sourceMissionId: createdMissions[2].id, targetMissionId: createdMissions[4].id }, // Pilot → Merge
    { sourceMissionId: createdMissions[3].id, targetMissionId: createdMissions[4].id }, // Engineer → Merge
    { sourceMissionId: createdMissions[4].id, targetMissionId: createdMissions[5].id }, // Merge → Final
  ];

  await prisma.missionDependency.createMany({
    data: dependencies
  });

  // Add competency mappings
  const competencyMappings = [
    { missionId: createdMissions[0].id, competencyId: competencies[0].id, points: 3 }, // Analytical thinking
    { missionId: createdMissions[2].id, competencyId: competencies[3].id, points: 5 }, // Stress resistance (pilot)
    { missionId: createdMissions[3].id, competencyId: competencies[7].id, points: 5 }, // Technical literacy (engineer)
    { missionId: createdMissions[4].id, competencyId: competencies[1].id, points: 4 }, // Teamwork
    { missionId: createdMissions[5].id, competencyId: competencies[2].id, points: 5 }, // Leadership
  ];

  await prisma.missionCompetency.createMany({
    data: competencyMappings
  });

  console.log(`✅ Created branching campaign with ${createdMissions.length} missions`);
  return campaign;
}

// Параллельные пути: Start → (A1, B1) → (A2, B2) → Final
async function createSpecializationCampaign(competencies: Array<{ id: string; name: string }>) {
  console.log("⚡ Creating 'Специализация' campaign...");

  const campaign = await prisma.campaign.create({
    data: {
      name: "Продвинутая специализация",
      description: "Сложная воронка с параллельными путями развития. Кандидаты развивают несколько компетенций одновременно.",
      theme: "advanced",
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    }
  });

  // const missions = await prisma.mission.createMany({
  await prisma.mission.createMany({
    data: [
      // Start
      {
        campaignId: campaign.id,
        name: "Базовая оценка",
        description: "Комплексная оценка текущих навыков. Определяем ваши сильные стороны для дальнейшего развития.",
        missionType: "QUIZ",
        experienceReward: 40,
        manaReward: 20,
        positionX: 400,
        positionY: 100,
        confirmationType: "AUTO",
        minRank: 1
      },
      // Parallel Path A1
      {
        campaignId: campaign.id,
        name: "Лидерские навыки",
        description: "Развитие управленческих компетенций. Изучите принципы эффективного руководства командой.",
        missionType: "CUSTOM",
        experienceReward: 70,
        manaReward: 35,
        positionX: 250,
        positionY: 250,
        confirmationType: "MANUAL_REVIEW",
        minRank: 1
      },
      // Parallel Path B1
      {
        campaignId: campaign.id,
        name: "Техническая экспертиза",
        description: "Углубленное изучение технических систем. Станьте экспертом в своей области.",
        missionType: "FILE_UPLOAD",
        experienceReward: 70,
        manaReward: 35,
        positionX: 550,
        positionY: 250,
        confirmationType: "AUTO",
        minRank: 1
      },
      // Parallel Path A2
      {
        campaignId: campaign.id,
        name: "Стратегическое мышление",
        description: "Развитие навыков долгосрочного планирования и принятия сложных решений.",
        missionType: "CUSTOM",
        experienceReward: 90,
        manaReward: 45,
        positionX: 250,
        positionY: 400,
        confirmationType: "MANUAL_REVIEW",
        minRank: 2
      },
      // Parallel Path B2
      {
        campaignId: campaign.id,
        name: "Инновационные решения",
        description: "Проектирование и внедрение новых технологических решений в реальных условиях.",
        missionType: "CUSTOM",
        experienceReward: 90,
        manaReward: 45,
        positionX: 550,
        positionY: 400,
        confirmationType: "MANUAL_REVIEW",
        minRank: 2
      },
      // Final
      {
        campaignId: campaign.id,
        name: "Комплексный проект",
        description: "Финальное испытание: возглавьте техническую команду и реализуйте инновационный проект от идеи до внедрения.",
        missionType: "OFFLINE_EVENT",
        experienceReward: 200,
        manaReward: 100,
        positionX: 400,
        positionY: 550,
        confirmationType: "MANUAL_REVIEW",
        minRank: 3
      }
    ]
  });

  const createdMissions = await prisma.mission.findMany({
    where: { campaignId: campaign.id },
    orderBy: { positionY: 'asc' }
  });

  // Create parallel dependencies
  const dependencies = [
    { sourceMissionId: createdMissions[0].id, targetMissionId: createdMissions[1].id }, // Start → A1
    { sourceMissionId: createdMissions[0].id, targetMissionId: createdMissions[2].id }, // Start → B1
    { sourceMissionId: createdMissions[1].id, targetMissionId: createdMissions[3].id }, // A1 → A2
    { sourceMissionId: createdMissions[2].id, targetMissionId: createdMissions[4].id }, // B1 → B2
    { sourceMissionId: createdMissions[3].id, targetMissionId: createdMissions[5].id }, // A2 → Final
    { sourceMissionId: createdMissions[4].id, targetMissionId: createdMissions[5].id }, // B2 → Final
  ];

  await prisma.missionDependency.createMany({
    data: dependencies
  });

  // Add competency mappings
  const competencyMappings = [
    { missionId: createdMissions[0].id, competencyId: competencies[0].id, points: 2 }, // Analytical thinking
    { missionId: createdMissions[1].id, competencyId: competencies[2].id, points: 4 }, // Leadership
    { missionId: createdMissions[2].id, competencyId: competencies[7].id, points: 4 }, // Technical literacy  
    { missionId: createdMissions[3].id, competencyId: competencies[0].id, points: 5 }, // Analytical thinking
    { missionId: createdMissions[4].id, competencyId: competencies[5].id, points: 5 }, // Creativity
    { missionId: createdMissions[5].id, competencyId: competencies[1].id, points: 5 }, // Teamwork
    { missionId: createdMissions[5].id, competencyId: competencies[2].id, points: 3 }, // Leadership
  ];

  await prisma.missionCompetency.createMany({
    data: competencyMappings
  });

  console.log(`✅ Created parallel campaign with ${createdMissions.length} missions`);
  return campaign;
}

// Execute seeding if run directly
if (require.main === module) {
  seedDatabase()
    .then((result) => {
      console.log('🎉 Seeding completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}
