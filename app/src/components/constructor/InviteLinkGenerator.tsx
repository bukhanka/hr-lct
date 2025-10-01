"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";

interface InviteLinkGeneratorProps {
  campaignId: string;
  campaignName: string;
  onSlugUpdate?: (slug: string) => void;
}

export function InviteLinkGenerator({
  campaignId,
  campaignName,
  onSlugUpdate,
}: InviteLinkGeneratorProps) {
  const [slug, setSlug] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);

  const inviteUrl = slug
    ? `${window.location.origin}/join/${slug}`
    : "Сначала создайте slug";

  // Load campaign slug when modal opens
  useEffect(() => {
    if (showModal && !slug) {
      loadCampaignSlug();
    }
  }, [showModal]);

  const loadCampaignSlug = async () => {
    setIsLoadingCampaign(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.slug) {
          setSlug(data.slug);
        }
      }
    } catch (error) {
      console.error("Error loading campaign:", error);
    } finally {
      setIsLoadingCampaign(false);
    }
  };

  useEffect(() => {
    if (slug && slug.length > 0) {
      generateQRCode(`${window.location.origin}/join/${slug}`);
    }
  }, [slug]);

  const generateQRCode = async (url: string) => {
    try {
      const qr = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(qr);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const handleGenerateSlug = () => {
    // Автоматическая генерация slug из названия кампании
    const autoSlug = campaignName
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);
    setSlug(autoSlug);
  };

  const handleSaveSlug = async () => {
    if (!slug || slug.length < 3) {
      alert("Slug должен быть минимум 3 символа");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (!response.ok) {
        throw new Error("Failed to update slug");
      }

      onSlugUpdate?.(slug);
      alert("✅ Invite-ссылка сохранена!");
    } catch (error) {
      console.error("Error saving slug:", error);
      alert("❌ Ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.download = `qr-${slug}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  return (
    <>
      {/* Trigger Button */}
      {/* <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all"
      >
        <span>🔗</span>
        <span className="font-medium">Invite-ссылка</span>
      </button> */}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  🔗 Пригласительная ссылка
                </h2>
                <p className="text-indigo-300 text-sm mt-1">
                  Создайте красивую ссылку для регистрации кадетов
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-indigo-300 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Slug Input */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-2">
                  URL Slug (короткий идентификатор)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="cosmic-journey-2025"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleGenerateSlug}
                    className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Авто
                  </button>
                </div>
                <p className="text-xs text-indigo-300/75 mt-1">
                  Только латиница, цифры и дефисы
                </p>
              </div>

              <button
                onClick={handleSaveSlug}
                disabled={isSaving || !slug}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
              >
                {isSaving ? "Сохранение..." : "💾 Сохранить slug"}
              </button>
            </div>

            {/* Generated Link */}
            {slug && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-2">
                    Пригласительная ссылка
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteUrl}
                      readOnly
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      {copied ? "✓" : "📋"}
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                    <p className="text-sm font-medium text-indigo-200 mb-4">
                      QR-код для офлайн мероприятий
                    </p>
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-64 h-64 mx-auto bg-white p-4 rounded-lg shadow-lg"
                    />
                    <button
                      onClick={handleDownloadQR}
                      className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      📥 Скачать QR-код
                    </button>
                  </div>
                )}

                {/* Usage Instructions */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-blue-300 mb-2">
                    💡 Как использовать:
                  </h3>
                  <ul className="text-xs text-blue-200 space-y-1">
                    <li>
                      • Поделитесь ссылкой в соцсетях или по email
                    </li>
                    <li>
                      • Распечатайте QR-код для дня открытых дверей
                    </li>
                    <li>
                      • Кандидаты зарегистрируются и автоматически попадут в
                      эту кампанию
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

