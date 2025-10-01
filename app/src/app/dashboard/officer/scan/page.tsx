"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const QRScanner = dynamic(() => import("@/components/missions/QRScanner"), {
  ssr: false,
});

interface ScanResult {
  success: boolean;
  missionName?: string;
  userName?: string;
  error?: string;
}

export default function OfficerScanPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  if (!session || (session.user as any)?.role !== "OFFICER") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 max-w-md">
          <h3 className="text-red-400 font-semibold mb-2">Доступ запрещен</h3>
          <p className="text-gray-400 text-sm">
            Только офицеры могут сканировать QR-коды для регистрации посещения.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const handleScan = async (qrData: string) => {
    setLoading(true);
    setResult(null);

    try {
      // Parse QR data
      const data = JSON.parse(qrData);
      
      if (!data.missionId) {
        setResult({
          success: false,
          error: "Неверный формат QR-кода",
        });
        setLoading(false);
        return;
      }

      // Get mission info
      const missionResponse = await fetch(`/api/missions/${data.missionId}`);
      if (!missionResponse.ok) {
        throw new Error("Миссия не найдена");
      }
      const mission = await missionResponse.json();

      // Check in user
      const checkInResponse = await fetch(`/api/missions/${data.missionId}/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrData: data,
        }),
      });

      if (!checkInResponse.ok) {
        const error = await checkInResponse.json();
        throw new Error(error.error || "Не удалось зарегистрировать посещение");
      }

      const checkInResult = await checkInResponse.json();

      setResult({
        success: true,
        missionName: mission.name,
        userName: (session.user as any)?.displayName || "Пользователь",
      });

      // Auto-close success message after 3 seconds
      setTimeout(() => {
        setResult(null);
        setScanning(false);
      }, 3000);
    } catch (error: any) {
      console.error("Check-in error:", error);
      setResult({
        success: false,
        error: error.message || "Произошла ошибка при регистрации",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: Error) => {
    console.error("Scanner error:", error);
    setResult({
      success: false,
      error: "Ошибка при сканировании QR-кода",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-purple-400 hover:text-purple-300 mb-4 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Назад
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">
            Сканирование QR-кода
          </h1>
          <p className="text-gray-400">
            Отсканируйте QR-код участника для регистрации посещения мероприятия
          </p>
        </div>

        {/* Scanner */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          {!scanning ? (
            <div className="text-center py-12">
              <svg
                className="w-24 h-24 text-purple-400 mx-auto mb-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">
                Готовы к сканированию
              </h3>
              <p className="text-gray-400 mb-6">
                Нажмите кнопку ниже, чтобы начать
              </p>
              <button
                onClick={() => setScanning(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
              >
                Начать сканирование
              </button>
            </div>
          ) : (
            <>
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Обработка...</p>
                  </div>
                </div>
              ) : result ? (
                <div className="p-8">
                  {result.success ? (
                    <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-6">
                      <svg
                        className="w-16 h-16 text-green-400 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <h3 className="text-green-400 font-semibold text-xl text-center mb-2">
                        Успешно зарегистрировано!
                      </h3>
                      <p className="text-gray-300 text-center">
                        <strong>{result.userName}</strong> отмечен на миссии{" "}
                        <strong>{result.missionName}</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6">
                      <svg
                        className="w-16 h-16 text-red-400 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <h3 className="text-red-400 font-semibold text-xl text-center mb-2">
                        Ошибка
                      </h3>
                      <p className="text-gray-300 text-center">{result.error}</p>
                      <button
                        onClick={() => {
                          setResult(null);
                          setScanning(false);
                        }}
                        className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Попробовать снова
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <QRScanner onScan={handleScan} onError={handleError} />
              )}
              {!loading && !result && (
                <button
                  onClick={() => setScanning(false)}
                  className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Отменить
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
