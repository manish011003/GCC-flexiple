import fs from 'node:fs';
import path from 'node:path';
import { ZodError, z } from 'zod';
import {
  CitySchema,
  CompanySchema,
  CostAssumptionSchema,
  CountClaimSchema,
  CountPurposeSchema,
  SetupStepSchema,
  SourceRecordSchema,
  StallReasonSchema,
  StateSchema,
} from '../lib/schema.ts';
import type { SetupStep } from '../lib/schema.ts';

interface ValidationConfig {
  filename: string;
  schema: z.ZodTypeAny;
  name: string;
  isBaseRecord?: boolean; // records that require sources, evidence_tier, last_checked
}

const FILES_TO_VALIDATE: ValidationConfig[] = [
  { filename: 'companies.json', schema: CompanySchema, name: 'Companies', isBaseRecord: true },
  { filename: 'cities.json', schema: CitySchema, name: 'Cities', isBaseRecord: true },
  { filename: 'states.json', schema: StateSchema, name: 'States', isBaseRecord: true },
  { filename: 'cost_assumptions.json', schema: CostAssumptionSchema, name: 'Cost Assumptions', isBaseRecord: true },
  { filename: 'count_claims.json', schema: CountClaimSchema, name: 'Count Claims', isBaseRecord: true },
  { filename: 'sources.json', schema: SourceRecordSchema, name: 'Sources', isBaseRecord: true },
  { filename: 'setup_steps.json', schema: SetupStepSchema, name: 'Setup Steps', isBaseRecord: true },
  { filename: 'stall_reasons.json', schema: StallReasonSchema, name: 'Stall Reasons', isBaseRecord: true },
  { filename: 'count_purposes.json', schema: CountPurposeSchema, name: 'Count Purposes', isBaseRecord: false },
];

function isValidUrl(urlString: unknown): boolean {
  if (typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function checkSetupStepsGraph(
  steps: SetupStep[],
  errors: string[]
): void {
  const stepMap = new Map<string, SetupStep>();
  for (const step of steps) {
    stepMap.set(step.id, step);
  }

  // 1. Verify that all depends_on IDs exist
  for (const step of steps) {
    for (const depId of step.depends_on) {
      if (!stepMap.has(depId)) {
        errors.push(
          `[MISSING DEPENDENCY] Step "${step.id}" depends on non-existent step id "${depId}"`
        );
      }
      if (depId === step.id) {
        errors.push(
          `[CYCLE DETECTED] Step "${step.id}" depends on itself`
        );
      }
    }
  }

  // 2. Detect cycles using DFS with recursion stack
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const pathStack: string[] = [];

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    inStack.add(nodeId);
    pathStack.push(nodeId);

    const step = stepMap.get(nodeId);
    const dependencies = step?.depends_on || [];

    for (const depId of dependencies) {
      if (!stepMap.has(depId)) continue; // Handled by missing dependency check above

      if (!visited.has(depId)) {
        if (dfs(depId)) return true;
      } else if (inStack.has(depId)) {
        const cycleStartIndex = pathStack.indexOf(depId);
        const cyclePath = pathStack.slice(cycleStartIndex).concat(depId).join(' -> ');
        errors.push(`[CYCLE DETECTED] Dependency cycle detected in setup_steps: ${cyclePath}`);
        return true;
      }
    }

    inStack.delete(nodeId);
    pathStack.pop();
    return false;
  }

  for (const step of steps) {
    if (!visited.has(step.id)) {
      dfs(step.id);
    }
  }
}

function runValidation() {
  console.log('🔍 Running Groundtruth Data Layer Validation...\n');

  let hasError = false;
  const errors: string[] = [];
  const globalIdSet = new Set<string>();
  const countClaimIds = new Set<string>();

  const dataDir = path.resolve(process.cwd(), 'data');
  const parsedTables: Record<string, any[]> = {};

  // First pass: load and parse all files
  for (const config of FILES_TO_VALIDATE) {
    const filePath = path.join(dataDir, config.filename);

    if (!fs.existsSync(filePath)) {
      errors.push(`[MISSING FILE] Required data file not found: ${config.filename}`);
      hasError = true;
      continue;
    }

    let rawData: unknown;
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      rawData = JSON.parse(fileContent);
    } catch (err) {
      errors.push(`[JSON PARSE ERROR] Failed to parse ${config.filename}: ${(err as Error).message}`);
      hasError = true;
      continue;
    }

    if (!Array.isArray(rawData)) {
      errors.push(`[STRUCTURE ERROR] Root element in ${config.filename} must be an array`);
      hasError = true;
      continue;
    }

    parsedTables[config.filename] = rawData;
    console.log(`Checking ${config.name} (${config.filename}) -> ${rawData.length} records`);

    const fileIdSet = new Set<string>();

    for (let index = 0; index < rawData.length; index++) {
      const item = rawData[index];
      const recordContext = `${config.filename}[${index}] (id: ${item?.id || item?.purpose || 'record-' + index})`;

      // 1. ID checks
      if (item?.id) {
        if (fileIdSet.has(item.id)) {
          errors.push(`[DUPLICATE ID] Duplicate ID "${item.id}" detected in ${config.filename}`);
          hasError = true;
        } else {
          fileIdSet.add(item.id);
        }

        if (globalIdSet.has(item.id)) {
          errors.push(`[DUPLICATE ID] Duplicate global ID "${item.id}" already seen in another table`);
          hasError = true;
        } else {
          globalIdSet.add(item.id);
        }

        if (config.filename === 'count_claims.json') {
          countClaimIds.add(item.id);
        }
      } else if (config.isBaseRecord) {
        errors.push(`[MISSING ID] Missing required ID in ${recordContext}`);
        hasError = true;
      }

      // 2. Base Record: Sources array check
      if (config.isBaseRecord) {
        if (!Array.isArray(item?.sources) || item.sources.length === 0) {
          errors.push(`[MISSING SOURCES] Record must contain at least 1 source reference in ${recordContext}`);
          hasError = true;
        } else {
          for (let sIdx = 0; sIdx < item.sources.length; sIdx++) {
            const src = item.sources[sIdx];
            if (!src?.url || !isValidUrl(src.url)) {
              errors.push(`[MALFORMED URL] Invalid URL in source[${sIdx}] in ${recordContext}: ${src?.url}`);
              hasError = true;
            }
          }
        }

        // Evidence Tier check
        const validTiers = ['A', 'B', 'C'];
        if (!item?.evidence_tier || !validTiers.includes(item.evidence_tier)) {
          errors.push(`[BAD TIER] Invalid evidence_tier "${item?.evidence_tier}" in ${recordContext}. Expected 'A', 'B', or 'C'.`);
          hasError = true;
        }
      }

      // 3. Top-level URL check
      if ('url' in item && item.url) {
        if (!isValidUrl(item.url)) {
          errors.push(`[MALFORMED URL] Invalid top-level URL in ${recordContext}: ${item.url}`);
          hasError = true;
        }
      }

      // 4. Company route_source URL check
      if (config.filename === 'companies.json' && item?.route_source) {
        if (!isValidUrl(item.route_source.url)) {
          errors.push(`[MALFORMED URL] Invalid route_source URL in ${recordContext}: ${item.route_source.url}`);
          hasError = true;
        }
      }

      // 5. Cost Assumption unit check
      if (config.filename === 'cost_assumptions.json') {
        const unit = item?.unit;
        if (!unit || typeof unit !== 'string' || unit.trim().length === 0) {
          errors.push(`[NUMBER WITHOUT UNIT] Missing or empty unit for numbers in ${recordContext}`);
          hasError = true;
        }
      }

      // 6. Zod Schema parse
      const parseResult = config.schema.safeParse(item);
      if (!parseResult.success) {
        hasError = true;
        const zodErrors = (parseResult.error as ZodError).issues;
        for (const issue of zodErrors) {
          errors.push(`[SCHEMA ERROR] ${recordContext} -> ${issue.path.join('.')}: ${issue.message}`);
        }
      }
    }
  }

  // Cross-file validation: setup_steps graph validation (depends_on existence & cycle detection)
  const setupStepsData = parsedTables['setup_steps.json'];
  if (Array.isArray(setupStepsData) && setupStepsData.length > 0) {
    const graphErrors: string[] = [];
    checkSetupStepsGraph(setupStepsData as SetupStep[], graphErrors);
    if (graphErrors.length > 0) {
      hasError = true;
      errors.push(...graphErrors);
    }
  }

  // Cross-file validation: count_purposes -> recommended_claim_id must exist in count_claims.json
  const countPurposesData = parsedTables['count_purposes.json'];
  if (Array.isArray(countPurposesData) && countPurposesData.length > 0) {
    for (let i = 0; i < countPurposesData.length; i++) {
      const purposeItem = countPurposesData[i];
      if (purposeItem?.recommended_claim_id && !countClaimIds.has(purposeItem.recommended_claim_id)) {
        errors.push(
          `[INVALID CLAIM REFERENCE] count_purposes.json[${i}] (${purposeItem.purpose}) references non-existent claim ID "${purposeItem.recommended_claim_id}"`
        );
        hasError = true;
      }
    }
  }

  console.log('\n----------------------------------------');
  if (hasError) {
    console.error(`❌ Validation FAILED with ${errors.length} error(s):\n`);
    for (const err of errors) {
      console.error(` - ${err}`);
    }
    process.exit(1);
  } else {
    console.log('✅ Validation PASSED! All data files, schemas, sources, tiers, URLs, units, and dependency DAGs are valid.');
    process.exit(0);
  }
}

runValidation();
