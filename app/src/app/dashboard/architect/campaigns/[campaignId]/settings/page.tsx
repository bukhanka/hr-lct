import { Suspense } from "react";
import { notFound } from "next/navigation";
import CampaignTabbedLayout from "../(tabbed)/layout";
import { CampaignSettingsForm } from "@/components/constructor/CampaignSettingsForm";

interface CampaignSettingsPageProps {
  params: Promise<{ campaignId: string }>;
}

async function CampaignSettingsPageContent({ params }: CampaignSettingsPageProps) {
  const { campaignId } = await params;
  if (!campaignId) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="text-indigo-200">Загружаем настройки...</div>}>
      <CampaignSettingsForm campaignId={campaignId} />
    </Suspense>
  );
}

export default function CampaignSettingsPage(props: CampaignSettingsPageProps) {
  return (
    <CampaignTabbedLayout params={props.params}>
      <CampaignSettingsPageContent {...props} />
    </CampaignTabbedLayout>
  );
}

