# Testing Patterns

**Analysis Date:** 2026-02-16

## Test Framework

**Runner:**
- **Playwright** (v1.56.1) - UI/E2E browser automation testing
- **Node.js scripts** (CommonJS `.cjs` files) - API integration testing
- No Jest/Vitest unit test framework detected

**Configuration:**
- Playwright config: `playwright.config.ts`
- Test directory: `tests/` and `ui-tests/`
- Config includes multi-browser testing (Chromium, Firefox, WebKit)
- Mobile device testing (Pixel 7, iPhone 14)

**Run Commands:**
```bash
npm run test:comprehensive   # Run all test suites via tests/run-all-tests.cjs
npm run test:e2e            # Run e2e-user-journey.test.cjs
npm run test:performance    # Run performance.test.cjs
npm run test:security       # Run security.test.cjs
npm run test:mobile         # Run mobile-pwa.test.cjs
npm run test:health         # Run comprehensive-test.cjs (forms)
npm run test:forms          # Same as test:health
npm run test:debug          # Run with DEBUG=true
npm run ui:test             # Run Playwright tests (npx playwright test)
npm run ui:test:headed      # Run Playwright with UI visible
npm run ui:test:report      # Show Playwright HTML report
```

## Test File Organization

**Location:**
- API/Integration tests: `tests/*.test.cjs`
- Playwright UI tests: `ui-tests/*.spec.ts`
- Performance tests: `tests/performance/*.spec.ts`

**Naming:**
- Node.js API tests: `*.test.cjs` (CommonJS)
- Playwright tests: `*.spec.ts` (TypeScript)
- Test reports: `*-test-report.json`

**Structure:**
```
tests/
├── e2e-user-journey.test.cjs    # Complete user workflows
├── security.test.cjs            # Security vulnerability tests
├── performance.test.cjs         # Load and response time tests
├── mobile-pwa.test.cjs          # PWA and mobile functionality
├── accessibility.test.cjs       # Accessibility audit tests
├── run-all-tests.cjs            # Master test orchestrator
└── performance/
    ├── performance-suite.spec.ts
    └── lighthouse-audit.spec.ts

ui-tests/
├── ui.spec.ts                   # Comprehensive UI tests
├── test-phase9-features.spec.ts # Feature-specific tests
├── performance.spec.ts          # Performance benchmarks
└── localstorage-error-handling.spec.ts
```

## Test Structure

**Node.js API Test Pattern:**
```javascript
// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`PASS: ${testName}`, 'success');
  } else {
    testResults.failed++;
    log(`FAIL: ${testName} - ${details}`, 'error');
  }
  testResults.details.push({ testName, passed, details });
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    // ... implementation
  });
}

// Main test runner
async function runTests() {
  await testSpecificFunctionality();
  generateReport();
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(error => {
    log(`Test suite failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runTests, testResults };
```

**Playwright Test Pattern:**
```typescript
import { test, expect, type Page } from '@playwright/test';

// Helper functions
async function waitForReactReady(page: Page) {
  await page.waitForFunction(
    () => window.performance?.getEntriesByType?.('navigation')?.[0]?.domInteractive > 0,
    { timeout: 10000 }
  );
}

async function navigateAndWait(page: Page, path: string) {
  await page.goto(path);
  await waitForReactReady(page);
}

test.describe('Feature Suite', () => {
  test('specific test case', async ({ page, baseURL }) => {
    await navigateAndWait(page, '/path');
    // ... test logic
    await expect(page).toHaveTitle(/Expected Title/i);
  });
});
```

## Mocking

**Framework:** None explicitly configured
- Tests hit actual API endpoints
- Uses production URL by default: `https://cacustodialcommand.up.railway.app`
- Can override via `TEST_URL` environment variable

**What Tests Use:**
- Real HTTP requests to backend
- Real database operations
- Production-equivalent environment

**What to Mock (per TODOs in code):**
- Test environment configuration needed for local testing
- Rate limiting bypass for local development

## Fixtures and Factories

**Test Data:**
- Inline data creation in tests
- Hardcoded test credentials (security risk noted)
- Dynamic timestamps for date fields

**Example Pattern:**
```javascript
const inspectionData = {
  inspectorName: 'Test Inspector',
  school: 'Test School',
  date: new Date().toISOString().split('T')[0],
  inspectionType: 'single_room',
  // ... other fields
};
```

**Test Data Cleanup:**
- `tests/cleanup-test-data.cjs` for removing test data
- Backup files in `.backups/` directory

## Coverage

**Requirements:** None enforced

**Coverage Tracking:**
- Manual success rate calculation in test reports
- Threshold: 80% success rate for suite pass
- Target: 95%+ overall for production readiness

**View Coverage:**
```bash
# No automated coverage tool configured
# Check test reports manually:
cat tests/master-test-report.json
cat tests/journey-test-report.json
cat tests/security-test-report.json
```

## Test Types

**Unit Tests:**
- Not currently implemented
- Use inline validation via Zod schemas instead

**Integration Tests:**
- Full CRUD operation testing via Node.js scripts
- API endpoint testing with real HTTP requests
- Data integrity verification across operations

**E2E Tests:**
- Playwright for UI automation
- Complete user journey testing (login → create → update → delete)
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile device simulation

**Security Tests:**
- SQL injection attempts
- XSS payload testing
- NoSQL injection attempts
- Rate limiting validation
- File upload security (malicious file types)
- Authentication/authorization testing
- Directory traversal attempts
- Security header verification

**Performance Tests:**
- Response time measurement
- Load testing with concurrent requests
- Throughput analysis
- Memory usage monitoring
- Lighthouse audits

**Accessibility Tests:**
- Axe-core integration for WCAG compliance
- Keyboard navigation testing
- Screen reader compatibility
- Touch target size validation

## Common Patterns

**Async Testing:**
```javascript
// Node.js tests use Promise-based HTTP
const response = await makeRequest(`${BASE_URL}/api/endpoint`, {
  method: 'POST',
  body: data
});

// Playwright uses async/await with page operations
await page.goto('/');
await page.waitForSelector('[data-loaded="true"]');
await expect(page).toHaveTitle(/Title/i);
```

**Error Testing:**
```javascript
// Expect errors to be handled
try {
  await makeRequest(`${BASE_URL}/api/invalid`);
  recordTest('Invalid endpoint', false, 'Should have failed');
} catch (error) {
  recordTest('Invalid endpoint', true, 'Properly rejected');
}
```

**Report Generation:**
```javascript
function generateReport() {
  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: (testResults.passed / testResults.total) * 100
    },
    details: testResults.details
  }, null, 2));
}
```

## Playwright Configuration

**Multi-browser Projects:**
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
]
```

**Test Options:**
- Timeout: 60 seconds per test
- Expect timeout: 10 seconds
- Parallel execution: Enabled
- Retries: 2 in CI, 0 locally
- Workers: 2 in CI, auto locally
- Screenshots: On failure only
- Video: Retain on failure
- Traces: On first retry

## Test Environment

**Configuration:**
- Base URL: `process.env.TEST_URL || 'https://cacustodialcommand.up.railway.app'`
- Default targets production deployment
- No local test environment configured

**Environment Variables:**
- `TEST_URL` - Override base URL for testing
- `DEBUG=true` - Enable debug mode
- `CI` - Detect CI environment for retries

## Testing TODOs (from code)

**Known Issues:**
- [TEST-CONFIG] Create test environment configuration system for local testing
- [TEST-FIX] Add error handling for EPIPE and TLS socket errors
- [TEST-FIX] Add rate limit handling with delays between test batches
- [PERFORMANCE-MONITORING] Add server-side performance monitoring middleware

## Running Tests

**Quick Commands:**
```bash
# All tests
npm run test:comprehensive

# Individual suites
node tests/e2e-user-journey.test.cjs
node tests/security.test.cjs
node tests/performance.test.cjs
node tests/mobile-pwa.test.cjs

# Playwright only
npx playwright test
npx playwright test --headed
npx playwright test ui-tests/example.spec.ts
```

---

*Testing analysis: 2026-02-16*
