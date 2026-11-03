import type { GeminiModel } from "./gemini";

const STORAGE_KEY = "microstock_settings";

export type AppSettings = {
  geminiKeys: string[];
  geminiModel: GeminiModel;
};

const defaults: AppSettings = {
  geminiKeys: [],
  geminiModel: "gemini-2.5-flash",
};

import { GEMINI_MODELS } from "./gemini";

const validModelValues = GEMINI_MODELS.map((m) => m.value) as readonly string[];

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = { ...defaults, ...JSON.parse(raw) };
    // Reset to default if stored model is no longer available
    if (!validModelValues.includes(parsed.geminiModel)) {
      parsed.geminiModel = defaults.geminiModel;
    }
    return parsed;
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
