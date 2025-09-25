import { CampaignBuilderWorkspace } from "@/components/constructor/CampaignBuilderWorkspace";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

interface BuilderPageParams {
  params: Promise<{
    campaignId: string;
  }>;
}

export default async function CampaignBuilderPage({ params }: BuilderPageParams) {
  const session = await getServerSession(authConfig);

  if (!session) {
    redirect("/auth/sign-in");
  }

  if (session.user.role !== "architect") {
    redirect(`/dashboard/${session.user.role}`);
  }

  const { campaignId } = await params;

  return <CampaignBuilderWorkspace campaignId={campaignId} />;
}
