"use client";

import { AlertCircle, Loader2, Check, RotateCw } from "lucide-react";
import { TextSegment } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SegmentBlockProps {
  segment: TextSegment;
  onRetry?: () => void;
  showOriginal?: boolean;
  showTranslated?: boolean;
}

export function SegmentBlock({
  segment,
  onRetry,
  showOriginal = true,
  showTranslated = true,
}: SegmentBlockProps) {
  const statusStyles = {
    pending: "border-gray-200",
    translating: "border-blue-200 bg-blue-50",
    success: "border-green-200 bg-green-50",
    error: "border-red-200 bg-red-50",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3 mb-2 transition-colors",
        statusStyles[segment.status]
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          {segment.status === "pending" && (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
          )}
          {segment.status === "translating" && (
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          )}
          {segment.status === "success" && (
            <Check className="w-5 h-5 text-green-500" />
          )}
          {segment.status === "error" && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {showOriginal && (
            <p className="text-sm font-medium text-gray-700 mb-1">
              {segment.original}
            </p>
          )}
          {showTranslated && segment.translated && (
            <p className="text-sm text-gray-900">{segment.translated}</p>
          )}
          {showTranslated && segment.error && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-red-600">{segment.error}</p>
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="h-auto p-0 text-blue-600 hover:text-blue-800"
                >
                  <RotateCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
