import { ApiConfig, SegmentSettings, ModelType } from "@/types";

const CONFIG_KEY = "translation-config";
const SETTINGS_KEY = "translation-settings";

const DEFAULT_CONFIG: ApiConfig = {
  endpoint: "",
  apiKey: "",
  model: "minimax" as ModelType,
};

const DEFAULT_SETTINGS: SegmentSettings = {
  minLength: 50,
  maxLength: 500,
};

export function getApiConfig(): ApiConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  const stored = localStorage.getItem(CONFIG_KEY);
  if (!stored) return DEFAULT_CONFIG;
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveApiConfig(config: ApiConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function getSegmentSettings(): SegmentSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSegmentSettings(settings: SegmentSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
