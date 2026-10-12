import citiesData from '../data/cities.json' with { type: 'json' };
import companiesData from '../data/companies.json' with { type: 'json' };
import costAssumptionsData from '../data/cost_assumptions.json' with { type: 'json' };
import setupStepsData from '../data/setup_steps.json' with { type: 'json' };
import stallReasonsData from '../data/stall_reasons.json' with { type: 'json' };
import statesData from '../data/states.json' with { type: 'json' };
import type {
  City,
  Company,
  CostAssumption,
  SetupStep,
  StallReason,
  State,
} from './schema.ts';

export type BriefFunction = 'engineering' | 'data/AI' | 'finance/ops' | 'support';
export type Urgency = 'fast' | 'standard';
export type EntryRouteChoice = 'eor_bridge' | 'entity_first';

export interface PriorityWeights {
  cost: number;
  talent_depth: number;
  incentives: number;
  sector_cluster: number;
}

export interface BriefInputs {
  function: BriefFunction;
  team_size: number; // 10 - 100
  urgency: Urgency;
  weights: PriorityWeights;
  sector: string;
  entry_route: EntryRouteChoice;
  capex_inr?: number | null; // Optional capex input
}

export interface CityScoredResult {
  city_id: string;
  city_name: string;
  state_name: string;
  state_id: string;
  total_score: number;
  breakdown: {
    cost_score: number;
    talent_score: number;
    incentives_score: number;
    cluster_score: number;
  };
  salary_index: number;
  rent_range: { low: number; high: number };
  rationale: string;
  cited_ids: string[];
}

export interface CostRangeItem {
  category: 'people' | 'office' | 'setup' | 'eor_fees' | 'total';
  label: string;
  low_inr_lakhs: number;
  base_inr_lakhs: number;
  high_inr_lakhs: number;
  cited_assumption_id: string;
}

export interface EvaluatedIncentive {
  state_id: string;
  state_name: string;
  policy_name: string;
  type: string;
  headline_amount_text: string;
  likely_qualification_text: string;
  qualification_status: 'likely_eligible' | 'ineligible' | 'depends_on_capex' | 'depends_on_headcount';
  min_headcount: number | null;
  min_capex_inr: number | null;
  cap_text: string | null;
  duration_years: number | null;
  conditions_text: string;
  headline_vs_reality: string;
  cited_ids: string[];
}

export interface TimelineMilestone {
  step_id: string;
  name: string;
  owner_type: string;
  duration_weeks: { low: number; base: number; high: number };
  cumulative_weeks: { low: number; base: number; high: number };
  common_blocker: string | null;
  is_bottleneck: boolean;
  cited_ids: string[];
}

export interface CriticalPathTimeline {
  route: EntryRouteChoice;
  milestones: TimelineMilestone[];
  bottleneck_step: TimelineMilestone;
  total_duration_weeks: { low: number; base: number; high: number };
  total_duration_months: { low: number; base: number; high: number };
  hiring_early_start_note: string;
  cited_ids: string[];
}

export interface PeerCompanyResult {
  company_id: string;
  name: string;
  parent_name: string;
  parent_country: string;
  sector: string;
  cities: string[];
  entered_india_year: number | null;
  entry_route: string;
  route_source_url: string | null;
  evidence_tier: string;
  notes: string;
  match_score: number;
  cited_ids: string[];
}

export interface PreMortemStallReason {
  id: string;
  reason: string;
  applies_to: string | null;
  evidence_text: string;
  source_publisher: string;
  source_url: string;
  evidence_tier: string;
  cited_ids: string[];
}

export interface EngineResult {
  inputs: BriefInputs;
  top_cities: CityScoredResult[];
  cost_breakdown: CostRangeItem[];
  timeline: CriticalPathTimeline;
  applicable_incentives: EvaluatedIncentive[];
  peer_companies: {
    peers: PeerCompanyResult[];
    insufficient_notice: string | null;
    cited_ids: string[];
  };
  pre_mortem_stall_reasons: PreMortemStallReason[];
  cited_ids: string[];
}

/**
 * Pure engine scoring function.
 */
export function runBriefEngine(
  inputs: BriefInputs,
  dataOverride?: {
    cities?: City[];
    states?: State[];
    costAssumptions?: CostAssumption[];
    companies?: Company[];
    setupSteps?: SetupStep[];
    stallReasons?: StallReason[];
  }
): EngineResult {
  const cities: City[] = dataOverride?.cities || (citiesData as City[]);
  const states: State[] = dataOverride?.states || (statesData as State[]);
  const costAssumptions: CostAssumption[] =
    dataOverride?.costAssumptions || (costAssumptionsData as CostAssumption[]);
  const companies: Company[] = dataOverride?.companies || (companiesData as Company[]);
  const setupSteps: SetupStep[] = dataOverride?.setupSteps || (setupStepsData as SetupStep[]);
  const stallReasons: StallReason[] = dataOverride?.stallReasons || (stallReasonsData as StallReason[]);

  const citedIdsSet = new Set<string>();

  // 1. City Scoring
  const rawW = inputs.weights;
  const totalWeight = Math.max(
    1,
    (rawW.cost || 1) + (rawW.talent_depth || 1) + (rawW.incentives || 1) + (rawW.sector_cluster || 1)
  );

  const wCost = (rawW.cost || 1) / totalWeight;
  const wTalent = (rawW.talent_depth || 1) / totalWeight;
  const wIncentives = (rawW.incentives || 1) / totalWeight;
  const wCluster = (rawW.sector_cluster || 1) / totalWeight;

  const stateByCityState = new Map<string, State>();
  for (const s of states) {
    stateByCityState.set(s.id.toLowerCase(), s);
    stateByCityState.set(s.policy_name.toLowerCase(), s);
    if (s.id.includes('karnataka')) stateByCityState.set('karnataka', s);
    if (s.id.includes('telangana')) stateByCityState.set('telangana', s);
    if (s.id.includes('maharashtra')) stateByCityState.set('maharashtra', s);
    if (s.id.includes('tamil-nadu')) stateByCityState.set('tamil nadu', s);
  }

  const scoredCities: CityScoredResult[] = cities.map((city) => {
    citedIdsSet.add(city.id);

    const cityStateKey = city.state.toLowerCase();
    const matchedState = Array.from(stateByCityState.values()).find(
      (st) =>
        st.id.toLowerCase().includes(cityStateKey.replace(/\s+/g, '-')) ||
        cityStateKey.includes(st.id.replace('state-', ''))
    );

    if (matchedState) {
      citedIdsSet.add(matchedState.id);
    }

    const talentScore = Math.min(10, Math.max(0, city.talent_depth_1to5 * 2));
    const salIdx = city.salary_index[inputs.function] ?? 1.0;
    const avgRent = (city.rent_inr_sqft_month.low + city.rent_inr_sqft_month.high) / 2;
    const salScore = Math.max(0, Math.min(10, (1.35 - salIdx) * 20));
    const rentScore = Math.max(0, Math.min(10, (170 - avgRent) / 11));
    const costScore = Number((salScore * 0.65 + rentScore * 0.35).toFixed(1));

    let incentivesScore = 3.0;
    if (matchedState) {
      const qualifyingIncentives = matchedState.incentives.filter((inc) => {
        if (inc.min_headcount && inputs.team_size < inc.min_headcount) return false;
        return true;
      });
      incentivesScore = Math.min(10, 4.0 + qualifyingIncentives.length * 2.5);
    }

    const targetSectorLower = inputs.sector.toLowerCase();
    const hasCluster = city.clusters.some((cl) => {
      const clLower = cl.toLowerCase();
      return (
        clLower.includes(targetSectorLower) ||
        targetSectorLower.includes(clLower) ||
        (targetSectorLower.includes('retail') && clLower.includes('retail')) ||
        (targetSectorLower.includes('fintech') && clLower.includes('fin')) ||
        (targetSectorLower.includes('bank') && clLower.includes('bank')) ||
        (targetSectorLower.includes('aero') && clLower.includes('aero')) ||
        (targetSectorLower.includes('health') && clLower.includes('health'))
      );
    });
    const clusterScore = hasCluster ? 9.5 : 5.0;

    const weightedSum =
      costScore * wCost * 10 +
      talentScore * wTalent * 10 +
      incentivesScore * wIncentives * 10 +
      clusterScore * wCluster * 10;

    const totalScore = Math.round(Math.min(100, Math.max(0, weightedSum)));
    const rationale = `${city.name} scores ${talentScore}/10 for ${inputs.function} talent depth, with an operating salary index of ${salIdx}x and ${hasCluster ? 'established cluster presence' : 'emerging presence'} in ${inputs.sector}.`;

    const cityCited = [city.id];
    if (matchedState) cityCited.push(matchedState.id);

    return {
      city_id: city.id,
      city_name: city.name,
      state_name: city.state,
      state_id: matchedState ? matchedState.id : 'unknown',
      total_score: totalScore,
      breakdown: {
        cost_score: costScore,
        talent_score: talentScore,
        incentives_score: Number(incentivesScore.toFixed(1)),
        cluster_score: clusterScore,
      },
      salary_index: salIdx,
      rent_range: city.rent_inr_sqft_month,
      rationale,
      cited_ids: cityCited,
    };
  });

  scoredCities.sort((a, b) => b.total_score - a.total_score);
  const topCities = scoredCities.slice(0, 3);

  // 2. Year-One Cost Breakdown
  const topCity = topCities[0] || cities[0];
  const citySalaryMultiplier = topCity.salary_index;

  const salaryAssumption =
    costAssumptions.find((ca) => ca.applies_to === inputs.function) ||
    costAssumptions.find((ca) => ca.applies_to === 'engineering') ||
    costAssumptions[0];
  citedIdsSet.add(salaryAssumption.id);

  const rawPeopleLow = inputs.team_size * salaryAssumption.low * citySalaryMultiplier;
  const rawPeopleBase = inputs.team_size * salaryAssumption.base * citySalaryMultiplier;
  const rawPeopleHigh = inputs.team_size * salaryAssumption.high * citySalaryMultiplier;

  const peopleItem: CostRangeItem = {
    category: 'people',
    label: `${inputs.function} Base Payroll (${inputs.team_size} FTEs)`,
    low_inr_lakhs: Number(rawPeopleLow.toFixed(1)),
    base_inr_lakhs: Number(rawPeopleBase.toFixed(1)),
    high_inr_lakhs: Number(rawPeopleHigh.toFixed(1)),
    cited_assumption_id: salaryAssumption.id,
  };

  const officeAssumption =
    costAssumptions.find((ca) => ca.applies_to === 'office_rent') || costAssumptions[0];
  citedIdsSet.add(officeAssumption.id);

  const officeLow = (officeAssumption.low * 12 * inputs.team_size) / 100000;
  const officeBase = (officeAssumption.base * 12 * inputs.team_size) / 100000;
  const officeHigh = (officeAssumption.high * 12 * inputs.team_size) / 100000;

  const officeItem: CostRangeItem = {
    category: 'office',
    label: `Workstation & Flexible Office (${inputs.team_size} seats)`,
    low_inr_lakhs: Number(officeLow.toFixed(1)),
    base_inr_lakhs: Number(officeBase.toFixed(1)),
    high_inr_lakhs: Number(officeHigh.toFixed(1)),
    cited_assumption_id: officeAssumption.id,
  };

  const setupAssumption =
    costAssumptions.find((ca) => ca.applies_to === 'entity_setup') || costAssumptions[0];
  citedIdsSet.add(setupAssumption.id);

  let setupLow = setupAssumption.low;
  let setupBase = setupAssumption.base;
  let setupHigh = setupAssumption.high;

  if (inputs.entry_route === 'eor_bridge') {
    setupLow = 1.5;
    setupBase = 2.5;
    setupHigh = 4.0;
  }

  const setupItem: CostRangeItem = {
    category: 'setup',
    label: inputs.entry_route === 'entity_first' ? 'Legal Entity (WOFE) Incorporation' : 'EOR Onboarding & Setup',
    low_inr_lakhs: setupLow,
    base_inr_lakhs: setupBase,
    high_inr_lakhs: setupHigh,
    cited_assumption_id: setupAssumption.id,
  };

  let eorFeeLow = 0;
  let eorFeeBase = 0;
  let eorFeeHigh = 0;
  const eorAssumption = costAssumptions.find((ca) => ca.applies_to === 'eor_fee');

  if (inputs.entry_route === 'eor_bridge' && eorAssumption) {
    citedIdsSet.add(eorAssumption.id);
    eorFeeLow = rawPeopleLow * eorAssumption.low;
    eorFeeBase = rawPeopleBase * eorAssumption.base;
    eorFeeHigh = rawPeopleHigh * eorAssumption.high;
  }

  const eorItem: CostRangeItem = {
    category: 'eor_fees',
    label: 'Employer of Record (EOR) Service Fee',
    low_inr_lakhs: Number(eorFeeLow.toFixed(1)),
    base_inr_lakhs: Number(eorFeeBase.toFixed(1)),
    high_inr_lakhs: Number(eorFeeHigh.toFixed(1)),
    cited_assumption_id: eorAssumption ? eorAssumption.id : 'none',
  };

  const totalItem: CostRangeItem = {
    category: 'total',
    label: 'Total Year-One Operational Cost Envelope',
    low_inr_lakhs: Number(
      (peopleItem.low_inr_lakhs + officeItem.low_inr_lakhs + setupItem.low_inr_lakhs + eorItem.low_inr_lakhs).toFixed(1)
    ),
    base_inr_lakhs: Number(
      (peopleItem.base_inr_lakhs + officeItem.base_inr_lakhs + setupItem.base_inr_lakhs + eorItem.base_inr_lakhs).toFixed(1)
    ),
    high_inr_lakhs: Number(
      (peopleItem.high_inr_lakhs + officeItem.high_inr_lakhs + setupItem.high_inr_lakhs + eorItem.high_inr_lakhs).toFixed(1)
    ),
    cited_assumption_id: 'composite',
  };

  const costBreakdown: CostRangeItem[] = [
    peopleItem,
    officeItem,
    setupItem,
    ...(inputs.entry_route === 'eor_bridge' ? [eorItem] : []),
    totalItem,
  ];

  // 3. Feature 2: Critical-path timeline computed from setup_steps.json
  const relevantStepIds =
    inputs.entry_route === 'eor_bridge'
      ? ['step-eor-msa', 'step-eor-workstation', 'step-eor-talent-hiring', 'step-eor-day-one']
      : [
          'step-name-approval',
          'step-entity-incorporation',
          'step-pan-bank-account',
          'step-office-lease',
          'step-it-infra',
          'step-talent-hiring',
          'step-entity-day-one',
        ];

  const stepsMap = new Map<string, SetupStep>();
  for (const s of setupSteps) {
    stepsMap.set(s.id, s);
  }

  // Filter existing steps in dataset
  const activeSteps = relevantStepIds
    .map((id) => stepsMap.get(id))
    .filter((s): s is SetupStep => s !== undefined);

  // Compute milestones and bottleneck
  let cumLow = 0;
  let cumBase = 0;
  let cumHigh = 0;

  let bottleneckCandidate: SetupStep = activeSteps[0] || setupSteps[0];
  let maxBaseDuration = -1;

  for (const s of activeSteps) {
    citedIdsSet.add(s.id);
    if (s.duration_weeks.base > maxBaseDuration) {
      maxBaseDuration = s.duration_weeks.base;
      bottleneckCandidate = s;
    }
  }

  const milestones: TimelineMilestone[] = activeSteps.map((step) => {
    cumLow += step.duration_weeks.low;
    cumBase += step.duration_weeks.base;
    cumHigh += step.duration_weeks.high;

    const isBottleneck = step.id === bottleneckCandidate.id;

    return {
      step_id: step.id,
      name: step.name,
      owner_type: step.owner_type,
      duration_weeks: step.duration_weeks,
      cumulative_weeks: {
        low: Number(cumLow.toFixed(1)),
        base: Number(cumBase.toFixed(1)),
        high: Number(cumHigh.toFixed(1)),
      },
      common_blocker: step.common_blocker,
      is_bottleneck: isBottleneck,
      cited_ids: [step.id],
    };
  });

  const bottleneckMilestone: TimelineMilestone =
    milestones.find((m) => m.is_bottleneck) || milestones[0];

  const criticalPathTimeline: CriticalPathTimeline = {
    route: inputs.entry_route,
    milestones,
    bottleneck_step: bottleneckMilestone,
    total_duration_weeks: {
      low: Number(cumLow.toFixed(1)),
      base: Number(cumBase.toFixed(1)),
      high: Number(cumHigh.toFixed(1)),
    },
    total_duration_months: {
      low: Number((cumLow / 4.3).toFixed(1)),
      base: Number((cumBase / 4.3).toFixed(1)),
      high: Number((cumHigh / 4.3).toFixed(1)),
    },
    hiring_early_start_note:
      inputs.entry_route === 'eor_bridge'
        ? 'EOR bridge allows candidate sourcing, technical interviews, and employment contracts to be issued on Day 14 (Week 2), bypassing corporate bank account and incorporation hurdles.'
        : 'Entity-first route mandates that corporate incorporation, PAN/TAN issuance, and Indian bank account activation precede legal employment contract issuance, shifting hiring to Month 2.5–3.',
    cited_ids: activeSteps.map((s) => s.id),
  };

  // 4. Feature 3: Likely-eligible incentives with capex & headcount logic
  const applicableIncentives: EvaluatedIncentive[] = [];
  const topStateIds = new Set(topCities.map((c) => c.state_id));

  for (const st of states) {
    if (topStateIds.has(st.id)) {
      citedIdsSet.add(st.id);
      for (const inc of st.incentives) {
        let qualStatus: EvaluatedIncentive['qualification_status'] = 'likely_eligible';
        let qualificationText = `Likely qualifies for ${inc.amount_text}`;

        // 1. Headcount check
        if (inc.min_headcount && inputs.team_size < inc.min_headcount) {
          qualStatus = 'ineligible';
          qualificationText = `Ineligible: Team size of ${inputs.team_size} is below the policy minimum threshold of ${inc.min_headcount} FTEs.`;
        }

        // 2. Capex check
        if (inc.min_capex_inr && qualStatus !== 'ineligible') {
          if (inputs.capex_inr === undefined || inputs.capex_inr === null) {
            qualStatus = 'depends_on_capex';
            const reqCr = (inc.min_capex_inr / 10000000).toFixed(1);
            qualificationText = `Depends on capex: Requires minimum capital investment of ₹${reqCr} Cr. (User capex not specified).`;
          } else if (inputs.capex_inr < inc.min_capex_inr) {
            qualStatus = 'ineligible';
            const reqCr = (inc.min_capex_inr / 10000000).toFixed(1);
            const userCr = (inputs.capex_inr / 10000000).toFixed(1);
            qualificationText = `Ineligible: Planned capex of ₹${userCr} Cr is below policy threshold of ₹${reqCr} Cr.`;
          } else {
            qualificationText = `Likely qualifies: Planned capex meets policy minimum threshold.`;
          }
        }

        if (inc.cap_text && qualStatus === 'likely_eligible') {
          qualificationText += ` (${inc.cap_text})`;
        }

        applicableIncentives.push({
          state_id: st.id,
          state_name: st.policy_name,
          policy_name: st.policy_name,
          type: inc.type,
          headline_amount_text: inc.amount_text,
          likely_qualification_text: qualificationText,
          qualification_status: qualStatus,
          min_headcount: inc.min_headcount,
          min_capex_inr: inc.min_capex_inr,
          cap_text: inc.cap_text,
          duration_years: inc.duration_years,
          conditions_text: inc.conditions_text,
          headline_vs_reality: inc.headline_vs_reality,
          cited_ids: [st.id],
        });
      }
    }
  }

  // 5. Feature 1: Companies like you (3-5 closest peers, no padding)
  const targetSectorLower = inputs.sector.toLowerCase();
  const scoredPeers: { peer: Company; score: number }[] = [];

  for (const c of companies) {
    let peerScore = 0;
    const cSector = c.sector.toLowerCase();

    // Primary qualification: Sector match
    let sectorMatched = false;
    if (cSector.includes(targetSectorLower) || targetSectorLower.includes(cSector)) {
      peerScore += 3;
      sectorMatched = true;
    } else if (
      (targetSectorLower.includes('retail') && cSector.includes('retail')) ||
      (targetSectorLower.includes('bank') && cSector.includes('bank')) ||
      (targetSectorLower.includes('software') && cSector.includes('software')) ||
      (targetSectorLower.includes('health') && cSector.includes('health')) ||
      (targetSectorLower.includes('aero') && cSector.includes('aero'))
    ) {
      peerScore += 2;
      sectorMatched = true;
    }

    if (!sectorMatched) {
      continue;
    }

    // GCC Type match (+2)
    if (c.type === 'captive') peerScore += 2;

    // City presence match with top ranked cities (+1)
    const topCityNames = topCities.map((tc) => tc.city_name.toLowerCase());
    if (c.india_cities?.some((ct) => topCityNames.includes(ct.toLowerCase()))) {
      peerScore += 1;
    }

    scoredPeers.push({ peer: c, score: peerScore });
  }

  scoredPeers.sort((a, b) => b.score - a.score);

  // Take 3-5 closest peers
  let selectedPeers = scoredPeers.slice(0, 5);
  let insufficientNotice: string | null = null;

  if (selectedPeers.length < 3) {
    insufficientNotice = `Fewer than 3 sourced peer GCCs in the database strictly match the "${inputs.sector}" sector and operating profile. Showing ${selectedPeers.length} sourced match(es) without artificial padding.`;
  }

  const peerCompanyResults: PeerCompanyResult[] = selectedPeers.map(({ peer, score }) => {
    citedIdsSet.add(peer.id);
    return {
      company_id: peer.id,
      name: peer.name,
      parent_name: peer.parent_name,
      parent_country: peer.parent_country,
      sector: peer.sector,
      cities: peer.india_cities,
      entered_india_year: peer.entered_india_year,
      entry_route: peer.entry_route,
      route_source_url: peer.route_source?.url || null,
      evidence_tier: peer.evidence_tier,
      notes: peer.notes,
      match_score: score,
      cited_ids: [peer.id],
    };
  });

  // 6. Feature 4: Pre-mortem stall reasons (3-5 most relevant)
  const scoredStalls: { stall: StallReason; score: number }[] = [];

  for (const sr of stallReasons) {
    let relevanceScore = 0;
    const appliesTo = sr.applies_to?.toLowerCase() || '';

    // Route match
    if (appliesTo === inputs.entry_route.toLowerCase()) {
      relevanceScore += 4;
    }
    // Sector match
    if (appliesTo && targetSectorLower.includes(appliesTo)) {
      relevanceScore += 4;
    }
    // Universal cross-cutting risk (applies_to is null)
    if (sr.applies_to === null) {
      relevanceScore += 2;
    }

    if (relevanceScore > 0) {
      scoredStalls.push({ stall: sr, score: relevanceScore });
    }
  }

  scoredStalls.sort((a, b) => b.score - a.score);
  const selectedStalls = (scoredStalls.length > 0 ? scoredStalls : stallReasons.map((s) => ({ stall: s, score: 1 })))
    .slice(0, 4)
    .map(({ stall }) => {
      citedIdsSet.add(stall.id);
      return {
        id: stall.id,
        reason: stall.reason,
        applies_to: stall.applies_to,
        evidence_text: stall.evidence_text,
        source_publisher: stall.sources[0]?.publisher || 'Verified Study',
        source_url: stall.sources[0]?.url || 'https://nasscom.in',
        evidence_tier: stall.evidence_tier,
        cited_ids: [stall.id],
      };
    });

  return {
    inputs,
    top_cities: topCities,
    cost_breakdown: costBreakdown,
    timeline: criticalPathTimeline,
    applicable_incentives: applicableIncentives,
    peer_companies: {
      peers: peerCompanyResults,
      insufficient_notice: insufficientNotice,
      cited_ids: peerCompanyResults.map((p) => p.company_id),
    },
    pre_mortem_stall_reasons: selectedStalls,
    cited_ids: Array.from(citedIdsSet),
  };
}

export const runFeasibilityEngine = runBriefEngine;

