# 04-04 Capability Inventory (Option B)

## Decision

- Selected option: `option-b` (expanded skill inventory first)
- Goal: increase confidence for urgency badge behavior before implementation

## Skills

- `frontend-design`: badge hierarchy and urgency signaling details
- `react-best-practices`: state update and rerender safety for count wiring
- `webapp-testing`: regression and flow checks after UI/state changes
- `web-design-guidelines`: UI guideline compliance pass on modified files

## Tools

- `read`, `glob`: inspect plan context and current implementation state
- `apply_patch`: atomic source and docs updates
- `bash`: verification (`npm run check`, `npm run build`, visual and deep-journey scripts)
- `git` via `bash`: per-task atomic commits and traceability

## Agents

- `gsd-plan-checker`: structured plan validation before implementation
- `explore` or `general` (fallback): ownership discovery if count logic is unclear

## Orchestration Sequence

1. Record checkpoint decision and expanded inventory.
2. Implement pending count badge wiring in app workflow entry points.
3. Add urgency visuals (threshold colors + pulse behavior) to review badges.
4. Ensure real-time update loop through dedicated pending count hook.
5. Run typecheck/build plus visual and deep-journey regressions.

## Preflight Validation Notes (gsd-plan-checker)

- Result: no-go until minor clarifications are resolved in implementation approach.
- Clarification applied: `red >= 5` takes precedence, `amber = 1-4`.
- Clarification applied: canonical source is a new `usePendingCount` hook consumed by `App`.
- Clarification applied: local build/type checks are primary gate; remote deep-journey remains a regression guard.

## Verification Gate for Checkpoint Task

- Decision explicitly recorded as `option-b`.
- Tool/agent/skill selections documented before any code changes.
