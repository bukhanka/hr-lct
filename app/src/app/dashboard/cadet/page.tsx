import { CadetOverview } from "@/components/dashboard/CadetOverview";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Кабинет кадета",
};

export default async function CadetDashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect("/auth/sign-in");
  }

  if (session.user.role !== "cadet") {
    redirect(`/dashboard/${session.user.role}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] py-16">
      <div className="mx-auto max-w-5xl space-y-12 px-6 text-white md:px-12 lg:px-16">
        <CadetOverview />
      </div>
    </main>
  );
}

