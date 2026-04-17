"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModelType } from "@/types";

interface HeaderProps {
  model: ModelType;
  onModelChange: (model: ModelType) => void;
  onSettingsClick: () => void;
}

export function Header({
  model,
  onModelChange,
  onSettingsClick,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <Button variant="ghost" size="icon" onClick={onSettingsClick}>
        <Settings className="h-5 w-5" />
        <span className="sr-only">Settings</span>
      </Button>

      <Select value={model} onValueChange={(v) => onModelChange(v as ModelType)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="minimax">MiniMax</SelectItem>
          <SelectItem value="deepseek">DeepSeek</SelectItem>
        </SelectContent>
      </Select>
    </header>
  );
}
