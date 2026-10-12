'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, ShieldCheck, Sparkles, Filter, CheckCircle2, Clock } from 'lucide-react';
import sourcesData from '@/data/sources.json';
import { SourceRecord } from '@/lib/schema';
import { TierBadge } from '@/components/source-chip';
import { CoverageMeter } from '@/components/coverage-meter';

// Pastel palette classes for cards
const PASTEL_THEMES = [
  'border-[#C9EBD1] bg-[#C9EBD1]/20',
  'border-[#FFF1CF] bg-[#FFF1CF]/30',
  'border-[#DDF0EE] bg-[#DDF0EE]/30',
  'border-[#DDE6FF] bg-[#DDE6FF]/25',
  'border-[#EEE6FB] bg-[#EEE6FB]/30',
];

export default function SourcesPage() {
  const sources = sourcesData as SourceRecord[];

  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [activeFlippedCard, setActiveFlippedCard] = useState<string | null>(null);

  const filteredSources = sources.filter((s) => {
    if (selectedTier !== 'all' && s.evidence_tier !== selectedTier) return false;
    return true;
  });

  return (
    <div className="pb-24 pt-4 px-4 sm:px-8 max-w-6xl mx-auto space-y-12">
      {/* Light Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E8E4] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E8E4] bg-white px-3 py-1 text-xs font-mono text-[#072A1B]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#14503A]" />
            <span>SOURCES &amp; EVIDENCE LEDGER</span>
          </div>
          <h1 className="mt-3 font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#111A15]">
            Source Ledger &amp; Methodology
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#2C3D34] max-w-3xl leading-relaxed">
            Full transparency ledger of all published market intelligence cited across Groundtruth. Every metric cites its publisher, revenue model, and bias profile.
          </p>
        </div>

        <CoverageMeter totalEstimated={2117} />
      </div>

      {/* Neutrality Note Banner */}
      <section className="rounded-2xl border border-[#C9EBD1] bg-[#C9EBD1]/30 p-6 text-[#111A15]">
        <div className="flex items-start gap-3.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#072A1B] text-[#D0F07A] font-bold text-xs mt-0.5">
            GT
          </div>
          <div className="space-y-1.5 text-xs sm:text-sm">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#072A1B]">
              Neutrality Guarantee
            </h2>
            <p className="text-[#2C3D34] leading-relaxed">
              Groundtruth operates strictly as a neutral, evidence-backed reference layer. We accept zero
              sponsorships, referral commissions, or paid directory promotions. Any service provider,
              including <strong className="text-[#072A1B] font-semibold">Flexiple</strong>, appears with the exact
              same standardized schema fields, sourced evidence citations, and without paid placement or preferential ranking.
            </p>
          </div>
        </div>
      </section>

      {/* Pastel Source Cards Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8E4] pb-3">
          <h2 className="font-serif text-2xl font-bold text-[#111A15]">
            Sourced Publisher Registry
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#8FA89A]">Filter Tier:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="rounded-full border border-[#E2E8E4] bg-white px-3 py-1 text-xs font-mono"
            >
              <option value="all">All Tiers</option>
              <option value="A">Tier A (Statutory / Official)</option>
              <option value="B">Tier B (Industry Reports)</option>
              <option value="C">Tier C (Directory Coverage)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
          {filteredSources.map((src, idx) => {
            const themeClass = PASTEL_THEMES[idx % PASTEL_THEMES.length];
            return (
              <div
                key={src.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between shadow-xs ${themeClass}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-[#111A15]/10 pb-3">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#111A15]">
                        {src.publisher}
                      </h3>
                      <span className="text-[11px] font-mono text-[#2C3D34]">
                        {src.type}
                      </span>
                    </div>
                    <TierBadge tier={src.evidence_tier} />
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-[#111A15]">Revenue Model: </span>
                      <span className="text-[#2C3D34]">{src.who_pays}</span>
                    </div>

                    <div className="rounded-xl bg-white/70 p-2.5 border border-white">
                      <span className="font-semibold text-[#111A15] text-[11px] block">
                        Bias &amp; Commercial Scope:
                      </span>
                      <p className="mt-0.5 text-[11px] text-[#2C3D34] italic leading-relaxed">
                        &ldquo;{src.bias_note}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#111A15]/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-[11px] text-[#2C3D34]">Checked: {src.last_checked}</span>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-bold text-[#072A1B] hover:underline"
                  >
                    <span>Publisher Site</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Methodology Section */}
      <section className="space-y-6 pt-4 border-t border-[#E2E8E4]">
        <h2 className="font-serif text-2xl font-bold text-[#111A15]">
          Methodology &amp; Evidence Governance
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-[#E2E8E4] bg-white p-5 space-y-2">
            <span className="font-mono text-xs font-bold text-[#072A1B] uppercase">
              1. Evidence Grading Tiers
            </span>
            <p className="text-xs text-[#2C3D34] leading-relaxed">
              Every data point is classified by regulatory verifiability: <strong>Tier A</strong> (MCA statutory filings, SEZ records, official press releases); <strong>Tier B</strong> (NASSCOM, Zinnov, CBRE, JLL consulting studies); <strong>Tier C</strong> (directory scrapers and uncorroborated social profiles).
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2E8E4] bg-white p-5 space-y-2">
            <span className="font-mono text-xs font-bold text-[#072A1B] uppercase">
              2. Discrepancy Reconciliation
            </span>
            <p className="text-xs text-[#2C3D34] leading-relaxed">
              We never average conflicting counts or declare an arbitrary favorite. We present differences alongside each publisher&apos;s scope (parent company vs delivery units vs directory listings) and disclose who funded the study.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2E8E4] bg-white p-5 space-y-2">
            <span className="font-mono text-xs font-bold text-[#072A1B] uppercase">
              3. Continuous Refresh Cadence
            </span>
            <p className="text-xs text-[#2C3D34] leading-relaxed">
              Automated link integrity scripts check source URLs continuously. Compensation bands, office rents, and center openings update quarterly to synchronize with published market reports.
            </p>
          </div>
        </div>
      </section>

      {/* 'Not Built Yet' Flip Cards Roadmap */}
      <section className="space-y-4 pt-6 border-t border-[#E2E8E4]">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#111A15]/5 px-2.5 py-0.5 text-[11px] font-mono text-[#072A1B]">
            Interactive Roadmap Flip Cards
          </div>
          <h2 className="mt-1 font-serif text-2xl font-bold text-[#111A15]">
            Not Built Yet: Three User-Validation Hypotheses
          </h2>
          <p className="text-xs text-[#2C3D34]">
            Click any card to flip and inspect what it needs to start and its primary operational risk.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {[
            {
              id: 'give-to-get',
              title: '1. Give-to-Get Benchmarks',
              frontText: 'GCC leaders submit anonymised numbers (rent per seat, time to hire) and unlock peer medians, with groups under 5 suppressed to prevent deanonymisation.',
              who: 'GCC Managing Directors, Finance Controllers, and Real Estate Directors.',
              needs: 'Seed coalition of 15–20 operators; k-anonymity (k ≥ 5) calculation engine.',
              risk: 'Cold-start participation friction and enterprise legal fear of disclosure.',
            },
            {
              id: 'claims-receipts',
              title: '2. Claims vs Receipts',
              frontText: 'Provider marketing claims compared against publicly corroborated deliveries, with structured right-of-reply for providers to contest or contextualize discrepancies.',
              who: 'Global enterprise procurement, legal counsel, and C-suites vetting EOR & BOT vendors.',
              needs: 'Objective evidence standard, intake pipeline for corroborated deliveries, 14-day right-of-reply.',
              risk: 'Vendor pushback, defamation threats, and asymmetric evidence due to client NDAs.',
            },
            {
              id: 'intent-signals',
              title: '3. Intent Signals Radar',
              frontText: 'Monitoring early leading indicators (India-head job posts, funding news, corporate expansion announcements) that flag likely entrants 6–9 months before incorporation.',
              who: 'State investment promotion boards, commercial real estate developers, and local recruiters.',
              needs: 'Curated job board and press crawlers watching executive leadership mandates.',
              risk: 'High false-positive rate from remote hiring that never culminates in an entity.',
            },
          ].map((card) => {
            const isFlipped = activeFlippedCard === card.id;
            return (
              <div
                key={card.id}
                onClick={() => setActiveFlippedCard(isFlipped ? null : card.id)}
                className="relative min-h-[270px] h-auto rounded-2xl border border-[#E2E8E4] bg-white p-5 cursor-pointer shadow-xs hover:border-[#14503A] transition-all flex flex-col justify-between"
              >
                {!isFlipped ? (
                  <div className="space-y-3">
                    <span className="font-mono text-xs font-bold text-[#14503A]">
                      [CLICK TO FLIP]
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#111A15]">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#2C3D34] leading-relaxed">
                      {card.frontText}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <span className="font-mono text-[10px] text-[#072A1B] uppercase font-bold">
                      Hypothesis Specifications
                    </span>
                    <div>
                      <strong className="text-[#111A15]">Who it serves: </strong>
                      <span className="text-[#2C3D34]">{card.who}</span>
                    </div>
                    <div>
                      <strong className="text-[#111A15]">What it needs: </strong>
                      <span className="text-[#2C3D34]">{card.needs}</span>
                    </div>
                    <div>
                      <strong className="text-amber-800">Main risk: </strong>
                      <span className="text-[#2C3D34]">{card.risk}</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-[#E2E8E4] text-[10px] font-mono text-[#8FA89A] flex justify-between">
                  <span>{isFlipped ? 'Click to return' : 'Flip card for risk analysis'}</span>
                  <span>No code built</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
