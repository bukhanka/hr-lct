"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Award, Lock, CheckCircle, Star } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { CadetNavigation } from "./CadetNavigation";

interface Purchase {
  id: string;
  itemType: string;
  itemName: string;
  itemDescription: string | null;
  manaCost: number;
  createdAt: string;
}

export function CadetAchievements() {
  const { data: session } = useSession();
  const { theme, getThemeText, getGradientColors, shouldShowEffects } = useTheme();
  const gradients = getGradientColors();
  const primary = theme.palette?.primary || "#8B5CF6";
  const secondary = theme.palette?.secondary || "#38BDF8";

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stats, setStats] = useState({ totalPurchases: 0, totalSpent: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPurchases() {
      if (!(session as any)?.user?.id) return;

      try {
        const response = await fetch(`/api/users/${(session as any)?.user?.id}/profile`);
        
        if (response.ok) {
          const data = await response.json();
          setPurchases(data.recentPurchases || []);
          setStats({
            totalPurchases: data.statistics.totalPurchases || 0,
            totalSpent: data.recentPurchases?.reduce((sum: number, p: Purchase) => sum + p.manaCost, 0) || 0
          });
        }
      } catch (error) {
        console.error("Failed to load purchases:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPurchases();
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
          <p className="text-indigo-100/70 text-lg">Загрузка достижений...</p>
        </div>
      </div>
    );
  }

  return (
    <main 
      className="min-h-screen relative"
      style={{
        background: `linear-gradient(to bottom right, ${gradients.from}, ${gradients.via}, ${gradients.to})`
      }}
    >
      <CadetNavigation />

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-6 py-12 text-white md:px-12 lg:px-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{getThemeText('achievements')}</h1>
          <p className="text-xl opacity-70">
            Ваша коллекция наград и артефактов
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div 
            className="rounded-[24px] p-6 text-center"
            style={{
              background: `linear-gradient(to bottom right, ${primary}10, ${secondary}10)`,
              border: `1px solid ${primary}30`
            }}
          >
            <Award className="w-12 h-12 mx-auto mb-4" style={{ color: primary }} />
            <div className="text-4xl font-bold mb-2">{stats.totalPurchases}</div>
            <div className="text-sm opacity-70">Всего достижений</div>
          </div>

          <div 
            className="rounded-[24px] p-6 text-center"
            style={{
              background: `linear-gradient(to bottom right, ${secondary}10, ${primary}10)`,
              border: `1px solid ${secondary}30`
            }}
          >
            <Star className="w-12 h-12 mx-auto mb-4" style={{ color: secondary }} />
            <div className="text-4xl font-bold mb-2">{stats.totalSpent}</div>
            <div className="text-sm opacity-70">Потрачено маны</div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map((purchase) => (
            <div 
              key={purchase.id}
              className="rounded-[24px] p-6 relative overflow-hidden group hover:scale-105 transition-transform"
              style={{
                background: `linear-gradient(to bottom right, ${primary}10, ${secondary}10)`,
                border: `1px solid ${primary}30`
              }}
            >
              {shouldShowEffects() && (
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                  style={{
                    background: `radial-gradient(circle at center, ${primary}, transparent 70%)`
                  }}
                />
              )}
              
              <div className="relative">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${primary}20` }}
                >
                  <CheckCircle className="w-8 h-8" style={{ color: secondary }} />
                </div>
                
                <h3 className="text-xl font-bold text-center mb-2">{purchase.itemName}</h3>
                {purchase.itemDescription && (
                  <p className="text-sm text-center opacity-70 mb-4">{purchase.itemDescription}</p>
                )}
                
                <div 
                  className="flex items-center justify-between mt-4 pt-4" 
                  style={{ borderTop: `1px solid ${primary}20` }}
                >
                  <span className="text-sm opacity-70">{new Date(purchase.createdAt).toLocaleDateString()}</span>
                  <span className="font-bold" style={{ color: primary }}>{purchase.manaCost} маны</span>
                </div>
              </div>
            </div>
          ))}

          {/* Locked Achievements */}
          {[...Array(6)].map((_, i) => (
            <div 
              key={`locked-${i}`}
              className="rounded-[24px] p-6 relative overflow-hidden opacity-50"
              style={{
                background: `linear-gradient(to bottom right, ${primary}05, ${secondary}05)`,
                border: `1px solid ${primary}20`
              }}
            >
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${primary}10` }}
              >
                <Lock className="w-8 h-8" style={{ color: primary }} />
              </div>
              
              <h3 className="text-xl font-bold text-center mb-2">???</h3>
              <p className="text-sm text-center opacity-50">Заблокировано</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

