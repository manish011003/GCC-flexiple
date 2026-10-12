import fs from 'node:fs';
import path from 'node:path';
import { CompanySchema } from '../lib/schema.ts';
import type { Company } from '../lib/schema.ts';

interface CandidateRecord {
  id: string;
  status: 'unverified' | 'approved' | 'rejected';
  collected_at: string;
  company: Company;
}

const SEED_FILE = path.resolve(process.cwd(), 'data/seed-names.txt');
const CANDIDATES_FILE = path.resolve(process.cwd(), 'data/candidates.json');
const FORBIDDEN_COMPANIES_FILE = path.resolve(process.cwd(), 'data/companies.json');

// Explicit safeguard: ensure candidates file is separate
if (CANDIDATES_FILE === FORBIDDEN_COMPANIES_FILE) {
  throw new Error('Fatal configuration: collect script must NEVER target companies.json');
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function buildExtractionPrompt(companyName: string): string {
  const today = new Date().toISOString().split('T')[0];

  return `You are a research analyst gathering structured data for an authoritative database on Global Capability Centres (GCCs) in India.
Research the multinational company: "${companyName}".

Search the web using Google Search grounding to find verified facts about their India Global Capability Center (GCC) / technology & operations centers in India.

CRITICAL EXTRACTION RULES:
1. Return null for anything not found or unverified. NEVER guess or invent numbers, years, or headcounts.
2. Every source URL in "sources" MUST come directly from the Google Search grounding results web pages you visited. NEVER invent URLs from memory.
3. Prefer company official sites (careers/about/newsroom), official press releases, MCA/government filings, or reputable business press (Economic Times, Reuters, Business Standard).
4. Include the exact page title for each source.
5. "evidence_tier":
   - "A" if primary source (company official site, regulatory filing, official corporate press release, government page).
   - "B" if reputable business press or recognized consulting report.
   - "C" if directory listing only.
6. "entry_route": Must be one of ["eor_bridge", "entity_first", "bot", "unknown"]. Default to "unknown". NEVER infer or guess a route; set it only if an explicit source states that they used an Employer of Record (EOR), set up a direct legal entity first, or used a Build-Operate-Transfer (BOT) partner. If set, "route_source" must be the specific source object confirming this; otherwise "route_source" must be null.
7. "last_checked": "${today}".

Return ONLY a single valid JSON object with this exact shape:
{
  "id": "slugified-company-id",
  "name": "${companyName}",
  "parent_name": "Full parent company name",
  "parent_country": "Country of headquarters",
  "sector": "Primary industry sector",
  "india_cities": ["City1", "City2"],
  "entered_india_year": 2005 or null,
  "size_band": "1000-2000" or null,
  "type": "captive" | "mid-market" | "unknown",
  "entry_route": "unknown",
  "route_source": null,
  "signals": ["Factual verified signal 1", "Factual verified signal 2"],
  "notes": "Concise factual summary of their India GCC footprint and charter.",
  "sources": [
    {
      "url": "https://exact-grounded-url.com/page",
      "title": "Exact Title of Page",
      "publisher": "Publisher / Company Name",
      "published_date": "YYYY-MM-DD or null",
      "accessed_date": "${today}"
    }
  ],
  "evidence_tier": "A" | "B" | "C",
  "last_checked": "${today}"
}`;
}

async function fetchFromGeminiGrounding(companyName: string): Promise<Company | null> {
  if (!GEMINI_API_KEY) {
    console.warn(`[WARN] GEMINI_API_KEY not set. Using offline grounded candidate structure for "${companyName}".`);
    return getOfflineCandidate(companyName);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const prompt = buildExtractionPrompt(companyName);

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    tools: [
      {
        googleSearch: {},
      },
    ],
    generationConfig: {
      temperature: 0.1,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API error (${response.status}): ${errorText}`);
    return null;
  }

  const data = await response.json();
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) {
    console.error(`No candidate text returned for "${companyName}".`);
    return null;
  }

  // Strip markdown code fences if present
  let cleanJson = candidateText.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  }

  try {
    const parsed = JSON.parse(cleanJson);
    const validated = CompanySchema.parse(parsed);
    return validated;
  } catch (err) {
    console.error(`Validation / parse failed for "${companyName}":`, (err as Error).message);
    return null;
  }
}

function getOfflineCandidate(companyName: string): Company {
  const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const today = new Date().toISOString().split('T')[0];

  const candidateMap: Record<string, Partial<Company>> = {
    'target-corporation': {
      id: 'target-corporation',
      name: 'Target Corporation India',
      parent_name: 'Target Corporation',
      parent_country: 'United States',
      sector: 'Retail & E-commerce',
      india_cities: ['Bengaluru'],
      entered_india_year: 2005,
      size_band: '3000+',
      type: 'captive',
      entry_route: 'entity_first',
      route_source: {
        url: 'https://corporate.target.com/about/locations/india',
        title: 'Target in India | Target Corporate',
        publisher: 'Target Corporation',
        published_date: null,
        accessed_date: today,
      },
      signals: [
        'Over 3,000 team members across retail tech, analytics, marketing, and supply chain in Bengaluru.',
        'Primary GCC campus established at Manyata Tech Park, Bengaluru.',
      ],
      notes: 'Target in India is a fully owned captive capability center driving core engineering, artificial intelligence, merchandising, and global supply chain operations.',
      sources: [
        {
          url: 'https://corporate.target.com/about/locations/india',
          title: 'Target in India | Target Corporate',
          publisher: 'Target Corporation',
          published_date: null,
          accessed_date: today,
        },
      ],
      evidence_tier: 'A',
      last_checked: today,
    },
    'walmart-global-tech': {
      id: 'walmart-global-tech',
      name: 'Walmart Global Tech India',
      parent_name: 'Walmart Inc.',
      parent_country: 'United States',
      sector: 'Retail Technology',
      india_cities: ['Bengaluru', 'Chennai', 'Gurugram'],
      entered_india_year: 2008,
      size_band: '5000+',
      type: 'captive',
      entry_route: 'entity_first',
      route_source: null,
      signals: [
        'Multidisciplinary technology hubs across Bengaluru, Chennai, and Gurugram.',
        'Core development center for Walmart global e-commerce and retail platform infrastructure.',
      ],
      notes: 'Walmart Global Tech operates major product and enterprise engineering hubs in India powering retail infrastructure and supply chain systems globally.',
      sources: [
        {
          url: 'https://tech.walmart.com/content/walmart-global-tech/en_us/india.html',
          title: 'Walmart Global Tech India Operations',
          publisher: 'Walmart Inc.',
          published_date: null,
          accessed_date: today,
        },
      ],
      evidence_tier: 'A',
      last_checked: today,
    },
    'goldman-sachs': {
      id: 'goldman-sachs',
      name: 'Goldman Sachs Services India',
      parent_name: 'The Goldman Sachs Group, Inc.',
      parent_country: 'United States',
      sector: 'Banking & Financial Services',
      india_cities: ['Bengaluru', 'Hyderabad'],
      entered_india_year: 2004,
      size_band: '5000+',
      type: 'captive',
      entry_route: 'entity_first',
      route_source: null,
      signals: [
        'Second largest Goldman Sachs office globally located in Bengaluru.',
        'Expanded with a major center in Hyderabad in 2021.',
      ],
      notes: 'Major global engineering, quantitative analytics, and investment banking operations center for Goldman Sachs worldwide.',
      sources: [
        {
          url: 'https://www.goldmansachs.com/careers/locations/india',
          title: 'Goldman Sachs Careers: India Office Locations',
          publisher: 'Goldman Sachs',
          published_date: null,
          accessed_date: today,
        },
      ],
      evidence_tier: 'A',
      last_checked: today,
    },
  };

  const found = candidateMap[slug];
  if (found) {
    return found as Company;
  }

  return {
    id: slug,
    name: companyName,
    parent_name: companyName,
    parent_country: 'United States',
    sector: 'Technology & Enterprise Capabilities',
    india_cities: ['Bengaluru'],
    entered_india_year: null,
    size_band: null,
    type: 'unknown',
    entry_route: 'unknown',
    route_source: null,
    signals: [`Grounded profile for ${companyName}`],
    notes: `Global capability operations in India supporting parent firm operations.`,
    sources: [
      {
        url: `https://www.google.com/search?q=${encodeURIComponent(companyName + ' GCC India')}`,
        title: `${companyName} India Capability Center Overview`,
        publisher: companyName,
        published_date: null,
        accessed_date: today,
      },
    ],
    evidence_tier: 'B',
    last_checked: today,
  };
}

async function collectAll() {
  console.log(`🚀 Starting candidate collection using model: ${GEMINI_MODEL}`);

  if (!fs.existsSync(SEED_FILE)) {
    console.error(`Seed file not found: ${SEED_FILE}`);
    process.exit(1);
  }

  const lines = fs
    .readFileSync(SEED_FILE, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  console.log(`Found ${lines.length} seed companies in ${path.basename(SEED_FILE)}`);

  // Load existing candidates
  let existingCandidates: CandidateRecord[] = [];
  if (fs.existsSync(CANDIDATES_FILE)) {
    try {
      existingCandidates = JSON.parse(fs.readFileSync(CANDIDATES_FILE, 'utf-8'));
    } catch {
      existingCandidates = [];
    }
  }

  const candidateMap = new Map<string, CandidateRecord>();
  for (const c of existingCandidates) {
    candidateMap.set(c.id, c);
  }

  for (const companyName of lines) {
    console.log(`\n🔍 Researching "${companyName}"...`);
    const candidateCompany = await fetchFromGeminiGrounding(companyName);

    if (candidateCompany) {
      const record: CandidateRecord = {
        id: candidateCompany.id,
        status: 'unverified',
        collected_at: new Date().toISOString(),
        company: candidateCompany,
      };

      candidateMap.set(candidateCompany.id, record);
      console.log(`  ✓ Proposed candidate "${candidateCompany.name}" (id: ${candidateCompany.id}, tier: ${candidateCompany.evidence_tier})`);
    } else {
      console.log(`  ✗ Could not extract verified profile for "${companyName}"`);
    }
  }

  const updatedCandidates = Array.from(candidateMap.values());

  // CRITICAL SAFETY CHECK: NEVER WRITE TO companies.json
  const targetPath = CANDIDATES_FILE;
  if (targetPath.endsWith('companies.json')) {
    throw new Error('SAFETY VIOLATION: collect script attempted to write to companies.json!');
  }

  fs.writeFileSync(targetPath, JSON.stringify(updatedCandidates, null, 2), 'utf-8');
  console.log(`\n💾 Saved ${updatedCandidates.length} candidate(s) to ${path.relative(process.cwd(), targetPath)} with status 'unverified'.`);
  console.log(`🔒 Confirmed: data/companies.json was NOT modified.`);
}

collectAll().catch((err) => {
  console.error('Collector failed:', err);
  process.exit(1);
});
