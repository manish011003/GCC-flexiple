'use client';

import React from 'react';
import Link from 'next/link';
import { Database } from 'lucide-react';
import companiesData from '@/data/companies.json';

interface CoverageMeterProps {
  totalEstimated?: number;
  className?: string;
}

export function CoverageMeter({
  totalEstimated = 2117,
  className = '',
}: CoverageMeterProps) {
  const sourcedCount = (companiesData as any[]).length;
  const percentage = Math.min(100, Math.round((sourcedCount / totalEstimated) * 100 * 10) / 10);

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-full border border-[#14503A] bg-[#0C3A26]/90 px-3.5 py-1.5 text-xs font-mono text-[#8FA89A] backdrop-blur-md shadow-xs ${className}`}
    >
      <div className="flex items-center gap-1.5 text-[#D0F07A]">
        <Database className="h-3.5 w-3.5" />
        <span className="font-semibold text-white">{sourcedCount}</span>
        <span>sourced GCCs</span>
      </div>

      <span className="text-[#3A5B4C]">|</span>

      <span className="hidden sm:inline">
        of <strong className="text-white font-semibold font-mono">~{totalEstimated.toLocaleString()}</strong> estimated (Zinnov-Nasscom FY2026)
      </span>

      <div className="w-16 h-1.5 rounded-full bg-[#14503A] overflow-hidden">
        <div
          className="h-full bg-[#D0F07A] rounded-full"
          style={{ width: `${Math.max(4, percentage)}%` }}
        />
      </div>

      <Link
        href="/map"
        className="text-[11px] text-[#D0F07A] hover:underline hidden md:inline"
      >
        Explore registry →
      </Link>
    </div>
  );
}
