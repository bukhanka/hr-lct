import { prisma } from "./prisma";

export async function seedDatabase() {
  try {
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

    for (const competency of competencies) {
      await prisma.competency.upsert({
        where: { name: competency.name },
        update: {},
        create: competency,
      });
    }

    console.log("✅ Database seeded successfully");
    
    return {
      competencies: competencies.length
    };
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    throw error;
  }
}
