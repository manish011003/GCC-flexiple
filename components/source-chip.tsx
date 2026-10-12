'use client';

import React, { useState } from 'react';
import { ExternalLink, Info, X } from 'lucide-react';
import { SourceReference } from '@/lib/schema';

interface SourceChipProps {
  sourceName?: string;
  sourceUrl?: string | null;
  tier?: 'A' | 'B' | 'C';
  whoPays?: string;
  asOf?: string;
  sources?: SourceReference[];
  className?: string;
}

export function SourceChip({
  sourceName = 'Zinnov-Nasscom',
  sourceUrl,
  tier = 'B',
  whoPays = 'Industry trade association & advisory',
  asOf = 'March 2026',
  sources,
  className = '',
}: SourceChipProps) {
  const [open, setOpen] = useState(false);

  const primarySource = sources?.[0];
  const url = sourceUrl || primarySource?.url || '#';
  const name = primarySource?.publisher || sourceName;
  const title = primarySource?.title || name;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#14503A] bg-[#0C3A26]/80 px-2.5 py-1 text-[11px] text-[#8FA89A] hover:border-[#D0F07A]/60 hover:text-[#D0F07A] transition-all cursor-pointer min-h-[32px]"
        title="View source attribution"
        aria-expanded={open}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#D0F07A] shrink-0"></span>
        <span className="truncate max-w-[140px] sm:max-w-[200px]">{name}</span>
        <Info className="h-3 w-3 opacity-70 shrink-0" />
      </button>

      {open && (
        <>
          {/* Backdrop to dismiss on outside tap */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Responsive Popover Card: fixed bottom-sheet on mobile, anchored tooltip on desktop */}
          <div
            className="fixed bottom-4 left-4 right-4 sm:absolute sm:bottom-full sm:left-auto sm:right-0 sm:mb-2 z-50 sm:w-80 max-w-[calc(100vw-32px)] rounded-[20px] border border-[#14503A] bg-[#0C3A26] p-4 text-xs text-white shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 border-b border-[#14503A] pb-2.5">
              <div className="font-bold text-white text-sm">{name}</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#14503A] text-[#8FA89A] hover:text-white"
                aria-label="Close popover"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2.5 space-y-2 text-xs text-[#8FA89A]">
              <div>
                <span className="text-white font-medium">Title: </span>
                <span className="italic text-white/90">{title}</span>
              </div>
              <div>
                <span className="text-white font-medium">Who pays: </span>
                <span>{whoPays}</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="rounded bg-[#14503A] px-2 py-0.5 text-[#D0F07A] font-semibold">
                  Tier {tier} Sourced
                </span>
                <span>As of {asOf}</span>
              </div>
            </div>

            {url && url !== '#' && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-[#14503A] py-2 text-xs font-bold text-[#D0F07A] hover:bg-[#D0F07A] hover:text-[#072A1B] transition-colors min-h-[40px]"
              >
                <span>Open Sourced Report</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function TierBadge({ tier }: { tier?: 'A' | 'B' | 'C' }) {
  if (!tier) return null;

  const styles = {
    A: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    B: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    C: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[tier]}`}
      title={`Tier ${tier} Evidence Level`}
    >
      Tier {tier}
    </span>
  );
}
