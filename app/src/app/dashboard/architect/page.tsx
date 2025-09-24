import { ArchitectOverview } from "@/components/dashboard/ArchitectOverview";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Командный центр HR",
};

export default async function ArchitectDashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect("/auth/sign-in");
  }

  if (session.user.role !== "architect") {
    redirect(`/dashboard/${session.user.role}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] py-16">
      <div className="mx-auto max-w-6xl space-y-12 px-6 text-white md:px-12 lg:px-16">
        <ArchitectOverview />
      </div>
    </main>
  );
}

