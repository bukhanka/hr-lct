import { CadetHistoryWrapper } from "@/components/dashboard/CadetHistoryWrapper";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "История миссий",
};

export default async function CadetHistoryPage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect("/auth/sign-in");
  }

  if ((session as any)?.user?.role !== "cadet") {
    redirect(`/dashboard/${(session as any)?.user?.role}`);
  }

  return (
    <CadetHistoryWrapper />
  );
}

