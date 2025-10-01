"use client";

import { motion } from "framer-motion";
import { Activity, Trophy, ShoppingBag, Clock, Zap, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface ActivityItem {
  missionId: string;
  missionName: string;
  campaignName?: string | null;
  completedAt: string;
  experienceEarned: number;
  manaEarned: number;
}

interface Purchase {
  id: string;
  item: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    imageUrl: string | null;
  };
  purchasedAt: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  purchases: Purchase[];
  getMotivationText: (key: string) => string;
}

export function RecentActivity({ activities, purchases, getMotivationText }: RecentActivityProps) {
  // Combine and sort activities and purchases by date
  const allActivities: Array<{
    type: 'mission' | 'purchase';
    date: string;
    data: any;
  }> = [
    ...activities.map(a => ({ type: 'mission' as const, date: a.completedAt, data: a })),
    ...purchases.map(p => ({ type: 'purchase' as const, date: p.purchasedAt, data: p }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  if (allActivities.length === 0) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-indigo-400" />
          Недавняя активность
        </h3>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-indigo-300/50 mx-auto mb-3" />
          <p className="text-indigo-200/70">Активность появится после выполнения миссий</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          Недавняя активность
        </h3>
        <span className="text-sm text-indigo-200/60">
          Последние {allActivities.length} событий
        </span>
      </div>

      <div className="space-y-3">
        {allActivities.map((activity, index) => (
          <motion.div
            key={`${activity.type}-${activity.data.id || activity.data.missionId}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              activity.type === 'mission'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-purple-500/20 text-purple-400'
            }`}>
              {activity.type === 'mission' ? (
                <Trophy className="w-5 h-5" />
              ) : (
                <ShoppingBag className="w-5 h-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {activity.type === 'mission' ? (
                <>
                  <h4 className="text-white font-medium truncate">
                    {activity.data.missionName}
                  </h4>
                  {activity.data.campaignName && (
                    <p className="text-xs text-indigo-200/60 truncate">
                      {activity.data.campaignName}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1 text-indigo-300">
                      <Zap className="w-3 h-3" />
                      +{activity.data.experienceEarned} {getMotivationText('xp')}
                    </span>
                    <span className="flex items-center gap-1 text-blue-300">
                      <Award className="w-3 h-3" />
                      +{activity.data.manaEarned} {getMotivationText('mana')}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h4 className="text-white font-medium truncate">
                    Куплено: {activity.data.item.name}
                  </h4>
                  <p className="text-xs text-indigo-200/60 truncate">
                    {activity.data.item.description || 'Покупка в магазине'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      -{activity.data.item.price} {getMotivationText('mana')}
                    </span>
                    <span className="text-xs text-indigo-200/60">
                      {activity.data.item.category}
                    </span>
                  </div>
                </>
              )}

              {/* Timestamp */}
              <p className="text-xs text-indigo-200/50 mt-2">
                {formatDistanceToNow(new Date(activity.date), {
                  addSuffix: true,
                  locale: ru
                })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

