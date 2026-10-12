export interface Source {
  name: string;
  reportTitle: string;
  year: number;
  date?: string; // e.g. "2023", "Q4 2023"
  url: string | null;
  notes?: string;
  note?: string; // alias for notes
}

export interface GCCCount {
  sourceName: string;
  count: number;
  asOfDate?: string;
  methodologyNote: string;
  includes?: string[];
  excludes?: string[];
  sources: Source[];
}

export interface GCCCountEstimate {
  source: Source;
  totalCenters: number | null;
  totalTalentHeadcount: number | null; // e.g. 1.66M
  marketSizeUsdBillions: number | null; // e.g. 46.0B
  definitionScope: string;
  yearPublished: number;
}

export interface FunctionTalentRating {
  functionId: string; // matches FunctionType.id e.g. "software-engineering"
  depthScore: number; // 1 to 10 scale
  medianSalaryLpa: {
    junior: number | null;
    mid: number | null;
    senior: number | null;
    lead: number | null;
  };
  talentAvailabilityIndex: 'High' | 'Moderate' | 'Constrained' | null;
  sources: Source[];
}

export interface CityProfile {
  id: string; // e.g. "bengaluru", "hyderabad", etc.
  name: string;
  tier: 'Tier 1' | 'Tier 2';
  state: string;
  overview: string;
  infraScore: number; // Scale 1 - 10
  commercialRealEstateAvgSqFtMonthlyInr: number | null;
  officeSeatMonthlyInr: {
    coworking: number | null;
    managedOffice: number | null;
    traditionalLease: number | null;
  };
  attritionRateAnnualPercent: number | null;
  functionTalent: FunctionTalentRating[];
  airportConnectivity: 'High' | 'Moderate' | 'Limited';
  techEcosystemMaturity: 'Pioneer' | 'Established' | 'Emerging';
  sources: Source[];
}

export interface FunctionType {
  id: string;
  name: string;
  category: 'Engineering & Tech' | 'Data & Analytics' | 'Business Operations' | 'Corporate Functions';
  description: string;
  typicalSubRoles: string[];
  nationalMedianSalaryLpa: {
    junior: number | null;
    mid: number | null;
    senior: number | null;
    lead: number | null;
  };
  sources: Source[];
}

export interface SalaryBand {
  functionId: string;
  cityId: string;
  level: 'Junior (0-3y)' | 'Mid (3-7y)' | 'Senior (7-12y)' | 'Lead/Principal (12y+)';
  minLpa: number | null;
  medianLpa: number | null;
  maxLpa: number | null;
  sources: Source[];
}

export interface EntitySetupCostBenchmark {
  route: 'Direct Subsidiary (Wholly Owned)' | 'Employer of Record (EOR)' | 'BOT (Build-Operate-Transfer)';
  setupCostInrLakhsRange: {
    min: number | null;
    max: number | null;
  };
  setupTimeMonthsRange: {
    min: number | null;
    max: number | null;
  };
  ongoingManagementCostModel: string;
  ongoingPercentageMarkup: number | null;
  annualComplianceCostInrLakhs: number | null;
  minimumHeadcountRecommended: number;
  sources: Source[];
}

export interface OfficeCostBenchmark {
  cityId: string;
  model: 'Coworking / Hot Desk' | 'Dedicated Managed Space' | 'Custom Enterprise Lease';
  monthlyCostPerSeatInr: {
    min: number;
    median: number;
    max: number;
  };
  fitoutCostPerSeatOneTimeInr: number | null;
  lockInPeriodMonths: number | null;
  sources: Source[];
}

export interface CostBenchmark {
  salaryBands: SalaryBand[];
  officeBenchmarks: OfficeCostBenchmark[];
  setupModels: EntitySetupCostBenchmark[];
  sources: Source[];
}

export interface RiskFactor {
  id: string;
  category: 'Regulatory & Compliance' | 'Attrition & Poaching' | 'IP & Data Protection' | 'Talent War & Wage Inflation' | 'Infrastructure & Mobility';
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  impactOnGCC: string;
  mitigationTactics: string[];
  applicableCities: string[]; // ['all'] or list of cityIds
  sources: Source[];
}

export interface QuestionnaireAnswers {
  companySize?: string;
  primaryFunction?: string;
  teamSize?: string;
  timeline?: string;
  priority?: string;
}

export interface UserAssessmentInput {
  targetFunctions?: string[];
  targetHeadcount?: number;
  preferredCities?: string[];
  setupModelPreference?: 'Direct Subsidiary (Wholly Owned)' | 'Employer of Record (EOR)' | 'BOT (Build-Operate-Transfer)';
  experienceMix?: {
    juniorPercent: number;
    midPercent: number;
    seniorPercent: number;
    leadPercent: number;
  };
  officeModel?: 'Coworking / Hot Desk' | 'Dedicated Managed Space' | 'Custom Enterprise Lease';
  // Questionnaire fields
  companySize?: string;
  primaryFunction?: string;
  teamSize?: string;
  timeline?: string;
  priority?: string;
}

export interface CostEnvelopeResult {
  headcount: number;
  annualSalaryCostInrLakhs: {
    min: number;
    median: number;
    max: number;
  };
  annualOfficeCostInrLakhs: {
    min: number;
    median: number;
    max: number;
  };
  initialSetupCostInrLakhs: {
    min: number;
    max: number;
  };
  annualTotalEstimatedInrLakhs: {
    min: number;
    median: number;
    max: number;
  };
  estimatedSetupTimelineMonths: {
    min: number;
    max: number;
  };
  setupModelSelected: string;
  methodologyNotes: string;
  sources: Source[];
}

export interface CityRankResult {
  cityId: string;
  cityName: string;
  overallFitScore: number;
  talentDepthScore: number;
  costEfficiencyScore: number;
  infrastructureScore: number;
  attritionRiskScore: number;
  rank: number;
  summaryRationale: string;
  sources: Source[];
}

export interface DiscrepancySummaryItem {
  metric: string;
  sourceA: {
    name: string;
    value: string | number;
    report: string;
    scope: string;
  };
  sourceB: {
    name: string;
    value: string | number;
    report: string;
    scope: string;
  };
  deltaExplanation: string;
}
