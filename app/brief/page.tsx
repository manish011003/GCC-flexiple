'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  ExternalLink,
  Layers,
  MapPin,
  Printer,
  Sparkles,
  Users,
} from 'lucide-react';
import { runFeasibilityEngine, BriefInputs, EngineResult } from '@/lib/engine';
import { StageContainer } from '@/components/stage-container';
import { SourceChip, TierBadge } from '@/components/source-chip';
import { CoverageMeter } from '@/components/coverage-meter';

const SECTOR_OPTIONS = [
  'Retail & E-commerce',
  'Software & SaaS',
  'Banking & Financial Services',
  'Healthcare & Life Sciences',
  'Automotive & Mobility Tech',
  'Consulting & Professional Services',
];

const PRESETS: { label: string; inputs: BriefInputs }[] = [
  {
    label: 'Mid-market SaaS (40 FTEs, Bengaluru)',
    inputs: {
      function: 'engineering',
      team_size: 40,
      urgency: 'standard',
      weights: { cost: 3, talent_depth: 5, incentives: 2, sector_cluster: 4 },
      sector: 'Software & SaaS',
      entry_route: 'entity_first',
      capex_inr: null,
    },
  },
  {
    label: 'Fast EOR Bridge (25 FTEs, Fintech)',
    inputs: {
      function: 'engineering',
      team_size: 25,
      urgency: 'fast',
      weights: { cost: 4, talent_depth: 4, incentives: 3, sector_cluster: 3 },
      sector: 'Banking & Financial Services',
      entry_route: 'eor_bridge',
      capex_inr: null,
    },
  },
  {
    label: 'Cost-Optimized Scale (80 FTEs, Pune)',
    inputs: {
      function: 'engineering',
      team_size: 80,
      urgency: 'standard',
      weights: { cost: 5, talent_depth: 3, incentives: 4, sector_cluster: 3 },
      sector: 'Automotive & Mobility Tech',
      entry_route: 'entity_first',
      capex_inr: 50000000,
    },
  },
];

export default function CompassPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-white">Loading Compass...</div>}>
      <CompassContent />
    </Suspense>
  );
}

function CompassContent() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get('city');

  // Interactive Live State
  const [inputs, setInputs] = useState<BriefInputs>({
    ...PRESETS[0].inputs,
    weights: {
      ...PRESETS[0].inputs.weights,
      ...(initialCity ? { sector_cluster: 5 } : {}),
    },
  });

  const [activeStep, setActiveStep] = useState<number>(1);
  const [capexCr, setCapexCr] = useState<string>('');
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  // Pure deterministic computation in code: runs synchronously on every input change
  const engineResult: EngineResult = useMemo(() => {
    const parsedCapex = capexCr.trim() ? parseFloat(capexCr) * 10000000 : null;
    return runFeasibilityEngine({
      ...inputs,
      capex_inr: isNaN(parsedCapex as number) ? null : parsedCapex,
    });
  }, [inputs, capexCr]);

  const handleExplain = async () => {
    setIsExplaining(true);
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiNarrative(json.narrative?.summary || null);
      }
    } catch {
      // Deterministic fallback
      const totalItem = engineResult.cost_breakdown.find((c) => c.category === 'total');
      const baseTotalCr = totalItem ? (totalItem.base_inr_lakhs / 100).toFixed(2) : '0';
      setAiNarrative(
        `Based on our pure calculation engine, ${engineResult.top_cities[0]?.city_name} ranks highest (score ${engineResult.top_cities[0]?.total_score}/100) with Year 1 base run-rate of ₹${baseTotalCr} Cr.`
      );
    } finally {
      setIsExplaining(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pb-16 space-y-4">
      <StageContainer noPadding={true}>
        {/* Compass Header Strip */}
        <div className="border-b border-[#14503A] bg-[#072A1B]/95 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#14503A] text-[#D0F07A]">
                <Compass className="h-4 w-4" />
              </span>
              <h1 className="font-serif text-2xl font-bold text-white">
                The Compass: Live Entry Brief
              </h1>
            </div>
            <p className="mt-1 text-xs text-[#8FA89A]">
              Live 5-step strategic decision engine recomputed instantly in pure TypeScript
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <CoverageMeter totalEstimated={2117} />
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#14503A] bg-[#0C3A26] px-3 py-1.5 text-xs font-mono text-[#D0F07A] hover:bg-[#14503A] transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Preset Chips */}
        <div className="bg-[#0C3A26]/80 px-4 sm:px-6 py-2.5 border-b border-[#14503A] flex items-center gap-2 text-xs font-mono overflow-x-auto no-scrollbar">
          <span className="text-[#8FA89A] uppercase tracking-wider text-[10px] whitespace-nowrap shrink-0">
            Fast Presets:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setInputs(p.inputs);
                setCapexCr(p.inputs.capex_inr ? `${p.inputs.capex_inr / 10000000}` : '');
              }}
              className="rounded-full border border-[#14503A] bg-[#072A1B] px-3 py-1.5 text-[#D0F07A] hover:border-[#D0F07A] transition-colors whitespace-nowrap shrink-0 min-h-[32px]"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Live Split Screen: Left 5-step stepper, Right Live Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[750px]">
          {/* LEFT: 5-step pill stepper & controls (5 cols) */}
          <div className="lg:col-span-5 border-r border-[#14503A] bg-[#072A1B] p-5 sm:p-6 space-y-6">
            {/* Stepper Tabs */}
            <div className="flex overflow-x-auto no-scrollbar rounded-full bg-[#0C3A26] p-1 border border-[#14503A] text-xs font-mono">
              {[
                { step: 1, label: 'Scope' },
                { step: 2, label: 'Team' },
                { step: 3, label: 'Sector' },
                { step: 4, label: 'Route' },
                { step: 5, label: 'Priorities' },
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setActiveStep(s.step)}
                  className={`flex-1 min-w-[58px] rounded-full py-1.5 transition-all text-center whitespace-nowrap min-h-[34px] ${
                    activeStep === s.step
                      ? 'bg-[#D0F07A] text-[#072A1B] font-bold shadow-xs'
                      : 'text-[#8FA89A] hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Stepper Content Panels */}
            <div className="space-y-5 text-xs font-sans text-white">
              {activeStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-base font-bold text-white">
                    1. Functional Mandate
                  </h3>
                  <div className="space-y-2">
                    {[
                      { id: 'engineering', title: 'Software Engineering', desc: 'Core product platforms, cloud architecture, and systems engineering.' },
                      { id: 'data/AI', title: 'Data & Artificial Intelligence', desc: 'GenAI, predictive pipelines, and MLOps capability centers.' },
                      { id: 'finance/ops', title: 'Finance, Shared Services & Ops', desc: 'Global controller charters, FP&A, and transaction operations.' },
                      { id: 'support', title: 'Customer Operations & Tech Support', desc: 'Tier 2/3 technical client support and global customer success.' },
                    ].map((f) => (
                      <div
                        key={f.id}
                        onClick={() => setInputs({ ...inputs, function: f.id as any })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          inputs.function === f.id
                            ? 'border-[#D0F07A] bg-[#0C3A26] ring-1 ring-[#D0F07A]'
                            : 'border-[#14503A] bg-[#072A1B] hover:border-[#14503A]'
                        }`}
                      >
                        <div className="font-bold text-[#D0F07A]">{f.title}</div>
                        <p className="text-[11px] text-[#8FA89A] mt-0.5">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-base font-bold text-white">
                    2. Planned Month-12 Headcount
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#8FA89A]">Team size at Month 12:</span>
                      <span className="font-mono font-bold text-[#D0F07A] text-lg">
                        {inputs.team_size} FTEs
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={inputs.team_size}
                      onChange={(e) =>
                        setInputs({ ...inputs, team_size: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-[#D0F07A] h-2 bg-[#14503A] rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#8FA89A]">
                      <span>10 (Niche Seed)</span>
                      <span>50 (Standard GCC)</span>
                      <span>100 (Scaled Hub)</span>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-base font-bold text-white">
                    3. Parent Corporate Sector
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {SECTOR_OPTIONS.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setInputs({ ...inputs, sector: sec })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          inputs.sector === sec
                            ? 'border-[#D0F07A] bg-[#0C3A26] font-bold text-[#D0F07A]'
                            : 'border-[#14503A] bg-[#072A1B] text-[#8FA89A] hover:text-white'
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-base font-bold text-white">
                    4. Setup Route &amp; Urgency
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setInputs({ ...inputs, entry_route: 'entity_first' })}
                      className={`p-3 rounded-xl border cursor-pointer ${
                        inputs.entry_route === 'entity_first'
                          ? 'border-[#D0F07A] bg-[#0C3A26]'
                          : 'border-[#14503A] bg-[#072A1B]'
                      }`}
                    >
                      <div className="font-bold text-[#D0F07A]">Direct Entity</div>
                      <p className="text-[11px] text-[#8FA89A] mt-1">
                        Wholly owned Indian subsidiary. Long-term IP ownership, higher setup duration.
                      </p>
                    </div>

                    <div
                      onClick={() => setInputs({ ...inputs, entry_route: 'eor_bridge' })}
                      className={`p-3 rounded-xl border cursor-pointer ${
                        inputs.entry_route === 'eor_bridge'
                          ? 'border-[#D0F07A] bg-[#0C3A26]'
                          : 'border-[#14503A] bg-[#072A1B]'
                      }`}
                    >
                      <div className="font-bold text-[#D0F07A]">EOR Bridge</div>
                      <p className="text-[11px] text-[#8FA89A] mt-1">
                        Immediate hiring via Employer of Record, transitioning to captive entity later.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#14503A]">
                    <span className="text-[#8FA89A] block mb-2 font-mono uppercase text-[10px]">
                      Hiring Urgency:
                    </span>
                    <div className="flex gap-2">
                      {(['standard', 'fast'] as const).map((urg) => (
                        <button
                          key={urg}
                          type="button"
                          onClick={() => setInputs({ ...inputs, urgency: urg })}
                          className={`flex-1 py-2 rounded-xl border capitalize font-mono text-xs ${
                            inputs.urgency === urg
                              ? 'border-[#D0F07A] bg-[#D0F07A] text-[#072A1B] font-bold'
                              : 'border-[#14503A] bg-[#0C3A26] text-[#8FA89A]'
                          }`}
                        >
                          {urg} (
                          {urg === 'fast' ? 'Target hire <60 days' : '12-24 weeks timeline'})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 5 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-base font-bold text-white">
                    5. Strategic Weights &amp; Capex
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'cost', label: 'Cost Efficiency' },
                      { key: 'talent_depth', label: 'Talent Depth' },
                      { key: 'incentives', label: 'State Subsidies' },
                      { key: 'sector_cluster', label: 'Sector Density' },
                    ].map((w) => (
                      <div key={w.key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#8FA89A]">{w.label}</span>
                          <span className="font-bold text-[#D0F07A] font-mono">
                            {(inputs.weights as any)[w.key]}/5
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={(inputs.weights as any)[w.key]}
                          onChange={(e) =>
                            setInputs({
                              ...inputs,
                              weights: {
                                ...inputs.weights,
                                [w.key]: parseInt(e.target.value, 10),
                              },
                            })
                          }
                          className="w-full accent-[#D0F07A] h-1.5 bg-[#14503A] rounded-lg cursor-pointer"
                        />
                      </div>
                    ))}

                    <div className="pt-3 border-t border-[#14503A]">
                      <label className="text-[11px] font-mono text-[#8FA89A] block mb-1">
                        Optional Fixed Capex (Crores INR):
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 5.0 for ₹5 Cr subsidy threshold"
                        value={capexCr}
                        onChange={(e) => setCapexCr(e.target.value)}
                        className="w-full rounded-xl border border-[#14503A] bg-[#0C3A26] px-3 py-2 text-xs text-white placeholder-[#8FA89A] focus:border-[#D0F07A] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stepper Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#14503A]">
              <button
                type="button"
                disabled={activeStep === 1}
                onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                className="rounded-full border border-[#14503A] px-4 py-1.5 text-xs text-[#8FA89A] disabled:opacity-30 hover:text-white"
              >
                ← Back
              </button>

              <button
                type="button"
                disabled={activeStep === 5}
                onClick={() => setActiveStep(Math.min(5, activeStep + 1))}
                className="rounded-full bg-[#14503A] px-4 py-1.5 text-xs font-semibold text-[#D0F07A] hover:bg-[#D0F07A] hover:text-[#072A1B] transition-colors"
              >
                Next Step →
              </button>
            </div>
          </div>

          {/* RIGHT: Live Results Canvas (7 cols) */}
          <div className="lg:col-span-7 bg-[#0C3A26] p-6 space-y-6 overflow-y-auto">
            {/* Top Canvas Header with AI Explain Action */}
            <div className="flex items-start justify-between gap-4 border-b border-[#14503A] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#D0F07A] block">
                  Computed Decision Architecture
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                  Feasibility Assessment for {inputs.team_size} FTEs
                </h2>
              </div>

              <button
                type="button"
                onClick={handleExplain}
                disabled={isExplaining}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#D0F07A] px-3.5 py-1.5 text-xs font-bold text-[#072A1B] hover:bg-[#BDE658] transition-all shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isExplaining ? 'Computing...' : 'Explain this Brief'}</span>
              </button>
            </div>

            {/* AI Narrative Bubble (Validated, template fallback) */}
            {aiNarrative && (
              <div className="rounded-2xl border border-[#D0F07A]/40 bg-[#072A1B] p-4 text-xs text-white space-y-2">
                <div className="flex items-center gap-2 text-[#D0F07A] font-bold">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Strategic Executive Summary (Sourced IDs Corroborated):</span>
                </div>
                <p className="text-[#8FA89A] leading-relaxed">{aiNarrative}</p>
              </div>
            )}

            {/* Module 1: Ranked Cities (Animated Reordering) */}
            <div className="space-y-3">
              <h3 className="font-serif text-base font-bold text-white flex items-center justify-between">
                <span>1. Recommended Hub Rankings</span>
                <span className="text-xs font-mono text-[#8FA89A]">
                  Top 3 Fit Scores
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {engineResult.top_cities.map((city, idx) => (
                  <div
                    key={city.city_id}
                    className={`rounded-2xl border p-4 transition-all ${
                      idx === 0
                        ? 'border-[#D0F07A] bg-[#072A1B] shadow-md'
                        : 'border-[#14503A] bg-[#072A1B]/70'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs font-bold text-[#D0F07A]">
                        #{idx + 1}
                      </span>
                      <span className="font-mono text-sm font-bold text-white">
                        {city.total_score}/100
                      </span>
                    </div>

                    <div className="mt-2 font-serif text-lg font-bold text-white">
                      {city.city_name}
                    </div>

                    <div className="mt-2 space-y-1 text-[11px] text-[#8FA89A]">
                      <div className="flex justify-between">
                        <span>Talent Score:</span>
                        <span className="text-white font-mono">{city.breakdown.talent_score}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost Efficiency:</span>
                        <span className="text-white font-mono">{city.breakdown.cost_score}/100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Module 2: Year-One Cost Envelope (Stacked with Low/Base/High) */}
            <div className="rounded-2xl border border-[#14503A] bg-[#072A1B] p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-white">
                    2. Year-One Cost Run-Rate Envelope
                  </h3>
                  <p className="text-xs text-[#8FA89A]">
                    Deterministic low/base/high breakdown from cost_assumptions.json
                  </p>
                </div>
                <SourceChip sourceName="Cost Assumptions" asOf="March 2026" tier="B" />
              </div>

              {/* Stat Figures from cost_breakdown total */}
              {(() => {
                const totalItem = engineResult.cost_breakdown.find((c) => c.category === 'total') || engineResult.cost_breakdown[0];
                return (
                  <div className="grid grid-cols-1 xs:grid-cols-3 gap-2.5 sm:gap-3 rounded-xl border border-[#14503A] bg-[#0C3A26] p-3 text-center">
                    <div className="py-1">
                      <span className="text-[10px] text-[#8FA89A] block font-medium">Conservative (Low)</span>
                      <span className="font-serif text-base sm:text-lg font-bold text-white">
                        ₹{(totalItem.low_inr_lakhs / 100).toFixed(2)} Cr
                      </span>
                    </div>
                    <div className="py-1 border-t xs:border-t-0 xs:border-x border-[#14503A]">
                      <span className="text-[10px] text-[#D0F07A] block font-medium">Expected (Base)</span>
                      <span className="font-serif text-xl sm:text-2xl font-bold text-[#D0F07A]">
                        ₹{(totalItem.base_inr_lakhs / 100).toFixed(2)} Cr
                      </span>
                    </div>
                    <div className="py-1 border-t xs:border-t-0 border-[#14503A]">
                      <span className="text-[10px] text-[#8FA89A] block font-medium">Contingency (High)</span>
                      <span className="font-serif text-base sm:text-lg font-bold text-white">
                        ₹{(totalItem.high_inr_lakhs / 100).toFixed(2)} Cr
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Stacked Cost Components */}
              <div className="space-y-2 text-xs">
                {engineResult.cost_breakdown.map((item) => (
                  <div key={item.label} className="flex justify-between text-[#8FA89A]">
                    <span>{item.label}:</span>
                    <span className="font-mono text-white">
                      ₹{item.base_inr_lakhs.toLocaleString('en-IN')} Lakhs
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Module 3: Route Comparison & Vendor Claims */}
            <div className="rounded-2xl border border-[#14503A] bg-[#072A1B] p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-white">
                    3. Route Comparison: Direct Entity vs. EOR Bridge
                  </h3>
                  <p className="text-xs text-[#8FA89A]">
                    Sourced published per-employee costs vs. vendor crossover benchmarks
                  </p>
                </div>
                <span className="font-mono text-[10px] rounded bg-[#14503A] px-2 py-0.5 text-[#D0F07A]">
                  Wisemonk / Beacon
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-[#14503A] bg-[#0C3A26] p-3 space-y-1">
                  <div className="font-bold text-white">Timeline Comparison</div>
                  <p className="text-[11px] text-[#8FA89A]">
                    • <strong className="text-white">Beacon Filing:</strong> 12–18 months board-to-100 FTEs; 12–24 weeks to go-live.
                  </p>
                  <p className="text-[11px] text-[#8FA89A]">
                    • <strong className="text-white">Flexiple states:</strong> 72 hours via EOR bridge, 4–6 months entity setup (Vendor claim).
                  </p>
                </div>

                <div className="rounded-xl border border-[#14503A] bg-[#0C3A26] p-3 space-y-1">
                  <div className="font-bold text-white">Crossover Economics</div>
                  <p className="text-[11px] text-[#8FA89A]">
                    • <strong className="text-white">Crossover Point:</strong> ~25–30 heads where direct entity fixed compliance becomes cheaper than EOR markup.
                  </p>
                  <p className="text-[11px] text-[#8FA89A]">
                    • Sourced Wisemonk: $2,909/head/mo ($2,444 base + $367 statutory + $99 fee).
                  </p>
                </div>
              </div>
            </div>

            {/* Module 4: Critical-Path Gantt Timeline */}
            <div className="rounded-2xl border border-[#14503A] bg-[#072A1B] p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#D0F07A]" />
                    <span>4. Critical-Path Setup Timeline</span>
                  </h3>
                  <p className="text-xs text-[#8FA89A]">
                    Total Duration: {engineResult.timeline.total_duration_weeks.low}–{engineResult.timeline.total_duration_weeks.high} Weeks
                  </p>
                </div>
                <span className="font-mono text-[10px] rounded bg-amber-950/60 text-amber-300 px-2 py-0.5 border border-amber-800/40">
                  Bottleneck Step Highlighted
                </span>
              </div>

              {/* Bottleneck Banner */}
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-200">
                <strong>Critical Bottleneck: </strong>
                {engineResult.timeline.bottleneck_step.name} ({engineResult.timeline.bottleneck_step.duration_weeks.base} weeks base)
                <div className="text-[11px] text-[#8FA89A] mt-1">
                  Common Blocker: {engineResult.timeline.bottleneck_step.common_blocker || 'Regulatory approval backlog'}
                </div>
              </div>

              {/* Milestones list */}
              <div className="space-y-2 pt-1 text-xs">
                {engineResult.timeline.milestones.slice(0, 4).map((m) => (
                  <div
                    key={m.step_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#0C3A26] border border-[#14503A]"
                  >
                    <span className="text-white font-medium">{m.name}</span>
                    <span className="font-mono text-[#D0F07A]">Cumulative: Week {m.cumulative_weeks.base}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Module 5: Likely-Eligible Incentives */}
            <div className="rounded-2xl border border-[#14503A] bg-[#072A1B] p-5 space-y-3">
              <h3 className="font-serif text-base font-bold text-white">
                5. State Incentive Eligibility Check
              </h3>
              <div className="space-y-2 text-xs">
                {engineResult.applicable_incentives.map((inc, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#14503A] bg-[#0C3A26] p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{inc.policy_name}</span>
                      <span
                        className={`font-mono text-[10px] rounded px-2 py-0.5 ${
                          inc.qualification_status === 'likely_eligible'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                        }`}
                      >
                        {inc.qualification_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[#D0F07A] font-semibold">{inc.headline_amount_text}</div>
                    <p className="text-[11px] text-[#8FA89A]">{inc.likely_qualification_text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Module 6: Comparable GCC Peers */}
            <div className="rounded-2xl border border-[#14503A] bg-[#072A1B] p-5 space-y-3">
              <h3 className="font-serif text-base font-bold text-white">
                6. Comparable GCC Peers in {inputs.sector}
              </h3>
              {engineResult.peer_companies.insufficient_notice ? (
                <div className="p-3 rounded-xl border border-[#14503A] text-xs text-[#8FA89A]">
                  Fewer than 3 comparable peers found in {inputs.sector}. No artificial padding added.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {engineResult.peer_companies.peers.map((peer) => (
                    <div
                      key={peer.company_id}
                      className="rounded-xl border border-[#14503A] bg-[#0C3A26] p-3"
                    >
                      <div className="font-bold text-white">{peer.name}</div>
                      <div className="text-[11px] text-[#D0F07A] font-mono mt-0.5">
                        {peer.cities.join(', ')} • Entered {peer.entered_india_year || 'Sourced'}
                      </div>
                      <div className="text-[10px] text-[#8FA89A] capitalize mt-1">
                        Route: {peer.entry_route}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Module 7: Pre-Mortem Stall Reasons */}
            <div className="rounded-2xl border border-[#14503A] bg-[#072A1B] p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>7. Pre-Mortem: Top Reasons GCC Setups Stall</span>
              </div>
              <div className="space-y-2 text-xs">
                {engineResult.pre_mortem_stall_reasons.map((stall) => (
                  <div
                    key={stall.id}
                    className="p-3 rounded-xl border border-[#14503A] bg-[#0C3A26] text-[#8FA89A]"
                  >
                    <div className="font-bold text-white mb-1">{stall.reason}</div>
                    <p className="text-[11px] leading-relaxed">{stall.evidence_text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </StageContainer>
    </div>
  );
}
