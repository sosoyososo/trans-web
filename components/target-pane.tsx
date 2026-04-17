"use client";

import { TextSegment } from "@/types";
import { SegmentBlock } from "./segment-block";

interface TargetPaneProps {
  segments: TextSegment[];
  onRetry: (segmentId: string) => void;
}

export function TargetPane({ segments, onRetry }: TargetPaneProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gray-50">
        <h2 className="font-medium text-sm text-gray-600">Translated Text</h2>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {segments.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Translated text will appear here
          </div>
        ) : (
          <div className="space-y-1">
            {segments.map((segment) => (
              <SegmentBlock
                key={segment.id}
                segment={segment}
                onRetry={() => onRetry(segment.id)}
                showOriginal={false}
              />
            ))}
          </div>
        )}
      </div>
      <div className="border-t bg-gray-50 p-3">
        <div className="flex gap-4 text-xs text-gray-500">
          <span>{segments.length} segments</span>
          <span>
            {segments.filter((s) => s.status === "success").length} completed
          </span>
          {segments.some((s) => s.status === "error") && (
            <span className="text-red-500">
              {segments.filter((s) => s.status === "error").length} failed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
