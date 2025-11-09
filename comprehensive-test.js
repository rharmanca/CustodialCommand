/**
 * Comprehensive Test Suite for Custodial Command Site
 * Tests all functionality, accessibility, performance, and user experience
 */

import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';

class ComprehensiveTester {
    constructor() {
        this.baseURL = 'https://cacustodialcommand.up.railway.app';
        this.screenshots = {};
        this.testResults = {
            visual: [],
            functional: [],
            mobile: [],
            accessibility: [],
            performance: [],
            pwa: [],
            forms: [],
            errors: [],
            security: []
        };
        this.startTime = Date.now();
    }

    async runAllTests() {
        console.log('🚀 Starting comprehensive testing of Custodial Command site...');

        const browser = await chromium.launch({
            headless: false,
            slowMo: 100 // Slow down for better observation
        });

        try {
            // Desktop testing
            await this.testDesktopExperience(browser);

            // Mobile testing
            await this.testMobileExperience(browser);

            // Performance testing
            await this.testPerformance(browser);

            // Accessibility testing
            await this.testAccessibility(browser);

            // PWA testing
            await this.testPWAFeatures(browser);

            // Security testing
            await this.testSecurityFeatures(browser);

        } catch (error) {
            console.error('❌ Test suite error:', error);
            this.testResults.errors.push({
                type: 'Suite Error',
                message: error.message,
                stack: error.stack
            });
        } finally {
            await browser.close();
            await this.generateReport();
        }
    }

    async testDesktopExperience(browser) {
        console.log('🖥️ Testing desktop experience...');

        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 }
        });
        const page = await context.newPage();

        try {
            // Enable performance monitoring
            await page.coverage.startJSCoverage();
            await page.coverage.startCSSCoverage();

            // Test 1: Home page loading
            console.log('📄 Testing home page...');
            await this.testPageLoad(page, 'home', '');

            // Test 2: Navigation
            console.log('🧭 Testing navigation...');
            await this.testNavigation(page);

            // Test 3: Single Area Inspection
            console.log('🔍 Testing single area inspection...');
            await this.testSingleAreaInspection(page);

            // Test 4: Whole Building Inspection
            console.log('🏢 Testing whole building inspection...');
            await this.testWholeBuildingInspection(page);

            // Test 5: Custodial Notes
            console.log('📝 Testing custodial notes...');
            await this.testCustodialNotes(page);

            // Test 6: Inspection Data
            console.log('📊 Testing inspection data viewing...');
            await this.testInspectionData(page);

            // Test 7: Monthly Feedback
            console.log('📅 Testing monthly feedback...');
            await this.testMonthlyFeedback(page);

            // Test 8: Admin Panel
            console.log('👑 Testing admin panel...');
            await this.testAdminPanel(page);

            // Test 9: Rating Criteria
            console.log('⭐ Testing rating criteria...');
            await this.testRatingCriteria(page);

            // Stop coverage and save results
            const [jsCoverage, cssCoverage] = await Promise.all([
                page.coverage.stopJSCoverage(),
                page.coverage.stopCSSCoverage()
            ]);

            this.testResults.performance.push({
                type: 'Code Coverage',
                jsFiles: jsCoverage.length,
                cssFiles: cssCoverage.length,
                totalJSSize: jsCoverage.reduce((sum, entry) => sum + entry.text.length, 0),
                totalCSSSize: cssCoverage.reduce((sum, entry) => sum + entry.text.length, 0)
            });

        } catch (error) {
            console.error('❌ Desktop testing error:', error);
            this.testResults.errors.push({
                type: 'Desktop Testing Error',
                message: error.message
            });
        } finally {
            await context.close();
        }
    }

    async testMobileExperience(browser) {
        console.log('📱 Testing mobile experience...');

        // Test on different mobile devices
        const mobileDevices = [
            { name: 'iPhone 12', device: devices['iPhone 12'] },
            { name: 'Samsung Galaxy S20', device: devices['Galaxy S20'] },
            { name: 'iPad', device: devices['iPad Pro'] }
        ];

        for (const device of mobileDevices) {
            console.log(`📱 Testing on ${device.name}...`);

            const context = await browser.newContext({
                ...device.device,
                isMobile: true,
                hasTouch: true
            });
            const page = await context.newPage();

            try {
                await this.testMobileSpecificFeatures(page, device.name);
                await this.testMobileNavigation(page, device.name);
                await this.testMobileForms(page, device.name);

            } catch (error) {
                console.error(`❌ Mobile testing error on ${device.name}:`, error);
                this.testResults.mobile.push({
                    device: device.name,
                    type: 'Testing Error',
                    message: error.message
                });
            } finally {
                await context.close();
            }
        }
    }

    async testPageLoad(page, testName, path) {
        const url = `${this.baseURL}${path}`;
        console.log(`Loading ${url}...`);

        const startTime = Date.now();

        try {
            const response = await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: 30000
            });

            const loadTime = Date.now() - startTime;

            // Wait for content to load
            await page.waitForTimeout(2000);

            // Take screenshot
            const screenshot = await page.screenshot({
                fullPage: true,
                path: `test-results/${testName}-desktop-full.png`
            });

            // Get page title
            const title = await page.title();

            // Check for console errors
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            // Get performance metrics
            const performanceMetrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
                    firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
                };
            });

            this.testResults.visual.push({
                testName,
                url,
                title,
                loadTime,
                responseStatus: response.status(),
                consoleErrors,
                performanceMetrics,
                screenshotPath: `test-results/${testName}-desktop-full.png`
            });

            console.log(`✅ ${testName} loaded in ${loadTime}ms`);

        } catch (error) {
            console.error(`❌ Failed to load ${testName}:`, error);
            this.testResults.errors.push({
                type: 'Page Load Error',
                testName,
                url,
                message: error.message
            });
        }
    }

    async testNavigation(page) {
        try {
            // Get all navigation links
            const navLinks = await page.locator('nav a, header a, [role="navigation"] a').all();

            console.log(`Found ${navLinks.length} navigation links`);

            for (let i = 0; i < navLinks.length; i++) {
                try {
                    const link = navLinks[i];
                    const text = await link.textContent();
                    const href = await link.getAttribute('href');

                    if (text && href && !href.startsWith('http') && !href.startsWith('#')) {
                        console.log(`Testing navigation to: ${text.trim()} (${href})`);

                        // Hover effect
                        await link.hover();
                        await page.waitForTimeout(500);
                        await this.takeScreenshot(page, `nav-${text.toLowerCase().replace(/\s+/g, '-')}-hover`);

                        // Click navigation
                        await link.click();
                        await page.waitForTimeout(2000);

                        await this.takeScreenshot(page, `page-${text.toLowerCase().replace(/\s+/g, '-')}`);

                        // Check for page load success
                        const title = await page.title();

                        this.testResults.functional.push({
                            type: 'Navigation',
                            linkText: text.trim(),
                            href,
                            pageTitle: title,
                            success: true
                        });

                        // Go back to home for next test
                        await page.goto(this.baseURL);
                        await page.waitForTimeout(1000);
                    }
                } catch (navError) {
                    console.error(`Navigation link ${i} error:`, navError);
                    this.testResults.functional.push({
                        type: 'Navigation Error',
                        linkIndex: i,
                        error: navError.message,
                        success: false
                    });
                }
            }

        } catch (error) {
            console.error('Navigation testing error:', error);
            this.testResults.errors.push({
                type: 'Navigation Testing Error',
                message: error.message
            });
        }
    }

    async testSingleAreaInspection(page) {
        try {
            // Navigate to single area inspection
            const areaInspectionLink = page.locator('a[href*="area"], a[href*="single"], button:has-text("Single")').first();
            if (await areaInspectionLink.isVisible()) {
                await areaInspectionLink.click();
                await page.waitForTimeout(2000);

                await this.takeScreenshot(page, 'single-area-inspection-form');

                // Test form elements
                const formElements = await page.locator('input, select, textarea, button').all();
                console.log(`Found ${formElements.length} form elements in single area inspection`);

                // Test form validation
                const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save")').first();
                if (await submitButton.isVisible()) {
                    // Test empty form submission
                    await submitButton.click();
                    await page.waitForTimeout(1000);
                    await this.takeScreenshot(page, 'single-area-validation-errors');

                    // Check for validation messages
                    const validationErrors = await page.locator('[role="alert"], .error, .invalid, [required]:invalid').all();

                    this.testResults.forms.push({
                        type: 'Single Area Inspection',
                        formElements: formElements.length,
                        validationErrors: validationErrors.length,
                        hasSubmitButton: true
                    });
                }
            } else {
                console.log('⚠️ Single area inspection link not found');
            }
        } catch (error) {
            console.error('Single area inspection testing error:', error);
            this.testResults.errors.push({
                type: 'Single Area Inspection Error',
                message: error.message
            });
        }
    }

    async testWholeBuildingInspection(page) {
        try {
            // Navigate to whole building inspection
            const buildingInspectionLink = page.locator('a[href*="building"], a[href*="whole"], button:has-text("Building")').first();
            if (await buildingInspectionLink.isVisible()) {
                await buildingInspectionLink.click();
                await page.waitForTimeout(2000);

                await this.takeScreenshot(page, 'whole-building-inspection-form');

                // Test multi-step process if present
                const stepIndicators = await page.locator('.step, [class*="step"], .progress').all();

                this.testResults.functional.push({
                    type: 'Whole Building Inspection',
                    hasMultiStep: stepIndicators.length > 0,
                    stepsFound: stepIndicators.length
                });
            } else {
                console.log('⚠️ Whole building inspection link not found');
            }
        } catch (error) {
            console.error('Whole building inspection testing error:', error);
        }
    }

    async testCustodialNotes(page) {
        try {
            const notesLink = page.locator('a[href*="notes"], a[href*="custodial"], button:has-text("Notes")').first();
            if (await notesLink.isVisible()) {
                await notesLink.click();
                await page.waitForTimeout(2000);

                await this.takeScreenshot(page, 'custodial-notes-form');

                // Test text area functionality
                const textArea = page.locator('textarea').first();
                if (await textArea.isVisible()) {
                    await textArea.fill('Test custodial note for testing purposes');
                    await page.waitForTimeout(1000);
                    await this.takeScreenshot(page, 'custodial-notes-filled');
                }
            }
        } catch (error) {
            console.error('Custodial notes testing error:', error);
        }
    }

    async testInspectionData(page) {
        try {
            const dataLink = page.locator('a[href*="data"], a[href*="view"], button:has-text("Data")').first();
            if (await dataLink.isVisible()) {
                await dataLink.click();
                await page.waitForTimeout(2000);

                await this.takeScreenshot(page, 'inspection-data-view');

                // Test filtering if present
                const filterInputs = await page.locator('input[type="search"], select, [class*="filter"]').all();

                this.testResults.functional.push({
                    type: 'Inspection Data',
                    hasFiltering: filterInputs.length > 0,
                    filterElements: filterInputs.length
                });
            }
        } catch (error) {
            console.error('Inspection data testing error:', error);
        }
    }

    async testMonthlyFeedback(page) {
        try {
            const feedbackLink = page.locator('a[href*="feedback"], a[href*="monthly"], button:has-text("Feedback")').first();
            if (await feedbackLink.isVisible()) {
                await feedbackLink.click();
                await page.waitForTimeout(2000);

                await this.takeScreenshot(page, 'monthly-feedback-report');

                // Test any interactive elements
                const interactiveElements = await page.locator('button, [role="button"], .interactive').all();

                this.testResults.functional.push({
                    type: 'Monthly Feedback',
                    interactiveElements: interactiveElements.length
                });
            }
        } catch (error) {
            console.error('Monthly feedback testing error:', error);
        }
    }

    async testAdminPanel(page) {
        try {
            const adminLink = page.locator('a[href*="admin"], button:has-text("Admin")').first();
            if (await adminLink.isVisible()) {
                await adminLink.click();
                await page.waitForTimeout(2000);

                await this.takeScreenshot(page, 'admin-panel');

                // Test admin functionality
                const adminControls = await page.locator('[class*="admin"], [role="admin"]').all();

                this.testResults.functional.push({
                    type: 'Admin Panel',
                    adminControls: adminControls.length
                });
            }
        } catch (error) {
            console.error('Admin panel testing error:', error);
        }
    }

    async testRatingCriteria(page) {
        try {
            const criteriaLink = page.locator('a[href*="rating"], a[href*="criteria"], button:has-text("Rating")').first();
            if (await criteriaLink.isVisible()) {
                await criteriaLink.click();
                await page.waitForTimeout(2000);

                await this.takeScreenshot(page, 'rating-criteria');

                // Test rating display
                const ratingElements = await page.locator('[class*="rating"], [class*="score"], .star').all();

                this.testResults.functional.push({
                    type: 'Rating Criteria',
                    ratingElements: ratingElements.length
                });
            }
        } catch (error) {
            console.error('Rating criteria testing error:', error);
        }
    }

    async testMobileSpecificFeatures(page, deviceName) {
        try {
            await page.goto(this.baseURL);
            await page.waitForTimeout(2000);

            // Test mobile navigation
            const mobileMenu = page.locator('[class*="menu"], [class*="hamburger"], button[aria-expanded]').first();
            if (await mobileMenu.isVisible()) {
                await mobileMenu.click();
                await page.waitForTimeout(1000);
                await this.takeScreenshot(page, `mobile-menu-open-${deviceName}`);
            }

            // Test touch interactions
            await page.tap('body');
            await page.waitForTimeout(500);

            // Test scrolling
            await page.evaluate(() => window.scrollTo(0, 500));
            await page.waitForTimeout(1000);
            await this.takeScreenshot(page, `mobile-scrolled-${deviceName}`);

        } catch (error) {
            console.error(`Mobile specific testing error on ${deviceName}:`, error);
        }
    }

    async testMobileNavigation(page, deviceName) {
        try {
            // Test swipe gestures if applicable
            await page.evaluate(() => {
                // Simulate touch events for swipe
                const touchStart = new TouchEvent('touchstart', {
                    touches: [{ clientX: 100, clientY: 100 }]
                });
                const touchEnd = new TouchEvent('touchend', {
                    touches: [{ clientX: 200, clientY: 100 }]
                });
                document.dispatchEvent(touchStart);
                setTimeout(() => document.dispatchEvent(touchEnd), 100);
            });

        } catch (error) {
            console.error(`Mobile navigation testing error on ${deviceName}:`, error);
        }
    }

    async testMobileForms(page, deviceName) {
        try {
            // Test virtual keyboard
            const inputField = page.locator('input[type="text"], textarea').first();
            if (await inputField.isVisible()) {
                await inputField.tap();
                await page.waitForTimeout(1000);
                await this.takeScreenshot(page, `mobile-keyboard-${deviceName}`);
            }

        } catch (error) {
            console.error(`Mobile form testing error on ${deviceName}:`, error);
        }
    }

    async testPerformance(browser) {
        console.log('⚡ Testing performance...');

        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            // Enable performance monitoring
            await page.goto(this.baseURL);

            // Get performance metrics
            const performanceMetrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paintEntries = performance.getEntriesByType('paint');

                return {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    firstPaint: paintEntries.find(p => p.name === 'first-paint')?.startTime || 0,
                    firstContentfulPaint: paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                    totalResources: performance.getEntriesByType('resource').length
                };
            });

            // Check Core Web Vitals
            const webVitals = await page.evaluate(() => {
                return new Promise((resolve) => {
                    // Simple LCP measurement
                    new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        resolve({
                            LCP: lastEntry.renderTime || lastEntry.loadTime
                        });
                    }).observe({ entryTypes: ['largest-contentful-paint'] });

                    // Timeout after 5 seconds
                    setTimeout(() => resolve({ LCP: null }), 5000);
                });
            });

            this.testResults.performance.push({
                type: 'Core Metrics',
                ...performanceMetrics,
                webVitals,
                timestamp: new Date().toISOString()
            });

            console.log('Performance metrics collected');

        } catch (error) {
            console.error('Performance testing error:', error);
        } finally {
            await context.close();
        }
    }

    async testAccessibility(browser) {
        console.log('♿ Testing accessibility...');

        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            await page.goto(this.baseURL);
            await page.waitForTimeout(2000);

            // Test keyboard navigation
            await page.keyboard.press('Tab');
            await page.waitForTimeout(500);
            const focusedElement = await page.evaluate(() => document.activeElement.tagName);

            // Test ARIA labels
            const ariaElements = await page.locator('[aria-label], [role], [aria-expanded]').all();

            // Test color contrast (basic check)
            const contrastIssues = await page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                let issues = 0;

                elements.forEach(el => {
                    const styles = window.getComputedStyle(el);
                    const color = styles.color;
                    const backgroundColor = styles.backgroundColor;

                    // Simple contrast check (would need more sophisticated calculation)
                    if (color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
                        // This is a simplified check
                        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                        const bgRgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

                        if (rgbMatch && bgRgbMatch) {
                            const brightness = (parseInt(rgbMatch[1]) * 299 + parseInt(rgbMatch[2]) * 587 + parseInt(rgbMatch[3]) * 114) / 1000;
                            const bgBrightness = (parseInt(bgRgbMatch[1]) * 299 + parseInt(bgRgbMatch[2]) * 587 + parseInt(bgRgbMatch[3]) * 114) / 1000;

                            if (Math.abs(brightness - bgBrightness) < 125) {
                                issues++;
                            }
                        }
                    }
                });

                return issues;
            });

            // Test semantic HTML
            const semanticElements = await page.locator('header, nav, main, section, article, aside, footer').all();

            this.testResults.accessibility.push({
                type: 'Accessibility Audit',
                keyboardNavigation: focusedElement !== 'BODY',
                ariaElements: ariaElements.length,
                contrastIssues,
                semanticElements: semanticElements.length,
                timestamp: new Date().toISOString()
            });

            await this.takeScreenshot(page, 'accessibility-keyboard-focus');

        } catch (error) {
            console.error('Accessibility testing error:', error);
        } finally {
            await context.close();
        }
    }

    async testPWAFeatures(browser) {
        console.log('📱 Testing PWA features...');

        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            // Check for service worker
            const serviceWorkerSupport = await page.evaluate(() => {
                return 'serviceWorker' in navigator;
            });

            // Check for manifest
            const manifestLink = await page.locator('link[rel="manifest"]').count();

            // Test installability
            const installability = await page.evaluate(async () => {
                if ('serviceWorker' in navigator && 'beforeinstallprompt' in window) {
                    return true;
                }
                return false;
            });

            // Test offline capability (basic check)
            await page.goto(this.baseURL);
            await page.waitForTimeout(2000);

            // Simulate offline mode
            await page.setOffline(true);
            await page.reload({ waitUntil: 'networkidle' });

            const offlineContent = await page.locator('body').textContent();
            const hasOfflineSupport = offlineContent.length > 100;

            await page.setOffline(false);

            this.testResults.pwa.push({
                type: 'PWA Features',
                serviceWorkerSupport,
                hasManifest: manifestLink > 0,
                installability,
                offlineSupport: hasOfflineSupport,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('PWA testing error:', error);
        } finally {
            await context.close();
        }
    }

    async testSecurityFeatures(browser) {
        console.log('🔒 Testing security features...');

        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            // Check HTTPS
            const response = await page.goto(this.baseURL);
            const isHTTPS = this.baseURL.startsWith('https://');

            // Check for security headers (basic check)
            const securityHeaders = await page.evaluate(() => {
                // This would need server-side inspection in a real scenario
                return {
                    hasCSP: document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null,
                    hasXFrameOptions: false, // Cannot check client-side
                    hasHSTS: isHTTPS // Basic check
                };
            });

            // Check for form security
            const forms = await page.locator('form').all();
            const secureForms = [];

            for (const form of forms) {
                const method = await form.getAttribute('method');
                const action = await form.getAttribute('action');
                const hasCSRF = await form.locator('input[name*="csrf"], input[name*="token"]').count();

                secureForms.push({
                    method: method || 'GET',
                    action: action || 'none',
                    hasCSRFToken: hasCSRF > 0
                });
            }

            this.testResults.security.push({
                type: 'Security Audit',
                httpsEnabled: isHTTPS,
                securityHeaders,
                forms: secureForms,
                totalForms: forms.length,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Security testing error:', error);
        } finally {
            await context.close();
        }
    }

    async takeScreenshot(page, name) {
        try {
            const screenshotPath = `test-results/${name}.png`;
            await page.screenshot({
                fullPage: true,
                path: screenshotPath
            });
            this.screenshots[name] = screenshotPath;
        } catch (error) {
            console.error(`Screenshot error for ${name}:`, error);
        }
    }

    async generateReport() {
        const endTime = Date.now();
        const totalTime = endTime - this.startTime;

        const report = {
            metadata: {
                siteURL: this.baseURL,
                testDate: new Date().toISOString(),
                totalTestTime: totalTime,
                screenshotsTaken: Object.keys(this.screenshots).length
            },
            summary: {
                totalTests: Object.values(this.testResults).flat().length,
                errorsFound: this.testResults.errors.length,
                pagesTested: this.testResults.visual.length,
                featuresTested: this.testResults.functional.length
            },
            results: this.testResults,
            screenshots: this.screenshots,
            recommendations: this.generateRecommendations()
        };

        // Save comprehensive report
        fs.writeFileSync('test-results/comprehensive-test-report.json', JSON.stringify(report, null, 2));

        // Generate markdown report
        const markdownReport = this.generateMarkdownReport(report);
        fs.writeFileSync('test-results/comprehensive-test-report.md', markdownReport);

        console.log('\n📊 Comprehensive Testing Complete!');
        console.log(`⏱️ Total test time: ${totalTime}ms`);
        console.log(`📸 Screenshots taken: ${Object.keys(this.screenshots).length}`);
        console.log(`❌ Errors found: ${this.testResults.errors.length}`);
        console.log('\n📄 Reports saved to test-results/');
    }

    generateRecommendations() {
        const recommendations = [];

        // Analyze performance
        const performanceIssues = this.testResults.performance.filter(p =>
            p.loadComplete && p.loadComplete > 3000
        );

        if (performanceIssues.length > 0) {
            recommendations.push({
                category: 'Performance',
                priority: 'High',
                issue: 'Slow page load times detected',
                recommendation: 'Optimize images, enable compression, consider CDN',
                affectedPages: performanceIssues.length
            });
        }

        // Analyze accessibility
        const accessibilityIssues = this.testResults.accessibility.filter(a =>
            a.contrastIssues > 0 || !a.keyboardNavigation
        );

        if (accessibilityIssues.length > 0) {
            recommendations.push({
                category: 'Accessibility',
                priority: 'High',
                issue: 'Accessibility barriers detected',
                recommendation: 'Improve color contrast, ensure keyboard navigation, add ARIA labels',
                issues: accessibilityIssues.reduce((sum, a) => sum + (a.contrastIssues || 0), 0)
            });
        }

        // Analyze security
        const securityIssues = this.testResults.security.filter(s =>
            !s.httpsEnabled || s.forms.some(f => !f.hasCSRFToken)
        );

        if (securityIssues.length > 0) {
            recommendations.push({
                category: 'Security',
                priority: 'Critical',
                issue: 'Security vulnerabilities detected',
                recommendation: 'Implement HTTPS, add CSRF protection, security headers',
                affectedAreas: securityIssues.length
            });
        }

        return recommendations;
    }

    generateMarkdownReport(report) {
        return `# Comprehensive Test Report - Custodial Command

## Test Summary
- **Site URL**: ${report.metadata.siteURL}
- **Test Date**: ${report.metadata.testDate}
- **Total Test Time**: ${report.metadata.totalTestTime}ms
- **Screenshots Taken**: ${report.metadata.screenshotsTaken}
- **Total Tests Run**: ${report.summary.totalTests}
- **Errors Found**: ${report.summary.errorsFound}

## Visual Analysis
${report.results.visual.map(test => `
### ${test.testName}
- **URL**: ${test.url}
- **Title**: ${test.title}
- **Load Time**: ${test.loadTime}ms
- **Status**: ${test.responseStatus}
- **Console Errors**: ${test.consoleErrors.length}
`).join('')}

## Functional Testing
${report.results.functional.map(test => `
### ${test.type}
- **Success**: ${test.success ? '✅' : '❌'}
- **Details**: ${JSON.stringify(test, null, 2)}
`).join('')}

## Mobile Testing
${report.results.mobile.map(test => `
### ${test.device || 'Mobile'}
- **Type**: ${test.type}
- **Result**: ${test.success ? '✅' : '❌'}
`).join('')}

## Performance Analysis
${report.results.performance.map(test => `
### ${test.type}
- **DOM Content Loaded**: ${test.domContentLoaded}ms
- **Load Complete**: ${test.loadComplete}ms
- **First Paint**: ${test.firstPaint}ms
- **First Contentful Paint**: ${test.firstContentfulPaint}ms
`).join('')}

## Accessibility Testing
${report.results.accessibility.map(test => `
### ${test.type}
- **Keyboard Navigation**: ${test.keyboardNavigation ? '✅' : '❌'}
- **ARIA Elements**: ${test.ariaElements}
- **Contrast Issues**: ${test.contrastIssues}
- **Semantic Elements**: ${test.semanticElements}
`).join('')}

## PWA Features
${report.results.pwa.map(test => `
### ${test.type}
- **Service Worker**: ${test.serviceWorkerSupport ? '✅' : '❌'}
- **Manifest**: ${test.hasManifest ? '✅' : '❌'}
- **Installability**: ${test.installability ? '✅' : '❌'}
- **Offline Support**: ${test.offlineSupport ? '✅' : '❌'}
`).join('')}

## Security Analysis
${report.results.security.map(test => `
### ${test.type}
- **HTTPS Enabled**: ${test.httpsEnabled ? '✅' : '❌'}
- **Total Forms**: ${test.totalForms}
- **Secure Forms**: ${test.forms.filter(f => f.hasCSRFToken).length}
`).join('')}

## Errors Found
${report.results.errors.map(error => `
### ${error.type}
- **Message**: ${error.message}
- **Stack**: ${error.stack || 'N/A'}
`).join('')}

## Recommendations
${report.recommendations.map(rec => `
### ${rec.category} (${rec.priority})
- **Issue**: ${rec.issue}
- **Recommendation**: ${rec.recommendation}
`).join('')}

## Screenshots
${Object.entries(report.screenshots).map(([name, path]) => `- **${name}**: ${path}`).join('\n')}

---
*Report generated by Comprehensive Test Suite*
`;
    }
}

// Create test-results directory if it doesn't exist
if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results');
}

// Run the comprehensive test suite
const tester = new ComprehensiveTester();
tester.runAllTests().catch(console.error);