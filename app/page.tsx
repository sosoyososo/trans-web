"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { SettingsDialog } from "@/components/settings-dialog";
import { TranslationPanel } from "@/components/translation-panel";
import { ApiConfig, ModelType } from "@/types";
import { getApiConfig } from "@/lib/config-store";

export default function Home() {
  const [config, setConfig] = useState<ApiConfig>({
    endpoint: "",
    apiKey: "",
    model: "minimax",
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const savedConfig = getApiConfig();
    setConfig(savedConfig);
  }, []);

  const handleModelChange = (model: ModelType) => {
    const newConfig = { ...config, model };
    setConfig(newConfig);
    localStorage.setItem("translation-config", JSON.stringify(newConfig));
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        model={config.model}
        onModelChange={handleModelChange}
        onSettingsClick={() => setSettingsOpen(true)}
      />
      <main className="flex-1 min-h-0">
        <TranslationPanel config={config} />
      </main>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={config}
        onConfigChange={setConfig}
      />
    </div>
  );
}
