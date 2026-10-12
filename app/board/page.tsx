'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Filter,
  Layers,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import companiesData from '@/data/companies.json';
import { Company } from '@/lib/schema';
import { StageContainer } from '@/components/stage-container';
import { TierBadge } from '@/components/source-chip';
import { CoverageMeter } from '@/components/coverage-meter';

export default function BoardPage() {
  const companies = companiesData as Company[];

  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Extract all signals
  const allSignals = companies.flatMap((c) =>
    (c.signals || []).map((s, idx) => ({
      id: `${c.id}-signal-${idx}`,
      company: c.name,
      parent: c.parent_name,
      country: c.parent_country,
      city: c.india_cities?.[0] || 'India',
      sector: c.sector,
      signal: s,
      tier: c.evidence_tier,
      last_checked: c.last_checked,
      source: c.sources?.[0],
    }))
  );

  const cities = Array.from(new Set(allSignals.map((s) => s.city))).sort();
  const sectors = Array.from(new Set(allSignals.map((s) => s.sector))).sort();

  const filteredSignals = allSignals.filter((s) => {
    if (selectedCity !== 'all' && s.city !== selectedCity) return false;
    if (selectedSector !== 'all' && s.sector !== selectedSector) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.company.toLowerCase().includes(q) ||
        s.signal.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="pb-16 space-y-4">
      <StageContainer>
        {/* Board Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#14503A]/70 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#14503A] bg-[#0C3A26] px-3 py-1 text-xs font-mono text-[#D0F07A]">
              <Layers className="h-3.5 w-3.5" />
              <span>THE BOARD</span>
              <span className="text-[#3A5B4C]">•</span>
              <span className="text-[#8FA89A]">MARKET SIGNALS RADAR</span>
            </div>
            <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-bold text-white">
              Sourced GCC Market Signals Feed
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#8FA89A]">
              Sourced footprint expansions, hiring mandates, and functional charters extracted directly from statutory filings
            </p>
          </div>

          <CoverageMeter totalEstimated={2117} />
        </div>

        {/* Filter Toolbar */}
        <div className="pt-4 pb-6 flex flex-wrap items-center gap-3 border-b border-[#14503A]/70">
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8FA89A]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter signals by company or keyword..."
              className="w-full rounded-full border border-[#14503A] bg-[#0C3A26] py-1.5 pl-8 pr-4 text-xs text-white placeholder-[#8FA89A] focus:border-[#D0F07A] focus:outline-none"
            />
          </div>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="rounded-full border border-[#14503A] bg-[#0C3A26] px-3 py-1.5 text-xs text-[#8FA89A] hover:text-white focus:outline-none"
          >
            <option value="all">All Hubs</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="rounded-full border border-[#14503A] bg-[#0C3A26] px-3 py-1.5 text-xs text-[#8FA89A] hover:text-white focus:outline-none"
          >
            <option value="all">All Sectors</option>
            {sectors.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>

          <span className="text-xs font-mono text-[#8FA89A] ml-auto">
            {filteredSignals.length} Active Sourced Signals
          </span>
        </div>

        {/* Live Signals Stream Grid */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSignals.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[#14503A] bg-[#0C3A26] p-5 flex flex-col justify-between hover:border-[#D0F07A]/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-[#14503A] pb-3">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-white">
                      {item.company}
                    </h2>
                    <div className="text-[11px] text-[#8FA89A] font-mono mt-0.5">
                      {item.parent} ({item.country}) • {item.sector}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#D0F07A] bg-[#072A1B] px-2 py-0.5 rounded-full border border-[#14503A]">
                      {item.city}
                    </span>
                    <TierBadge tier={item.tier} />
                  </div>
                </div>

                <p className="mt-3 text-xs text-white leading-relaxed">
                  {item.signal}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#14503A] flex items-center justify-between text-[11px] font-mono text-[#8FA89A]">
                <span>Checked: {item.last_checked}</span>
                {item.source?.url && (
                  <a
                    href={item.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#D0F07A] hover:underline"
                  >
                    <span>View Filing</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Roadmap Cards for Hiring Velocity & Compensation Benchmarks (Marked: Not built yet) */}
        <div className="mt-10 pt-6 border-t border-[#14503A]/70 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8FA89A]">
              Telemetry Pipelines (Under Research)
            </span>
            <span className="text-[10px] font-mono rounded bg-[#14503A] px-2 py-0.5 text-[#D0F07A]">
              No Sourced Telemetry Available Yet
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-dashed border-[#14503A] bg-[#072A1B]/60 p-5 space-y-2 opacity-75">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <TrendingUp className="h-4 w-4 text-[#8FA89A]" />
                <span>Live Hiring Velocity Telemetry</span>
              </div>
              <p className="text-xs text-[#8FA89A] leading-relaxed">
                Direct aggregation of active job requisitions and time-to-hire curves across India GCCs.
              </p>
              <div className="text-[10px] font-mono text-amber-300 pt-1">
                [Not Built: Awaiting Sourced ATS Telemetry Access]
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-[#14503A] bg-[#072A1B]/60 p-5 space-y-2 opacity-75">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Sparkles className="h-4 w-4 text-[#8FA89A]" />
                <span>Real-Time Compensation Band Dispersion</span>
              </div>
              <p className="text-xs text-[#8FA89A] leading-relaxed">
                Audited salary distributions with real offer shopping drop-out telemetry across tech hubs.
              </p>
              <div className="text-[10px] font-mono text-amber-300 pt-1">
                [Not Built: Requires Anonymized Payroll Feed Partnerships]
              </div>
            </div>
          </div>
        </div>
      </StageContainer>
    </div>
  );
}
