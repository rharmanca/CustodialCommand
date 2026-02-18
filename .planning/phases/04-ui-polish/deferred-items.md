# Deferred Items

## 2026-02-18

- 04-06 verification: `tests/dev-browser-deep-journey.cjs` against `https://custodialcommand-dev.up.railway.app` reports `quickCaptureUiWorked: false` and intermittently misses pending review rows. API fallback remains true, but remote UI flow is not stable enough for regression signal in this branch.
- 04-04 verification: `npx cross-env TARGET_URL=https://custodialcommand-dev.up.railway.app node tests/dev-browser-deep-journey.cjs` failed with remote `403` CSRF validation error during quick-capture fallback and timed out waiting for the capture button. Treated as out-of-scope environment instability; local typecheck/build and visual-analysis passed.
