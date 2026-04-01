import { GoogleGenAI } from "@google/genai";

const PRIMARY_KEY = process.env.GEMINI_API_KEY as string;
const FALLBACK_KEY = "AIzaSyD2gUzC4QxIDAG2hoAOu7Wapr10Qq68B1k";

let currentKeyIndex = 0;
const keys = [PRIMARY_KEY, FALLBACK_KEY];

export function getAI() {
  if (currentKeyIndex >= keys.length) {
    return null;
  }
  return new GoogleGenAI({ apiKey: keys[currentKeyIndex] });
}

export function switchToNextKey() {
  currentKeyIndex++;
  console.log(`Switching to AI key index: ${currentKeyIndex}`);
}

export function isAIWorking() {
  return currentKeyIndex < keys.length;
}

export const AI_ERROR_MESSAGE = {
  de: "KI funktioniert heute nicht mehr",
  en: "AI is not working today"
};
