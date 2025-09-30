import { CampaignBuilderWorkspace } from "@/components/constructor/CampaignBuilderWorkspace";

interface BuilderPageParams {
  params: Promise<{
    campaignId: string;
  }>;
}

export default async function CampaignBuilderPage({ params }: BuilderPageParams) {
  const { campaignId } = await params;

  return <CampaignBuilderWorkspace campaignId={campaignId} />;
}
