# Testing Patterns

**Analysis Date:** 2026-02-09

## Test Framework

**Runner:**
- Playwright (E2E/Integration): `@playwright/test` v1.56.1
- Node.js test scripts: Custom test harness with native modules
- Config: `playwright.config.ts`

**Assertion Library:**
- Playwright: Built-in `expect`
- Node scripts: Manual assertion patterns

**Run Commands:**
```bash
# Playwright tests
npx playwright test                           # Run all tests
npx playwright test --headed                  # Run with browser visible
npx playwright show-report                    # Show HTML report

# Node.js test scripts
npm run test:comprehensive                    # Run all tests (tests/run-all-tests.cjs)
npm run test:e2e                             # E2E user journeys (tests/e2e-user-journey.test.cjs)
npm run test:performance                      # Performance tests (tests/performance.test.cjs)
npm run test:security                        # Security tests (tests/security.test.cjs)
npm run test:mobile                          # Mobile/PWA tests (tests/mobile-pwa.test.cjs)
```

## Test File Organization

**Location:**
- Playwright tests: `tests/*.spec.ts`
- Node.js tests: `tests/*.test.cjs`
- Test data: `tests/` directory and various `*-test-data.json` files

**Naming:**
- Playwright: `[feature].spec.ts` (`performance-suite.spec.ts`, `custodial-improvements.spec.ts`)
- Node.js: `[feature].test.cjs` (`e2e-user-journey.test.cjs`, `accessibility.test.cjs`)

**Structure:**
```
tests/
├── performance/
│   ├── performance-suite.spec.ts    # Core Web Vitals, bundle analysis
│   └── lighthouse-audit.spec.ts     # Lighthouse CI integration
├── e2e-user-journey.test.cjs        # Complete user workflows
├── accessibility.test.cjs           # WCAG AA compliance
├── performance.test.cjs             # Load testing, API performance
├── security.test.cjs                # Security vulnerability tests
├── mobile-pwa.test.cjs              # Mobile/PWA specific tests
└── run-all-tests.cjs                # Test orchestrator
```

## Test Structure

**Playwright Pattern:**
```typescript
import { test, expect } from '@playwright/test';

const APP_URL = 'https://cacustodialcommand.up.railway.app';

test.describe('Feature Name', () => {
  test('should do something', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto(APP_URL);
    
    // Assertions
    expect(await page.locator('button').count()).toBeGreaterThan(0);
    
    await context.close();
  });
});
```

**Node.js Test Pattern:**
```javascript
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function recordTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${testName} - ${details}`);
  }
  testResults.details.push({ testName, passed, details });
}

async function runTests() {
  // Test implementation
  recordTest('Test name', true, 'Details');
  
  // Generate report
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
}

module.exports = { runTests, testResults };
```

## Mocking

**Framework:** Not explicitly used - tests hit real endpoints

**Patterns:**
- Test against staging/production URLs
- Mock servers available: `mock-server.ts`, `enhanced-mock-server.ts`
- Mock data: `mock-data-for-testing.ts`

**Mock Server Usage:**
```typescript
// mock-server.ts provides fake API responses for development
const mockInspections = [
  { id: 1, school: 'Test School', inspectorName: 'Test Inspector', ... },
];
```

**What to Mock:**
- External APIs not under test
- File upload services (when needed)
- Authentication for admin routes (using test credentials)

**What NOT to Mock:**
- Database (tests use real database)
- Internal API endpoints
- File system operations

## Fixtures and Factories

**Test Data:**
- JSON fixtures: `backup-test-data-*.json`, `export-test-results/*.json`
- Inline test data in test files
- Mock data modules: `mock-data-for-testing.ts`

**Example:**
```javascript
const inspectionData = {
  inspectorName: 'Test Inspector',
  school: 'Test School',
  date: new Date().toISOString().split('T')[0],
  inspectionType: 'single_room',
  locationDescription: 'Test Location',
  floors: 4,
  // ... other fields
};
```

**Location:**
- `tests/` - Test-specific data
- `export-test-results/` - Generated test datasets
- Root directory - Various backup JSON files

## Coverage

**Requirements:** Not enforced by configuration

**View Coverage:**
No built-in coverage tool configured. Use manual verification:
```bash
# Run specific test to verify functionality
node tests/e2e-user-journey.test.cjs

# Check Playwright report
npx playwright show-report
```

## Test Types

**Unit Tests:**
- Not present in codebase
- Validation logic tested via integration tests

**Integration Tests:**
- `tests/e2e-user-journey.test.cjs` - Complete workflows
- API endpoint testing in individual test files
- Database operations tested end-to-end

**E2E Tests:**
- Playwright for UI automation (`tests/performance/*.spec.ts`)
- Browser automation with Chromium, Firefox, WebKit
- Mobile device emulation (Pixel 7, iPhone 14)
- Network throttling tests (Fast 3G, 4G)

**Performance Tests:**
- Core Web Vitals (TTFB, FCP, LCP, TTI)
- Bundle size analysis
- Load testing with concurrent users (5, 10, 20)
- Resource caching effectiveness
- Mobile performance

**Accessibility Tests:**
- WCAG AA compliance verification
- Keyboard navigation testing
- Screen reader support checks
- Color contrast validation
- ARIA attributes verification

**Security Tests:**
- CSRF protection verification
- Rate limiting tests
- Admin authentication tests
- File upload validation
- XSS prevention checks

## Common Patterns

**Async Testing:**
```javascript
// Playwright
await page.goto(APP_URL, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="element"]');
await page.click('button');

// Node.js with async/await
const response = await makeRequest(`${BASE_URL}/api/inspections`, {
  method: 'POST',
  body: inspectionData
});
expect(response.status).toBe(201);
```

**Error Testing:**
```javascript
// Test validation errors
try {
  await insertInspectionSchema.parse(invalidData);
  recordTest('Validation should fail', false, 'Expected error not thrown');
} catch (error) {
  recordTest('Validation error caught', true, error.message);
}

// Test API error responses
const response = await makeRequest(`${BASE_URL}/api/inspections/99999`);
recordTest('Not found handling', response.status === 404, 
  `Expected 404, got ${response.status}`);
```

**HTTP Request Helper:**
```javascript
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 15000
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(data) 
            : data;
          resolve({ status: res.statusCode, headers: res.headers, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}
```

## Test Configuration

**Playwright Config (`playwright.config.ts`):**
```typescript
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'ui-test-report' }]],
  use: {
    baseURL: process.env.TEST_URL || 'https://cacustodialcommand.up.railway.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } }
  ]
});
```

## CI Integration

**Scripts in package.json:**
```json
{
  "test:comprehensive": "node tests/run-all-tests.cjs",
  "test:e2e": "node tests/e2e-user-journey.test.cjs",
  "test:performance": "node tests/performance.test.cjs",
  "test:security": "node tests/security.test.cjs",
  "test:mobile": "node tests/mobile-pwa.test.cjs",
  "ui:test": "npx --yes playwright test"
}
```

## Best Practices

1. **Always test error cases** - Verify 400/500 responses
2. **Clean up test data** - Tests create records in database
3. **Use descriptive test names** - "Single Room Inspection Journey - Create"
4. **Record detailed results** - Store pass/fail with details
5. **Set appropriate timeouts** - 15s for API, 60s for E2E
6. **Test against production-like data** - Use realistic test values
7. **Validate response structure** - Check both status and data shape
8. **Report generation** - Save JSON reports for analysis

---

*Testing analysis: 2026-02-09*
