export type ModelType = "minimax" | "deepseek";

export interface ApiConfig {
  endpoint: string;
  apiKey: string;
  model: ModelType;
}

export interface SegmentSettings {
  minLength: number;
  maxLength: number;
}

export interface TextSegment {
  id: string;
  original: string;
  translated: string;
  status: "pending" | "translating" | "success" | "error";
  error?: string;
}

export interface TranslateRequest {
  text: string;
  model: ModelType;
  endpoint: string;
  apiKey: string;
}

export interface TranslateResponse {
  success: boolean;
  translatedText?: string;
  error?: string;
}
