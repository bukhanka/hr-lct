import { prisma } from "./prisma";
import { ItemCategory } from "@/generated/prisma";
import { 
  QuizPayload, 
  VideoPayload, 
  FileUploadPayload, 
  FormPayload,
  OfflineEventPayload
} from "./mission-types";

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

    // Create rank system
    const ranks = await createRankSystem();
    console.log(`🎖️ Created ${ranks.length} ranks`);

    // Create store items
    const storeItems = await createStoreItems();
    console.log(`🏪 Created ${storeItems.length} store items`);

    // Create demo campaigns with missions
    const campaigns = await createDemoCampaigns(createdCompetencies);
    
    // Create cadet users with mission progress
    const users = await createCadetUsers(campaigns, createdCompetencies);
    console.log(`👥 Created ${users.length} cadet users with progress`);
    
    console.log("✅ Database seeded successfully");
    
    return {
      competencies: competencies.length,
      ranks: ranks.length,
      storeItems: storeItems.length,
      campaigns: campaigns.length,
      users: users.length
    };
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    throw error;
  }
}

async function createDemoCampaigns(competencies: any[]) {
  const campaigns = [];

  // 1. Линейная воронка "Путь в космос" (Galactic Academy theme)
  const spaceJourney = await createSpaceJourneyCampaign(competencies);
  campaigns.push(spaceJourney);

  // 2. Воронка с ветвлением "Академия кадетов" (Galactic Academy theme)
  const academy = await createAcademyCampaign(competencies);
  campaigns.push(academy);

  // 3. Параллельные пути "Специализация" (Galactic Academy theme)
  const specialization = await createSpecializationCampaign(competencies);
  campaigns.push(specialization);
  
  // 4. Corporate Onboarding (Corporate Metropolis theme)
  const corporate = await createCorporateCampaign(competencies);
  campaigns.push(corporate);
  
  // 5. ESG Program (ESG Mission theme)
  const esg = await createESGCampaign(competencies);
  campaigns.push(esg);

  return campaigns;
}

// Линейная воронка: A → B → C → D → E
async function createSpaceJourneyCampaign(competencies: any[]) {
  console.log("🚀 Creating 'Путь в космос' campaign...");

  const campaign = await prisma.campaign.create({
    data: {
      name: "Путь в космос",
      description: "Линейная воронка отбора кандидатов в космонавты. Каждый шаг открывает следующий уровень подготовки.",
      theme: "cosmic",
      themeConfig: {
        themeId: "galactic-academy",
        funnelType: "onboarding",
        personas: ["students", "professionals"],
        gamificationLevel: "high",
        motivationOverrides: {
          xp: "Опыт",
          mana: "Энергия",
          rank: "Ранг"
        },
        palette: {
          primary: "#8B5CF6",
          secondary: "#38BDF8",
          surface: "rgba(23, 16, 48, 0.85)"
        }
      },
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    }
  });

  // Создаем полноценные миссии с payload
  const missionsData = [
    {
      campaignId: campaign.id,
      name: "Тест на профпригодность",
      description: "Пройдите вступительный тест, чтобы доказать свои базовые знания о космосе и готовность к звездным полетам.",
      missionType: "COMPLETE_QUIZ",
      experienceReward: 75,
      manaReward: 30,
      positionX: 400,
      positionY: 100,
      confirmationType: "AUTO",
      minRank: 1,
      payload: {
        type: "COMPLETE_QUIZ",
        passingScore: 75,
        timeLimit: 10,
        allowRetries: true,
        maxRetries: 2,
        questions: [
          {
            id: "q1",
            text: "Какая планета в Солнечной системе самая большая?",
            type: "single",
            required: true,
            answers: [
              { id: "a1", text: "Земля" },
              { id: "a2", text: "Марс" },
              { id: "a3", text: "Юпитер" },
              { id: "a4", text: "Сатурн" }
            ],
            correctAnswerIds: ["a3"]
          },
          {
            id: "q2", 
            text: "Выберите основные качества космонавта:",
            type: "multiple",
            required: true,
            answers: [
              { id: "b1", text: "Стрессоустойчивость" },
              { id: "b2", text: "Физическая выносливость" },
              { id: "b3", text: "Боязнь высоты" },
              { id: "b4", text: "Аналитическое мышление" }
            ],
            correctAnswerIds: ["b1", "b2", "b4"]
          },
          {
            id: "q3",
            text: "Почему вы хотите стать космонавтом?",
            type: "text",
            required: true
          }
        ]
      } as QuizPayload
    },
    {
      campaignId: campaign.id,
      name: "Мотивационное эссе",
      description: "Скачайте шаблон и напишите эссе о том, почему именно вы должны стать частью космического флота.",
      missionType: "UPLOAD_FILE",
      experienceReward: 125,
      manaReward: 60,
      positionX: 400,
      positionY: 250,
      confirmationType: "MANUAL_REVIEW",
      minRank: 1,
      payload: {
        type: "UPLOAD_FILE",
        templateFileUrl: "/templates/motivation_essay_template.docx",
        allowedFormats: ["pdf", "docx", "doc"],
        maxFileSize: 5 * 1024 * 1024, // 5MB
        requiredFiles: 1,
        instructions: "Эссе должно содержать: 1) Вашу мотивацию, 2) Опыт и навыки, 3) Видение будущего в космосе. Минимум 500 слов."
      } as FileUploadPayload
    },
    {
      campaignId: campaign.id,
      name: "Брифинг от капитана",
      description: "Посмотрите обязательное видеообращение от капитана флота. Узнайте о целях нашей миссии и структуре команды.",
      missionType: "WATCH_VIDEO",
      experienceReward: 50,
      manaReward: 25,
      positionX: 400,
      positionY: 400,
      confirmationType: "AUTO",
      minRank: 1,
      payload: {
        type: "WATCH_VIDEO",
        videoUrl: "https://rutube.ru/video/b7d4b6c1234567890abcdef1234567890/", // Популярное видео о космосе
        watchThreshold: 0.90,
        allowSkip: false,
        duration: 600 // 10 минут
      } as VideoPayload
    },
    {
      campaignId: campaign.id,
      name: "Личное собеседование",
      description: "Пройдите личное собеседование с командиром. Будьте готовы рассказать о себе и ответить на вопросы о мотивации.",
      missionType: "ATTEND_OFFLINE",
      experienceReward: 150,
      manaReward: 75,
      positionX: 400,
      positionY: 550,
      confirmationType: "QR_SCAN",
      minRank: 2,
      payload: {
        type: "ATTEND_OFFLINE",
        eventName: "Собеседование с командиром флота",
        location: "Командный центр, кабинет 301",
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        checkInWindow: 15 // 15 минут до и после для регистрации
      } as OfflineEventPayload
    },
    {
      campaignId: campaign.id,
      name: "Обратная связь о процессе",
      description: "Поделитесь впечатлениями о процессе отбора. Ваше мнение поможет нам улучшить программу для будущих кадетов!",
      missionType: "SUBMIT_FORM",
      experienceReward: 100,
      manaReward: 50,
      positionX: 400,
      positionY: 700,
      confirmationType: "AUTO",
      minRank: 2,
      payload: {
        type: "SUBMIT_FORM",
        title: "Оценка процесса отбора",
        description: "Помогите нам стать лучше!",
        fields: [
          {
            id: "overall_rating",
            label: "Общая оценка процесса отбора",
            type: "radio",
            required: true,
            options: ["Отлично", "Хорошо", "Удовлетворительно", "Плохо"]
          },
          {
            id: "most_valuable",
            label: "Какой этап был наиболее полезным?",
            type: "select",
            required: true,
            options: ["Тест на знания", "Видео от капитана", "Личное собеседование", "Все одинаково"]
          },
          {
            id: "suggestions",
            label: "Предложения по улучшению",
            type: "textarea",
            required: false,
            placeholder: "Что бы вы добавили или изменили в процессе?"
          },
          {
            id: "recommend",
            label: "Рекомендовали бы программу друзьям?",
            type: "radio",
            required: true,
            options: ["Да, обязательно", "Скорее да", "Скорее нет", "Точно нет"]
          }
        ]
      } as FormPayload
    }
  ];

  // Создаем миссии по одной, чтобы можно было передать payload
  for (const missionData of missionsData) {
    await prisma.mission.create({
      data: missionData as any
    });
  }

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
async function createAcademyCampaign(competencies: any[]) {
  console.log("🏫 Creating 'Академия кадетов' campaign...");

  const campaign = await prisma.campaign.create({
    data: {
      name: "Академия кадетов",
      description: "Воронка с выбором специализации. После общей подготовки кадеты выбирают путь пилота или инженера.",
      theme: "academy",
      themeConfig: {
        themeId: "corporate-metropolis",
        funnelType: "engagement",
        personas: ["professionals"],
        gamificationLevel: "balanced",
        motivationOverrides: {
          xp: "KPI",
          mana: "Бонусы",
          rank: "Статус"
        },
        palette: {
          primary: "#38BDF8",
          secondary: "#0EA5E9",
          surface: "rgba(8, 16, 32, 0.9)"
        }
      },
      startDate: new Date(),
      endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
    }
  });

  const missions = await prisma.mission.createMany({
    data: [
      // Start
      {
        campaignId: campaign.id,
        name: "Вступительные испытания",
        description: "Пройдите базовые тесты для поступления в академию. Оценим ваши начальные навыки и потенциал.",
        missionType: "COMPLETE_QUIZ",
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
        missionType: "COMPLETE_QUIZ",
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
        missionType: "ATTEND_OFFLINE",
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
async function createSpecializationCampaign(competencies: any[]) {
  console.log("⚡ Creating 'Специализация' campaign...");

  const campaign = await prisma.campaign.create({
    data: {
      name: "Продвинутая специализация",
      description: "Сложная воронка с параллельными путями развития. Кандидаты развивают несколько компетенций одновременно.",
      theme: "advanced",
      themeConfig: {
        themeId: "esg-mission",
        funnelType: "growth",
        personas: ["volunteers", "professionals"],
        gamificationLevel: "balanced",
        motivationOverrides: {
          xp: "Вклад",
          mana: "Импакт",
          rank: "Статус"
        },
        palette: {
          primary: "#22C55E",
          secondary: "#4ADE80",
          surface: "rgba(6, 24, 18, 0.9)"
        }
      },
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    }
  });

  const missions = await prisma.mission.createMany({
    data: [
      // Start
      {
        campaignId: campaign.id,
        name: "Базовая оценка",
        description: "Комплексная оценка текущих навыков. Определяем ваши сильные стороны для дальнейшего развития.",
        missionType: "COMPLETE_QUIZ",
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
        missionType: "UPLOAD_FILE",
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
        missionType: "ATTEND_OFFLINE",
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

// Corporate Onboarding Campaign (Corporate Metropolis theme)
async function createCorporateCampaign(competencies: any[]) {
  console.log("🏢 Creating 'Корпоративная адаптация' campaign...");

  const campaign = await prisma.campaign.create({
    data: {
      name: "Корпоративная адаптация",
      description: "Программа onboarding для новых сотрудников компании. Минимальная геймификация, фокус на KPI и практических навыках.",
      theme: "corporate",
      themeConfig: {
        themeId: "corporate-metropolis",
        funnelType: "onboarding",
        personas: ["professionals"],
        gamificationLevel: "low",
        motivationOverrides: {
          xp: "KPI",
          mana: "Бонусы",
          rank: "Статус",
        },
        palette: {
          primary: "#38BDF8",
          secondary: "#0EA5E9",
          surface: "rgba(8, 16, 32, 0.9)",
        },
      },
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const missions = [
    { name: "Welcome: корпоративная культура", description: "Ознакомьтесь с ценностями компании", type: "WATCH_VIDEO", experience: 50, mana: 20, competency: competencies[4], x: 300, y: 100 },
    { name: "Знакомство с командой", description: "Представьтесь коллегам", type: "SUBMIT_FORM", experience: 80, mana: 30, competency: competencies[1], x: 500, y: 100 },
    { name: "Изучение бизнес-процессов", description: "Обучение по ключевым процессам", type: "COMPLETE_QUIZ", experience: 120, mana: 50, competency: competencies[7], x: 700, y: 100 },
  ];

  const createdMissions = [];
  for (let i = 0; i < missions.length; i++) {
    const mission = missions[i];
    const created = await prisma.mission.create({
      data: {
        campaignId: campaign.id,
        name: mission.name,
        description: mission.description,
        missionType: mission.type as any,
        experienceReward: mission.experience,
        manaReward: mission.mana,
        positionX: mission.x,
        positionY: mission.y,
        confirmationType: "AUTO",
        minRank: 1,
        competencies: { create: { competencyId: mission.competency.id, points: 2 } },
      },
    });
    createdMissions.push(created);
    if (i > 0) {
      await prisma.missionDependency.create({
        data: { sourceMissionId: createdMissions[i - 1].id, targetMissionId: created.id },
      });
    }
  }

  console.log(`✅ Created corporate campaign with ${createdMissions.length} missions`);
  return campaign;
}

// ESG Program Campaign (ESG Mission theme)
async function createESGCampaign(competencies: any[]) {
  console.log("🌱 Creating 'Программа ESG' campaign...");

  const campaign = await prisma.campaign.create({
    data: {
      name: "Программа ESG: вклад в будущее",
      description: "Волонтёрская программа с фокусом на социальную ответственность и экологию.",
      theme: "esg",
      themeConfig: {
        themeId: "esg-mission",
        funnelType: "esg",
        personas: ["volunteers"],
        gamificationLevel: "balanced",
        motivationOverrides: {
          xp: "Вклад",
          mana: "Импакт",
          rank: "Статус",
        },
        palette: {
          primary: "#22C55E",
          secondary: "#4ADE80",
          surface: "rgba(6, 24, 18, 0.9)",
        },
      },
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  const missions = [
    { name: "Экологический аудит офиса", description: "Оценка экологичности рабочего пространства", type: "SUBMIT_FORM", experience: 100, mana: 40, competency: competencies[0], x: 300, y: 100 },
    { name: "Волонтёрская акция: посадка деревьев", description: "Участие в высадке деревьев", type: "ATTEND_OFFLINE", experience: 150, mana: 80, competency: competencies[1], x: 500, y: 100 },
    { name: "Отчёт о социальном импакте", description: "Подготовка отчёта о проделанной работе", type: "UPLOAD_FILE", experience: 120, mana: 60, competency: competencies[4], x: 700, y: 100 },
  ];

  const createdMissions = [];
  for (let i = 0; i < missions.length; i++) {
    const mission = missions[i];
    const created = await prisma.mission.create({
      data: {
        campaignId: campaign.id,
        name: mission.name,
        description: mission.description,
        missionType: mission.type as any,
        experienceReward: mission.experience,
        manaReward: mission.mana,
        positionX: mission.x,
        positionY: mission.y,
        confirmationType: mission.type === "ATTEND_OFFLINE" ? "MANUAL_REVIEW" : "AUTO",
        minRank: 1,
        competencies: { create: { competencyId: mission.competency.id, points: 3 } },
      },
    });
    createdMissions.push(created);
    if (i > 0) {
      await prisma.missionDependency.create({
        data: { sourceMissionId: createdMissions[i - 1].id, targetMissionId: created.id },
      });
    }
  }

  console.log(`✅ Created ESG campaign with ${createdMissions.length} missions`);
  return campaign;
}

// Create rank system with progressive requirements
async function createRankSystem() {
  console.log("🎖️ Creating rank system...");

  const ranks = [
    {
      level: 1,
      name: "Искатель",
      title: "Космический скиталец",
      description: "Первый шаг к звездам. Вы только начинаете свой путь в галактике возможностей.",
      minExperience: 0,
      minMissions: 0,
      requiredCompetencies: {},
      rewards: { mana: 0, badge: "seeker_star" }
    },
    {
      level: 2,
      name: "Пилот-кандидат",
      title: "Будущий покоритель звезд",
      description: "Вы показали базовые навыки и готовность к более сложным испытаниям.",
      minExperience: 150,
      minMissions: 3,
      requiredCompetencies: { "Аналитическое мышление": 2 },
      rewards: { mana: 50, badge: "pilot_wings" }
    },
    {
      level: 3,
      name: "Кадет",
      title: "Член экипажа",
      description: "Официальный член команды. Вы доказали свою надежность и профессионализм.",
      minExperience: 400,
      minMissions: 8,
      requiredCompetencies: { "Командная работа": 3, "Коммуникация": 2 },
      rewards: { mana: 100, badge: "cadet_emblem" }
    },
    {
      level: 4,
      name: "Лейтенант",
      title: "Младший офицер",
      description: "Лидерские качества и экспертность в своей области открывают новые горизонты.",
      minExperience: 750,
      minMissions: 15,
      requiredCompetencies: { "Лидерство": 4, "Стрессоустойчивость": 3 },
      rewards: { mana: 200, badge: "lieutenant_stripes" }
    },
    {
      level: 5,
      name: "Капитан",
      title: "Командир звездолета",
      description: "Высший ранг для большинства кадетов. Вы - образец для подражания и наставник.",
      minExperience: 1200,
      minMissions: 25,
      requiredCompetencies: { "Лидерство": 5, "Аналитическое мышление": 4, "Командная работа": 4 },
      rewards: { mana: 500, badge: "captain_insignia" }
    }
  ];

  const createdRanks = [];
  for (const rank of ranks) {
    const existing = await prisma.rank.findFirst({
      where: { level: rank.level }
    });
    
    const created = existing || await prisma.rank.create({
      data: rank
    });
    
    createdRanks.push(created);
  }

  return createdRanks;
}

// Create store items for spending mana
async function createStoreItems() {
  console.log("🏪 Creating store items...");

  const items = [
    // Мерч
    {
      name: "Кружка 'Космический кофе'",
      description: "Эксклюзивная кружка с логотипом космической академии",
      price: 150,
      category: ItemCategory.MERCH,
      imageUrl: null,
      isAvailable: true
    },
    {
      name: "Футболка 'Кадет галактики'",
      description: "Удобная футболка с принтом звездной карты",
      price: 300,
      category: ItemCategory.MERCH,
      imageUrl: null,
      isAvailable: true
    },
    {
      name: "Блокнот 'Бортовой журнал'",
      description: "Стильный блокнот для записи космических идей",
      price: 100,
      category: ItemCategory.MERCH,
      imageUrl: null,
      isAvailable: true
    },
    
    // Бонусы
    {
      name: "Дополнительные попытки",
      description: "3 дополнительные попытки для прохождения квизов",
      price: 50,
      category: ItemCategory.BONUS,
      imageUrl: null,
      isAvailable: true
    },
    {
      name: "Ускоритель прогресса",
      description: "+50% опыта за следующую миссию",
      price: 75,
      category: ItemCategory.BONUS,
      imageUrl: null,
      isAvailable: true
    },
    {
      name: "VIP поддержка",
      description: "Приоритетная проверка заданий в течение дня",
      price: 200,
      category: ItemCategory.BONUS,
      imageUrl: null,
      isAvailable: true
    },

    // Бейджи
    {
      name: "Бейдж 'Первопроходец'",
      description: "Эксклюзивный бейдж для первых 100 кадетов",
      price: 500,
      category: ItemCategory.BADGE,
      imageUrl: null,
      isAvailable: true
    },
    {
      name: "Бейдж 'Наставник'",
      description: "Специальный бейдж для помощи новым кадетам",
      price: 400,
      category: ItemCategory.BADGE,
      imageUrl: null,
      isAvailable: true
    },

    // Аватары
    {
      name: "Аватар 'Космический исследователь'",
      description: "Уникальный аватар в скафандре исследователя",
      price: 250,
      category: ItemCategory.AVATAR,
      imageUrl: null,
      isAvailable: true
    },
    {
      name: "Аватар 'Капитан корабля'",
      description: "Аватар в форме капитана звездолета",
      price: 600,
      category: ItemCategory.AVATAR,
      imageUrl: null,
      isAvailable: false // Unlock at Captain rank
    }
  ];

  const createdItems = [];
  for (const item of items) {
    const existing = await prisma.storeItem.findFirst({
      where: { name: item.name }
    });
    
    const created = existing || await prisma.storeItem.create({
      data: item
    });
    
    createdItems.push(created);
  }

  return createdItems;
}

// Create cadet users with mission progress
async function createCadetUsers(campaigns: any[], competencies: any[]) {
  console.log("👥 Creating cadet users with progress...");
  
  const { UserRole, MissionStatus } = await import("@/generated/prisma");
  
  const users = [
    {
      id: "u-cadet-student",
      email: "cadet.student@example.com",
      displayName: "Алекс Новиков",
      role: UserRole.CADET,
      experience: 250,
      mana: 120,
      currentRank: 2,
      campaignIndex: 0, // Galactic Academy - Путь в космос
      completedMissions: 3
    },
    {
      id: "u-cadet-professional",
      email: "cadet.pro@example.com",
      displayName: "Мария Соколова",
      role: UserRole.CADET,
      experience: 450,
      mana: 80,
      currentRank: 3,
      campaignIndex: 3, // Corporate Metropolis
      completedMissions: 2
    },
    {
      id: "u-cadet-volunteer",
      email: "cadet.volunteer@example.com",
      displayName: "Иван Зеленский",
      role: UserRole.CADET,
      experience: 180,
      mana: 200,
      currentRank: 2,
      campaignIndex: 4, // ESG Mission
      completedMissions: 2
    }
  ];
  
  const createdUsers = [];
  
  for (const userData of users) {
    // Create or update user
    const user = await prisma.user.upsert({
      where: { id: userData.id },
      update: {
        experience: userData.experience,
        mana: userData.mana,
        currentRank: userData.currentRank
      },
      create: {
        id: userData.id,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        experience: userData.experience,
        mana: userData.mana,
        currentRank: userData.currentRank
      }
    });
    
    createdUsers.push(user);
    
    // Get the campaign missions
    const campaign = campaigns[userData.campaignIndex];
    if (!campaign) continue;
    
    const missions = await prisma.mission.findMany({
      where: { campaignId: campaign.id },
      orderBy: { positionY: 'asc' },
      include: {
        dependenciesTo: true,
        competencies: true
      }
    });
    
    // Create user missions with some completed
    for (let i = 0; i < missions.length; i++) {
      const mission = missions[i];
      let status: any = MissionStatus.LOCKED;
      let completedAt: Date | null = null;
      
      if (i < userData.completedMissions) {
        status = MissionStatus.COMPLETED;
        completedAt = new Date(Date.now() - (userData.completedMissions - i) * 24 * 60 * 60 * 1000);
      } else if (i === userData.completedMissions) {
        status = MissionStatus.AVAILABLE;
      }
      
      await prisma.userMission.upsert({
        where: {
          userId_missionId: {
            userId: user.id,
            missionId: mission.id
          }
        },
        update: {
          status,
          completedAt
        },
        create: {
          userId: user.id,
          missionId: mission.id,
          status,
          completedAt,
          startedAt: status === MissionStatus.AVAILABLE ? new Date() : null
        }
      });
      
      // Add competency points for completed missions
      if (status === MissionStatus.COMPLETED && mission.competencies.length > 0) {
        for (const missionComp of mission.competencies) {
          await prisma.userCompetency.upsert({
            where: {
              userId_competencyId: {
                userId: user.id,
                competencyId: missionComp.competencyId
              }
            },
            update: {
              points: {
                increment: missionComp.points
              }
            },
            create: {
              userId: user.id,
              competencyId: missionComp.competencyId,
              points: missionComp.points
            }
          });
        }
      }
    }
  }
  
  return createdUsers;
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
