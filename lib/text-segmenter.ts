import { TextSegment, SegmentSettings } from "@/types";
import { generateId } from "./utils";

const SENTENCE_DELIMITERS = /[。！？.!?]/;
const CLAUSE_DELIMITERS = /[，、,;；]/;

export function segmentText(
  text: string,
  settings: SegmentSettings
): TextSegment[] {
  if (!text.trim()) return [];

  // Step 1: Split by sentence delimiters
  const rawSegments = text.split(SENTENCE_DELIMITERS).filter((s) => s.trim());

  const result: TextSegment[] = [];
  let buffer = "";

  for (const segment of rawSegments) {
    const trimmed = segment.trim();
    const length = trimmed.length;

    if (length === 0) continue;

    // If too long, split by clause delimiters first
    if (length > settings.maxLength) {
      // Flush buffer if it has content
      if (buffer.length >= settings.minLength) {
        result.push(createSegment(buffer));
        buffer = "";
      } else if (buffer.length > 0) {
        // Keep buffer content for merging with next segment
        buffer += "。" + trimmed;
        continue;
      }

      const subSegments = splitByClauses(trimmed, settings.maxLength);
      for (const sub of subSegments) {
        if (sub.length >= settings.minLength) {
          result.push(createSegment(sub));
        } else {
          // Accumulate short segments
          if (buffer) {
            buffer += "。" + sub;
          } else {
            buffer = sub;
          }
        }
      }
      continue;
    }

    // Add to buffer
    if (buffer) {
      buffer += "。" + trimmed;
    } else {
      buffer = trimmed;
    }

    // If buffer meets minimum length, create a segment
    if (buffer.length >= settings.minLength) {
      result.push(createSegment(buffer));
      buffer = "";
    }
  }

  // Handle remaining buffer
  if (buffer) {
    if (buffer.length >= settings.minLength) {
      result.push(createSegment(buffer));
    } else if (result.length > 0) {
      // Merge remaining short buffer with last segment
      const lastIndex = result.length - 1;
      result[lastIndex] = createSegment(result[lastIndex].original + "。" + buffer);
    } else {
      // No result yet, just use buffer as-is
      result.push(createSegment(buffer));
    }
  }

  return result;
}

function splitByClauses(text: string, maxLength: number): string[] {
  const result: string[] = [];
  let current = "";

  const clauses = text.split(CLAUSE_DELIMITERS);

  for (const clause of clauses) {
    if (current.length + clause.length <= maxLength) {
      current += (current ? "，" : "") + clause;
    } else {
      if (current) result.push(current);
      current = clause;
    }
  }

  if (current) result.push(current);
  return result;
}

function mergeShortSegments(
  segments: TextSegment[],
  minLength: number
): TextSegment[] {
  const result: TextSegment[] = [];
  let buffer = "";

  for (const segment of segments) {
    buffer += (buffer ? "。" : "") + segment.original;

    if (buffer.length >= minLength) {
      result.push(createSegment(buffer));
      buffer = "";
    }
  }

  // If there's remaining buffer that's too short, merge it with the last result
  if (buffer && result.length > 0) {
    const lastIndex = result.length - 1;
    const lastSegment = result[lastIndex];
    const merged = lastSegment.original + "。" + buffer;
    result[lastIndex] = createSegment(merged);
  } else if (buffer) {
    // No result yet, just use the buffer as-is
    result.push(createSegment(buffer));
  }

  return result;
}

function createSegment(text: string): TextSegment {
  return {
    id: generateId(),
    original: text,
    translated: "",
    status: "pending",
  };
}
