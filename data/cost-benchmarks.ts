import type { CostBenchmark, EntitySetupCostBenchmark, OfficeCostBenchmark, SalaryBand, Source } from './types.ts';

const nasscomCompensation2023: Source = {
  name: 'NASSCOM-Aon',
  reportTitle: 'GCC Total Rewards and Compensation Study 2023-24',
  year: 2023,
  url: 'https://nasscom.in/knowledge-center/publications/gcc-compensation-study-2023',
};

const michaelPage2024: Source = {
  name: 'Michael Page India',
  reportTitle: 'India GCC Salary Benchmark Report 2024',
  year: 2024,
  url: 'https://www.michaelpage.co.in/salary-guide/gcc-technology',
};

const knightFrankOfficeReport: Source = {
  name: 'Knight Frank India',
  reportTitle: 'India Real Estate: Office Market Review H2 2023',
  year: 2023,
  url: 'https://www.knightfrank.co.in/research/india-real-estate-office-market-review-h2-2023',
};

const deloitteSetupBenchmarking: Source = {
  name: 'Deloitte India',
  reportTitle: 'Setting Up a Global Capability Centre in India: Operating Models & Cost Economics',
  year: 2023,
  url: 'https://www.deloitte.com/in/en/pages/consulting/articles/setting-up-gcc-operating-models.html',
};

export const salaryBands: SalaryBand[] = [
  // --- Bengaluru ---
  {
    functionId: 'software-engineering',
    cityId: 'bengaluru',
    level: 'Junior (0-3y)',
    minLpa: 8.5,
    medianLpa: 13.5,
    maxLpa: 16.5,
    sources: [nasscomCompensation2023, michaelPage2024],
  },
  {
    functionId: 'software-engineering',
    cityId: 'bengaluru',
    level: 'Mid (3-7y)',
    minLpa: 16.0,
    medianLpa: 22.0,
    maxLpa: 28.0,
    sources: [nasscomCompensation2023, michaelPage2024],
  },
  {
    functionId: 'software-engineering',
    cityId: 'bengaluru',
    level: 'Senior (7-12y)',
    minLpa: 26.0,
    medianLpa: 38.0,
    maxLpa: 48.0,
    sources: [nasscomCompensation2023, michaelPage2024],
  },
  {
    functionId: 'software-engineering',
    cityId: 'bengaluru',
    level: 'Lead/Principal (12y+)',
    minLpa: 45.0,
    medianLpa: 60.0,
    maxLpa: 80.0,
    sources: [nasscomCompensation2023, michaelPage2024],
  },
  {
    functionId: 'data-ai',
    cityId: 'bengaluru',
    level: 'Junior (0-3y)',
    minLpa: 9.5,
    medianLpa: 15.0,
    maxLpa: 18.0,
    sources: [michaelPage2024],
  },
  {
    functionId: 'data-ai',
    cityId: 'bengaluru',
    level: 'Senior (7-12y)',
    minLpa: 28.0,
    medianLpa: 42.0,
    maxLpa: 55.0,
    sources: [michaelPage2024],
  },

  // --- Hyderabad ---
  {
    functionId: 'software-engineering',
    cityId: 'hyderabad',
    level: 'Junior (0-3y)',
    minLpa: 7.5,
    medianLpa: 11.5,
    maxLpa: 14.5,
    sources: [nasscomCompensation2023, michaelPage2024],
  },
  {
    functionId: 'software-engineering',
    cityId: 'hyderabad',
    level: 'Mid (3-7y)',
    minLpa: 14.0,
    medianLpa: 18.5,
    maxLpa: 24.0,
    sources: [nasscomCompensation2023, michaelPage2024],
  },
  {
    functionId: 'software-engineering',
    cityId: 'hyderabad',
    level: 'Senior (7-12y)',
    minLpa: 22.0,
    medianLpa: 32.5,
    maxLpa: 42.0,
    sources: [nasscomCompensation2023, michaelPage2024],
  },
  {
    functionId: 'software-engineering',
    cityId: 'hyderabad',
    level: 'Lead/Principal (12y+)',
    minLpa: 40.0,
    medianLpa: 52.0,
    maxLpa: 68.0,
    sources: [nasscomCompensation2023, michaelPage2024],
  },
  {
    functionId: 'data-ai',
    cityId: 'hyderabad',
    level: 'Junior (0-3y)',
    minLpa: 8.5,
    medianLpa: 12.8,
    maxLpa: 16.0,
    sources: [michaelPage2024],
  },
  {
    functionId: 'data-ai',
    cityId: 'hyderabad',
    level: 'Senior (7-12y)',
    minLpa: 25.0,
    medianLpa: 36.0,
    maxLpa: 48.0,
    sources: [michaelPage2024],
  },

  // --- Pune ---
  {
    functionId: 'software-engineering',
    cityId: 'pune',
    level: 'Junior (0-3y)',
    minLpa: 7.0,
    medianLpa: 10.5,
    maxLpa: 13.5,
    sources: [nasscomCompensation2023],
  },
  {
    functionId: 'software-engineering',
    cityId: 'pune',
    level: 'Mid (3-7y)',
    minLpa: 13.0,
    medianLpa: 17.0,
    maxLpa: 22.0,
    sources: [nasscomCompensation2023],
  },
  {
    functionId: 'software-engineering',
    cityId: 'pune',
    level: 'Senior (7-12y)',
    minLpa: 20.0,
    medianLpa: 29.5,
    maxLpa: 38.0,
    sources: [nasscomCompensation2023],
  },
  {
    functionId: 'software-engineering',
    cityId: 'pune',
    level: 'Lead/Principal (12y+)',
    minLpa: 36.0,
    medianLpa: 48.0,
    maxLpa: 62.0,
    sources: [nasscomCompensation2023],
  },

  // --- Chennai ---
  {
    functionId: 'software-engineering',
    cityId: 'chennai',
    level: 'Junior (0-3y)',
    minLpa: 6.8,
    medianLpa: 10.0,
    maxLpa: 13.0,
    sources: [nasscomCompensation2023],
  },
  {
    functionId: 'software-engineering',
    cityId: 'chennai',
    level: 'Senior (7-12y)',
    minLpa: 19.5,
    medianLpa: 28.5,
    maxLpa: 37.0,
    sources: [nasscomCompensation2023],
  },
  {
    functionId: 'finance-accounting',
    cityId: 'chennai',
    level: 'Junior (0-3y)',
    minLpa: 5.8,
    medianLpa: 8.5,
    maxLpa: 11.5,
    sources: [nasscomCompensation2023],
  },
  {
    functionId: 'finance-accounting',
    cityId: 'chennai',
    level: 'Senior (7-12y)',
    minLpa: 17.0,
    medianLpa: 24.0,
    maxLpa: 32.0,
    sources: [nasscomCompensation2023],
  },

  // --- NCR ---
  {
    functionId: 'software-engineering',
    cityId: 'ncr',
    level: 'Junior (0-3y)',
    minLpa: 7.8,
    medianLpa: 11.8,
    maxLpa: 15.0,
    sources: [nasscomCompensation2023],
  },
  {
    functionId: 'software-engineering',
    cityId: 'ncr',
    level: 'Senior (7-12y)',
    minLpa: 23.0,
    medianLpa: 33.0,
    maxLpa: 43.0,
    sources: [nasscomCompensation2023],
  },

  // --- Mumbai ---
  {
    functionId: 'software-engineering',
    cityId: 'mumbai',
    level: 'Junior (0-3y)',
    minLpa: 7.5,
    medianLpa: 11.0,
    maxLpa: 14.5,
    sources: [nasscomCompensation2023],
  },
  {
    functionId: 'software-engineering',
    cityId: 'mumbai',
    level: 'Senior (7-12y)',
    minLpa: 22.0,
    medianLpa: 31.0,
    maxLpa: 42.0,
    sources: [nasscomCompensation2023],
  },
  {
    functionId: 'finance-accounting',
    cityId: 'mumbai',
    level: 'Junior (0-3y)',
    minLpa: 7.0,
    medianLpa: 9.8,
    maxLpa: 13.5,
    sources: [nasscomCompensation2023],
  },
  {
    functionId: 'finance-accounting',
    cityId: 'mumbai',
    level: 'Senior (7-12y)',
    minLpa: 21.0,
    medianLpa: 28.5,
    maxLpa: 39.0,
    sources: [nasscomCompensation2023],
  },

  // --- Ahmedabad ---
  {
    functionId: 'software-engineering',
    cityId: 'ahmedabad',
    level: 'Junior (0-3y)',
    minLpa: 5.5,
    medianLpa: 7.8,
    maxLpa: 10.5,
    sources: [nasscomCompensation2023],
  },
  {
    functionId: 'software-engineering',
    cityId: 'ahmedabad',
    level: 'Senior (7-12y)',
    minLpa: 15.0,
    medianLpa: 22.0,
    maxLpa: 29.0,
    sources: [nasscomCompensation2023],
  },

  // --- Kochi ---
  {
    functionId: 'software-engineering',
    cityId: 'kochi',
    level: 'Junior (0-3y)',
    minLpa: 5.0,
    medianLpa: 7.5,
    maxLpa: 10.0,
    sources: [nasscomCompensation2023],
  },
  {
    functionId: 'software-engineering',
    cityId: 'kochi',
    level: 'Senior (7-12y)',
    minLpa: 14.5,
    medianLpa: 21.0,
    maxLpa: 28.0,
    sources: [nasscomCompensation2023],
  },
];

export const officeBenchmarks: OfficeCostBenchmark[] = [
  {
    cityId: 'bengaluru',
    model: 'Coworking / Hot Desk',
    monthlyCostPerSeatInr: { min: 8500, median: 11000, max: 15000 },
    fitoutCostPerSeatOneTimeInr: 0,
    lockInPeriodMonths: 3,
    sources: [knightFrankOfficeReport],
  },
  {
    cityId: 'bengaluru',
    model: 'Dedicated Managed Space',
    monthlyCostPerSeatInr: { min: 11500, median: 14500, max: 19500 },
    fitoutCostPerSeatOneTimeInr: 15000,
    lockInPeriodMonths: 12,
    sources: [knightFrankOfficeReport],
  },
  {
    cityId: 'bengaluru',
    model: 'Custom Enterprise Lease',
    monthlyCostPerSeatInr: { min: 7500, median: 9500, max: 13000 },
    fitoutCostPerSeatOneTimeInr: 65000,
    lockInPeriodMonths: 36,
    sources: [knightFrankOfficeReport],
  },
  {
    cityId: 'hyderabad',
    model: 'Coworking / Hot Desk',
    monthlyCostPerSeatInr: { min: 7000, median: 9200, max: 12500 },
    fitoutCostPerSeatOneTimeInr: 0,
    lockInPeriodMonths: 3,
    sources: [knightFrankOfficeReport],
  },
  {
    cityId: 'hyderabad',
    model: 'Dedicated Managed Space',
    monthlyCostPerSeatInr: { min: 9500, median: 12000, max: 16000 },
    fitoutCostPerSeatOneTimeInr: 12000,
    lockInPeriodMonths: 12,
    sources: [knightFrankOfficeReport],
  },
  {
    cityId: 'pune',
    model: 'Coworking / Hot Desk',
    monthlyCostPerSeatInr: { min: 6500, median: 8500, max: 11500 },
    fitoutCostPerSeatOneTimeInr: 0,
    lockInPeriodMonths: 3,
    sources: [knightFrankOfficeReport],
  },
  {
    cityId: 'chennai',
    model: 'Coworking / Hot Desk',
    monthlyCostPerSeatInr: { min: 6000, median: 8000, max: 11000 },
    fitoutCostPerSeatOneTimeInr: 0,
    lockInPeriodMonths: 3,
    sources: [knightFrankOfficeReport],
  },
  {
    cityId: 'ncr',
    model: 'Coworking / Hot Desk',
    monthlyCostPerSeatInr: { min: 7500, median: 10200, max: 14000 },
    fitoutCostPerSeatOneTimeInr: 0,
    lockInPeriodMonths: 3,
    sources: [knightFrankOfficeReport],
  },
  {
    cityId: 'mumbai',
    model: 'Coworking / Hot Desk',
    monthlyCostPerSeatInr: { min: 10000, median: 13500, max: 21000 },
    fitoutCostPerSeatOneTimeInr: 0,
    lockInPeriodMonths: 3,
    sources: [knightFrankOfficeReport],
  },
  {
    cityId: 'ahmedabad',
    model: 'Coworking / Hot Desk',
    monthlyCostPerSeatInr: { min: 4500, median: 6000, max: 8500 },
    fitoutCostPerSeatOneTimeInr: 0,
    lockInPeriodMonths: 3,
    sources: [knightFrankOfficeReport],
  },
  {
    cityId: 'kochi',
    model: 'Coworking / Hot Desk',
    monthlyCostPerSeatInr: { min: 4000, median: 5500, max: 7500 },
    fitoutCostPerSeatOneTimeInr: 0,
    lockInPeriodMonths: 3,
    sources: [knightFrankOfficeReport],
  },
];

export const entitySetupBenchmarks: EntitySetupCostBenchmark[] = [
  {
    route: 'Direct Subsidiary (Wholly Owned)',
    setupCostInrLakhsRange: {
      min: 15.0, // Realistic ₹15-30 lakhs setup cost
      max: 30.0,
    },
    setupTimeMonthsRange: {
      min: 3.0, // Realistic 3-6 months
      max: 6.0,
    },
    ongoingManagementCostModel: 'Annual statutory audit, ROC filings, Transfer Pricing certification & secretarial compliance',
    ongoingPercentageMarkup: null,
    annualComplianceCostInrLakhs: 8.5,
    minimumHeadcountRecommended: 40,
    sources: [deloitteSetupBenchmarking],
  },
  {
    route: 'Employer of Record (EOR)',
    setupCostInrLakhsRange: {
      min: 1.5,
      max: 3.5,
    },
    setupTimeMonthsRange: {
      min: 0.25, // 1-2 weeks
      max: 0.75,
    },
    ongoingManagementCostModel: '15% to 25% monthly management fee markup on gross salary compensation',
    ongoingPercentageMarkup: 0.18, // 18% median markup in 15-25% range
    annualComplianceCostInrLakhs: null, // Absorbed by EOR vendor
    minimumHeadcountRecommended: 1,
    sources: [deloitteSetupBenchmarking],
  },
  {
    route: 'BOT (Build-Operate-Transfer)',
    setupCostInrLakhsRange: {
      min: 25.0,
      max: 45.0,
    },
    setupTimeMonthsRange: {
      min: 4.0,
      max: 8.0,
    },
    ongoingManagementCostModel: 'Cost-plus margin (12% - 18%) plus pre-agreed transfer multiple upon maturity at month 24-36',
    ongoingPercentageMarkup: 0.14,
    annualComplianceCostInrLakhs: 5.0,
    minimumHeadcountRecommended: 50,
    sources: [deloitteSetupBenchmarking],
  },
];

export const costBenchmarks: CostBenchmark = {
  salaryBands,
  officeBenchmarks,
  setupModels: entitySetupBenchmarks,
  sources: [
    nasscomCompensation2023,
    michaelPage2024,
    knightFrankOfficeReport,
    deloitteSetupBenchmarking,
  ],
};

