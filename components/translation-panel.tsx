"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TextSegment, ApiConfig, SegmentSettings } from "@/types";
import { TranslateResponse } from "@/types";
import { getSegmentSettings, saveSegmentSettings } from "@/lib/config-store";
import { segmentText } from "@/lib/text-segmenter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Check, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TranslationPanelProps {
  config: ApiConfig;
}

export function TranslationPanel({ config }: TranslationPanelProps) {
  const [text, setText] = useState("");
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [settings, setSettings] = useState<SegmentSettings>({
    minLength: 300,
    maxLength: 500,
  });
  const [inputText, setInputText] = useState("");
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const leftRowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleScroll = (source: 'left' | 'right') => {
    if (isScrolling.current) return;
    isScrolling.current = true;

    const sourceRef = source === 'left' ? leftScrollRef : rightScrollRef;
    const targetRef = source === 'left' ? rightScrollRef : leftScrollRef;

    if (sourceRef.current && targetRef.current) {
      const sourceScrollTop = sourceRef.current.scrollTop;
      targetRef.current.scrollTop = sourceScrollTop;
    }

    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  };

  // Sync row heights between left and right columns
  useEffect(() => {
    const syncHeights = () => {
      leftRowRefs.current.forEach((leftRow, index) => {
        const rightRow = rightRowRefs.current[index];
        if (leftRow && rightRow) {
          const maxHeight = Math.max(leftRow.scrollHeight, rightRow.scrollHeight);
          leftRow.style.minHeight = `${maxHeight}px`;
          rightRow.style.minHeight = `${maxHeight}px`;
        }
      });
    };

    // Delay to ensure DOM is rendered
    const timeout = setTimeout(syncHeights, 50);
    return () => clearTimeout(timeout);
  }, [segments]);

  useEffect(() => {
    const savedSettings = getSegmentSettings();
    setSettings(savedSettings);
  }, []);

  const handleInputChange = (newText: string) => {
    setInputText(newText);
  };

  const handleSegment = () => {
    if (!inputText.trim()) return;

    const newSegments = segmentText(inputText, settings);

    setSegments(newSegments);
    setText(inputText);
    setInputText("");
  };

  const handleTranslate = useCallback(async () => {
    if (!config.endpoint || !config.apiKey) {
      alert("Please configure API settings first");
      return;
    }

    const segmentsToTranslate = segments.filter(
      (s) => s.status === "pending" || s.status === "error"
    );

    // Limited parallelism: max 3 concurrent requests
    const CONCURRENCY = 3;

    const translateSegment = async (segment: TextSegment) => {
      setSegments((prev) =>
        prev.map((s) =>
          s.id === segment.id ? { ...s, status: "translating" as const } : s
        )
      );

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: segment.original,
            model: config.model,
            endpoint: config.endpoint,
            apiKey: config.apiKey,
          }),
        });

        const data: TranslateResponse = await response.json();

        if (data.success && data.translatedText) {
          setSegments((prev) =>
            prev.map((s) =>
              s.id === segment.id
                ? {
                    ...s,
                    status: "success" as const,
                    translated: data.translatedText || "",
                  }
                : s
            )
          );
        } else {
          setSegments((prev) =>
            prev.map((s) =>
              s.id === segment.id
                ? {
                    ...s,
                    status: "error" as const,
                    error: data.error || "Translation failed",
                  }
                : s
            )
          );
        }
      } catch (error) {
        setSegments((prev) =>
          prev.map((s) =>
            s.id === segment.id
              ? {
                  ...s,
                  status: "error" as const,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Network error",
                }
              : s
          )
        );
      }
    };

    // Process segments with limited concurrency
    for (let i = 0; i < segmentsToTranslate.length; i += CONCURRENCY) {
      const batch = segmentsToTranslate.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(translateSegment));
    }
  }, [segments, config]);

  // Auto-translate when segments change
  useEffect(() => {
    if (segments.length > 0 && config.endpoint && config.apiKey) {
      const hasPending = segments.some(
        (s) => s.status === "pending" || s.status === "error"
      );
      if (hasPending) {
        handleTranslate();
      }
    }
  }, [segments.length, config.endpoint, config.apiKey]);

  const handleRetry = useCallback(
    (segmentId: string) => {
      setSegments((prev) =>
        prev.map((s) =>
          s.id === segmentId ? { ...s, status: "pending" as const } : s
        )
      );
    },
    []
  );

  const handleSettingsChange = (
    key: keyof SegmentSettings,
    value: number
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSegmentSettings(newSettings);
  };

  const statusStyles = {
    pending: "bg-gray-50 border-gray-200",
    translating: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input area */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex gap-4">
          <textarea
            className="flex-1 min-h-[80px] p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Paste your text here to segment..."
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
          />
          <div className="flex flex-col justify-end gap-2">
            <Button onClick={handleSegment} disabled={!inputText.trim()}>
              Segment
            </Button>
            <Button onClick={handleTranslate} disabled={segments.length === 0}>
              Translate All
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="minLength" className="text-sm">
              Min chars:
            </Label>
            <Input
              id="minLength"
              type="number"
              className="w-20"
              value={settings.minLength}
              onChange={(e) =>
                handleSettingsChange("minLength", parseInt(e.target.value) || 0)
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="maxLength" className="text-sm">
              Max chars:
            </Label>
            <Input
              id="maxLength"
              type="number"
              className="w-20"
              value={settings.maxLength}
              onChange={(e) =>
                handleSettingsChange("maxLength", parseInt(e.target.value) || 0)
              }
            />
          </div>
          <span className="text-sm text-gray-500">
            {segments.length} segments
          </span>
        </div>
      </div>

      {/* Comparison area */}
      <div className="flex-1 min-h-0 flex">
        {/* Original column */}
        <div
          className="flex-1 border-r overflow-auto"
          ref={leftScrollRef}
          onScroll={() => handleScroll('left')}
        >
          <div className="sticky top-0 bg-gray-100 border-b px-4 py-2 font-medium text-sm text-gray-600">
            Original Text
          </div>
          <div className="divide-y">
            {segments.length === 0 ? (
              <div className="p-4 text-gray-400 text-sm">
                Segmented text will appear here
              </div>
            ) : (
              segments.map((segment, index) => (
                <div
                  key={segment.id}
                  ref={(el) => { leftRowRefs.current[index] = el; }}
                  className={cn(
                    "p-3 min-h-[60px] border-b transition-colors",
                    statusStyles[segment.status]
                  )}
                >
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {segment.original}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Translated column */}
        <div
          className="flex-1 overflow-auto"
          ref={rightScrollRef}
          onScroll={() => handleScroll('right')}
        >
          <div className="sticky top-0 bg-gray-100 border-b px-4 py-2 font-medium text-sm text-gray-600">
            Translated Text
          </div>
          <div className="divide-y">
            {segments.length === 0 ? (
              <div className="p-4 text-gray-400 text-sm">
                Translation will appear here
              </div>
            ) : (
              segments.map((segment, index) => (
                <div
                  key={segment.id}
                  ref={(el) => { rightRowRefs.current[index] = el; }}
                  className={cn(
                    "p-3 min-h-[60px] border-b transition-colors",
                    statusStyles[segment.status]
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {segment.status === "pending" && (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                      {segment.status === "translating" && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      )}
                      {segment.status === "success" && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                      {segment.status === "error" && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {segment.translated && (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {segment.translated}
                        </p>
                      )}
                      {segment.error && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-red-600">{segment.error}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetry(segment.id)}
                            className="h-auto p-0 text-blue-600 hover:text-blue-800"
                          >
                            <RotateCw className="w-3 h-3 mr-1" />
                            Retry
                          </Button>
                        </div>
                      )}
                      {segment.status === "pending" && (
                        <p className="text-sm text-gray-400">Waiting...</p>
                      )}
                      {segment.status === "translating" && (
                        <p className="text-sm text-blue-400">Translating...</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
