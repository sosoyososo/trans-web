"use client";

import { TextSegment, SegmentSettings } from "@/types";
import { segmentText } from "@/lib/text-segmenter";
import { SegmentBlock } from "./segment-block";

interface SourcePaneProps {
  text: string;
  segments: TextSegment[];
  onSegmentsChange: (segments: TextSegment[]) => void;
  settings: SegmentSettings;
}

export function SourcePane({
  text,
  segments,
  onSegmentsChange,
  settings,
}: SourcePaneProps) {
  // Auto-segment when text changes
  const handleTextChange = (newText: string) => {
    const newSegments = segmentText(newText, settings);
    onSegmentsChange(newSegments);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gray-50">
        <h2 className="font-medium text-sm text-gray-600">Original Text</h2>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {segments.length === 0 ? (
          <textarea
            className="w-full h-full min-h-[200px] p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Paste your text here..."
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        ) : (
          <div className="space-y-1">
            {segments.map((segment) => (
              <SegmentBlock
                key={segment.id}
                segment={segment}
                showTranslated={false}
              />
            ))}
          </div>
        )}
      </div>
      <div className="border-t bg-gray-50 p-3">
        <div className="flex gap-4 text-xs text-gray-500">
          <span>{segments.length} segments</span>
          <span>
            {segments.filter((s) => s.status === "success").length} translated
          </span>
        </div>
      </div>
    </div>
  );
}
