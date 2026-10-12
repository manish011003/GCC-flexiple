import assert from 'node:assert';
import { runBriefEngine } from '../lib/engine.ts';
import type { BriefInputs } from '../lib/engine.ts';

console.log('🧪 Running Comprehensive Unit Tests for /lib/engine.ts...\n');

// Test Case 1: Talent Priority vs Cost Priority
const talentHeavyInputs: BriefInputs = {
  function: 'engineering',
  team_size: 40,
  urgency: 'standard',
  weights: { cost: 1, talent_depth: 5, incentives: 1, sector_cluster: 2 },
  sector: 'Software & SaaS',
  entry_route: 'entity_first',
};

const resultTalent = runBriefEngine(talentHeavyInputs);
assert(resultTalent.top_cities.length > 0, 'Must return at least 1 top city');
assert(resultTalent.top_cities[0].city_name === 'Bengaluru', 'Bengaluru should rank #1 for heavy engineering talent weight');
console.log('✓ Test 1 Passed: Talent-heavy scoring ranks Bengaluru highest.');

// Test Case 2: Cost Priority
const costHeavyInputs: BriefInputs = {
  function: 'support',
  team_size: 30,
  urgency: 'fast',
  weights: { cost: 5, talent_depth: 1, incentives: 2, sector_cluster: 1 },
  sector: 'Customer Operations',
  entry_route: 'eor_bridge',
};

const resultCost = runBriefEngine(costHeavyInputs);
assert(resultCost.top_cities[0].city_name !== 'Bengaluru', 'Lower cost cities should outrank Bengaluru when cost weight is 5x');
console.log(`✓ Test 2 Passed: Cost-heavy scoring prioritizes cost-effective hub: ${resultCost.top_cities[0].city_name}.`);

// Test Case 3: Timeline Critical Path & Bottleneck Step Identification
const eorInputs: BriefInputs = {
  function: 'engineering',
  team_size: 25,
  urgency: 'fast',
  weights: { cost: 3, talent_depth: 3, incentives: 3, sector_cluster: 3 },
  sector: 'Software & SaaS',
  entry_route: 'eor_bridge',
};
const resultEor = runBriefEngine(eorInputs);
assert(resultEor.timeline.route === 'eor_bridge', 'Timeline route should be eor_bridge');
assert(resultEor.timeline.bottleneck_step.is_bottleneck === true, 'Bottleneck step must be identified');
assert(resultEor.timeline.bottleneck_step.common_blocker !== null, 'Bottleneck step must provide common_blocker');
assert(resultEor.timeline.hiring_early_start_note.includes('Day 14'), 'EOR timeline must note early hiring start');
console.log(`✓ Test 3 Passed: EOR timeline identifies bottleneck step "${resultEor.timeline.bottleneck_step.name}" with common blocker.`);

// Test Case 4: Entity-First Timeline Longest Chain
const entityInputs: BriefInputs = {
  function: 'engineering',
  team_size: 50,
  urgency: 'standard',
  weights: { cost: 3, talent_depth: 3, incentives: 3, sector_cluster: 3 },
  sector: 'Retail & E-commerce',
  entry_route: 'entity_first',
};
const resultEntity = runBriefEngine(entityInputs);
assert(resultEntity.timeline.route === 'entity_first', 'Timeline route should be entity_first');
assert(resultEntity.timeline.total_duration_weeks.base > resultEor.timeline.total_duration_weeks.base, 'Entity first must have longer total duration than EOR');
assert(resultEntity.timeline.milestones.some((m) => m.step_id === 'step-entity-incorporation'), 'Must include incorporation milestone');
console.log(`✓ Test 4 Passed: Entity-first critical path correctly models multi-step incorporation dependency.`);

// Test Case 5: Likely-Eligible Incentives with and without Capex
const noCapexInputs: BriefInputs = {
  ...entityInputs,
  team_size: 100, // Headcount threshold met, testing capex dependency
  capex_inr: null, // User omits capex
};
const resultNoCapex = runBriefEngine(noCapexInputs);
const capexDependentInc = resultNoCapex.applicable_incentives.find((i) => i.min_capex_inr !== null && i.qualification_status === 'depends_on_capex');
assert(capexDependentInc !== undefined, 'Incentive with min_capex_inr must report "depends_on_capex" when capex is null');
assert(capexDependentInc.likely_qualification_text.includes('Depends on capex'), 'Qualification text must state "Depends on capex"');

const highCapexInputs: BriefInputs = {
  ...entityInputs,
  capex_inr: 80000000, // ₹8 Cr (exceeds ₹5 Cr threshold)
  team_size: 120, // (exceeds 100 headcount threshold)
};
const resultHighCapex = runBriefEngine(highCapexInputs);
const qualifiedInc = resultHighCapex.applicable_incentives.find((i) => i.min_capex_inr !== null && i.qualification_status === 'likely_eligible');
assert(qualifiedInc !== undefined, 'Incentive must qualify when both headcount and capex exceed thresholds');
console.log('✓ Test 5 Passed: Incentive eligibility logic correctly distinguishes missing capex ("depends on capex") vs qualified capex.');

// Test Case 6: Companies Like You (Peer Selection & Insufficient Notice)
const retailInputs: BriefInputs = {
  ...entityInputs,
  sector: 'Retail & E-commerce',
};
const resultRetail = runBriefEngine(retailInputs);
assert(resultRetail.peer_companies.peers.length > 0, 'Must find matching peers for Retail sector');
assert(resultRetail.peer_companies.peers.some((p) => p.name.includes('Target') || p.name.includes('Walmart')), 'Retail sector must match Target or Walmart');

// Rare sector test (testing insufficient notice without padding)
const rareSectorInputs: BriefInputs = {
  ...entityInputs,
  sector: 'Deep Space Mining',
};
const resultRare = runBriefEngine(rareSectorInputs);
assert(resultRare.peer_companies.peers.length < 3, 'Rare sector should return fewer than 3 peers');
assert(resultRare.peer_companies.insufficient_notice !== null, 'Must provide insufficient notice instead of padding');
console.log('✓ Test 6 Passed: Peer matching selects closest peers and triggers insufficient notice when < 3 match.');

// Test Case 7: Pre-Mortem Stall Reasons
assert(resultRetail.pre_mortem_stall_reasons.length >= 3, 'Must provide at least 3 relevant pre-mortem stall reasons');
assert(resultRetail.pre_mortem_stall_reasons.every((sr) => sr.evidence_text.length > 0), 'Every stall reason must have evidence text');
console.log(`✓ Test 7 Passed: Pre-mortem selects ${resultRetail.pre_mortem_stall_reasons.length} relevant stall reasons with source evidence.`);

console.log('\n🎉 ALL 7 UNIT TESTS PASSED SUCCESSFULLY!\n');
