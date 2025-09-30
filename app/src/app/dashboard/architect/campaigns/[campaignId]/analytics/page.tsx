import { Suspense } from "react";
import { notFound } from "next/navigation";
import CampaignTabbedLayout from "../(tabbed)/layout";
import { CampaignAnalyticsContent } from "@/components/constructor/CampaignAnalyticsContent";

interface CampaignAnalyticsPageProps {
  params: Promise<{ campaignId: string }>;
}

async function CampaignAnalyticsPageContent({ params }: CampaignAnalyticsPageProps) {
  const { campaignId } = await params;
  if (!campaignId) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="text-indigo-200">Загружаем аналитику...</div>}>
      <CampaignAnalyticsContent campaignId={campaignId} />
    </Suspense>
  );
}

export default function CampaignAnalyticsPage(props: CampaignAnalyticsPageProps) {
  return (
    <CampaignTabbedLayout params={props.params}>
      <CampaignAnalyticsPageContent {...props} />
    </CampaignTabbedLayout>
  );
}

