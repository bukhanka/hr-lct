"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем информацию о кампании
    fetch(`/api/campaigns/${campaignId}`)
      .then((res) => res.json())
      .then((data) => {
        setCampaign(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        router.push("/dashboard/cadet");
      });
  }, [campaignId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514]">
        <div className="text-white text-xl">Подготовка к запуску...</div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const themeConfig = getThemeConfig(campaign.theme);
  const steps = getOnboardingSteps(themeConfig);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Завершаем онбординг
      router.push("/dashboard/cadet");
    }
  };

  const handleSkip = () => {
    router.push("/dashboard/cadet");
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ background: themeConfig.background }}
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-9xl mb-8"
            >
              {steps[currentStep].icon}
            </motion.div>

            {/* Title */}
            <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
              {steps[currentStep].title}
            </h1>

            {/* Description */}
            <p className="text-xl text-indigo-200 mb-12 max-w-2xl mx-auto leading-relaxed">
              {steps[currentStep].description}
            </p>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              {currentStep < steps.length - 1 && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 text-indigo-300 hover:text-white transition"
                >
                  Пропустить
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300"
              >
                {currentStep < steps.length - 1 ? "Далее →" : "🚀 Начать"}
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mt-12">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? "w-8 bg-purple-500"
                      : index < currentStep
                      ? "bg-purple-500/50"
                      : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Theme configurations
function getThemeConfig(theme: string | null) {
  switch (theme) {
    case "galactic-academy":
      return {
        background: "linear-gradient(to bottom right, #050514, #0b0924, #1a0b3d)",
        primaryColor: "#8b5cf6",
      };
    case "cyberpunk-hub":
      return {
        background: "linear-gradient(to bottom right, #0a0a0a, #1a0f2e, #2d1b4e)",
        primaryColor: "#06b6d4",
      };
    case "esg-mission":
      return {
        background: "linear-gradient(to bottom right, #052e16, #064e3b, #065f46)",
        primaryColor: "#10b981",
      };
    case "corporate-metropolis":
      return {
        background: "linear-gradient(to bottom right, #1e1e1e, #2d2d3f, #3d3d5c)",
        primaryColor: "#6366f1",
      };
    default:
      return {
        background: "linear-gradient(to bottom right, #050514, #0b0924, #050514)",
        primaryColor: "#8b5cf6",
      };
  }
}

// Onboarding steps based on theme
function getOnboardingSteps(themeConfig: any) {
  return [
    {
      icon: "🚀",
      title: "Добро пожаловать на борт, Кадет!",
      description:
        "Вы только что присоединились к уникальному путешествию. Здесь каждое действие приближает вас к цели, а каждая миссия — это шаг вперёд.",
    },
    {
      icon: "🗺️",
      title: "Ваша Галактическая Карта",
      description:
        "Визуализация всех миссий в виде звёздной карты. Выполняйте миссии последовательно, разблокируйте новые возможности и прокачивайте компетенции.",
    },
    {
      icon: "⭐",
      title: "Опыт и Награды",
      description:
        "За каждую выполненную миссию вы получаете опыт (XP), игровую валюту (мана) и прокачиваете компетенции. Достигайте новых рангов и открывайте уникальные возможности!",
    },
    {
      icon: "🏆",
      title: "Магазин и Достижения",
      description:
        "Тратьте заработанную ману на реальные призы: мерч, билеты на мероприятия или виртуальные бонусы. Собирайте артефакты и делитесь успехами!",
    },
  ];
}

