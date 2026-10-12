"use client";

import { Source } from "@/data/types";
import { SourcePill } from "./source-pill";

interface StatBlockProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  footnote?: string;
  sources: Source[];
}

export function StatBlock({
  label,
  value,
  unit,
  delta,
  footnote,
  sources,
}: StatBlockProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-headline text-2xl font-medium tabular-nums text-ink">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-ink-muted">{unit}</span>
        )}
        {delta && (
          <span
            className={`text-xs font-medium ${
              delta.direction === "up"
                ? "text-green-700"
                : delta.direction === "down"
                ? "text-red-700"
                : "text-ink-muted"
            }`}
          >
            {delta.direction === "up" ? "↑" : delta.direction === "down" ? "↓" : "~"}
            {delta.value}
          </span>
        )}
      </div>
      {footnote && (
        <span className="text-xs text-ink-muted">{footnote}</span>
      )}
      <div className="mt-0.5">
        {sources.map((source, i) => (
          <SourcePill key={`${source.name}-${i}`} source={source} />
        ))}
      </div>
    </div>
  );
}
