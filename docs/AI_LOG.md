# AI Build Log — Groundtruth Prototype

This log tracks every major task performed during development, what the model got wrong, and what was corrected, in accordance with the project rules.

---

## Task 1: Architecture Planning & System Design

**Date:** 2026-10-12  
**Goal:** Define the system architecture, file tree, data flow, and design tokens for Groundtruth before writing code.

### What was done
- Authored the comprehensive architecture plan artifact (`groundtruth-architecture.md`) covering:
  - 3-act user flow (Discrepancy Hook → 5-Question Questionnaire → Streamed Entry Brief)
  - Complete file tree across `app/`, `components/`, `data/`, and `lib/`
  - Mermaid data flow diagram showing build-time computation to edge streaming
  - 5-question specification with rationale for each
  - Entry Brief section breakdown (shortlist, cost envelope, entity vs EOR, risks, sources)
  - Editorial design tokens (warm off-white `#FAF8F5`, near-black `#1A1A1A`, amber `#B45309`, Newsreader serif, Inter sans)
  - 6 blocking questions addressing data authenticity, Gemini model, questions, delivery mode, and deployment

### What the model got wrong
- Initially proposed `.json` files for data storage, which would require runtime schema validation and parsing. Corrected to typed `.ts` literal exports to get compile-time type safety, zero-parse overhead, and automatic tree-shaking.
- Initially assumed the questionnaire should be multi-page; corrected to an inline, zero-navigation interactive component that lives on the landing page to keep the "30 seconds" promise intact.

---

## Task 2: Project Scaffolding & Directory Setup

**Date:** 2026-10-12  
**Goal:** Initialize the Next.js App Router project with TypeScript, Tailwind CSS, and create the directory structure.

### What was done
- Created Next.js App Router project via `create-next-app` with App Router, TypeScript, and Tailwind CSS.
- Handled npm package naming restrictions (directory had capital letters `GCC-prototype-Flexiple`) by scaffolding to `/tmp` and copying back.
- Created directory layout: `app/api/brief`, `app/methodology`, `components/ui`, `data/`, `lib/`, `docs/`.

### What the model got wrong
- Attempted to run `create-next-app` directly in the root directory which failed because npm disallows capital letters in project names derived from the folder path. Corrected by scaffolding to `/tmp/groundtruth-init/groundtruth` and moving the files.

---

## Task 3: Editorial Design System Implementation

**Date:** 2026-10-12  
**Goal:** Implement the editorial design tokens in `app/globals.css` and configure Google Fonts in `app/layout.tsx`.

### What was done
- Configured CSS custom properties for warm off-white background (`#FAF8F5`), near-black ink (`#1A1A1A`), warm amber accent (`#B45309`), surface tints, and 8px grid spacing.
- Enforced tabular numerals globally (`font-variant-numeric: tabular-nums`).
- Configured Newsreader (serif) for headlines and Inter (sans) for body/UI via `next/font/google`.
- Added CSS classes for brief prose styling, shimmer skeleton animations, and editorial transition curves.

### What the model got wrong
- The subagent initially added a monospace font (`JetBrains Mono`) which diluted the editorial identity. This was stripped and replaced with Inter using `font-variant-numeric: tabular-nums` to maintain clean two-font discipline.
- Subagent configured Fraunces with both `axes: ["opsz"]` and a fixed `weight: ["700"]`, which caused `next/font` compile errors. Fixed by using pure variable font declarations.

---

## Task 4: Sourced Data Layer & Computation Engine

**Date:** 2026-10-12  
**Goal:** Build typed data files with mandatory source citations and a pure computation engine.

### What was done
- Created `data/types.ts` defining strict TypeScript interfaces (`Source`, `GCCCount`, `CityProfile`, `FunctionType`, `CostBenchmark`, `RiskFactor`).
  - **Hard rule enforced:** Every record mandates non-empty `sources: Source[]`. Unknown values are strictly `null`.
- Created `data/gcc-counts.ts` with published counts from NASSCOM/Zinnov (1,580), Deloitte (1,430), ANSR (1,750), and EY (1,500), detailing inclusion/exclusion criteria.
- Created `data/cities.ts` with 8 Indian city profiles (Bengaluru, Hyderabad, Pune, Chennai, NCR, Mumbai, Ahmedabad, Kochi) covering talent depth per function, rent, office costs, and attrition rates.
- Created `data/cost-benchmarks.ts` with salary bands, office costs, and entity setup models (Subsidiary vs EOR vs BOT).
- Created `data/risks.ts` detailing regulatory, attrition, IP assignment, and infrastructure risks with practical mitigations.
- Built `lib/compute.ts` with pure deterministic calculation functions:
  - `computeCostEnvelope()` — derives Year-1 financial range
  - `rankCities()` — scores cities based on user priority weighting
  - `getDiscrepancySummary()` — extracts head-to-head source delta
  - `collectAllSources()` — compiles bibliography of every referenced source
- Built `lib/format.ts` for Indian currency formatting (Lakhs, Crores) and percentages.
- Built `lib/prompts.ts` with system prompts forbidding the LLM from inventing figures.

### What the model got wrong
- The subagent created duplicate data formats (both `.ts` and `.json` tables like `count_claims.json`, `cost_assumptions.json`). Kept both in sync so that the expanded test suite and the core prototype both function without breaking.
- Subagent used the term "verified" in several places. Corrected to "sourced" to reflect Groundtruth's neutral stance as an evidence reference layer rather than an authoritative auditor.
- Cleaned em dashes (`—`) to maintain clean typographic standards.

---

## Task 5: Component Layer & User Interface

**Date:** 2026-10-12  
**Goal:** Build the interactive questionnaire, discrepancy hero, source pills, entry brief, and skeleton states.

### What was done
- Created `components/source-pill.tsx`: Interactive citation chip linking to original research with date and notes.
- Created `components/stat-block.tsx`: Sourced numerical callout with delta indicators and inline citation pills.
- Created `components/discrepancy-hero.tsx`: Editorial lead showing published count disagreements side-by-side with methodology notes and a gap callout.
- Created `components/questionnaire.tsx`: 5-question step-through component with progress indicator, visual selection states, and auto-advance.
- Created `components/brief-skeleton.tsx`: Exact layout-matched skeleton preventing Cumulative Layout Shift (CLS) during streaming.
- Created `components/entry-brief.tsx`: Formatted prose renderer with auto-scroll during streaming and an aggregated source bibliography.
- Created `app/methodology/page.tsx`: Deep-dive editorial page breaking down counting differences by source.

### What the model got wrong
- Subagent built expanded features (Map, Registry, Board) that went beyond the initial scope. While the expanded features provide additional value, the core 30-second entry brief flow on the home page was preserved as the primary landing experience.

---

## Task 6: Server-Side Gemini Integration & Edge Route Handler

**Date:** 2026-10-12  
**Goal:** Implement the streaming API route with pre-computed data injection and local fallback.

### What was done
- Created `lib/gemini.server.ts`: Server-only module reading `GEMINI_API_KEY`, using `gemini-2.0-flash` with SSE streaming.
  - Included a realistic deterministic mock brief fallback for local development when no API key is present.
- Created `app/api/brief/route.ts`: Edge route handler validating the 5 answers, running deterministic computations from `/data`, injecting pre-computed figures into the prompt, and streaming the response.
- Verified that `GEMINI_API_KEY` is never exposed in client code or bundle.

---

## Task 7: Fix India Map Layout & Drawer Stacking Context

**Date:** 2026-10-12  
**Goal:** Fix broken India map layout where the map was overflowing its container, stretching across the viewport, and layering markers over the Zinnov-Nasscom source-details drawer.

### What was done
1. **Isolated Stacking Context (`isolation: isolate`)**:
   - Diagnosed root cause: `MapPreviewCard` and its stage container lacked an isolated stacking context. Leaflet's internal controls and markers operate with `z-index: 600` and `z-index: 1000`. Because the parent was `position: relative` with `z-index: auto`, these elements escaped into the root document stacking context, overriding the `Drawer` which was styled with `z-50` (`z-index: 50`).
   - Added `isolation: isolate`, `overflow: hidden`, `position: relative`, `min-width: 0`, and `width: 100%` on `components/map-preview-card.tsx` outer container and map stage container.
   - Applied the same isolation pattern in `app/map/page.tsx` and `components/stage-container.tsx`.
2. **Embedded Leaflet Core CSS in `app/globals.css`**:
   - Diagnosed root cause of map tiles stretching across viewport: Leaflet's stylesheet was loaded asynchronously via a dynamically inserted `<link>` tag in `useEffect`. Before/without the stylesheet, Tailwind's preflight image rule (`img { max-width: 100%; height: auto; }`) broke Leaflet tiles, and unpositioned `.leaflet-pane` elements expanded to full dimensions.
   - Embedded full Leaflet core stylesheet into `app/globals.css`, ensuring `.leaflet-container` is constrained with `position: relative !important; overflow: hidden !important; width: 100% !important; height: 100% !important; min-width: 0 !important; max-width: 100% !important;`, and tiles have `max-width: none !important; width: auto !important;`.
3. **Elevated & Restructured `Drawer` (`components/drawer.tsx`)**:
   - Elevated the Drawer container to `z-[100]` so it sits strictly above the page content, map containers, and the floating navigation header (`z-50`).
   - Structured the drawer with a dedicated full-viewport backdrop (`fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity`) that blurs and dims the entire page including the map.
   - Rendered the drawer panel with a solid `#0C3A26` background, dedicated scrollable content body (`flex-1 overflow-y-auto`), ensuring text and cards remain 100% sharp and readable.
   - Added body scroll locking while the drawer is active and ESC key dismissal.
4. **Verified Responsiveness & Build**:
   - Added container resize handling (`map.invalidateSize()`).
   - Re-ran `npm run validate` (PASSED 100%), `npx tsc --noEmit` (0 errors), all 7 engine unit tests in `scripts/test-engine.ts` (PASSED 100%), and `npm run build` (compiled 12/12 static/dynamic routes in 3.7s).

### What the model got wrong
- The model previously assumed relying on CDN-injected `<link rel="stylesheet">` at runtime inside `useEffect` was sufficient for Leaflet. This caused a race condition where Leaflet calculated dimensions before CSS loaded, causing tiles to expand. Corrected by bundling all core Leaflet rules directly in `app/globals.css`.
- The model previously gave `Drawer` `z-50` without isolating the map container's stacking context. Leaflet's internal marker pane (`z-index: 600`) and control panes (`z-index: 1000`) escaped into the root stacking context and layered on top of the drawer. Corrected by adding `isolation: isolate` to the map stage container and elevating the Drawer to `z-[100]`.

---

## Task 8: Fix Turbopack Font Loading Error (`@vercel/turbopack-next/internal/font/google/font`)

**Date:** 2026-10-12  
**Goal:** Resolve Turbopack dev server error: `Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'` shown on `localhost:3000`.

### What was done
- **Root Cause**: The repository had a workaround script `scripts/mock-fonts.js` hooked into `process.env.NEXT_FONT_GOOGLE_MOCKED_RESPONSES` in `next.config.ts`. While Webpack tolerated this mock, Turbopack's native font resolver failed to resolve the mock path, attempting to load internal `@vercel/turbopack-next/internal/font/google/font` and crashing the dev build.
- **Fixed with `next/font/local`**:
  - Converted font loading in `app/layout.tsx` to standard Next.js `next/font/local` using the pre-existing variable font files `public/fonts/fraunces.woff2` and `public/fonts/inter.woff2`.
  - Removed `process.env.NEXT_FONT_GOOGLE_MOCKED_RESPONSES` from `next.config.ts`.
  - Deleted `scripts/mock-fonts.js`.
- **Verification**: Turbopack compiled `/` in 220ms without errors. Production build (`npm run build`) succeeded in 3.6s with all 12 routes generated.


