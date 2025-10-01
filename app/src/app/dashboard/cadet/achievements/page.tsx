import { CadetAchievementsWrapper } from "@/components/dashboard/CadetAchievementsWrapper";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Достижения",
};

export default async function CadetAchievementsPage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect("/auth/sign-in");
  }

  if ((session as any)?.user?.role !== "cadet") {
    redirect(`/dashboard/${(session as any)?.user?.role}`);
  }

  return (
    <CadetAchievementsWrapper />
  );
}

