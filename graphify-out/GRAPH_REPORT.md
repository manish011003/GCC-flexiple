# Graph Report - .  (2026-10-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 342 nodes · 499 edges · 19 communities (16 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d38b5c56`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compute.ts
- engine.ts
- app/page.tsx
- schema.ts
- compilerOptions
- devDependencies
- dependencies
- Source
- collect.ts
- scripts
- nl-filter/route.ts
- layout.tsx
- check-links.ts
- questionnaire.tsx
- gemini.server.ts
- eslint.config.mjs
- next.config.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `Source` - 15 edges
3. `Company` - 9 edges
4. `scripts` - 9 edges
5. `include` - 7 edges
6. `CoverageMeter()` - 6 edges
7. `TierBadge()` - 6 edges
8. `CompanySchema` - 6 edges
9. `POST()` - 5 edges
10. `SourceChip()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `EntryBriefProps` --references--> `Source`  [EXTRACTED]
  components/entry-brief.tsx → data/types.ts
- `SourceChipProps` --references--> `SourceReference`  [EXTRACTED]
  components/source-chip.tsx → lib/schema.ts
- `SourcePillProps` --references--> `Source`  [EXTRACTED]
  components/source-pill.tsx → data/types.ts
- `SourceListProps` --references--> `Source`  [EXTRACTED]
  components/source-pill.tsx → data/types.ts
- `StatBlockProps` --references--> `Source`  [EXTRACTED]
  components/stat-block.tsx → data/types.ts

## Import Cycles
- None detected.

## Communities (19 total, 3 thin omitted)

### Community 0 - "compute.ts"
Cohesion: 0.06
Nodes (51): aonAttritionSurvey, cbreIndiaOfficeReport, cities, jllOfficePulse, nasscomLocationReport, costBenchmarks, deloitteSetupBenchmarking, entitySetupBenchmarks (+43 more)

### Community 1 - "engine.ts"
Cohesion: 0.06
Nodes (39): briefCache, BriefNarrative, CacheEntry, createDeterministicNarrative(), POST(), BriefFunction, BriefInputs, CityScoredResult (+31 more)

### Community 2 - "app/page.tsx"
Cohesion: 0.09
Nodes (27): CompassContent(), PRESETS, SECTOR_OPTIONS, CITY_COORDINATES, MapContent(), CensusPage(), GROWTH_DATA, MATURITY_TIERS (+19 more)

### Community 3 - "schema.ts"
Cohesion: 0.09
Nodes (29): BaseRecordSchema, CitySchema, CostAssumptionSchema, CountClaimSchema, CountClaimScopeEnum, CountClaimUnit, CountClaimUnitEnum, CountPurpose (+21 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (29): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+21 more)

### Community 5 - "devDependencies"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/turbopack, @types/d3-geo (+15 more)

### Community 6 - "dependencies"
Cohesion: 0.10
Nodes (21): d3-geo, d3-zoom, framer-motion, lucide-react, next, dependencies, d3-geo, d3-zoom (+13 more)

### Community 7 - "Source"
Cohesion: 0.18
Nodes (8): EntryBriefProps, SourceListProps, SourcePill(), SourcePillProps, StatBlockProps, gccCounts, Source, TeamCostResult

### Community 8 - "collect.ts"
Cohesion: 0.17
Nodes (16): Company, CompanySchema, buildExtractionPrompt(), CandidateRecord, CANDIDATES_FILE, collectAll(), fetchFromGeminiGrounding(), FORBIDDEN_COMPANIES_FILE (+8 more)

### Community 9 - "scripts"
Cohesion: 0.15
Nodes (12): name, private, scripts, build, check-links, collect, dev, lint (+4 more)

### Community 10 - "nl-filter/route.ts"
Cohesion: 0.33
Nodes (8): checkRateLimit(), ipRateLimitMap, ParsedFilters, parseHeuristically(), POST(), RateLimitEntry, VALID_TIERS, VALID_TYPES

### Community 11 - "layout.tsx"
Cohesion: 0.29
Nodes (5): fraunces, inter, jetbrainsMono, metadata, FloatingNav()

### Community 12 - "check-links.ts"
Cohesion: 0.43
Nodes (6): CANDIDATES_FILE, checkUrl(), extractHostname(), isRelatedDomain(), runLinkChecker(), UrlCheckResult

### Community 13 - "questionnaire.tsx"
Cohesion: 0.40
Nodes (3): QuestionnaireAnswers, QuestionnaireProps, QUESTIONS

## Knowledge Gaps
- **156 isolated node(s):** `BriefNarrative`, `briefCache`, `RateLimitEntry`, `ipRateLimitMap`, `ParsedFilters` (+151 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Source` connect `Source` to `compute.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `Company` connect `collect.ts` to `engine.ts`, `app/page.tsx`, `schema.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `BriefNarrative`, `briefCache`, `RateLimitEntry` to the rest of the system?**
  _156 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compute.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.055299539170506916 - nodes in this community are weakly interconnected._
- **Should `engine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.056910569105691054 - nodes in this community are weakly interconnected._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09024390243902439 - nodes in this community are weakly interconnected._