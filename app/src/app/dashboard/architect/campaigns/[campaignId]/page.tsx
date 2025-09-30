import { Suspense } from "react";
import { notFound } from "next/navigation";
import CampaignTabbedLayout from "./(tabbed)/layout";
import { CampaignOverview } from "@/components/constructor/CampaignOverview";

interface CampaignPageProps {
  params: Promise<{ campaignId: string }>;
}

async function CampaignOverviewPageContent({ params }: CampaignPageProps) {
  const { campaignId } = await params;
  if (!campaignId) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="text-indigo-200">Загрузка кампании...</div>}>
      <CampaignOverview campaignId={campaignId} />
    </Suspense>
  );
}

export default function CampaignPage(props: CampaignPageProps) {
  return (
    <CampaignTabbedLayout params={props.params}>
      {/* @ts-expect-error Async Server Component */}
      <CampaignOverviewPageContent {...props} />
    </CampaignTabbedLayout>
  );
}

