// import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export type MockUser = {
  id: string;
  email: string;
  name: string;
  role: "cadet" | "architect" | "officer" | "admin";
  description?: string;
};

// Группы пользователей для тестирования
export const mockUserGroups = {
  admins: [
    {
      id: "u-architect-1",
      email: "architect@example.com",
      name: "Елена Архитектор",
      role: "architect" as const,
      description: "Создатель кампаний"
    },
    {
      id: "u-officer-1",
      email: "officer@example.com",
      name: "Ильдар Офицер",
      role: "officer" as const,
      description: "Модератор заданий"
    },
  ],
  champions: [
    {
      id: "u-champion-1",
      email: "champion1@example.com",
      name: "Алекс Новиков",
      role: "cadet" as const,
      description: "🏆 3 миссии, Ранг 2 | Активен 1ч назад"
    },
    {
      id: "u-champion-5",
      email: "champion5@example.com",
      name: "Дмитрий Козлов",
      role: "cadet" as const,
      description: "🏆 5 миссий, Ранг 3 | Активен 12ч назад"
    },
    {
      id: "u-academy.ch1",
      email: "academy.ch1@example.com",
      name: "Денис Яковлев",
      role: "cadet" as const,
      description: "🎓 Академия | 4 миссии | Активен сейчас"
    },
  ],
  progress: [
    {
      id: "u-progress-1",
      email: "progress1@example.com",
      name: "Ольга Зайцева",
      role: "cadet" as const,
      description: "📈 2 миссии, Ранг 1 | Активна 2 дня назад"
    },
    {
      id: "u-progress-5",
      email: "progress5@example.com",
      name: "Наталья Попова",
      role: "cadet" as const,
      description: "📈 2 миссии + в процессе | Активна вчера"
    },
  ],
  stalled: [
    {
      id: "u-stalled-1",
      email: "stalled1@example.com",
      name: "Михаил Фёдоров",
      role: "cadet" as const,
      description: "⚠️ 2 миссии | Неактивен 8 дней"
    },
    {
      id: "u-stalled-3",
      email: "stalled3@example.com",
      name: "Александр Медведев",
      role: "cadet" as const,
      description: "⚠️ 2 миссии | Неактивен 15 дней"
    },
  ],
  dropped: [
    {
      id: "u-dropped-1",
      email: "dropped1@example.com",
      name: "Николай Кузнецов",
      role: "cadet" as const,
      description: "❌ 1 миссия | Неактивен месяц"
    },
    {
      id: "u-dropped-2",
      email: "dropped2@example.com",
      name: "Светлана Павлова",
      role: "cadet" as const,
      description: "❌ 0 миссий | Неактивна 50 дней"
    },
  ],
  corporate: [
    {
      id: "u-corp.ch1",
      email: "corp.ch1@example.com",
      name: "Игорь Соколов",
      role: "cadet" as const,
      description: "🏢 Корпоративная адаптация | 3 миссии"
    },
    {
      id: "u-corp.pr2",
      email: "corp.pr2@example.com",
      name: "Ярослава Терентьева",
      role: "cadet" as const,
      description: "🏢 Корпорат | 1 миссия + в процессе"
    },
  ],
  esg: [
    {
      id: "u-esg.ch1",
      email: "esg.ch1@example.com",
      name: "Марина Крылова",
      role: "cadet" as const,
      description: "🌱 ESG Программа | 3 миссии"
    },
    {
      id: "u-esg.pr2",
      email: "esg.pr2@example.com",
      name: "Ярина Панкратова",
      role: "cadet" as const,
      description: "🌱 ESG | 1 миссия + в процессе"
    },
  ],
  newbies: [
    {
      id: "u-cadet-student",
      email: "cadet.student@example.com",
      name: "Новый Кадет (Студент)",
      role: "cadet" as const,
      description: "🆕 Новый пользователь | 0 миссий"
    },
    {
      id: "u-cadet-professional",
      email: "cadet.pro@example.com",
      name: "Новый Кадет (Специалист)",
      role: "cadet" as const,
      description: "🆕 Новый пользователь | 0 миссий"
    },
  ]
};

// Плоский список всех пользователей для authorize
export const mockUsers: MockUser[] = [
  ...mockUserGroups.admins,
  ...mockUserGroups.champions,
  ...mockUserGroups.progress,
  ...mockUserGroups.stalled,
  ...mockUserGroups.dropped,
  ...mockUserGroups.corporate,
  ...mockUserGroups.esg,
  ...mockUserGroups.newbies,
];

export const authConfig = {
  providers: [
    Credentials({
      name: "Mock",
      credentials: {
        email: { label: "Email", type: "email" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        // 1. Проверяем mock users (для демо: архитекторы, офицеры)
        const mockUser = mockUsers.find(
          (candidate) =>
            candidate.email === credentials.email &&
            (!credentials.role || candidate.role === credentials.role)
        );

        if (mockUser) {
          return mockUser;
        }

        // 2. Проверяем реальных пользователей из БД (зарегистрированные кадеты)
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (dbUser) {
            return {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.displayName || dbUser.email,
              role: dbUser.role.toLowerCase() as MockUser["role"],
            };
          }
        } catch (error) {
          console.error("Error checking DB user:", error);
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as MockUser).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).user.id = token.sub ?? "mock";
        (session as any).user.role = token.role as MockUser["role"];
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/sign-in",
  },
} as any; // satisfies NextAuthConfig;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: MockUser["role"];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: MockUser["role"];
  }
}

