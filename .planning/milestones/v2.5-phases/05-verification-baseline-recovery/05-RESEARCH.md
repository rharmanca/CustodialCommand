# Phase 05: Verification Baseline Recovery - Research

**Researched:** 2026-02-18
**Domain:** Phase verification backfill and milestone evidence reconciliation
**Confidence:** HIGH

## User Constraints

No `05-CONTEXT.md` exists yet. Using roadmap/audit artifacts as source of truth.

### Effective Constraints From Current Artifacts
- Scope is **evidence recovery**, not feature implementation.
- Goal is to restore milestone-grade verification coverage for completed phases.
- Must reconcile requirements set: `CAP-01..CAP-07`, `REV-01..REV-07`, `PERF-01..PERF-05`, `MOB-01..MOB-04`.
- Must remove milestone blocker caused by missing execution `VERIFICATION.md` artifacts for phases 01-03.
- Do not treat `RESEARCH-VERIFICATION.md` as phase execution verification.

## Summary

Phase 05 is a documentation-and-evidence recovery phase. The core blocker is not missing implementation for most v2 requirements; it is missing **execution verification artifacts** for phases 01-03, which prevents reliable milestone-level requirement audit.

The standard way to recover this baseline in this repo is to create canonical phase execution verification files (`01-VERIFICATION.md`, `02-VERIFICATION.md`, `03-VERIFICATION.md`) using the established verification-report structure and explicit evidence links to code, plans, summaries, and (where required) fresh reruns.

Because this is retrospective verification, the plan must separate evidence quality levels (direct code/runtime evidence vs summary-only historical claims). Requirement statuses should be conservative: do not mark satisfied unless evidence is explicit and traceable.

**Primary recommendation:** Execute Phase 05 as a 4-wave evidence pipeline: inventory/scaffold -> evidence extraction -> requirement reconciliation -> QA + milestone re-audit.

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| `gsd-tools.cjs` | current repo tool | Detect phase completeness and scaffold/validate artifacts | Canonical GSD workflow utility already used in this repo |
| Phase `*-VERIFICATION.md` frontmatter schema | repo standard | Milestone-readable verification artifact format | Required by audit flow and verifier conventions |
| Phase `*-SUMMARY.md` artifacts | existing | Historical execution record per plan | Primary retrospective evidence source |
| `REQUIREMENTS.md` v2 set | current | Requirement IDs and target behaviors | Source-of-truth requirement catalog for coverage table |
| Milestone audit report (`v1.0-MILESTONE-AUDIT.md`) | current | Gap baseline and blocker list | Defines exact failure conditions to close |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `gsd-tools verify phase-completeness <phase>` | Check missing summaries/evidence consistency | Start-of-phase baseline and pre-close QA |
| `gsd-tools template fill verification --phase <N>` | Scaffold canonical verification structure | Create 01/02/03 verification files quickly |
| `gsd-tools frontmatter validate --schema verification` | Frontmatter correctness check | Before completion sign-off |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Canonical `*-VERIFICATION.md` reconstruction | Re-run all historical phases end-to-end | Higher confidence but much larger scope/time |
| Conservative status with evidence-grade tags | Mark all historical claims as satisfied from summaries | Faster but low integrity; audit risk remains |

**Installation:**
```bash
# No new dependency required
# Uses existing repo tooling and artifacts
```

## Architecture Patterns

### Recommended Project Structure
```text
.planning/
├── REQUIREMENTS.md
├── v1.0-MILESTONE-AUDIT.md
└── phases/
    ├── 01-review-and-testing/
    │   ├── 01-*-SUMMARY.md
    │   └── 01-VERIFICATION.md   # create in Phase 05
    ├── 02-recommendations/
    │   ├── 02-*-SUMMARY.md
    │   ├── RESEARCH-VERIFICATION.md
    │   └── 02-VERIFICATION.md   # create in Phase 05
    ├── 03-workflow-improvements/
    │   ├── 03-*-PLAN.md
    │   ├── 03-*-SUMMARY.md
    │   └── 03-VERIFICATION.md   # create in Phase 05
    └── 05-verification-baseline-recovery/
        └── 05-RESEARCH.md
```

### Pattern 1: Retrospective Verification with Evidence Grades
**What:** Backfill verification by aggregating evidence from plans, summaries, code references, and optional reruns.
**When to use:** Historical phases completed without canonical execution verification docs.
**Example:**
```markdown
| Requirement | Status | Evidence Grade | Evidence |
|-------------|--------|----------------|----------|
| CAP-01 | SATISFIED | A (code+flow) | src/App.tsx:490, src/components/ui/FloatingActionButton.tsx:77 |
| PERF-01 | NEEDS_RERUN | C (summary-only) | 03-06-SUMMARY.md: load target claimed, no current runtime proof |
```

### Pattern 2: Goal-Backward Verification Tables
**What:** Use the standard verification sections: Observable Truths, Required Artifacts, Key Link Verification, Requirements Coverage.
**When to use:** Every phase execution verification artifact.
**Example:**
```markdown
## Observable Truths
| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Pending review API exists and is wired | VERIFIED | server/routes.ts, server/storage.ts |
```

### Pattern 3: Requirement Reconciliation Matrix (Single Source)
**What:** Build one master matrix in Phase 03 verification for all CAP/REV/PERF/MOB requirements, then reference from phase 01/02 where applicable.
**When to use:** Cross-phase requirement coverage recovery.
**Example:**
```markdown
| Req | Owning Phase | Status | Evidence | Notes |
|-----|--------------|--------|----------|-------|
| REV-04 | 03 (+04 support) | SATISFIED | 04-VERIFICATION.md:110 | Sticky visibility verified |
```

### Anti-Patterns to Avoid
- **Summary-as-proof:** Treating narrative summary statements as conclusive without traceable artifact/code evidence.
- **Status inflation:** Marking `passed` to close milestone quickly while unresolved gaps remain.
- **Mixing verification types:** Using `RESEARCH-VERIFICATION.md` as substitute for execution verification.
- **Silent requirement drift:** Ignoring requirement-count inconsistency (`23` milestone count vs `21` v2 list in REQUIREMENTS.md).

## Recommended Plan Decomposition

### Wave 1 - Baseline Inventory and Scaffolding
- Confirm missing execution verification files for phases 01/02/03.
- Scaffold `01-VERIFICATION.md`, `02-VERIFICATION.md`, `03-VERIFICATION.md` with canonical structure.
- Validate frontmatter/schema before filling details.

### Wave 2 - Evidence Extraction and Mapping
- Extract concrete claims from existing plan/summary artifacts.
- Attach evidence references (file path + line where possible).
- Tag each claim with evidence grade (A/B/C) to prevent over-claiming.

### Wave 3 - Requirements Reconciliation
- Build CAP/REV/PERF/MOB mapping table against current code + existing verification.
- Classify each requirement as `SATISFIED`, `BLOCKED`, `UNVERIFIED`, or `NEEDS_RERUN`.
- Resolve discrepancies with explicit notes (especially count mismatch and MOB-01 blocker).

### Wave 4 - Quality Gate and Audit Unblock
- Run artifact completeness checks (`phase-completeness`, frontmatter validation).
- Ensure each new verification doc has observable truths, artifacts, links, coverage, gaps summary.
- Re-run milestone audit workflow to confirm blocker removal.

## Dependency and Wave Guidance

| Wave | Depends On | Parallelizable | Output |
|------|------------|----------------|--------|
| 1 | none | yes (01/02/03 scaffolding in parallel) | empty canonical verification files |
| 2 | wave 1 | partial (phase evidence extraction parallel) | filled evidence sections |
| 3 | wave 2 | mostly no (central reconciliation table should be single-owner) | consistent requirements matrix |
| 4 | wave 3 | yes (validation commands + doc polish) | audit-ready baseline |

**Critical dependency:** Reconciliation (Wave 3) must run after evidence extraction to avoid contradictory requirement statuses.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Verification format | Ad-hoc markdown layout | Standard GSD verification-report structure | Planner/verifier/audit tooling expects this shape |
| Artifact detection | Manual eyeballing only | `gsd-tools verify phase-completeness` + explicit file checks | Reduces omission errors |
| Requirement coverage logic | Freeform prose | Tabular requirement matrix with explicit statuses | Auditable and diff-friendly |
| Confidence handling | Binary pass/fail only | Evidence grading and status taxonomy | Honest retrospective verification |

**Key insight:** In retrospective verification, the primary failure mode is false confidence, not missing prose.

## Common Pitfalls

### Pitfall 1: Treating historical summaries as runtime truth
**What goes wrong:** Requirements marked satisfied based solely on old summary language.
**Why it happens:** Easy to copy claims without validating current code/state.
**How to avoid:** Require evidence link per satisfied requirement; downgrade to `NEEDS_RERUN` if only summary proof exists.
**Warning signs:** Many satisfied rows with no code or verification references.

### Pitfall 2: Requirement cardinality drift
**What goes wrong:** Audit score and coverage table disagree (21 vs 23 requirement baseline).
**Why it happens:** Mixed legacy interpretations of v2 set.
**How to avoid:** Lock canonical requirement list from `.planning/REQUIREMENTS.md` and explicitly document any extra counted items.
**Warning signs:** Coverage denominator changes between files.

### Pitfall 3: Overwriting existing unresolved blockers
**What goes wrong:** New backfilled verification hides real open gaps (e.g., MOB-01).
**Why it happens:** Pressure to clear milestone blocker quickly.
**How to avoid:** Preserve and carry forward known blockers from `04-VERIFICATION.md` and milestone audit.
**Warning signs:** Previously blocked items disappear without new evidence.

### Pitfall 4: Inconsistent status vocabulary
**What goes wrong:** Mixed terms (`failed`, `partial`, `blocked`, `unverified`) make audits ambiguous.
**Why it happens:** Multi-author docs without normalization.
**How to avoid:** Define one status legend at top of each backfilled verification.
**Warning signs:** Same requirement appears with different semantic meanings across files.

## Verification Approach for Backfilled Phase Verifications

1. **Scaffold canonical docs** for phases 01/02/03.
2. **Populate Observable Truths** from phase goals and must-haves inferred from roadmap/plans.
3. **Populate Required Artifacts** with substantive checks (exists + non-stub + role).
4. **Populate Key Link Verification** for critical flows (UI -> hook -> API -> storage -> DB where relevant).
5. **Populate Requirements Coverage** using conservative rule set:
   - `SATISFIED`: direct code/verification evidence exists.
   - `BLOCKED`: explicit failing evidence exists.
   - `UNVERIFIED`: no sufficient evidence.
   - `NEEDS_RERUN`: only historical summary evidence exists for runtime/perf/mobile behavior.
6. **Set phase status**:
   - `passed` only if all must-haves are verified and no blockers.
   - `gaps_found` if blockers/unverified critical truths exist.
   - `human_needed` if only manual checks remain.
7. **Cross-check against milestone audit** to ensure blocker categories are addressed, not merely restated.

## Code/Command Examples

### 1) Check completeness before/after backfill
```bash
node C:/Users/veloc/.config/opencode/get-shit-done/bin/gsd-tools.cjs verify phase-completeness 01
node C:/Users/veloc/.config/opencode/get-shit-done/bin/gsd-tools.cjs verify phase-completeness 02
node C:/Users/veloc/.config/opencode/get-shit-done/bin/gsd-tools.cjs verify phase-completeness 03
```

### 2) Scaffold verification docs
```bash
node C:/Users/veloc/.config/opencode/get-shit-done/bin/gsd-tools.cjs template fill verification --phase 01
node C:/Users/veloc/.config/opencode/get-shit-done/bin/gsd-tools.cjs template fill verification --phase 02
node C:/Users/veloc/.config/opencode/get-shit-done/bin/gsd-tools.cjs template fill verification --phase 03
```

### 3) Validate frontmatter schema
```bash
node C:/Users/veloc/.config/opencode/get-shit-done/bin/gsd-tools.cjs frontmatter validate .planning/phases/01-review-and-testing/01-VERIFICATION.md --schema verification
```

## State of the Art (for this repo's process)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Summary-only completion evidence | Phase-level execution verification artifacts | Established by Phase 04 verification workflow | Enables auditable milestone rollups |
| Implicit requirement satisfaction | Explicit requirement coverage tables in verification docs | Current milestone audit process | Deterministic coverage scoring |
| Freeform validation notes | Goal-backward structured verification report | Current GSD verifier pattern | Better gap routing and fix planning |

**Deprecated/outdated in this context:**
- Using `PHASE-XX-SUMMARY.md` alone as milestone pass evidence.
- Counting research verification docs as execution verification.

## Risks

- **Audit integrity risk (HIGH):** Backfilled docs may over-assert if evidence standards are weak.
- **Traceability risk (HIGH):** Missing line-level references can cause re-audit rejection.
- **Scope creep risk (MEDIUM):** Attempting to fix functional gaps in Phase 05 instead of recording them for Phase 06/07.
- **Time risk (MEDIUM):** Performance/mobile requirements may require targeted reruns to upgrade evidence quality.

## Open Questions

1. **Requirement denominator discrepancy (21 vs 23) needs explicit lock.**
   - What we know: `REQUIREMENTS.md` lists 21 v2 checks; milestone audit scored against 23.
   - What's unclear: Which two extra checks are being counted.
   - Recommendation: Add a "coverage denominator note" in each backfilled verification and align milestone audit method before closure.

2. **What evidence threshold is acceptable for PERF and MOB claims in retrospective mode?**
   - What we know: Many claims exist in summaries, not fresh reruns.
   - What's unclear: Whether summary-only claims can be accepted.
   - Recommendation: Default to `NEEDS_RERUN` unless code + measurable artifacts exist.

## Sources

### Primary (HIGH confidence)
- `.planning/ROADMAP.md` - Phase 05 goal/scope and gap closure definition.
- `.planning/REQUIREMENTS.md` - canonical CAP/REV/PERF/MOB requirement list.
- `.planning/v1.0-MILESTONE-AUDIT.md` - current blocker inventory and scoring.
- `.planning/phases/04-ui-polish/04-VERIFICATION.md` - current verification structure and unresolved blocker evidence.
- `.planning/phases/01-review-and-testing/PHASE-01-SUMMARY.md` - historical evidence source.
- `.planning/phases/02-recommendations/PHASE-02-SUMMARY.md` - historical evidence source.
- `.planning/phases/03-workflow-improvements/03-01..06-PLAN.md` - must-haves and expected truths/artifacts.
- `.planning/phases/03-workflow-improvements/03-01..06-SUMMARY.md` - execution outcome evidence.
- `C:/Users/veloc/.config/opencode/get-shit-done/bin/gsd-tools.cjs` - command behaviors and verification schema requirements.
- `C:/Users/veloc/.config/opencode/get-shit-done/templates/verification-report.md` - canonical verification report shape.

### Secondary (MEDIUM confidence)
- Git history for `.planning/phases/01..03` (`git log --name-status`) confirming no execution `*-VERIFICATION.md` commits observed for these phases.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - fully derived from repo workflow/tooling.
- Architecture/decomposition: HIGH - aligns with existing phase + audit mechanics.
- Pitfalls/risks: HIGH - directly evidenced by current milestone audit failures.

**Research date:** 2026-02-18
**Valid until:** 2026-03-20 (30 days; process-level and repo-state dependent)
