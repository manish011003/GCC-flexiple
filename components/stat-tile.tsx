'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SourceChip } from './source-chip';
import { SourceReference } from '@/lib/schema';

interface StatTileProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  deltaText?: string;
  deltaPositive?: boolean;
  subtext?: string;
  sourceName?: string;
  sourceUrl?: string | null;
  asOf?: string;
  tier?: 'A' | 'B' | 'C';
  sources?: SourceReference[];
  whoPays?: string;
  className?: string;
}

export function StatTile({
  label,
  value,
  prefix,
  suffix,
  deltaText,
  deltaPositive,
  subtext,
  sourceName = 'Zinnov-Nasscom',
  sourceUrl,
  asOf = 'March 2026',
  tier = 'B',
  sources,
  whoPays,
  className = '',
}: StatTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative flex flex-col justify-between rounded-[20px] sm:rounded-[24px] border border-[#14503A] bg-[#0C3A26] p-4 sm:p-5 lg:p-6 shadow-sm hover:border-[#D0F07A]/40 transition-all ${className}`}
    >
      {/* Tile Header: Label + Source Chip */}
      <div className="flex flex-col xs:flex-row items-start justify-between gap-1.5 sm:gap-2">
        <span className="text-[11px] sm:text-xs uppercase tracking-wider text-[#8FA89A] font-medium">
          {label}
        </span>
        <SourceChip
          sourceName={sourceName}
          sourceUrl={sourceUrl}
          tier={tier}
          sources={sources}
          asOf={asOf}
          whoPays={whoPays}
        />
      </div>

      {/* Main Metric Value */}
      <div className="my-2 sm:my-3">
        <div className="flex items-baseline flex-wrap gap-1 sm:gap-1.5">
          {prefix && (
            <span className="font-serif text-xl sm:text-2xl lg:text-3xl text-[#D0F07A]">
              {prefix}
            </span>
          )}
          <span className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white tabular-nums">
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </span>
          {suffix && (
            <span className="text-xs sm:text-sm lg:text-base font-semibold text-[#D0F07A]">
              {suffix}
            </span>
          )}
        </div>

        {/* Delta Chip or Subtext */}
        {deltaText && (
          <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 rounded-full bg-[#14503A]/80 px-2 py-0.5 text-[10px] sm:text-[11px] text-[#D0F07A]">
            <span>{deltaPositive ? '↑' : '↓'}</span>
            <span>{deltaText}</span>
          </div>
        )}

        {subtext && !deltaText && (
          <p className="mt-1 text-[11px] sm:text-xs text-[#8FA89A] leading-relaxed">{subtext}</p>
        )}
      </div>
    </motion.div>
  );
}
