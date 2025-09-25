"use client";

import { ReactNode } from "react";
import clsx from "clsx";
import { Minus, Plus } from "lucide-react";

interface PanelSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PanelSection({ title, description, action, children, className }: PanelSectionProps) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_32px_rgba(12,8,32,0.25)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {description && <p className="mt-1 text-xs text-indigo-100/70">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

interface FieldLabelProps {
  label: string;
  hint?: string;
  htmlFor?: string;
}

export function FieldLabel({ label, hint, htmlFor }: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className="flex items-center justify-between gap-3 text-xs font-medium text-indigo-100/80">
      <span className="uppercase tracking-[0.2em] text-indigo-100/60">{label}</span>
      {hint && <span className="text-[10px] text-indigo-200/50">{hint}</span>}
    </label>
  );
}

interface NumberStepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (next: number) => void;
}

export function NumberStepper({ value, min = 0, max = 100, step = 1, onChange }: NumberStepperProps) {
  const clamp = (next: number) => Math.max(min, Math.min(max, next));

  const handleStep = (direction: "increment" | "decrement") => {
    const delta = direction === "increment" ? step : -step;
    onChange(clamp(value + delta));
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-white">
      <button
        type="button"
        onClick={() => handleStep("decrement")}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-indigo-100/70 transition hover:border-white/30 hover:text-white"
      >
        <Minus size={14} />
      </button>
      <div className="flex min-w-[3rem] items-center justify-center text-sm font-semibold text-white">
        {value}
      </div>
      <button
        type="button"
        onClick={() => handleStep("increment")}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-indigo-100/70 transition hover:border-white/30 hover:text-white"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}


