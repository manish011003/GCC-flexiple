import { z } from 'zod';

export const EvidenceTierEnum = z.enum(['A', 'B', 'C']);
export type EvidenceTier = z.infer<typeof EvidenceTierEnum>;

export const SourceReferenceSchema = z.object({
  url: z.string().url({ message: 'Source reference URL must be a valid URL' }),
  title: z.string().min(1, { message: 'Title is required' }),
  publisher: z.string().min(1, { message: 'Publisher is required' }),
  published_date: z.string().nullable(),
  accessed_date: z.string().min(1, { message: 'Accessed date is required' }),
});
export type SourceReference = z.infer<typeof SourceReferenceSchema>;

export const BaseRecordSchema = z.object({
  sources: z
    .array(SourceReferenceSchema)
    .min(1, { message: 'Every record must contain at least 1 source reference' }),
  evidence_tier: EvidenceTierEnum,
  last_checked: z.string().min(1, { message: 'last_checked is required' }),
});

export const EntryRouteEnum = z.enum(['eor_bridge', 'entity_first', 'bot', 'unknown']);
export type EntryRoute = z.infer<typeof EntryRouteEnum>;

export const CompanySchema = BaseRecordSchema.extend({
  id: z.string().min(1, { message: 'id is required' }),
  name: z.string().min(1, { message: 'name is required' }),
  parent_name: z.string().min(1, { message: 'parent_name is required' }),
  parent_country: z.string().min(1, { message: 'parent_country is required' }),
  sector: z.string().min(1, { message: 'sector is required' }),
  india_cities: z.array(z.string()),
  entered_india_year: z.number().int().nullable(),
  size_band: z.string().nullable(),
  type: z.enum(['captive', 'mid-market', 'unknown']),
  entry_route: EntryRouteEnum.default('unknown'),
  route_source: SourceReferenceSchema.nullable().default(null),
  signals: z.array(z.string()),
  notes: z.string(),
});
export type Company = z.infer<typeof CompanySchema>;

export const CitySchema = BaseRecordSchema.extend({
  id: z.string().min(1, { message: 'id is required' }),
  name: z.string().min(1, { message: 'name is required' }),
  state: z.string().min(1, { message: 'state is required' }),
  talent_depth_1to5: z.number().min(1).max(5),
  rent_inr_sqft_month: z.object({
    low: z.number().positive({ message: 'Rent low must be positive' }),
    high: z.number().positive({ message: 'Rent high must be positive' }),
  }),
  salary_index: z.record(z.string(), z.number()),
  clusters: z.array(z.string()),
  notes: z.string(),
});
export type City = z.infer<typeof CitySchema>;

export const StateIncentiveSchema = z.object({
  type: z.string().min(1, { message: 'Incentive type is required' }),
  amount_text: z.string().min(1, { message: 'amount_text is required' }),
  min_headcount: z.number().int().positive().nullable(),
  min_capex_inr: z.number().positive().nullable(),
  cap_text: z.string().nullable(),
  duration_years: z.number().positive().nullable(),
  conditions_text: z.string().min(1, { message: 'conditions_text is required' }),
  headline_vs_reality: z.string().min(1, { message: 'headline_vs_reality note is required' }),
  conditions: z.string().optional(),
});
export type StateIncentive = z.infer<typeof StateIncentiveSchema>;

export const StateSchema = BaseRecordSchema.extend({
  id: z.string().min(1, { message: 'id is required' }),
  policy_name: z.string().min(1, { message: 'policy_name is required' }),
  period: z.string().min(1, { message: 'period is required' }),
  incentives: z.array(StateIncentiveSchema),
});
export type State = z.infer<typeof StateSchema>;

export const CostAssumptionSchema = BaseRecordSchema.extend({
  id: z.string().min(1, { message: 'id is required' }),
  label: z.string().min(1, { message: 'label is required' }),
  low: z.number(),
  base: z.number(),
  high: z.number(),
  unit: z.string().min(1, { message: 'Numbers must have a non-empty unit' }),
  applies_to: z.string().min(1, { message: 'applies_to is required' }),
});
export type CostAssumption = z.infer<typeof CostAssumptionSchema>;

export const CountClaimScopeEnum = z.enum([
  'India-only',
  'Global',
  'Directory coverage',
]);

export const CountClaimUnitEnum = z.enum([
  'centres',
  'parent_entities',
  'sites',
  'unknown',
]);
export type CountClaimUnit = z.infer<typeof CountClaimUnitEnum>;

export const CountClaimSchema = BaseRecordSchema.extend({
  id: z.string().min(1, { message: 'id is required' }),
  source_name: z.string().min(1, { message: 'source_name is required' }),
  number: z.number().int().positive({ message: 'Count number must be a positive integer' }),
  scope: CountClaimScopeEnum,
  unit: CountClaimUnitEnum.default('centres'),
  what_is_counted: z.string().min(1, { message: 'what_is_counted is required' }),
  as_of: z.string().min(1, { message: 'as_of is required' }),
  published_year: z.number().int().nullable().default(null),
  who_pays: z.string().min(1, { message: 'who_pays is required' }),
  url: z.string().url({ message: 'url must be a valid URL' }),
});
export type CountClaim = z.infer<typeof CountClaimSchema>;

export const SourceRecordSchema = BaseRecordSchema.extend({
  id: z.string().min(1, { message: 'id is required' }),
  publisher: z.string().min(1, { message: 'publisher is required' }),
  type: z.string().min(1, { message: 'type is required' }),
  who_pays: z.string().min(1, { message: 'who_pays is required' }),
  bias_note: z.string().min(1, { message: 'bias_note is required' }),
  url: z.string().url({ message: 'url must be a valid URL' }),
});
export type SourceRecord = z.infer<typeof SourceRecordSchema>;

export const SetupOwnerTypeEnum = z.enum(['legal', 'finance', 'real_estate', 'hr', 'it']);
export type SetupOwnerType = z.infer<typeof SetupOwnerTypeEnum>;

export const SetupStepSchema = BaseRecordSchema.extend({
  id: z.string().min(1, { message: 'id is required' }),
  name: z.string().min(1, { message: 'name is required' }),
  depends_on: z.array(z.string()),
  duration_weeks: z.object({
    low: z.number().nonnegative(),
    base: z.number().nonnegative(),
    high: z.number().nonnegative(),
  }),
  owner_type: SetupOwnerTypeEnum,
  common_blocker: z.string().nullable(),
  sources: z.array(SourceReferenceSchema).min(1, { message: 'At least 1 source is required' }),
});
export type SetupStep = z.infer<typeof SetupStepSchema>;

export const StallReasonSchema = BaseRecordSchema.extend({
  id: z.string().min(1, { message: 'id is required' }),
  reason: z.string().min(1, { message: 'reason is required' }),
  applies_to: z.string().nullable(),
  evidence_text: z.string().min(1, { message: 'evidence_text is required' }),
  sources: z.array(SourceReferenceSchema).min(1, { message: 'At least 1 source is required' }),
});
export type StallReason = z.infer<typeof StallReasonSchema>;

export const CountPurposeEnum = z.enum([
  'benchmark peers',
  'size the market',
  'find hiring pools',
  'cite in a board memo',
]);
export type CountPurpose = z.infer<typeof CountPurposeEnum>;

export const CountPurposeSchema = z.object({
  id: z.string().optional(),
  purpose: CountPurposeEnum,
  recommended_claim_id: z.string().min(1, { message: 'recommended_claim_id is required' }),
  rationale: z.string().min(1, { message: 'rationale is required' }),
  caveat: z.string().min(1, { message: 'caveat is required' }),
});
export type CountPurposeRecord = z.infer<typeof CountPurposeSchema>;
