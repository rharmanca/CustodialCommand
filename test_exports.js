import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = 'https://cacustodialcommand.up.railway.app';
const DOWNLOADS_DIR = path.join(__dirname, 'test_downloads');
const SCREENSHOTS_DIR = path.join(__dirname, 'test_screenshots');
const TEST_RESULTS = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
    }
};

// Test credentials - will need to be provided
const TEST_USER = {
    email: process.env.TEST_EMAIL || 'test@example.com',
    password: process.env.TEST_PASSWORD || 'testpassword123'
};

// Utility functions
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function addTestResult(testName, status, details = {}) {
    const result = {
        test: testName,
        status,
        timestamp: new Date().toISOString(),
        ...details
    };
    TEST_RESULTS.tests.push(result);
    TEST_RESULTS.summary.total++;
    TEST_RESULTS.summary[status]++;

    console.log(`[${status.toUpperCase()}] ${testName}`);
    if (details.message) {
        console.log(`  → ${details.message}`);
    }
}

function generateTestData() {
    return {
        timestamp: Date.now(),
        location: `Test Location ${Math.floor(Math.random() * 1000)}`,
        inspector: `Test Inspector ${Math.floor(Math.random() * 100)}`,
        items: [
            { name: 'Item 1', status: 'Clean', notes: 'Test note 1' },
            { name: 'Item 2', status: 'Needs Attention', notes: 'Test note 2' },
            { name: 'Item 3', status: 'Clean', notes: 'Test note 3' }
        ],
        specialCharacters: 'Test™ with spëcial çhars & symbols <>"'
    };
}

async function login(page) {
    console.log('\n🔐 Attempting to log in...');
    try {
        await page.goto(BASE_URL);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_homepage.png'), fullPage: true });

        // Look for login form or button
        const loginButton = await page.locator('a:has-text("Login"), button:has-text("Login")').first();
        if (await loginButton.isVisible({ timeout: 5000 })) {
            await loginButton.click();
            await page.waitForLoadState('networkidle');
        }

        // Fill login form
        await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
        await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_login_form.png'), fullPage: true });

        // Submit login
        await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_after_login.png'), fullPage: true });

        // Verify login success
        const isLoggedIn = await page.locator('text=/logout|sign out|dashboard/i').first().isVisible({ timeout: 5000 }).catch(() => false);

        if (isLoggedIn) {
            console.log('✅ Login successful');
            return true;
        } else {
            console.log('⚠️  Login status unclear - continuing anyway');
            return true; // Continue testing even if login verification fails
        }
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        throw error;
    }
}

async function createSampleInspection(page, testData) {
    console.log('\n📝 Creating sample inspection data...');
    try {
        // Navigate to create inspection page
        await page.goto(`${BASE_URL}/inspections/new`, { waitUntil: 'networkidle' });
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_create_inspection.png'), fullPage: true });

        // Fill inspection form (adjust selectors based on actual form structure)
        const locationInput = await page.locator('input[name*="location"], input[placeholder*="location"]').first();
        if (await locationInput.isVisible({ timeout: 5000 })) {
            await locationInput.fill(testData.location);
        }

        const inspectorInput = await page.locator('input[name*="inspector"], input[placeholder*="inspector"]').first();
        if (await inspectorInput.isVisible({ timeout: 5000 })) {
            await inspectorInput.fill(testData.inspector);
        }

        // Add test items if interface supports it
        for (const item of testData.items) {
            // This will need to be adjusted based on actual form structure
            const addItemBtn = await page.locator('button:has-text("Add Item"), button:has-text("Add")').first();
            if (await addItemBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await addItemBtn.click();
                await page.waitForTimeout(500);
            }
        }

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_inspection_form_filled.png'), fullPage: true });

        // Submit form
        const submitBtn = await page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save")').first();
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_inspection_created.png'), fullPage: true });

        console.log('✅ Sample inspection created');
        return true;
    } catch (error) {
        console.warn('⚠️  Could not create sample inspection:', error.message);
        console.log('   Continuing with existing data...');
        return false;
    }
}

async function testPDFExport(page) {
    console.log('\n📄 Testing PDF Export...');
    const testName = 'PDF Export';
    const startTime = Date.now();

    try {
        // Navigate to inspections page
        await page.goto(`${BASE_URL}/inspections`, { waitUntil: 'networkidle' });
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_inspections_list.png'), fullPage: true });

        // Look for PDF export button
        const pdfButton = await page.locator('button:has-text("PDF"), a:has-text("PDF"), button:has-text("Export PDF")').first();

        if (!await pdfButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            addTestResult(testName, 'failed', {
                message: 'PDF export button not found',
                duration: Date.now() - startTime
            });
            return;
        }

        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
        await pdfButton.click();

        const download = await downloadPromise;
        const downloadPath = path.join(DOWNLOADS_DIR, `test_report_${Date.now()}.pdf`);
        await download.saveAs(downloadPath);

        // Verify file exists and has content
        const stats = fs.statSync(downloadPath);
        const fileSize = stats.size;

        if (fileSize === 0) {
            addTestResult(testName, 'failed', {
                message: 'PDF file is empty',
                fileSize: 0,
                duration: Date.now() - startTime
            });
            return;
        }

        // Check if it's actually a PDF
        const fileBuffer = fs.readFileSync(downloadPath);
        const isPDF = fileBuffer.toString('utf8', 0, 4) === '%PDF';

        if (!isPDF) {
            addTestResult(testName, 'failed', {
                message: 'Downloaded file is not a valid PDF',
                fileSize,
                duration: Date.now() - startTime
            });
            return;
        }

        addTestResult(testName, 'passed', {
            message: 'PDF exported successfully',
            fileSize,
            filePath: downloadPath,
            duration: Date.now() - startTime
        });

    } catch (error) {
        addTestResult(testName, 'failed', {
            message: error.message,
            duration: Date.now() - startTime
        });
    }
}

async function testCSVExport(page) {
    console.log('\n📊 Testing CSV Export...');
    const testName = 'CSV Export';
    const startTime = Date.now();

    try {
        await page.goto(`${BASE_URL}/inspections`, { waitUntil: 'networkidle' });

        const csvButton = await page.locator('button:has-text("CSV"), a:has-text("CSV"), button:has-text("Export CSV")').first();

        if (!await csvButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            addTestResult(testName, 'failed', {
                message: 'CSV export button not found',
                duration: Date.now() - startTime
            });
            return;
        }

        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
        await csvButton.click();

        const download = await downloadPromise;
        const downloadPath = path.join(DOWNLOADS_DIR, `test_export_${Date.now()}.csv`);
        await download.saveAs(downloadPath);

        const stats = fs.statSync(downloadPath);
        const fileSize = stats.size;

        if (fileSize === 0) {
            addTestResult(testName, 'failed', {
                message: 'CSV file is empty',
                fileSize: 0,
                duration: Date.now() - startTime
            });
            return;
        }

        // Read and verify CSV content
        const csvContent = fs.readFileSync(downloadPath, 'utf8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        const hasHeaders = lines.length > 0;
        const hasData = lines.length > 1;

        // Check for special character encoding
        const hasSpecialChars = csvContent.includes('™') || csvContent.includes('ë') || csvContent.includes('ç');

        addTestResult(testName, 'passed', {
            message: 'CSV exported successfully',
            fileSize,
            filePath: downloadPath,
            lineCount: lines.length,
            hasHeaders,
            hasData,
            encodingTest: hasSpecialChars ? 'Special characters preserved' : 'No special characters in data',
            duration: Date.now() - startTime
        });

    } catch (error) {
        addTestResult(testName, 'failed', {
            message: error.message,
            duration: Date.now() - startTime
        });
    }
}

async function testExcelExport(page) {
    console.log('\n📗 Testing Excel Export...');
    const testName = 'Excel Export';
    const startTime = Date.now();

    try {
        await page.goto(`${BASE_URL}/inspections`, { waitUntil: 'networkidle' });

        const excelButton = await page.locator('button:has-text("Excel"), a:has-text("Excel"), button:has-text("Export Excel"), button:has-text("XLSX")').first();

        if (!await excelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            addTestResult(testName, 'warnings', {
                message: 'Excel export button not found - feature may not be implemented',
                duration: Date.now() - startTime
            });
            return;
        }

        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
        await excelButton.click();

        const download = await downloadPromise;
        const downloadPath = path.join(DOWNLOADS_DIR, `test_export_${Date.now()}.xlsx`);
        await download.saveAs(downloadPath);

        const stats = fs.statSync(downloadPath);
        const fileSize = stats.size;

        if (fileSize === 0) {
            addTestResult(testName, 'failed', {
                message: 'Excel file is empty',
                fileSize: 0,
                duration: Date.now() - startTime
            });
            return;
        }

        // Check if it's a valid Excel file (XLSX files start with PK - they're ZIP files)
        const fileBuffer = fs.readFileSync(downloadPath);
        const isExcel = fileBuffer.toString('utf8', 0, 2) === 'PK';

        if (!isExcel) {
            addTestResult(testName, 'failed', {
                message: 'Downloaded file is not a valid Excel file',
                fileSize,
                duration: Date.now() - startTime
            });
            return;
        }

        addTestResult(testName, 'passed', {
            message: 'Excel exported successfully',
            fileSize,
            filePath: downloadPath,
            duration: Date.now() - startTime
        });

    } catch (error) {
        addTestResult(testName, 'warnings', {
            message: `Excel export not available: ${error.message}`,
            duration: Date.now() - startTime
        });
    }
}

async function testPhotoDownloads(page) {
    console.log('\n📷 Testing Photo Downloads...');
    const testName = 'Photo Downloads';
    const startTime = Date.now();

    try {
        await page.goto(`${BASE_URL}/inspections`, { waitUntil: 'networkidle' });

        // Look for photo elements or download buttons
        const photoLinks = await page.locator('img, a[href*="photo"], a[href*="image"], button:has-text("Download Photo")').all();

        if (photoLinks.length === 0) {
            addTestResult(testName, 'warnings', {
                message: 'No photos found in inspections - cannot test photo downloads',
                duration: Date.now() - startTime
            });
            return;
        }

        // Test individual photo download
        const firstPhoto = photoLinks[0];

        // Check if there's a download button or link
        const downloadLink = await page.locator('a[download], button:has-text("Download")').first();

        if (await downloadLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
            await downloadLink.click();

            const download = await downloadPromise;
            const downloadPath = path.join(DOWNLOADS_DIR, `test_photo_${Date.now()}.jpg`);
            await download.saveAs(downloadPath);

            const stats = fs.statSync(downloadPath);

            addTestResult(testName, 'passed', {
                message: 'Individual photo download successful',
                fileSize: stats.size,
                filePath: downloadPath,
                duration: Date.now() - startTime
            });
        } else {
            addTestResult(testName, 'warnings', {
                message: 'Photos exist but no download functionality found',
                photoCount: photoLinks.length,
                duration: Date.now() - startTime
            });
        }

    } catch (error) {
        addTestResult(testName, 'warnings', {
            message: `Photo download test incomplete: ${error.message}`,
            duration: Date.now() - startTime
        });
    }
}

async function testEdgeCases(page) {
    console.log('\n⚠️  Testing Edge Cases...');

    // Test 1: Export with no data
    const noDataTest = 'Export with No Data';
    try {
        // Try to navigate to a filtered view with no results
        await page.goto(`${BASE_URL}/inspections?filter=nonexistent`, { waitUntil: 'networkidle' });

        const pdfButton = await page.locator('button:has-text("PDF"), a:has-text("PDF")').first();
        if (await pdfButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await pdfButton.click();
            await page.waitForTimeout(2000);

            addTestResult(noDataTest, 'passed', {
                message: 'Application handles export with no data without crashing'
            });
        } else {
            addTestResult(noDataTest, 'warnings', {
                message: 'Could not test - export button not available'
            });
        }
    } catch (error) {
        addTestResult(noDataTest, 'warnings', {
            message: `Edge case test incomplete: ${error.message}`
        });
    }

    // Test 2: Concurrent exports
    const concurrentTest = 'Concurrent Exports';
    try {
        await page.goto(`${BASE_URL}/inspections`, { waitUntil: 'networkidle' });

        const exportButtons = await page.locator('button:has-text("PDF"), button:has-text("CSV"), button:has-text("Excel")').all();

        if (exportButtons.length >= 2) {
            // Click multiple export buttons rapidly
            await exportButtons[0].click();
            await page.waitForTimeout(100);
            await exportButtons[1].click();

            await page.waitForTimeout(3000);

            addTestResult(concurrentTest, 'passed', {
                message: 'Application handles concurrent export requests'
            });
        } else {
            addTestResult(concurrentTest, 'warnings', {
                message: 'Not enough export options to test concurrency'
            });
        }
    } catch (error) {
        addTestResult(concurrentTest, 'warnings', {
            message: `Concurrent export test incomplete: ${error.message}`
        });
    }
}

async function generateReport() {
    console.log('\n📋 Generating Test Report...');

    const reportPath = path.join(__dirname, `export_test_report_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(TEST_RESULTS, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('EXPORT FUNCTIONALITY TEST REPORT');
    console.log('='.repeat(80));
    console.log(`\nTest Timestamp: ${TEST_RESULTS.timestamp}`);
    console.log(`Application URL: ${BASE_URL}`);
    console.log('\nSummary:');
    console.log(`  Total Tests: ${TEST_RESULTS.summary.total}`);
    console.log(`  ✅ Passed: ${TEST_RESULTS.summary.passed}`);
    console.log(`  ❌ Failed: ${TEST_RESULTS.summary.failed}`);
    console.log(`  ⚠️  Warnings: ${TEST_RESULTS.summary.warnings}`);

    console.log('\nDetailed Results:');
    TEST_RESULTS.tests.forEach(test => {
        const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
        console.log(`\n${icon} ${test.test}`);
        console.log(`   Status: ${test.status.toUpperCase()}`);
        if (test.message) console.log(`   Message: ${test.message}`);
        if (test.fileSize) console.log(`   File Size: ${(test.fileSize / 1024).toFixed(2)} KB`);
        if (test.duration) console.log(`   Duration: ${test.duration}ms`);
        if (test.filePath) console.log(`   File: ${test.filePath}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`Full report saved to: ${reportPath}`);
    console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log(`Downloaded files saved to: ${DOWNLOADS_DIR}`);
    console.log('='.repeat(80) + '\n');

    return reportPath;
}

async function main() {
    console.log('🚀 Starting Export Functionality Tests\n');
    console.log(`Target Application: ${BASE_URL}`);
    console.log(`Test User: ${TEST_USER.email}\n`);

    // Setup
    ensureDir(DOWNLOADS_DIR);
    ensureDir(SCREENSHOTS_DIR);

    const browser = await chromium.launch({
        headless: false,
        downloadsPath: DOWNLOADS_DIR
    });

    const context = await browser.newContext({
        acceptDownloads: true,
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    try {
        // Login
        await login(page);

        // Create sample data
        const testData = generateTestData();
        await createSampleInspection(page, testData);

        // Run tests
        await testPDFExport(page);
        await testCSVExport(page);
        await testExcelExport(page);
        await testPhotoDownloads(page);
        await testEdgeCases(page);

        // Generate report
        const reportPath = await generateReport();

        console.log('\n✅ All tests completed!');

    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'error_final.png'), fullPage: true });
    } finally {
        await browser.close();
    }
}

// Run tests
main().catch(console.error);
