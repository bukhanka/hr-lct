import { notFound } from "next/navigation";
import { Suspense } from "react";

interface CampaignTabbedLayoutProps {
  children: React.ReactNode;
  params: Promise<{ campaignId: string }>;
}

export default async function CampaignTabbedLayout({ children, params }: CampaignTabbedLayoutProps) {
  const { campaignId } = await params;

  if (!campaignId) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-indigo-200">Загрузка...</div>}>
        {children}
      </Suspense>
    </div>
  );
}


