import type { GCCCount, GCCCountEstimate, Source } from './types.ts';

export const sourcesRegistry = {
  nasscomZinnov2023: {
    name: 'NASSCOM & Zinnov',
    reportTitle: 'GCC India 4.0: India GCC Landscape 2023',
    year: 2023,
    date: '2023',
    url: 'https://nasscom.in/knowledge-center/publications/gcc-india-40-india-gcc-landscape-2023',
    notes: 'Counts operational GCC centers operating distinct functional charters; includes parent company footprints with dedicated physical delivery footprints.',
    note: 'Counts operational GCC centers operating distinct functional charters; includes parent company footprints with dedicated physical delivery footprints.',
  } satisfies Source,
  deloitte2023: {
    name: 'Deloitte India',
    reportTitle: 'GCC India Pulse: Strategic Shifts in the GCC Landscape',
    year: 2023,
    date: '2023',
    url: 'https://www.deloitte.com/in/en/pages/consulting/articles/gcc-pulse-survey.html',
    notes: 'Restricts GCC count to direct corporate entities with legal entity registration in India; excludes hybrid vendor-run captives.',
    note: 'Restricts GCC count to direct corporate entities with legal entity registration in India; excludes hybrid vendor-run captives.',
  } satisfies Source,
  ansr2024: {
    name: 'ANSR',
    reportTitle: 'State of the GCC Market Q4 2023 / FY24 Outlook',
    year: 2024,
    date: 'Q4 2023',
    url: 'https://ansr.com/resources/gcc-reports/quarterly-market-update/',
    notes: 'Counts distinct global capability units, including expansion centers and satellite hubs of existing parent corporations.',
    note: 'Counts distinct global capability units, including expansion centers and satellite hubs of existing parent corporations.',
  } satisfies Source,
  ey2023: {
    name: 'EY India',
    reportTitle: 'GCCs in India: Building Future-Ready Global Enterprises',
    year: 2023,
    date: '2023',
    url: 'https://www.ey.com/en_in/technology-consulting/gcc-landscape-india',
    notes: 'Focuses on parent firms registered under Ministry of Corporate Affairs with dedicated captive services classification.',
    note: 'Focuses on parent firms registered under Ministry of Corporate Affairs with dedicated captive services classification.',
  } satisfies Source,
};

/**
 * GCC Counts array used by DiscrepancyHero table and methodology page
 */
export const gccCounts: GCCCount[] = [
  {
    sourceName: 'Deloitte India',
    count: 1430,
    asOfDate: '2023',
    methodologyNote: 'Counts active parent corporate entities registered as wholly owned foreign enterprises (WOFE). Excludes vendor-operated BOTs.',
    includes: [
      'Wholly owned direct subsidiaries registered under MCA',
      'Captive tech, engineering, and shared-services centers',
      'Entities with parent equity ownership > 51%',
    ],
    excludes: [
      'Third-party vendor BOT delivery centers',
      'Incubation co-working desks without distinct legal entity status',
      'Contract IT staff providers',
    ],
    sources: [sourcesRegistry.deloitte2023],
  },
  {
    sourceName: 'EY India',
    count: 1500,
    asOfDate: '2023',
    methodologyNote: 'Tracks multinational corporations with dedicated captive centers operating across Tier 1 and emerging hubs.',
    includes: [
      'Multinational captive delivery centers across Tier 1 & Tier 2',
      'Corporate shared services units (SSCs)',
      'Enterprise global capability centers',
    ],
    excludes: [
      'Domestic Indian IT services captives',
      'Freelance contractor pools',
    ],
    sources: [sourcesRegistry.ey2023],
  },
  {
    sourceName: 'NASSCOM / Zinnov',
    count: 1580,
    asOfDate: 'FY2023',
    methodologyNote: 'Counts discrete operational GCC centers across India. Multi-center parent enterprises with separate functional charters are counted per site.',
    includes: [
      'Discrete operational centers with distinct functional charters',
      'Multi-city delivery sites of single parent entities',
      'Global in-house engineering and R&D centers (ER&D)',
    ],
    excludes: [
      'Pure vendor-operated delivery centers (third-party IT services)',
      'Shared staff augmentation contracts',
    ],
    sources: [sourcesRegistry.nasscomZinnov2023],
  },
  {
    sourceName: 'ANSR',
    count: 1750,
    asOfDate: 'Q4 2023',
    methodologyNote: 'Comprehensive ecosystem footprint capturing primary corporate hubs, secondary satellite offices, and incubator micro-centers.',
    includes: [
      'Primary corporate capability hubs',
      'Tier-2 satellite innovation units and micro-centers',
      'Managed GCCs operating under structured BOT frameworks',
    ],
    excludes: [
      'Traditional IT body-shopping staffing accounts',
    ],
    sources: [sourcesRegistry.ansr2024],
  },
];

export const gccCountEstimates: GCCCountEstimate[] = [
  {
    source: sourcesRegistry.nasscomZinnov2023,
    totalCenters: 1580,
    totalTalentHeadcount: 1660000,
    marketSizeUsdBillions: 46.0,
    definitionScope: 'Operational GCC units across India, accounting for parent corporations operating distinct functional charters. Includes both single and multi-center footprints.',
    yearPublished: 2023,
  },
  {
    source: sourcesRegistry.deloitte2023,
    totalCenters: 1430,
    totalTalentHeadcount: 1510000,
    marketSizeUsdBillions: 42.5,
    definitionScope: 'Active wholly owned foreign enterprise subsidiaries (WOFE) categorized under information technology and business capability charters. Excludes contract vendor units.',
    yearPublished: 2023,
  },
  {
    source: sourcesRegistry.ansr2024,
    totalCenters: 1750,
    totalTalentHeadcount: 1800000,
    marketSizeUsdBillions: 52.0,
    definitionScope: 'Comprehensive capability footprint counting satellite centers, micro-hubs, and incubator centers alongside primary corporate hubs.',
    yearPublished: 2024,
  },
  {
    source: sourcesRegistry.ey2023,
    totalCenters: 1500,
    totalTalentHeadcount: null,
    marketSizeUsdBillions: 43.8,
    definitionScope: 'Foreign parent multinational firms operating captive centers in Tier 1 and emerging Tier 2 tech hubs.',
    yearPublished: 2023,
  },
];
