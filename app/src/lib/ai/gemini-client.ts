import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";

if (!API_KEY && process.env.NODE_ENV !== "development") {
  console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
}

export const genAI = new GoogleGenerativeAI(API_KEY);

// Get the text generation model
export function getTextModel() {
  return genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
}

// Get the vision model (if needed for image analysis)
export function getVisionModel() {
  return genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
}

export const AI_CONFIG = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 2048,
};

// Rate limiting helper (simple in-memory cache)
const requestCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export function getCachedResult(key: string) {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  return null;
}

export function setCachedResult(key: string, result: any) {
  requestCache.set(key, { result, timestamp: Date.now() });
  
  // Clean old cache entries
  if (requestCache.size > 100) {
    const entries = Array.from(requestCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, 20);
    toDelete.forEach(([key]) => requestCache.delete(key));
  }
}
