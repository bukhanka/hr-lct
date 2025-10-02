"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Rocket, Target, Trophy, Infinity, Sparkles, Zap, Sprout, Building2, Frown } from "lucide-react";

export default function JoinCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Загружаем информацию о кампании
    fetch(`/api/campaigns?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.campaigns && data.campaigns.length > 0) {
          setCampaign(data.campaigns[0]);
        } else {
          setError("Кампания не найдена");
        }
      })
      .catch(() => setError("Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Регистрируем пользователя
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          displayName: formData.displayName,
          campaignSlug: slug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка регистрации");
        setIsSubmitting(false);
        return;
      }

      // Автоматически логиним пользователя
      await signIn("credentials", {
        email: formData.email,
        redirect: false,
      });

      // Redirect на онбординг
      router.push(`/onboarding/${campaign.id}`);
    } catch (err) {
      setError("Произошла ошибка. Попробуйте снова.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514]">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514]">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Frown className="text-white" size={32} />
            <h1 className="text-2xl font-bold text-white">Упс!</h1>
          </div>
          <p className="text-indigo-200">{error || "Кампания не найдена"}</p>
        </div>
      </div>
    );
  }

  // Определяем тематические стили
  const themeStyles = getThemeStyles(campaign.theme);

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: themeStyles.background }}
    >
      {/* Фоновые эффекты */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-block mb-6">
              <div className="text-white">{themeStyles.icon}</div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              {campaign.name}
            </h1>
            <p className="text-xl text-indigo-200 max-w-lg mx-auto">
              {campaign.description || "Присоединяйтесь к приключению и начните своё путешествие"}
            </p>
          </div>

          {/* Registration Form */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl animate-scale-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-2">
                  Ваше имя
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  placeholder="Иван Иванов"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {!isSubmitting && <Rocket size={20} />}
                {isSubmitting ? "Регистрация..." : "Начать путешествие"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-indigo-300/75">
              Уже зарегистрированы?{" "}
              <a href="/auth/sign-in" className="text-purple-400 hover:underline">
                Войти
              </a>
            </div>
          </div>

          {/* Campaign Stats Preview */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
              <div className="flex justify-center mb-2">
                <Infinity className="text-white" size={32} />
              </div>
              <div className="text-xs text-indigo-300">Возможностей</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
              <div className="flex justify-center mb-2">
                <Target className="text-white" size={32} />
              </div>
              <div className="text-xs text-indigo-300">Увлекательно</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
              <div className="flex justify-center mb-2">
                <Trophy className="text-white" size={32} />
              </div>
              <div className="text-xs text-indigo-300">Награды</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Вспомогательная функция для тематических стилей
function getThemeStyles(theme: string | null) {
  switch (theme) {
    case "galactic-academy":
      return {
        background: "linear-gradient(to bottom right, #050514, #0b0924, #1a0b3d)",
        icon: <Rocket size={64} />,
      };
    case "cyberpunk-hub":
      return {
        background: "linear-gradient(to bottom right, #0a0a0a, #1a0f2e, #2d1b4e)",
        icon: <Zap size={64} />,
      };
    case "esg-mission":
      return {
        background: "linear-gradient(to bottom right, #052e16, #064e3b, #065f46)",
        icon: <Sprout size={64} />,
      };
    case "corporate-metropolis":
      return {
        background: "linear-gradient(to bottom right, #1e1e1e, #2d2d3f, #3d3d5c)",
        icon: <Building2 size={64} />,
      };
    default:
      return {
        background: "linear-gradient(to bottom right, #050514, #0b0924, #050514)",
        icon: <Sparkles size={64} />,
      };
  }
}

