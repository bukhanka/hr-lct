import { CadetLeaderboardWrapper } from "@/components/dashboard/CadetLeaderboardWrapper";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Рейтинг",
};

export default async function CadetLeaderboardPage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect("/auth/sign-in");
  }

  if ((session as any)?.user?.role !== "cadet") {
    redirect(`/dashboard/${(session as any)?.user?.role}`);
  }

  return (
    <CadetLeaderboardWrapper />
  );
}

