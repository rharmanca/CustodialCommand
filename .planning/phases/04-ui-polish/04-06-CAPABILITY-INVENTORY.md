# 04-06 Capability Inventory and Orchestration

- Decision: option-b (expanded capability inventory)
- Date: 2026-02-18
- Scope: touch-target and thumb-reach polish for Quick Capture

## Skills

- `frontend-design`: validate thumb-zone placement and control sizing decisions.
- `web-design-guidelines`: verify 44px/64px target-size compliance and spacing.
- `webapp-testing`: run mobile flow and screenshot checks for button visibility and interaction safety.

## Tools

- `read`: inspect plan, context, and affected components before edits.
- `apply_patch`: atomic code changes in component and page files.
- `bash`: run `npm run check`, `npm run build`, and required browser-flow scripts.

## Agents

- `gsd-plan-checker`: optional final sanity review of plan-to-implementation alignment.
- `explore`: optional fallback if touch-target ownership spans additional components.
- `general`: optional fallback if multi-file orchestration expands beyond current scope.

## Execution Order

1. Confirm baseline touch targets in `CameraCapture` and supporting controls.
2. Apply 64px primary capture updates and active feedback refinement.
3. Apply thumb-reach placement updates in `quick-capture` mobile layout.
4. Confirm 44px secondary controls in `PhotoPreviewStrip` and nearby quick-capture actions.
5. Run required verification commands and record outcomes in SUMMARY.
