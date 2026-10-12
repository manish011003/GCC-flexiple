import fs from 'node:fs';
import path from 'node:path';
import { CompanySchema } from '../lib/schema.ts';
import type { Company } from '../lib/schema.ts';

const APPROVALS_FILE = path.resolve(process.cwd(), 'data/approvals.json');
const CANDIDATES_FILE = path.resolve(process.cwd(), 'data/candidates.json');
const COMPANIES_FILE = path.resolve(process.cwd(), 'data/companies.json');

interface CandidateEntry {
  id: string;
  status: 'unverified' | 'approved' | 'rejected';
  collected_at: string;
  company: Company;
}

function parseApprovedIds(approvalsRaw: unknown): Set<string> {
  const approvedSet = new Set<string>();

  if (Array.isArray(approvalsRaw)) {
    for (const item of approvalsRaw) {
      if (typeof item === 'string') {
        approvedSet.add(item.trim());
      } else if (item && typeof item === 'object') {
        if ('id' in item && ('approved' in item ? Boolean(item.approved) : true)) {
          approvedSet.add(String(item.id).trim());
        }
      }
    }
  } else if (approvalsRaw && typeof approvalsRaw === 'object') {
    for (const [key, value] of Object.entries(approvalsRaw)) {
      if (Boolean(value)) {
        approvedSet.add(key.trim());
      }
    }
  }

  return approvedSet;
}

function runPromotion() {
  console.log('🚀 Running Groundtruth Candidate Promotion Pipeline...\n');

  if (!fs.existsSync(APPROVALS_FILE)) {
    console.error(`Approvals file not found: ${APPROVALS_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(CANDIDATES_FILE)) {
    console.error(`Candidates file not found: ${CANDIDATES_FILE}`);
    process.exit(1);
  }

  // 1. Read approvals
  let approvalsRaw: unknown = [];
  try {
    approvalsRaw = JSON.parse(fs.readFileSync(APPROVALS_FILE, 'utf-8'));
  } catch (err) {
    console.error(`Failed to parse approvals.json: ${(err as Error).message}`);
    process.exit(1);
  }

  const approvedIds = parseApprovedIds(approvalsRaw);
  console.log(`Found ${approvedIds.size} approved ID(s) in data/approvals.json`);

  if (approvedIds.size === 0) {
    console.log('No approved candidates specified. To approve candidates, add their IDs to data/approvals.json.');
    console.log('Example data/approvals.json:');
    console.log('  [\n    "target-corporation",\n    "walmart-global-tech"\n  ]');
    process.exit(0);
  }

  // 2. Read candidates
  let candidates: CandidateEntry[] = [];
  try {
    candidates = JSON.parse(fs.readFileSync(CANDIDATES_FILE, 'utf-8'));
  } catch (err) {
    console.error(`Failed to parse candidates.json: ${(err as Error).message}`);
    process.exit(1);
  }

  const candidateMap = new Map<string, CandidateEntry>();
  for (const c of candidates) {
    candidateMap.set(c.id, c);
  }

  // 3. Read existing companies
  let existingCompanies: Company[] = [];
  if (fs.existsSync(COMPANIES_FILE)) {
    try {
      existingCompanies = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf-8'));
    } catch {
      existingCompanies = [];
    }
  }

  const existingCompanyMap = new Map<string, Company>();
  for (const c of existingCompanies) {
    existingCompanyMap.set(c.id, c);
  }

  let promotedCount = 0;
  const promotedList: string[] = [];

  // 4. Promote each approved candidate
  for (const approvedId of approvedIds) {
    const candidateEntry = candidateMap.get(approvedId);

    if (!candidateEntry) {
      console.warn(`⚠️  Approved ID "${approvedId}" not found in data/candidates.json — skipping.`);
      continue;
    }

    const companyToPromote = candidateEntry.company || candidateEntry;

    // Validate strictly against CompanySchema
    const parseResult = CompanySchema.safeParse(companyToPromote);
    if (!parseResult.success) {
      console.error(`❌ Validation failed for candidate "${approvedId}":`, parseResult.error.format());
      continue;
    }

    const validatedCompany = parseResult.data;

    // Add or update in companies table
    const isUpdate = existingCompanyMap.has(validatedCompany.id);
    existingCompanyMap.set(validatedCompany.id, validatedCompany);

    // Update candidate entry status
    candidateEntry.status = 'approved';

    promotedCount++;
    promotedList.push(validatedCompany.id);

    console.log(`  ✓ ${isUpdate ? 'Updated' : 'Promoted'}: "${validatedCompany.name}" (${validatedCompany.id}) [Tier ${validatedCompany.evidence_tier}]`);
  }

  // 5. Write back data/companies.json
  const finalCompaniesList = Array.from(existingCompanyMap.values());
  fs.writeFileSync(COMPANIES_FILE, JSON.stringify(finalCompaniesList, null, 2), 'utf-8');

  // 6. Write back updated candidates.json with approved statuses
  fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(candidates, null, 2), 'utf-8');

  console.log('\n----------------------------------------');
  console.log(`✅ Promotion Complete!`);
  console.log(`Promoted ${promotedCount} company record(s) into data/companies.json.`);
  console.log(`Total companies in database: ${finalCompaniesList.length}`);
  console.log(`Promoted IDs: ${promotedList.join(', ')}`);
}

runPromotion();
