import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export type MockUser = {
  id: string;
  email: string;
  name: string;
  role: "cadet" | "architect" | "officer" | "admin";
};

export const mockUsers: MockUser[] = [
  {
    id: "u-cadet-1",
    email: "cadet@example.com",
    name: "Кадет А. Вектор",
    role: "cadet",
  },
  {
    id: "u-architect-1",
    email: "architect@example.com",
    name: "Елена Архитектор",
    role: "architect",
  },
  {
    id: "u-officer-1",
    email: "officer@example.com",
    name: "Ильдар Офицер",
    role: "officer",
  },
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
        if (!credentials?.email || !credentials?.role) {
          return null;
        }

        const user = mockUsers.find(
          (candidate) =>
            candidate.email === credentials.email &&
            candidate.role === credentials.role
        );

        return user ?? null;
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
        session.user.id = token.sub ?? "mock";
        session.user.role = token.role as MockUser["role"];
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/sign-in",
  },
} satisfies NextAuthConfig;

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

