"use client";

import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { ContentStudio } from "./ContentStudio";

interface ContentStudioTriggerProps {
  campaignId: string;
  context?: {
    type: "campaign" | "mission";
    id?: string;
    name?: string;
  };
}

export function ContentStudioTrigger({ campaignId, context }: ContentStudioTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="group fixed bottom-8 right-8 z-50 flex items-center gap-3 overflow-hidden rounded-full border border-indigo-400/40 bg-gradient-to-r from-indigo-500/90 to-purple-500/90 px-5 py-3 text-white shadow-[0_20px_60px_rgba(99,102,241,0.5)] backdrop-blur transition hover:scale-105 hover:shadow-[0_25px_70px_rgba(99,102,241,0.6)]"
        title="Открыть Content Studio (⌘K)"
      >
        <Sparkles size={20} className="shrink-0" />
        <span className="font-semibold">Content Studio</span>
        <kbd className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-medium opacity-0 transition group-hover:opacity-100">
          ⌘K
        </kbd>
        
        {/* Pulse Animation */}
        <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-indigo-400 opacity-0 group-hover:opacity-20" />
      </button>

      {/* Content Studio Modal */}
      <ContentStudio
        campaignId={campaignId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        context={context}
      />
    </>
  );
}
