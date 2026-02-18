const { chromium } = require('playwright');

const BASE_URL = process.env.TARGET_URL || 'https://custodialcommand-dev.up.railway.app';

// Tiny 1x1 PNG data URL for API fallback payload
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnS4l8AAAAASUVORK5CYII=';

(async () => {
  const runId = Date.now();
  const location = `Automation Deep Journey ${runId}`;
  const inspector = 'Automation QA';

  const result = {
    baseUrl: BASE_URL,
    runId,
    location,
    createdBy: null,
    quickCaptureUiWorked: false,
    quickCaptureApiFallbackWorked: false,
    reviewListLoaded: false,
    reviewRowFound: false,
    reviewOpened: false,
    completionSubmitted: false,
    completionSucceeded: false,
    artifacts: {
      dashboard: 'tests/screenshots/dev-deep-dashboard.png',
      quickCapture: 'tests/screenshots/dev-deep-quick-capture.png',
      reviewList: 'tests/screenshots/dev-deep-review-list.png',
      reviewForm: 'tests/screenshots/dev-deep-review-form.png',
      completion: 'tests/screenshots/dev-deep-completion.png',
    },
    errors: [],
  };

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    serviceWorkers: 'block',
  });
  const page = await context.newPage();

  const fail = (msg) => {
    result.errors.push(msg);
  };

  async function gotoDashboard() {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (_) {}
  }

  async function createPendingViaApi() {
    const apiResult = await page.evaluate(async ({ location, inspector, runId, tinyPng }) => {
      const csrfResponse = await fetch('/api/csrf-token', {
        credentials: 'include',
      });
      if (!csrfResponse.ok) {
        return {
          ok: false,
          status: csrfResponse.status,
          body: (await csrfResponse.text()).slice(0, 300),
          stage: 'csrf-token',
        };
      }

      const csrfPayload = await csrfResponse.json();
      const csrfToken = csrfPayload?.csrfToken;
      if (!csrfToken) {
        return {
          ok: false,
          status: 0,
          body: 'csrfToken missing in response payload',
          stage: 'csrf-token-parse',
        };
      }

      const response = await fetch('/api/inspections/quick-capture', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          school: 'LCA',
          captureLocation: location,
          inspectorName: inspector,
          quickNotes: `Automated deep journey fallback ${runId}`,
          images: [tinyPng],
        }),
      });

      return {
        ok: response.ok,
        status: response.status,
        body: (await response.text()).slice(0, 400),
        stage: 'quick-capture',
      };
    }, {
      location,
      inspector,
      runId,
      tinyPng: TINY_PNG,
    });

    if (!apiResult.ok) {
      throw new Error(`API fallback failed at ${apiResult.stage} (${apiResult.status}): ${apiResult.body}`);
    }

    result.quickCaptureApiFallbackWorked = true;
    result.createdBy = 'api';
  }

  try {
    await gotoDashboard();
    await page.screenshot({ path: result.artifacts.dashboard, fullPage: true });

    // --- Attempt full UI quick capture ---
    try {
      await page.locator('button:has-text("Quick Capture"):visible').first().click();
      await page.waitForTimeout(1200);

      // Fill form
      await page.locator('button[role="combobox"]').first().click();
      await page.getByRole('option', { name: 'LCA' }).click();
      await page.locator('input[placeholder*="Room 101"]').fill(location);
      await page.locator('input[placeholder*="Enter your name"]').fill(inspector);

      // Capture photo
      const captureButton = page.locator('button[aria-label="Capture photo"]');
      await captureButton.waitFor({ state: 'visible', timeout: 20000 });
      await captureButton.click();
      await page.waitForTimeout(2000);

      const capturedText = page.locator('text=/photo(s)? captured/i');
      const captured = (await capturedText.count()) > 0;
      if (!captured) {
        throw new Error('Camera capture did not produce a captured photo state');
      }

      await page.screenshot({ path: result.artifacts.quickCapture, fullPage: true });

      await page.locator('button:has-text("Save Quick Capture")').click();
      await page.waitForSelector('text=Capture Saved!', { timeout: 20000 });
      result.quickCaptureUiWorked = true;
      result.createdBy = 'ui';

      const backToDashboard = page.locator('button:has-text("Back to Dashboard")');
      if ((await backToDashboard.count()) > 0) {
        await backToDashboard.first().click();
        await page.waitForTimeout(1000);
      }
    } catch (quickCaptureError) {
      fail(`UI quick capture failed: ${quickCaptureError.message}`);
      await gotoDashboard();
      await createPendingViaApi();
    }

    // --- Review flow ---
    await gotoDashboard();
    await page.locator('button:has-text("Review Inspections"):visible').first().click();
    await page.waitForSelector('h1:has-text("Photo-First Review")', { timeout: 20000 });
    result.reviewListLoaded = true;
    await page.screenshot({ path: result.artifacts.reviewList, fullPage: true });

    // Find the created inspection row
    const row = page.locator('div[role="button"]', { hasText: location }).first();
    if ((await row.count()) > 0) {
      result.reviewRowFound = true;
      await row.locator('button:has-text("Review")').first().click();
    } else {
      fail(`Created row not found by location text: ${location}`);
      // fallback: review first available inspection so journey can continue
      const firstReview = page.locator('button:has-text("Review")').first();
      if ((await firstReview.count()) === 0) {
        throw new Error('No review buttons found in pending list');
      }
      await firstReview.click();
    }

    await page.waitForSelector('h1:has-text("Review Inspection")', { timeout: 20000 });
    result.reviewOpened = true;
    await page.screenshot({ path: result.artifacts.reviewForm, fullPage: true });

    // Fill all ratings with 3 stars
    const threeStarButtons = page.locator('button[aria-label="Rate 3 stars"]');
    const ratingCount = await threeStarButtons.count();
    if (ratingCount < 11) {
      fail(`Expected at least 11 rating controls, found ${ratingCount}`);
    }
    for (let i = 0; i < ratingCount; i += 1) {
      await threeStarButtons.nth(i).click();
    }

    const completionPayload = {
      floors: 3,
      verticalHorizontalSurfaces: 3,
      ceiling: 3,
      restrooms: 3,
      customerSatisfaction: 3,
      trash: 3,
      projectCleaning: 3,
      activitySupport: 3,
      safetyCompliance: 3,
      equipment: 3,
      monitoring: 3,
      notes: `Automated completion note (${runId})`,
    };

    // Fill detailed notes
    await page
      .locator('textarea[placeholder*="additional notes"]')
      .fill(completionPayload.notes);

    const completionResponsePromise = page.waitForResponse((response) => {
      const request = response.request();
      return (
        request.method() === 'PATCH' &&
        /\/api\/inspections\/\d+\/complete$/.test(response.url())
      );
    }, { timeout: 30000 });

    await page.locator('button:has-text("Complete Inspection")').click();
    result.completionSubmitted = true;

    const completionResponse = await completionResponsePromise;
    const completionRequestHeaders = completionResponse.request().headers();
    const completionBody = await completionResponse.text();

    if (!completionResponse.ok()) {
      // Fallback for stale client bundles missing CSRF header on completion
      const completionIdMatch = completionResponse.url().match(/\/api\/inspections\/(\d+)\/complete$/);
      const completionInspectionId = completionIdMatch ? Number(completionIdMatch[1]) : null;

      if (
        completionResponse.status() === 403 &&
        !completionRequestHeaders['x-csrf-token'] &&
        completionInspectionId
      ) {
        const fallback = await page.evaluate(async ({ inspectionId, payload }) => {
          const csrfResponse = await fetch('/api/csrf-token', {
            credentials: 'include',
          });

          if (!csrfResponse.ok) {
            return {
              ok: false,
              status: csrfResponse.status,
              body: (await csrfResponse.text()).slice(0, 300),
              stage: 'csrf-token',
            };
          }

          const csrfJson = await csrfResponse.json();
          const csrfToken = csrfJson?.csrfToken;
          if (!csrfToken) {
            return {
              ok: false,
              status: 0,
              body: 'csrfToken missing from response',
              stage: 'csrf-token-parse',
            };
          }

          const response = await fetch(`/api/inspections/${inspectionId}/complete`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': csrfToken,
            },
            body: JSON.stringify(payload),
          });

          return {
            ok: response.ok,
            status: response.status,
            body: (await response.text()).slice(0, 300),
            stage: 'complete',
          };
        }, {
          inspectionId: completionInspectionId,
          payload: completionPayload,
        });

        if (fallback.ok) {
          result.completionSucceeded = true;
          fail('UI completion request missed CSRF header; API fallback completed successfully');
          await page.screenshot({ path: result.artifacts.completion, fullPage: true });
        } else {
          fail(
            `Completion API fallback failed at ${fallback.stage} (${fallback.status}): ${fallback.body}`
          );
        }
      } else {
        fail(
          `Completion API failed (${completionResponse.status()}, csrfHeader=${Boolean(completionRequestHeaders['x-csrf-token'])}): ${completionBody.slice(0, 300)}`
        );
      }
    } else {
      result.completionSucceeded = true;
      try {
        await page.waitForSelector('text=/Inspection Completed!|Inspection completed successfully!/i', { timeout: 10000 });
      } catch (_) {
        // API success is the primary pass condition; UI toast/copy may vary.
      }
      await page.screenshot({ path: result.artifacts.completion, fullPage: true });
    }
  } catch (err) {
    fail(`Fatal test error: ${err.message}`);
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
})();
