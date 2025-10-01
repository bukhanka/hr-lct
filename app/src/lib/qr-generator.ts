import QRCode from "qrcode";
import crypto from "crypto";

const QR_SECRET = process.env.QR_SECRET || "default-secret-change-in-production";

export interface QRPayload {
  missionId: string;
  eventId?: string;
  timestamp: number;
  signature: string;
}

/**
 * Generate HMAC signature for QR data
 */
function generateSignature(data: string): string {
  return crypto
    .createHmac("sha256", QR_SECRET)
    .update(data)
    .digest("hex");
}

/**
 * Verify HMAC signature
 */
function verifySignature(data: string, signature: string): boolean {
  const expectedSignature = generateSignature(data);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Generate QR code data with signature
 */
export function generateQRData(missionId: string, eventId?: string): QRPayload {
  const timestamp = Date.now();
  const dataToSign = `${missionId}:${eventId || ""}:${timestamp}`;
  const signature = generateSignature(dataToSign);

  return {
    missionId,
    eventId,
    timestamp,
    signature,
  };
}

/**
 * Generate QR code image as Data URL
 */
export async function generateQRCode(
  missionId: string,
  eventId?: string
): Promise<string> {
  const qrData = generateQRData(missionId, eventId);
  const qrString = JSON.stringify(qrData);

  try {
    const dataUrl = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: "H",
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return dataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Verify QR code data
 */
export function verifyQRData(
  qrData: QRPayload,
  options?: {
    maxAge?: number; // Maximum age in milliseconds
  }
): { valid: boolean; error?: string } {
  const { missionId, eventId, timestamp, signature } = qrData;

  // Verify signature
  const dataToVerify = `${missionId}:${eventId || ""}:${timestamp}`;
  if (!verifySignature(dataToVerify, signature)) {
    return { valid: false, error: "Invalid signature" };
  }

  // Check timestamp (default max age: 24 hours)
  const maxAge = options?.maxAge || 24 * 60 * 60 * 1000;
  const age = Date.now() - timestamp;

  if (age > maxAge) {
    return { valid: false, error: "QR code expired" };
  }

  if (age < 0) {
    return { valid: false, error: "Invalid timestamp" };
  }

  return { valid: true };
}

/**
 * Parse QR code string
 */
export function parseQRData(qrString: string): QRPayload | null {
  try {
    const data = JSON.parse(qrString) as QRPayload;
    
    if (!data.missionId || !data.timestamp || !data.signature) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error parsing QR data:", error);
    return null;
  }
}
