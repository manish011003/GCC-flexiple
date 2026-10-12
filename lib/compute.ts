import { cities } from '../data/cities.ts';
import { entitySetupBenchmarks, officeBenchmarks, salaryBands } from '../data/cost-benchmarks.ts';
import { gccFunctions } from '../data/functions.ts';
import { gccCountEstimates } from '../data/gcc-counts.ts';
import { riskFactors } from '../data/risks.ts';
import type {
  CityRankResult,
  CostEnvelopeResult,
  DiscrepancySummaryItem,
  RiskFactor,
  Source,
  UserAssessmentInput,
} from '../data/types.ts';

export interface TeamCostResult {
  cityId: string;
  cityName: string;
  functionId: string;
  functionName: string;
  headcount: number;
  totalAnnualSalaryInrLakhs: {
    min: number;
    median: number;
    max: number;
  };
  blendedAnnualSalaryPerEngineerLpa: {
    min: number;
    median: number;
    max: number;
  };
  sources: Source[];
}

const DEFAULT_EXPERIENCE_MIX = {
  juniorPercent: 0.35,
  midPercent: 0.40,
  seniorPercent: 0.20,
  leadPercent: 0.05,
};

/**
 * Normalizes input from either UserAssessmentInput or QuestionnaireAnswers
 */
function normalizeAnswers(answers: UserAssessmentInput): {
  targetFunctions: string[];
  headcount: number;
  preferredCityId: string;
  setupModelRoute: 'Direct Subsidiary (Wholly Owned)' | 'Employer of Record (EOR)' | 'BOT (Build-Operate-Transfer)';
  officeModel: 'Coworking / Hot Desk' | 'Dedicated Managed Space' | 'Custom Enterprise Lease';
  priority: string;
  experienceMix: typeof DEFAULT_EXPERIENCE_MIX;
} {
  // 1. Functions
  let targetFunctions = answers.targetFunctions || [];
  if (targetFunctions.length === 0 && answers.primaryFunction) {
    if (answers.primaryFunction === 'engineering') targetFunctions = ['software-engineering'];
    else if (answers.primaryFunction === 'data-ai') targetFunctions = ['data-ai'];
    else if (answers.primaryFunction === 'finance') targetFunctions = ['finance-accounting'];
    else if (answers.primaryFunction === 'customer-ops') targetFunctions = ['customer-ops'];
    else if (answers.primaryFunction === 'multi') targetFunctions = ['software-engineering', 'data-ai', 'finance-accounting'];
    else targetFunctions = [answers.primaryFunction];
  }
  if (targetFunctions.length === 0) {
    targetFunctions = ['software-engineering'];
  }

  // 2. Headcount
  let headcount = answers.targetHeadcount || 0;
  if (!headcount && answers.teamSize) {
    if (answers.teamSize === '10-30') headcount = 20;
    else if (answers.teamSize === '30-75') headcount = 50;
    else if (answers.teamSize === '75-150') headcount = 100;
    else {
      const parsed = parseInt(answers.teamSize, 10);
      headcount = isNaN(parsed) ? 25 : parsed;
    }
  }
  if (headcount <= 0) headcount = 25;

  // 3. Preferred city
  const preferredCityId = answers.preferredCities?.[0] || 'bengaluru';

  // 4. Setup Route
  let setupModelRoute = answers.setupModelPreference;
  if (!setupModelRoute) {
    if (answers.priority === 'speed' || headcount < 40) {
      setupModelRoute = 'Employer of Record (EOR)';
    } else {
      setupModelRoute = 'Direct Subsidiary (Wholly Owned)';
    }
  }

  // 5. Office Model
  const officeModel = answers.officeModel || (headcount > 60 ? 'Dedicated Managed Space' : 'Coworking / Hot Desk');

  const priority = answers.priority || 'talent';
  const experienceMix = answers.experienceMix || DEFAULT_EXPERIENCE_MIX;

  return {
    targetFunctions,
    headcount,
    preferredCityId,
    setupModelRoute,
    officeModel,
    priority,
    experienceMix,
  };
}

/**
 * Computes salary and compensation costs for a specific functional team in a specific city.
 * Pure function with no side-effects.
 */
export function computeTeamCost(
  cityId: string,
  functionId: string,
  size: number,
  experienceMix = DEFAULT_EXPERIENCE_MIX
): TeamCostResult {
  const city = cities.find((c) => c.id.toLowerCase() === cityId.toLowerCase()) || cities[0];
  const func = gccFunctions.find((f) => f.id.toLowerCase() === functionId.toLowerCase()) || gccFunctions[0];

  const cityFunctionTalent = city.functionTalent.find((ft) => ft.functionId === func.id);

  const juniorMedian = cityFunctionTalent?.medianSalaryLpa.junior ?? func.nationalMedianSalaryLpa.junior ?? 10.0;
  const midMedian = cityFunctionTalent?.medianSalaryLpa.mid ?? func.nationalMedianSalaryLpa.mid ?? 17.0;
  const seniorMedian = cityFunctionTalent?.medianSalaryLpa.senior ?? func.nationalMedianSalaryLpa.senior ?? 30.0;
  const leadMedian = cityFunctionTalent?.medianSalaryLpa.lead ?? func.nationalMedianSalaryLpa.lead ?? 50.0;

  const blendedMedianLpa =
    experienceMix.juniorPercent * juniorMedian +
    experienceMix.midPercent * midMedian +
    experienceMix.seniorPercent * seniorMedian +
    experienceMix.leadPercent * leadMedian;

  const blendedMinLpa = Number((blendedMedianLpa * 0.8).toFixed(2));
  const blendedMaxLpa = Number((blendedMedianLpa * 1.25).toFixed(2));
  const roundedMedianLpa = Number(blendedMedianLpa.toFixed(2));

  const totalAnnualSalaryInrLakhs = {
    min: Number((blendedMinLpa * size).toFixed(2)),
    median: Number((roundedMedianLpa * size).toFixed(2)),
    max: Number((blendedMaxLpa * size).toFixed(2)),
  };

  const collectedSources: Source[] = [
    ...(cityFunctionTalent?.sources || []),
    ...func.sources,
  ];
  const uniqueSources = collectedSources.filter(
    (src, idx, arr) => arr.findIndex((s) => s.name === src.name && s.year === src.year) === idx
  );

  return {
    cityId: city.id,
    cityName: city.name,
    functionId: func.id,
    functionName: func.name,
    headcount: size,
    totalAnnualSalaryInrLakhs,
    blendedAnnualSalaryPerEngineerLpa: {
      min: blendedMinLpa,
      median: roundedMedianLpa,
      max: blendedMaxLpa,
    },
    sources: uniqueSources,
  };
}

/**
 * Computes the total initial cost envelope and annual run rate for setting up a GCC based on user requirements.
 * Pure function.
 */
export function computeCostEnvelope(answers: UserAssessmentInput): CostEnvelopeResult {
  const norm = normalizeAnswers(answers);
  const headcount = norm.headcount;
  const targetFunctions = norm.targetFunctions;
  const preferredCity = cities.find((c) => c.id === norm.preferredCityId) || cities[0];

  const countPerFunction = headcount / targetFunctions.length;
  let totalSalaryMinLakhs = 0;
  let totalSalaryMedianLakhs = 0;
  let totalSalaryMaxLakhs = 0;
  const sourcesGathered: Source[] = [];

  for (const fId of targetFunctions) {
    const teamCost = computeTeamCost(preferredCity.id, fId, countPerFunction, norm.experienceMix);
    totalSalaryMinLakhs += teamCost.totalAnnualSalaryInrLakhs.min;
    totalSalaryMedianLakhs += teamCost.totalAnnualSalaryInrLakhs.median;
    totalSalaryMaxLakhs += teamCost.totalAnnualSalaryInrLakhs.max;
    sourcesGathered.push(...teamCost.sources);
  }

  const officeModelName = norm.officeModel;
  const matchingOffice = officeBenchmarks.find(
    (ob) => ob.cityId === preferredCity.id && ob.model === officeModelName
  ) || officeBenchmarks.find((ob) => ob.cityId === preferredCity.id) || officeBenchmarks[0];

  if (matchingOffice) {
    sourcesGathered.push(...matchingOffice.sources);
  }

  const annualOfficeMinLakhs = Number(((matchingOffice.monthlyCostPerSeatInr.min * 12 * headcount) / 100000).toFixed(2));
  const annualOfficeMedianLakhs = Number(((matchingOffice.monthlyCostPerSeatInr.median * 12 * headcount) / 100000).toFixed(2));
  const annualOfficeMaxLakhs = Number(((matchingOffice.monthlyCostPerSeatInr.max * 12 * headcount) / 100000).toFixed(2));

  const matchingSetup = entitySetupBenchmarks.find((s) => s.route === norm.setupModelRoute) || entitySetupBenchmarks[0];
  sourcesGathered.push(...matchingSetup.sources);

  const initialSetupCostMin = matchingSetup.setupCostInrLakhsRange.min ?? 15.0;
  const initialSetupCostMax = matchingSetup.setupCostInrLakhsRange.max ?? 30.0;

  let markupMultiplierMin = 1.0;
  let markupMultiplierMedian = 1.0;
  let markupMultiplierMax = 1.0;
  let annualComplianceAddon = 0;

  if (matchingSetup.route === 'Employer of Record (EOR)') {
    markupMultiplierMin = 1.15;
    markupMultiplierMedian = 1.18;
    markupMultiplierMax = 1.25;
  } else if (matchingSetup.annualComplianceCostInrLakhs) {
    annualComplianceAddon = matchingSetup.annualComplianceCostInrLakhs;
  }

  const effectiveSalaryAnnualMin = totalSalaryMinLakhs * markupMultiplierMin;
  const effectiveSalaryAnnualMedian = totalSalaryMedianLakhs * markupMultiplierMedian;
  const effectiveSalaryAnnualMax = totalSalaryMaxLakhs * markupMultiplierMax;

  const totalAnnualMin = Number((effectiveSalaryAnnualMin + annualOfficeMinLakhs + annualComplianceAddon).toFixed(2));
  const totalAnnualMedian = Number((effectiveSalaryAnnualMedian + annualOfficeMedianLakhs + annualComplianceAddon).toFixed(2));
  const totalAnnualMax = Number((effectiveSalaryAnnualMax + annualOfficeMaxLakhs + annualComplianceAddon).toFixed(2));

  const uniqueSources = sourcesGathered.filter(
    (src, idx, arr) => arr.findIndex((s) => s.name === src.name && s.year === src.year) === idx
  );

  return {
    headcount,
    annualSalaryCostInrLakhs: {
      min: Number(totalSalaryMinLakhs.toFixed(2)),
      median: Number(totalSalaryMedianLakhs.toFixed(2)),
      max: Number(totalSalaryMaxLakhs.toFixed(2)),
    },
    annualOfficeCostInrLakhs: {
      min: annualOfficeMinLakhs,
      median: annualOfficeMedianLakhs,
      max: annualOfficeMaxLakhs,
    },
    initialSetupCostInrLakhs: {
      min: initialSetupCostMin,
      max: initialSetupCostMax,
    },
    annualTotalEstimatedInrLakhs: {
      min: totalAnnualMin,
      median: totalAnnualMedian,
      max: totalAnnualMax,
    },
    estimatedSetupTimelineMonths: {
      min: matchingSetup.setupTimeMonthsRange.min ?? 3.0,
      max: matchingSetup.setupTimeMonthsRange.max ?? 6.0,
    },
    setupModelSelected: matchingSetup.route,
    methodologyNotes: `Estimated for ${headcount} FTEs in ${preferredCity.name} via ${matchingSetup.route}. Includes salary envelope, ${matchingOffice.model} workstation costs, and route-specific management fees/compliance overhead.`,
    sources: uniqueSources,
  };
}

/**
 * Ranks candidate Indian cities according to user's targeted functions, headcount, and priorities.
 * Pure deterministic function.
 */
export function rankCities(answers: UserAssessmentInput): CityRankResult[] {
  const norm = normalizeAnswers(answers);
  const targetFunctions = norm.targetFunctions;
  const preferredFilter = answers.preferredCities && answers.preferredCities.length > 0
    ? new Set(answers.preferredCities.map((c) => c.toLowerCase()))
    : null;

  const candidateCities = preferredFilter
    ? cities.filter((c) => preferredFilter.has(c.id.toLowerCase()) || preferredFilter.has(c.name.toLowerCase()))
    : cities;

  const results: CityRankResult[] = candidateCities.map((city) => {
    let depthSum = 0;
    let functionsFound = 0;
    const sourcesPool: Source[] = [...city.sources];

    for (const fId of targetFunctions) {
      const match = city.functionTalent.find((ft) => ft.functionId === fId);
      if (match) {
        depthSum += match.depthScore;
        functionsFound++;
        sourcesPool.push(...match.sources);
      }
    }
    const talentDepthScore = Number((functionsFound > 0 ? depthSum / functionsFound : 6.0).toFixed(1));

    const baseRent = city.commercialRealEstateAvgSqFtMonthlyInr ?? 80;
    const normalizedRentFactor = 1 - (baseRent - 45) / (135 - 45);
    const costEfficiencyScore = Number((5.0 + normalizedRentFactor * 4.5).toFixed(1));

    const infrastructureScore = Number(city.infraScore.toFixed(1));

    const attrition = city.attritionRateAnnualPercent ?? 15.0;
    const attritionRiskScore = Number(Math.max(1, Math.min(10, 10 - (attrition - 7) * 0.45)).toFixed(1));

    // Dynamic weighting based on user priority
    let weightTalent = 4.0;
    let weightCost = 2.5;
    let weightInfra = 2.0;
    let weightAttrition = 1.5;

    if (norm.priority === 'cost') {
      weightCost = 4.5;
      weightTalent = 2.5;
    } else if (norm.priority === 'speed') {
      weightInfra = 3.5;
      weightTalent = 3.5;
    } else if (norm.priority === 'ip') {
      weightAttrition = 3.0;
      weightTalent = 3.5;
    }

    const totalWeight = weightTalent + weightCost + weightInfra + weightAttrition;
    const weightedSum =
      (talentDepthScore * weightTalent +
        costEfficiencyScore * weightCost +
        infrastructureScore * weightInfra +
        attritionRiskScore * weightAttrition) *
      (10 / totalWeight);

    const overallFitScore = Math.min(100, Math.max(1, Math.round(weightedSum * 10) / 10));

    const rationale = `${city.name} scores ${talentDepthScore}/10 for ${targetFunctions.join(', ')} depth, ${costEfficiencyScore}/10 cost efficiency, and ${attrition}% projected annual attrition.`;

    const uniqueSources = sourcesPool.filter(
      (src, idx, arr) => arr.findIndex((s) => s.name === src.name && s.year === src.year) === idx
    );

    return {
      cityId: city.id,
      cityName: city.name,
      overallFitScore: Math.round(overallFitScore),
      talentDepthScore,
      costEfficiencyScore,
      infrastructureScore,
      attritionRiskScore,
      rank: 1,
      summaryRationale: rationale,
      sources: uniqueSources,
    };
  });

  results.sort((a, b) => b.overallFitScore - a.overallFitScore);

  return results.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

/**
 * Returns structured summary of discrepancies among major published GCC benchmarks.
 * Pure function.
 */
export function getDiscrepancySummary(): DiscrepancySummaryItem[] {
  const nasscom = gccCountEstimates.find((e) => e.source.name.includes('NASSCOM'))!;
  const deloitte = gccCountEstimates.find((e) => e.source.name.includes('Deloitte'))!;
  const ansr = gccCountEstimates.find((e) => e.source.name.includes('ANSR'))!;

  return [
    {
      metric: 'Total Active GCC Count in India',
      sourceA: {
        name: nasscom.source.name,
        value: `${nasscom.totalCenters} Centers`,
        report: nasscom.source.reportTitle,
        scope: nasscom.definitionScope,
      },
      sourceB: {
        name: deloitte.source.name,
        value: `${deloitte.totalCenters} Centers`,
        report: deloitte.source.reportTitle,
        scope: deloitte.definitionScope,
      },
      deltaExplanation:
        'Delta of 150 centers (+10.5% in NASSCOM): NASSCOM counts operational functional charters including multi-center presences as discrete units, whereas Deloitte filters strictly by registered Foreign Wholly Owned Subsidiary (WOFE) legal entities.',
    },
    {
      metric: 'Total Installed GCC Talent Headcount',
      sourceA: {
        name: nasscom.source.name,
        value: '1.66 Million FTEs',
        report: nasscom.source.reportTitle,
        scope: 'On-roll FTEs plus long-term dedicated captive staff.',
      },
      sourceB: {
        name: ansr.source.name,
        value: '1.80 Million FTEs',
        report: ansr.source.reportTitle,
        scope: 'Consolidated GCC ecosystem including micro-satellites, incubation hubs, and third-party dedicated BOT staff.',
      },
      deltaExplanation:
        'Delta of ~140,000 personnel (+8.4% in ANSR): ANSR captures rapid Tier-2 expansion satellites, micro-hubs, and tech contractors under BOT arrangements that are excluded from NASSCOM core captive benchmarks.',
    },
    {
      metric: 'India GCC Economic Market Size (USD)',
      sourceA: {
        name: deloitte.source.name,
        value: '$42.5 Billion',
        report: deloitte.source.reportTitle,
        scope: deloitte.definitionScope,
      },
      sourceB: {
        name: ansr.source.name,
        value: '$52.0 Billion',
        report: ansr.source.reportTitle,
        scope: ansr.definitionScope,
      },
      deltaExplanation:
        'Delta of $9.5 Billion (+22.3% in ANSR): Deloitte bases market size strictly on reported inter-company transfer pricing billings and operating budgets, while ANSR factors in total value-added economic footprint including third-party vendor pass-throughs and real estate capital expenditure.',
    },
  ];
}

/**
 * Returns risk factors prioritized according to user input.
 * Pure function.
 */
export function getRelevantRisks(answers: UserAssessmentInput): RiskFactor[] {
  const norm = normalizeAnswers(answers);
  const preferredCity = norm.preferredCityId;

  // Filter risks applicable to all or specifically to user preferred city
  return riskFactors.filter((rf) =>
    rf.applicableCities.includes('all') || rf.applicableCities.includes(preferredCity)
  );
}

/**
 * Collects and deduplicates all sources referenced across cost, cities, and risks for the assessment.
 * Pure function.
 */
export function collectAllSources(answers: UserAssessmentInput): Source[] {
  const envelope = computeCostEnvelope(answers);
  const rankedCities = rankCities(answers);
  const risks = getRelevantRisks(answers);

  const pool: Source[] = [
    ...envelope.sources,
    ...rankedCities.flatMap((c) => c.sources),
    ...risks.flatMap((r) => r.sources),
  ];

  return pool.filter(
    (src, idx, arr) => arr.findIndex((s) => s.name === src.name && s.year === src.year) === idx
  );
}
