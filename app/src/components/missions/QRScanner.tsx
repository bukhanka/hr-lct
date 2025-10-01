"use client";

import { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: Error) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    // Request camera permission
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(() => setHasPermission(true))
        .catch((err) => {
          setHasPermission(false);
          onError?.(err);
        });
    }
  }, [onError]);

  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Запрос доступа к камере...</p>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6">
        <h3 className="text-red-400 font-semibold mb-2">Нет доступа к камере</h3>
        <p className="text-gray-400 text-sm">
          Пожалуйста, разрешите доступ к камере для сканирования QR-кодов.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {isScanning ? (
        <div className="rounded-lg overflow-hidden border-2 border-purple-500/50">
          <Scanner
            onScan={(result) => {
              if (result && result.length > 0) {
                setIsScanning(false);
                onScan(result[0].rawValue);
              }
            }}
            onError={(error) => {
              console.error("QR Scanner error:", error);
              onError?.(error as Error);
            }}
            constraints={{
              facingMode: "environment",
            }}
            styles={{
              container: {
                width: "100%",
                maxWidth: "500px",
              },
            }}
          />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-purple-400 rounded-lg"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-1 bg-purple-400 animate-scan"></div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-8 bg-green-500/10 border border-green-500/50 rounded-lg">
          <div className="text-center">
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
            <p className="text-green-400 font-semibold">QR-код отсканирован!</p>
          </div>
        </div>
      )}
      {isScanning && (
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm">
            Наведите камеру на QR-код для регистрации посещения
          </p>
        </div>
      )}
      {!isScanning && (
        <button
          onClick={() => setIsScanning(true)}
          className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Сканировать еще один QR-код
        </button>
      )}
    </div>
  );
}
