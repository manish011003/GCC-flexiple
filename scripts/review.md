# Candidate Review Checklist Template

Use this document to manually review and verify candidate GCC records generated in `data/candidates.json` before approving them for promotion into `data/companies.json`.

---

## Verification Criteria (All 6 must be satisfied)

1. **Link Opens:** The source URL resolves successfully (HTTP 200), has valid SSL, and is accessible without paywalls, login screens, or dead redirects.
2. **Page Names the Company:** The verified page explicitly names the company or its registered Indian legal entity.
3. **India Presence Stated:** The page explicitly documents an active Global Capability Center (GCC), technology center, captive shared service unit, or R&D center in India.
4. **City Stated:** At least one specific Indian city (e.g. Bengaluru, Hyderabad, Pune, Chennai, NCR, Mumbai, etc.) is clearly identified in the source text.
5. **Evidence Tier Matches:**
   - **Tier A:** Company official domain (`*.company.com`), official regulatory filing, company newsroom press release, or government portal.
   - **Tier B:** Reputable tier-1 business media (The Economic Times, Reuters, Mint, Business Standard) or recognized analyst report (NASSCOM, Zinnov, Deloitte, Everest Group).
   - **Tier C:** Directory listing only (Glassdoor, AmbitionBox, LinkedIn directory).
6. **Entry Route Verification:**
   - If `entry_route` is `'unknown'`, verify that no speculative claims were made.
   - If `entry_route` is `'eor_bridge'`, `'entity_first'`, or `'bot'`, verify that the attached `route_source` explicitly and specifically states this setup model. **Never infer or guess a route.**

---

## Candidate Verification Checklist Template

Duplicate the section below for each candidate under review:

```markdown
### Candidate: [Company Name] (ID: [candidate-id])

- [ ] **1. Link Opens:** Source URL ([url]) loads cleanly with HTTP 200.
- [ ] **2. Page Names Company:** Exact entity name "[Company Name]" verified on page.
- [ ] **3. India Presence Stated:** Captive GCC / R&D operations explicitly confirmed in text.
- [ ] **4. City Stated:** City location(s) confirmed: `[e.g., Bengaluru, Hyderabad]`.
- [ ] **5. Evidence Tier:** Verified as Tier `[A / B / C]`.
- [ ] **6. Entry Route:** Route `[unknown / entity_first / eor_bridge / bot]` verified by `route_source`.
- [ ] **7. No Hallucinations:** Headcount and founding year are either verified by source or set to `null`.

**Reviewer Decision:**
- Status: `APPROVED` | `REJECTED` | `NEEDS_RE-CRAWL`
- Reviewer Initials: `[Your Initials]`
- Date: `YYYY-MM-DD`
- Notes: `[Any observations or clarifications]`
```

---

## Approval & Promotion Workflow

1. **Run Link Checker:**
   ```bash
   npm run check-links
   ```
2. **Review Candidates in `data/candidates.json`:**
   Inspect candidate details against the checklist above.
3. **Add Approved Candidate IDs to `data/approvals.json`:**
   ```json
   [
     "target-corporation",
     "walmart-global-tech",
     "goldman-sachs"
   ]
   ```
4. **Run Promotion Script:**
   ```bash
   npm run promote
   ```
   *Only approved candidates will be validated and promoted into `data/companies.json`.*
5. **Validate Repository Integrity:**
   ```bash
   npm run validate
   ```
