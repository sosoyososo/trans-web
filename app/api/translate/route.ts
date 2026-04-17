import { NextRequest, NextResponse } from "next/server";
import { TranslateRequest, TranslateResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();
    const { text, model, endpoint, apiKey } = body;

    if (!text || !model || !endpoint || !apiKey) {
      return NextResponse.json<TranslateResponse>(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build request based on model type
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    let requestBody: Record<string, unknown>;

    if (model === "minimax") {
      requestBody = {
        model: "MiniMax-Text-01",
        messages: [
          {
            role: "user",
            content: `Translate the following text to Chinese: \n\n${text}`,
          },
        ],
      };
    } else {
      // deepseek
      requestBody = {
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: `Translate the following text to Chinese: \n\n${text}`,
          },
        ],
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json<TranslateResponse>(
        { success: false, error: `API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract translated text (common pattern for both APIs)
    const translatedText =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      data.output ||
      "";

    return NextResponse.json<TranslateResponse>({
      success: true,
      translatedText: translatedText.trim(),
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json<TranslateResponse>(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Translation failed",
      },
      { status: 500 }
    );
  }
}
