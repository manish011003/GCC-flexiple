import type {
  CityRankResult,
  CostEnvelopeResult,
  DiscrepancySummaryItem,
  RiskFactor,
  UserAssessmentInput,
} from '../data/types.ts';
import { formatCurrency, formatRange } from './format.ts';

export interface PromptPayloadInput {
  costEnvelope?: CostEnvelopeResult;
  envelope?: CostEnvelopeResult;
  rankedCities?: CityRankResult[];
  cityRankings?: CityRankResult[];
  discrepancy?: DiscrepancySummaryItem[];
  discrepancies?: DiscrepancySummaryItem[];
  risks?: RiskFactor[];
  applicableRisks?: RiskFactor[];
}

/**
 * Builds the immutable system prompt for Gemini LLM.
 * Strictly prohibits hallucination or inventing benchmarks.
 */
export function buildSystemPrompt(): string {
  return `You are "Groundtruth", an objective, authoritative, and strictly neutral analytical reference advisor for Global Capability Centres (GCCs) in India.

CRITICAL OPERATIONAL RULES:
1. NEVER INVENT, FABRICATE, OR EXTRAPOLATE NUMBERS. You must ONLY use the exact numbers, ranges, and facts supplied in the input context.
2. If a specific metric, salary, cost, or city statistic is not supplied or is marked null/unknown, you MUST explicitly state that the data is "unbenchmarked / not currently sourced in authoritative GCC literature". NEVER guess.
3. ATTRIBUTE EVERY QUANTITATIVE CLAIM: Whenever you quote an estimate (center count, headcount, cost range, attrition rate, or timeline), explicitly reference the source report and publication year provided in the data (e.g., "According to NASSCOM-Zinnov 2023...", "Per Deloitte India 2023...").
4. NEUTRAL & EVIDENCE-BASED TONE: Present differing benchmarks objectively. When industry sources diverge (such as total center counts or market size), outline the methodological rationale for the discrepancy rather than declaring one source correct and another wrong.
5. REALISTIC GCC CONTEXT: Highlight trade-offs honestly (e.g., Bengaluru's unmatched talent depth vs. higher wage inflation and 19%+ attrition; Tier-2 hubs like Kochi/Ahmedabad offering lower operational costs but shallower senior leadership pools).
6. STRUCTURED EXECUTIVE OUTPUT: Format all recommendations cleanly using GitHub-flavored Markdown tables, bullet points, and clear executive callouts.`;
}

/**
 * Builds the user prompt template injecting user requirements and computed data.
 */
export function buildUserPrompt(
  answers: UserAssessmentInput,
  computedData: PromptPayloadInput
): string {
  const envelope = computedData.costEnvelope || computedData.envelope;
  const rankedCities = computedData.rankedCities || computedData.cityRankings || [];
  const discrepancies = computedData.discrepancy || computedData.discrepancies || [];
  const applicableRisks = computedData.risks || computedData.applicableRisks || [];

  const topCities = rankedCities.slice(0, 3);
  const functionsList =
    answers.targetFunctions && answers.targetFunctions.length > 0
      ? answers.targetFunctions.join(', ')
      : answers.primaryFunction || 'Software Engineering';

  const headcountLabel = answers.targetHeadcount || answers.teamSize || '25-50';
  const preferredCitiesStr = answers.preferredCities?.length
    ? answers.preferredCities.join(', ')
    : 'All primary Indian tech hubs';

  let prompt = `### GCC FEASIBILITY & ADVISORY REQUEST

#### User Objectives:
- **Target Functional Scope:** ${functionsList}
- **Planned Headcount:** ${headcountLabel} FTEs
- **Target Setup Model Preference:** ${answers.setupModelPreference || 'Recommended optimal model'}
- **Location Preference:** ${preferredCitiesStr}
- **Priority:** ${answers.priority || 'Talent depth & Cost efficiency'}
- **Timeline to First Hire:** ${answers.timeline || '3-6 months'}

---

### COMPUTED BENCHMARK DATA (SOURCED RECORDS ONLY)
`;

  if (envelope) {
    prompt += `
#### 1. Financial & Operational Envelope:
- **Headcount:** ${envelope.headcount} FTEs
- **Setup Model:** ${envelope.setupModelSelected}
- **Estimated Setup Timeline:** ${formatRange(envelope.estimatedSetupTimelineMonths.min, envelope.estimatedSetupTimelineMonths.max)} Months
- **One-time Initial Setup Cost:** ${formatRange(envelope.initialSetupCostInrLakhs.min, envelope.initialSetupCostInrLakhs.max, (v) => formatCurrency(v, 'INR', 'lakhs'))}
- **Annual Base Salary Envelope:** ${formatRange(envelope.annualSalaryCostInrLakhs.min, envelope.annualSalaryCostInrLakhs.max, (v) => formatCurrency(v, 'INR', 'lakhs'))} (Median: ${formatCurrency(envelope.annualSalaryCostInrLakhs.median, 'INR', 'lakhs')})
- **Annual Office Workstation Cost:** ${formatRange(envelope.annualOfficeCostInrLakhs.min, envelope.annualOfficeCostInrLakhs.max, (v) => formatCurrency(v, 'INR', 'lakhs'))} (Median: ${formatCurrency(envelope.annualOfficeCostInrLakhs.median, 'INR', 'lakhs')})
- **Total Annual Run-Rate (All-Inclusive):** ${formatRange(envelope.annualTotalEstimatedInrLakhs.min, envelope.annualTotalEstimatedInrLakhs.max, (v) => formatCurrency(v, 'INR', 'crores'))} (Median: ${formatCurrency(envelope.annualTotalEstimatedInrLakhs.median, 'INR', 'crores')})
- **Data Sources:** ${envelope.sources.map((s) => `${s.name} (${s.reportTitle}, ${s.year})`).join('; ')}
`;
  }

  if (topCities.length > 0) {
    prompt += `
#### 2. City Location Rankings & Trade-offs:
${topCities
  .map(
    (c) =>
      `Rank #${c.rank}: **${c.cityName}** (Overall Fit Score: ${c.overallFitScore}/100)
- Talent Depth Score: ${c.talentDepthScore}/10
- Cost Efficiency Score: ${c.costEfficiencyScore}/10
- Infrastructure Score: ${c.infrastructureScore}/10
- Attrition Stability Score: ${c.attritionRiskScore}/10
- Summary: ${c.summaryRationale}
- Sources: ${c.sources.map((s) => s.name).join(', ')}`
  )
  .join('\n\n')}
`;
  }

  if (discrepancies.length > 0) {
    prompt += `\n#### 3. Macro GCC Market Benchmarks & Observed Discrepancies:
${discrepancies
  .map(
    (d) =>
      `- **${d.metric}**: ${d.sourceA.name} states "${d.sourceA.value}" (${d.sourceA.report}) vs ${d.sourceB.name} states "${d.sourceB.value}" (${d.sourceB.report}).
  *Root Cause:* ${d.deltaExplanation}`
  )
  .join('\n')}\n`;
  }

  if (applicableRisks.length > 0) {
    prompt += `\n#### 4. Critical Risk Factors & Mitigations:
${applicableRisks
  .map(
    (r) =>
      `- **[${r.severity} Severity] ${r.title} (${r.category})**: ${r.description}
  *Impact:* ${r.impactOnGCC}
  *Key Mitigations:* ${r.mitigationTactics.join(' | ')}
  *Sources:* ${r.sources.map((s) => s.name).join(', ')}`
  )
  .join('\n')}\n`;
  }

  prompt += `\n---
### INSTRUCTIONS FOR THE RESPONSE:
1. Synthesize this data into an executive strategic feasibility memo for a C-suite executive / VP exploring an India GCC.
2. Outline recommended next steps, location shortlist rationale, and operating model comparison (EOR vs Wholly Owned Subsidiary).
3. Do NOT cite any numbers, salary bands, rent rates, or center totals that are not explicitly present in the data above.
4. Conclude with a transparent note explaining why published GCC benchmarks vary across top industry advisory firms.`;

  return prompt;
}
