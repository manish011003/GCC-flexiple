'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Compass,
  Database,
  ExternalLink,
  Globe,
  Info,
  Layers,
  Search,
  Sparkles,
} from 'lucide-react';
import countClaimsData from '@/data/count_claims.json';
import countPurposesData from '@/data/count_purposes.json';
import companiesData from '@/data/companies.json';
import { CountClaim, CountPurposeRecord, Company } from '@/lib/schema';
import { StageContainer } from '@/components/stage-container';
import { StatTile } from '@/components/stat-tile';
import { SourceChip, TierBadge } from '@/components/source-chip';
import { CoverageMeter } from '@/components/coverage-meter';
import { Drawer } from '@/components/drawer';
import { MapPreviewCard } from '@/components/map-preview-card';

// Recharts Growth Line data
const GROWTH_DATA = [
  { year: '2015', count: 750, label: 'Under 800 (approx. decade ago)' },
  { year: '2024', count: 1700, label: '1,700+ GCCs (FY2024 Zinnov-Nasscom)' },
  { year: '2026', count: 2117, label: '2,117 GCCs (FY2026 Zinnov-Nasscom)' },
];

// Maturity Tiers breakdown
const MATURITY_TIERS = [
  {
    tier: 'Outpost',
    pct: 13,
    color: '#8FA89A',
    description: 'Task-based tactical execution centres supporting parent tech/back-office.',
  },
  {
    tier: 'Satellite',
    pct: 43,
    color: '#14503A',
    description: 'Dedicated functional hubs with independent delivery ownership.',
  },
  {
    tier: 'Portfolio Hub',
    pct: 39,
    color: '#D0F07A',
    textColor: '#072A1B',
    description: 'Multi-functional centers driving core product engineering, AI & finance charters.',
  },
  {
    tier: 'Transformation Hub',
    pct: 5,
    color: '#FFD13F',
    textColor: '#072A1B',
    description: 'Global headquarters for end-to-end digital business transformation & global P&L.',
  },
];

export default function CensusPage() {
  const router = useRouter();
  const allClaims = countClaimsData as CountClaim[];
  const purposes = countPurposesData as CountPurposeRecord[];
  const companies = companiesData as Company[];

  // Unit filter state: 'all' | 'centres' | 'parent_entities' | 'sites'
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  // Purpose filter state
  const [selectedPurposeKey, setSelectedPurposeKey] = useState<string>(
    purposes[0]?.purpose || 'cite in a board memo'
  );

  // Selected claim for right Drawer
  const [selectedClaimForDrawer, setSelectedClaimForDrawer] = useState<CountClaim | null>(null);

  // Active hover maturity tier
  const [activeMaturityHover, setActiveMaturityHover] = useState<string | null>(null);

  // NL Search input on Ask Card
  const [askInput, setAskInput] = useState('');

  const currentPurpose =
    purposes.find((p) => p.purpose === selectedPurposeKey) || purposes[0];

  // Highlighted claim based on purpose
  const highlightedClaimId = currentPurpose?.recommended_claim_id;

  // Filtered claims based on unit
  const visibleClaims = allClaims.filter((c) => {
    if (selectedUnit === 'all') return true;
    return c.unit === selectedUnit;
  });

  const maxClaimNumber = Math.max(...visibleClaims.map((c) => c.number), 2500);

  // Sourced signals pool from companies
  const sourcedSignals = companies.flatMap((c) =>
    (c.signals || []).map((s) => ({
      company: c.name,
      city: c.india_cities?.[0] || 'India',
      signal: s,
      tier: c.evidence_tier,
      source: c.sources?.[0],
    }))
  ).slice(0, 5);

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askInput.trim()) return;
    router.push(`/map?nl=${encodeURIComponent(askInput.trim())}`);
  };

  const handleSuggestionClick = (text: string) => {
    router.push(`/map?nl=${encodeURIComponent(text)}`);
  };

  return (
    <div className="pb-16 space-y-6">
      <StageContainer>
        {/* Top Header Strip with Coverage Meter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#14503A]/70 pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#14503A] bg-[#0C3A26] px-3.5 py-1 text-xs font-mono text-[#D0F07A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D0F07A]"></span>
            <span>GROUNDTRUTH CENSUS</span>
            <span className="text-[#3A5B4C]">•</span>
            <span className="text-[#8FA89A]">AUDITED EVIDENCE LAYER</span>
          </div>

          <CoverageMeter totalEstimated={2117} />
        </div>

        {/* Hero Headline */}
        <div className="pt-8 pb-6 max-w-4xl">
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            How many GCCs are in India?{' '}
            <span className="text-[#D0F07A]">Depends who you ask.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#8FA89A] max-w-2xl leading-relaxed">
            The sources are mostly not wrong: they count different things (parent company vs unit, FY24 vs FY26, census vs web directory) and none states so. Here is the sourced single source of truth.
          </p>
        </div>

        {/* Bento Grid: 1. Anchor Stat Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2 pb-6 sm:pb-8">
          <StatTile
            label="Installed GCCs"
            value={2117}
            suffix="Centres"
            deltaText="+32% since FY2021"
            deltaPositive={true}
            sourceName="Zinnov-Nasscom"
            sourceUrl="https://zinnov.com/centers-of-excellence/zinnov-nasscom-india-gcc-landscape-2026-report/"
            asOf="March 2026"
            tier="B"
            subtext="3,728 total operational units"
          />

          <StatTile
            label="Total Market Size"
            value="98.4"
            prefix="$"
            suffix="Bn"
            sourceName="Zinnov-Nasscom"
            sourceUrl="https://zinnov.com/centers-of-excellence/zinnov-nasscom-india-gcc-landscape-2026-report/"
            asOf="March 2026"
            tier="B"
            subtext="Cumulative GCC export value"
          />

          <StatTile
            label="Talent Headcount"
            value="2.36"
            suffix="M Staff"
            deltaText="+12% annual run-rate"
            deltaPositive={true}
            sourceName="Zinnov-Nasscom"
            sourceUrl="https://zinnov.com/centers-of-excellence/zinnov-nasscom-india-gcc-landscape-2026-report/"
            asOf="March 2026"
            tier="B"
            subtext="Specialized engineers & tech talent"
          />

          <StatTile
            label="Mid-Market GCCs"
            value={583}
            suffix="Hubs"
            deltaText="15-20% projected revenue growth"
            deltaPositive={true}
            sourceName="Zinnov-Nasscom"
            sourceUrl="https://zinnov.com/centers-of-excellence/zinnov-nasscom-india-gcc-landscape-2026-report/"
            asOf="March 2026"
            tier="B"
            subtext="Sub-$5B parent company entities"
          />
        </div>

        {/* Bento Grid: Regional Footprint Map Preview */}
        <div className="pb-8 w-full min-w-0 max-w-full">
          <MapPreviewCard />
        </div>

        {/* Bento Grid: 2. Claims Comparison & 4. 'Which number should you use?' */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 pb-8 border-t border-[#14503A]/70">
          {/* Claims comparison interactive bars (7 cols) */}
          <div className="lg:col-span-7 rounded-[24px] border border-[#14503A] bg-[#0C3A26] p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#14503A] pb-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-white">
                    Claims Comparison &amp; Units
                  </h2>
                  <p className="text-xs text-[#8FA89A]">
                    Click any bar for definition, methodology scope, and primary citation link
                  </p>
                </div>

                {/* Segmented Control for Units */}
                <div className="inline-flex max-w-full overflow-x-auto rounded-full bg-[#072A1B] p-1 border border-[#14503A] text-[11px] font-mono shrink-0">
                  {['all', 'centres', 'parent_entities', 'sites'].map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setSelectedUnit(unit)}
                      className={`rounded-full px-2.5 py-1 whitespace-nowrap capitalize transition-all min-h-[32px] ${
                        selectedUnit === unit
                          ? 'bg-[#D0F07A] text-[#072A1B] font-semibold'
                          : 'text-[#8FA89A] hover:text-white'
                      }`}
                    >
                      {unit === 'all' ? 'All' : unit.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bars list */}
              <div className="mt-5 space-y-4">
                {visibleClaims.map((claim) => {
                  const isHighlighted = claim.id === highlightedClaimId;
                  const isNonComparable = claim.scope !== 'India-only';
                  const barWidthPercent = Math.min(
                    100,
                    Math.max(12, Math.round((claim.number / maxClaimNumber) * 100))
                  );

                  return (
                    <div
                      key={claim.id}
                      onClick={() => setSelectedClaimForDrawer(claim)}
                      className={`group rounded-xl p-2.5 border transition-all cursor-pointer ${
                        isHighlighted
                          ? 'border-[#D0F07A] bg-[#14503A]/60 shadow-md ring-1 ring-[#D0F07A]'
                          : 'border-transparent hover:border-[#14503A] hover:bg-[#072A1B]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white group-hover:text-[#D0F07A] transition-colors">
                            {claim.source_name}
                          </span>
                          <span className="font-mono text-[10px] rounded bg-[#14503A] px-1.5 py-0.2 text-[#8FA89A]">
                            {claim.as_of}
                          </span>
                          <span className="font-mono text-[10px] text-[#8FA89A]">
                            Unit: {claim.unit}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">
                            {claim.number.toLocaleString('en-IN')}
                          </span>
                          <span
                            className={`font-mono text-[10px] rounded px-1.5 py-0.2 ${
                              claim.scope === 'India-only'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                            }`}
                          >
                            {claim.scope}
                          </span>
                        </div>
                      </div>

                      {/* Bar rendering (Hatched for non-comparable claims) */}
                      <div className="h-5 w-full rounded-md bg-[#072A1B] overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-sm transition-all duration-500 ${
                            isNonComparable
                              ? 'hatched-pattern-dark bg-[#3A5B4C]/40'
                              : isHighlighted
                              ? 'bg-[#D0F07A]'
                              : 'bg-[#14503A] group-hover:bg-[#1B654A]'
                          }`}
                          style={{ width: `${barWidthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#14503A] flex items-center justify-between text-[11px] font-mono text-[#8FA89A]">
              <span>💡 Hatched bars indicate non-comparable coverage (Global scope / Directory sample)</span>
              <span>Click any bar for details →</span>
            </div>
          </div>

          {/* 4. 'Which number should you use?' selector (5 cols) */}
          <div className="lg:col-span-5 rounded-[24px] border border-[#14503A] bg-[#0C3A26] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-[#14503A] pb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D0F07A] text-[#072A1B] text-xs font-bold">
                  ?
                </span>
                <h2 className="font-serif text-xl font-bold text-white">
                  Which number should you use?
                </h2>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8FA89A] mb-2.5">
                  Select your objective:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {purposes.map((p) => {
                    const isSelected = p.purpose === selectedPurposeKey;
                    return (
                      <button
                        key={p.purpose}
                        type="button"
                        onClick={() => setSelectedPurposeKey(p.purpose)}
                        className={`rounded-xl p-2.5 text-left text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-[#D0F07A] text-[#072A1B] font-bold shadow-md scale-102'
                            : 'bg-[#072A1B] text-[#8FA89A] border border-[#14503A] hover:text-white hover:border-[#D0F07A]/40'
                        }`}
                      >
                        <span className="capitalize block">{p.purpose}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recommendation card */}
              {currentPurpose && (
                <div className="mt-5 rounded-xl border border-[#14503A] bg-[#072A1B] p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8FA89A] block">
                        Recommended Figure:
                      </span>
                      <span className="font-serif text-2xl font-bold text-[#D0F07A]">
                        {allClaims.find((c) => c.id === currentPurpose.recommended_claim_id)?.number.toLocaleString('en-IN') || '2,117'}{' '}
                        <span className="text-sm font-sans text-white font-normal">
                          {allClaims.find((c) => c.id === currentPurpose.recommended_claim_id)?.unit || 'Centres'}
                        </span>
                      </span>
                    </div>

                    <span className="font-mono text-[10px] rounded bg-[#14503A] px-2 py-0.5 text-white">
                      {allClaims.find((c) => c.id === currentPurpose.recommended_claim_id)?.source_name}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="font-semibold text-white">Why use this: </span>
                      <span className="text-[#8FA89A]">{currentPurpose.rationale}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-amber-300">Caveat: </span>
                      <span className="text-[#8FA89A]">{currentPurpose.caveat}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#14503A]">
              <Link
                href="/brief"
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#D0F07A] py-2.5 text-xs font-bold text-[#072A1B] hover:bg-[#BDE658] transition-all"
              >
                <span>Build an Entry Brief with this baseline</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bento Grid: 3. Growth Line Chart & 5. Maturity Tiers Bubble Cluster */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 pb-8 border-t border-[#14503A]/70">
          {/* 3. Growth Line Chart (6 cols) */}
          <div className="lg:col-span-6 rounded-[24px] border border-[#14503A] bg-[#0C3A26] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-[#14503A] pb-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    10-Year GCC Trajectory in India
                  </h3>
                  <p className="text-xs text-[#8FA89A]">
                    Under 800 a decade ago to 2,117 in FY2026
                  </p>
                </div>
                <SourceChip
                  sourceName="Zinnov-Nasscom FY2026"
                  asOf="March 2026"
                  tier="B"
                />
              </div>

              <div className="mt-5 h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={GROWTH_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <XAxis
                      dataKey="year"
                      stroke="#8FA89A"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#14503A' }}
                    />
                    <YAxis
                      stroke="#8FA89A"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#14503A' }}
                      domain={[500, 2400]}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-[#14503A] bg-[#072A1B] p-2.5 shadow-xl text-xs font-mono text-white">
                              <div className="font-bold text-[#D0F07A]">{item.count.toLocaleString()} GCCs</div>
                              <div className="text-[11px] text-[#8FA89A]">{item.label}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#D0F07A"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#072A1B', stroke: '#D0F07A', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#D0F07A' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#14503A] text-[11px] font-mono text-[#8FA89A]">
              *The FY24 report projected 2,100–2,200 GCCs by 2030; FY2026 already reached 2,117.
            </div>
          </div>

          {/* 5. Maturity Tiers Bubble Cluster (6 cols) */}
          <div className="lg:col-span-6 rounded-[24px] border border-[#14503A] bg-[#0C3A26] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-[#14503A] pb-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    Ecosystem Maturity Tiers
                  </h3>
                  <p className="text-xs text-[#8FA89A]">
                    Hover each cluster bubble to see functional scope &amp; mandate
                  </p>
                </div>
                <SourceChip
                  sourceName="Zinnov-Nasscom"
                  asOf="March 2026"
                  tier="B"
                />
              </div>

              {/* Interactive Bubble Cluster */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 py-2">
                {MATURITY_TIERS.map((tier) => {
                  const isHovered = activeMaturityHover === tier.tier;
                  // Dynamic size proportional to percentage
                  const sizeClass =
                    tier.pct >= 40
                      ? 'w-28 h-28 text-base'
                      : tier.pct >= 30
                      ? 'w-24 h-24 text-sm'
                      : 'w-18 h-18 text-xs';

                  return (
                    <div
                      key={tier.tier}
                      onMouseEnter={() => setActiveMaturityHover(tier.tier)}
                      onMouseLeave={() => setActiveMaturityHover(null)}
                      className={`relative flex flex-col items-center justify-center rounded-full border border-white/20 transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 ${sizeClass}`}
                      style={{
                        backgroundColor: tier.color,
                        color: tier.textColor || '#FFFFFF',
                      }}
                    >
                      <span className="font-mono font-bold">{tier.pct}%</span>
                      <span className="text-[10px] font-semibold text-center leading-tight px-1">
                        {tier.tier}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Hover description display */}
              <div className="mt-4 rounded-xl border border-[#14503A] bg-[#072A1B] p-3 min-h-[50px] flex items-center">
                {activeMaturityHover ? (
                  <p className="text-xs text-[#D0F07A]">
                    <strong>{activeMaturityHover}:</strong>{' '}
                    {MATURITY_TIERS.find((t) => t.tier === activeMaturityHover)?.description}
                  </p>
                ) : (
                  <p className="text-xs text-[#8FA89A] italic">
                    Hover over any maturity tier bubble to read its operational definition.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#14503A] text-[11px] font-mono text-[#8FA89A]">
              Transformation Hubs (5%) drive global enterprise P&amp;L from Indian centers.
            </div>
          </div>
        </div>

        {/* Bento Grid: 6. Ask Card & 7. Latest Sourced Signals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-[#14503A]/70">
          {/* 6. Ask Card ('How can I help you?') (6 cols) */}
          <div className="lg:col-span-6 rounded-[24px] border border-[#14503A] bg-[#0C3A26] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-[#14503A] pb-3">
                <Sparkles className="h-5 w-5 text-[#D0F07A]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  Ask Groundtruth in Plain English
                </h3>
              </div>

              <p className="mt-3 text-xs text-[#8FA89A]">
                Query the GCC reference layer. We parse your objective and route you directly to the interactive map with active filter chips.
              </p>

              <form onSubmit={handleAskSubmit} className="mt-4">
                <div className="relative">
                  <input
                    type="text"
                    value={askInput}
                    onChange={(e) => setAskInput(e.target.value)}
                    placeholder="e.g. Retail captives in Bengaluru with Tier A evidence..."
                    className="w-full rounded-full border border-[#14503A] bg-[#072A1B] px-4 py-3 pr-10 text-xs text-white placeholder-[#8FA89A] focus:border-[#D0F07A] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 rounded-full bg-[#D0F07A] p-1.5 text-[#072A1B] hover:bg-[#BDE658]"
                  >
                    <Search className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>

              {/* Suggestion Chips */}
              <div className="mt-4 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8FA89A] block">
                  Suggested inquiries:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Fintech captives in Hyderabad',
                    'Tier A sourced engineering GCCs in Pune',
                    'Retail tech centers entering via Entity First',
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleSuggestionClick(sug)}
                      className="rounded-full border border-[#14503A] bg-[#072A1B] px-3 py-1 text-[11px] text-[#D0F07A] hover:border-[#D0F07A]/60 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#14503A] text-[11px] font-mono text-[#8FA89A]">
              Zero hallucinated data • Schema-validated filter translation
            </div>
          </div>

          {/* 7. Board strip: Latest Sourced Signals (6 cols) */}
          <div className="lg:col-span-6 rounded-[24px] border border-[#14503A] bg-[#0C3A26] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#14503A] pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#D0F07A]" />
                  <h3 className="font-serif text-lg font-bold text-white">
                    Latest Sourced Market Signals
                  </h3>
                </div>
                <Link
                  href="/board"
                  className="text-xs font-mono text-[#D0F07A] hover:underline"
                >
                  View all →
                </Link>
              </div>

              <div className="mt-4 space-y-2.5">
                {sourcedSignals.map((sig, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#14503A] bg-[#072A1B]/60 p-3 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white">{sig.company}</span>
                        <span className="font-mono text-[10px] text-[#8FA89A]">({sig.city})</span>
                        <TierBadge tier={sig.tier} />
                      </div>
                      <p className="text-[11px] text-[#8FA89A] leading-relaxed">
                        {sig.signal}
                      </p>
                    </div>

                    {sig.source?.url && (
                      <a
                        href={sig.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#D0F07A] hover:text-white shrink-0 mt-0.5"
                        title="View signal source"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#14503A] text-[11px] font-mono text-[#8FA89A]">
              Directly extracted from audited statutory filings and corporate disclosures
            </div>
          </div>
        </div>

        {/* Bottom Stage Action Callouts */}
        <div className="mt-8 pt-6 border-t border-[#14503A]/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-[#8FA89A] font-mono">
            <span className="h-2 w-2 rounded-full bg-[#D0F07A] animate-pulse"></span>
            <span>Groundtruth Active Session • Pure Audited Records</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/map"
              className="rounded-full border border-[#D0F07A] bg-transparent px-5 py-2.5 text-xs font-semibold text-[#D0F07A] hover:bg-[#D0F07A] hover:text-[#072A1B] transition-all"
            >
              Explore the Map →
            </Link>
            <Link
              href="/brief"
              className="rounded-full bg-[#D0F07A] px-5 py-2.5 text-xs font-bold text-[#072A1B] hover:bg-[#BDE658] transition-all shadow-md"
            >
              Build my Entry Brief
            </Link>
          </div>
        </div>
      </StageContainer>

      {/* Claim Detail Right Slide-over Drawer */}
      <Drawer
        isOpen={!!selectedClaimForDrawer}
        onClose={() => setSelectedClaimForDrawer(null)}
        title={selectedClaimForDrawer?.source_name || 'Claim Details'}
        subtitle={`As of ${selectedClaimForDrawer?.as_of} • Scope: ${selectedClaimForDrawer?.scope}`}
      >
        {selectedClaimForDrawer && (
          <div className="space-y-5">
            <div className="rounded-xl border border-[#14503A] bg-[#072A1B] p-4 space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#8FA89A]">
                Published Figure:
              </span>
              <div className="font-serif text-3xl font-bold text-[#D0F07A]">
                {selectedClaimForDrawer.number.toLocaleString('en-IN')}{' '}
                <span className="text-sm font-sans text-white font-normal">
                  {selectedClaimForDrawer.unit}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-white block mb-0.5">What is counted:</span>
                <p className="text-[#8FA89A] leading-relaxed">
                  {selectedClaimForDrawer.what_is_counted}
                </p>
              </div>

              <div>
                <span className="font-semibold text-white block mb-0.5">Revenue / Funding Model:</span>
                <p className="text-[#8FA89A] leading-relaxed">
                  {selectedClaimForDrawer.who_pays}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-[#14503A] pt-3 font-mono text-[11px]">
                <span>Evidence Level:</span>
                <TierBadge tier={selectedClaimForDrawer.evidence_tier} />
              </div>
            </div>

            {selectedClaimForDrawer.url && (
              <a
                href={selectedClaimForDrawer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#D0F07A] py-2.5 text-xs font-bold text-[#072A1B] hover:bg-[#BDE658] transition-colors"
              >
                <span>Visit Primary Source Report</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
