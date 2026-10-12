import { NextRequest, NextResponse } from 'next/server';
import { BriefInputs, EngineResult, runBriefEngine } from '@/lib/engine';

export interface BriefNarrative {
  summary: string;
  per_city_rationale: {
    city_name: string;
    rationale: string;
  }[];
  risks: string[];
  unknowns: string[];
  peer_takeaways: string[];
  bottleneck_note: string;
  cited_ids: string[];
}

interface CacheEntry {
  engine: EngineResult;
  narrative: BriefNarrative;
  timestamp: number;
}

const briefCache = new Map<string, CacheEntry>();

function createDeterministicNarrative(engine: EngineResult): BriefNarrative {
  const topCity = engine.top_cities[0]?.city_name || 'Bengaluru';
  const totalCost = engine.cost_breakdown.find((c) => c.category === 'total');
  const baseCostLakhs = totalCost ? totalCost.base_inr_lakhs : 0;
  const baseCostCr = (baseCostLakhs / 100).toFixed(2);

  const peerNames = engine.peer_companies.peers.map((p) => p.name).join(', ') || 'multinational GCC peers';
  const bottleneck = engine.timeline.bottleneck_step;

  return {
    summary: `For a ${engine.inputs.team_size}-person ${engine.inputs.function} team in the ${engine.inputs.sector} sector, ${topCity} ranks as the primary candidate hub based on talent depth and cluster maturity. The projected Year-1 operational run-rate is estimated at ₹${baseCostCr} Crores via the ${engine.inputs.entry_route === 'eor_bridge' ? 'Employer of Record (EOR)' : 'direct legal entity'} pathway, with a target delivery sprint window of ${engine.timeline.total_duration_months.low} to ${engine.timeline.total_duration_months.high} months.`,
    per_city_rationale: engine.top_cities.map((city) => ({
      city_name: city.city_name,
      rationale: city.rationale,
    })),
    risks: [
      `Talent competition in ${topCity} is acute; senior roles may demand 15-20% compensation premiums during active recruitment cycles.`,
      `State subsidies are disbursed retrospectively following annual audited compliance filings, meaning Day-1 cash outflows must cover full un-subsidized capex.`,
      engine.inputs.entry_route === 'eor_bridge'
        ? 'EOR management fee markup adds ongoing payroll overhead until transition to a wholly owned captive entity is executed.'
        : 'Direct legal incorporation requires 3-6 months lead time for RBI/MCA registrations and corporate bank account activation.',
    ],
    unknowns: [
      'Company-specific global transfer pricing markup percentages agreed with parent tax jurisdictions.',
      'Exact physical space requirements and specialized IT hardware or dedicated server room fit-out costs.',
      'Discretionary employee performance bonus pool and localized long-term incentive plan (LTIP) structures.',
    ],
    peer_takeaways: [
      `Peer enterprises like ${peerNames} demonstrate that establishing multi-functional capability hubs in ${topCity} anchors long-term retention.`,
      `Most mature peers in ${engine.inputs.sector} transitioned to direct corporate subsidiaries once headcount crossed 40-50 FTEs to capture transfer pricing efficiencies.`,
    ],
    bottleneck_note: `The critical-path bottleneck is "${bottleneck.name}" (estimated ${bottleneck.duration_weeks.base} weeks base duration). Primary risk: ${bottleneck.common_blocker || 'Administrative delays'}.`,
    cited_ids: engine.cited_ids.slice(0, 10),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const inputs: BriefInputs = body.inputs;

    if (!inputs || !inputs.function || !inputs.team_size || !inputs.entry_route) {
      return NextResponse.json(
        { error: 'Missing required scoping parameters (function, team_size, entry_route).' },
        { status: 400 }
      );
    }

    // 1. Compute deterministic engine result
    const engineResult = runBriefEngine(inputs);
    const validContextIds = new Set(engineResult.cited_ids);

    // 2. Check cache for identical inputs
    const cacheKey = JSON.stringify(inputs);
    const cachedEntry = briefCache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < 24 * 60 * 60 * 1000) {
      return NextResponse.json({
        engine: cachedEntry.engine,
        narrative: cachedEntry.narrative,
        cached: true,
      });
    }

    // 3. Narrative generation via Gemini
    let narrative: BriefNarrative | null = null;
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    if (apiKey) {
      const systemInstruction = `You are an executive GCC reference advisor.
Using ONLY the supplied numerical engine calculation context, generate a structured strategic feasibility brief.
CRITICAL RULES:
1. NEVER invent numbers, timeline weeks, city scores, or record IDs. Use ONLY facts supplied in the engine context.
2. In "cited_ids", list only the IDs explicitly provided in the engine's cited_ids list.
3. In "peer_takeaways", synthesize observations based ONLY on the peers provided in the engine context.
4. In "bottleneck_note", cite the exact bottleneck step name, duration, and common blocker provided in the timeline.
5. In "unknowns", explicitly articulate what cannot be calculated without proprietary enterprise disclosures.
6. Output ONLY valid JSON matching this schema:
{
  "summary": "2-3 sentence executive summary citing exact top city and total base cost",
  "per_city_rationale": [{"city_name": "string", "rationale": "string"}],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "unknowns": ["unknown 1", "unknown 2", "unknown 3"],
  "peer_takeaways": ["takeaway 1", "takeaway 2"],
  "bottleneck_note": "statement about the critical-path bottleneck step and blocker",
  "cited_ids": ["array of exact IDs from engine context"]
}`;

      const userPrompt = `ENGINE COMPUTATION CONTEXT:
${JSON.stringify(engineResult, null, 2)}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const geminiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        clearTimeout(timeoutId);

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText) as BriefNarrative;

            const allCitedExist =
              Array.isArray(parsed.cited_ids) &&
              parsed.cited_ids.length > 0 &&
              parsed.cited_ids.every((id) => validContextIds.has(id));

            if (
              allCitedExist &&
              parsed.summary &&
              Array.isArray(parsed.per_city_rationale) &&
              Array.isArray(parsed.peer_takeaways) &&
              parsed.bottleneck_note
            ) {
              narrative = parsed;
            } else {
              console.warn('Gemini response failed cited_ids validation. Reverting to deterministic narrative.');
            }
          }
        }
      } catch (err) {
        console.warn('Gemini brief generation failed or timed out:', (err as Error).message);
      }
    }

    if (!narrative) {
      narrative = createDeterministicNarrative(engineResult);
    }

    briefCache.set(cacheKey, {
      engine: engineResult,
      narrative,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      engine: engineResult,
      narrative,
      cached: false,
    });
  } catch (err) {
    console.error('Failed to generate entry brief:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
