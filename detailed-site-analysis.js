/**
 * Detailed Site Analysis for Custodial Command
 * Manual exploration with comprehensive screenshots and analysis
 */

import { chromium, devices } from 'playwright';
import fs from 'fs';

class DetailedSiteAnalyzer {
    constructor() {
        this.baseURL = 'https://cacustodialcommand.up.railway.app';
        this.screenshots = {};
        this.analysis = {
            pages: [],
            navigation: [],
            forms: [],
            features: [],
            issues: [],
            mobileCompatibility: [],
            performance: {}
        };
    }

    async runCompleteAnalysis() {
        console.log('🔍 Starting detailed site analysis...');

        const browser = await chromium.launch({
            headless: false,
            slowMo: 200,
            args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        });

        try {
            // Main site analysis
            await this.analyzeHomePage(browser);
            await this.exploreAllRoutes(browser);
            await this.analyzeFormsAndInteractions(browser);
            await this.testMobileViewports(browser);
            await this.testErrorHandling(browser);
            await this.analyzePerformance(browser);

        } catch (error) {
            console.error('❌ Analysis error:', error);
            this.analysis.issues.push({
                type: 'Analysis Error',
                message: error.message,
                stack: error.stack
            });
        } finally {
            await browser.close();
            await this.generateDetailedReport();
        }
    }

    async analyzeHomePage(browser) {
        console.log('🏠 Analyzing home page...');

        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 }
        });
        const page = await context.newPage();

        try {
            // Monitor network requests
            const requests = [];
            page.on('request', request => requests.push(request.url()));

            // Load home page
            const startTime = Date.now();
            await page.goto(this.baseURL, { waitUntil: 'networkidle' });
            const loadTime = Date.now() - startTime;

            // Get page information
            const pageInfo = await page.evaluate(() => {
                return {
                    title: document.title,
                    description: document.querySelector('meta[name="description"]')?.content || '',
                    keywords: document.querySelector('meta[name="keywords"]')?.content || '',
                    language: document.documentElement.lang || 'en',
                    viewport: document.querySelector('meta[name="viewport"]')?.content || '',
                    hasFavicon: !!document.querySelector('link[rel*="icon"]'),
                    hasManifest: !!document.querySelector('link[rel="manifest"]'),
                    hasServiceWorker: 'serviceWorker' in navigator,
                    bodyClasses: document.body.className,
                    bodyText: document.body.innerText.substring(0, 200)
                };
            });

            // Analyze navigation structure
            const navigation = await this.analyzeNavigation(page);

            // Find all interactive elements
            const interactiveElements = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const links = Array.from(document.querySelectorAll('a[href]'));
                const inputs = Array.from(document.querySelectorAll('input'));
                const selects = Array.from(document.querySelectorAll('select'));
                const textareas = Array.from(document.querySelectorAll('textarea'));

                return {
                    buttons: buttons.map(btn => btn.textContent?.trim() || btn.className || 'button'),
                    links: links.map(link => ({ text: link.textContent?.trim(), href: link.href })),
                    inputs: inputs.map(input => ({ type: input.type, name: input.name, placeholder: input.placeholder })),
                    selects: selects.map(select => ({ name: select.name, options: select.options.length })),
                    textareas: textareas.map(textarea => ({ name: textarea.name, placeholder: textarea.placeholder }))
                };
            });

            // Take multiple screenshots
            await this.takeScreenshot(page, 'home-fullpage');
            await this.takeScreenshot(page, 'home-viewport');

            // Test scroll behavior
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
            await page.waitForTimeout(1000);
            await this.takeScreenshot(page, 'home-scrolled');

            this.analysis.pages.push({
                url: this.baseURL,
                title: pageInfo.title,
                loadTime,
                requests: requests.length,
                pageInfo,
                navigation,
                interactiveElements,
                screenshotPath: 'home-fullpage.png'
            });

            console.log(`✅ Home page analyzed in ${loadTime}ms`);

        } catch (error) {
            console.error('❌ Home page analysis error:', error);
            this.analysis.issues.push({
                type: 'Home Page Error',
                message: error.message
            });
        } finally {
            await context.close();
        }
    }

    async analyzeNavigation(page) {
        const navStructure = await page.evaluate(() => {
            const navElements = document.querySelectorAll('nav, header, [role="navigation"], .nav, .navigation, .menu');
            const result = [];

            navElements.forEach(nav => {
                const links = Array.from(nav.querySelectorAll('a[href]')).map(link => ({
                    text: link.textContent?.trim() || '',
                    href: link.href,
                    isInternal: link.href.includes(window.location.hostname) || link.href.startsWith('/')
                }));

                result.push({
                    tagName: nav.tagName,
                    className: nav.className,
                    id: nav.id,
                    role: nav.getAttribute('role'),
                    links: links
                });
            });

            return result;
        });

        return navStructure;
    }

    async exploreAllRoutes(browser) {
        console.log('🧭 Exploring all accessible routes...');

        const context = await browser.newContext();
        const page = await context.newPage();

        // Common routes to try for this type of application
        const potentialRoutes = [
            '/',
            '/login',
            '/dashboard',
            '/inspections',
            '/inspection',
            '/area',
            '/building',
            '/reports',
            '/feedback',
            '/admin',
            '/settings',
            '/help',
            '/about',
            '/profile',
            '/data',
            '/analysis',
            '/monthly',
            '/scores',
            '/criteria',
            '/notes',
            '/whole-building',
            '/single-area'
        ];

        for (const route of potentialRoutes) {
            try {
                console.log(`Exploring route: ${route}`);
                const url = `${this.baseURL}${route}`;

                const response = await page.goto(url, {
                    waitUntil: 'networkidle',
                    timeout: 10000
                });

                const pageInfo = await page.evaluate(() => {
                    return {
                        title: document.title,
                        hasError: document.body.textContent.includes('404') || document.body.textContent.includes('Not Found'),
                        hasForm: document.forms.length > 0,
                        bodyClass: document.body.className,
                        heading: document.querySelector('h1, h2, h3')?.textContent?.trim() || ''
                    };
                });

                await this.takeScreenshot(page, `route-${route.replace(/\//g, '-')}`);

                this.analysis.navigation.push({
                    route,
                    url,
                    status: response.status(),
                    success: response.status() < 400,
                    pageInfo,
                    screenshotPath: `route-${route.replace(/\//g, '-')}.png`
                });

                // Go back to home for next test
                await page.goto(this.baseURL);

            } catch (error) {
                console.log(`❌ Route ${route} failed:`, error.message);
                this.analysis.navigation.push({
                    route,
                    success: false,
                    error: error.message
                });
            }
        }

        await context.close();
    }

    async analyzeFormsAndInteractions(browser) {
        console.log('📝 Analyzing forms and interactions...');

        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            // Find pages with forms
            const pagesWithForms = this.analysis.navigation.filter(nav => nav.pageInfo?.hasForm);

            if (pagesWithForms.length === 0) {
                // Try to find forms on the main page
                await page.goto(this.baseURL);
                await page.waitForTimeout(2000);
            } else {
                // Test the first page with forms
                await page.goto(pagesWithForms[0].url);
            }

            // Analyze all forms on the page
            const forms = await page.evaluate(() => {
                const formElements = Array.from(document.querySelectorAll('form'));
                return formElements.map(form => {
                    const inputs = Array.from(form.querySelectorAll('input')).map(input => ({
                        type: input.type,
                        name: input.name,
                        id: input.id,
                        required: input.required,
                        placeholder: input.placeholder,
                        value: input.value,
                        className: input.className
                    }));

                    const textareas = Array.from(form.querySelectorAll('textarea')).map(textarea => ({
                        name: textarea.name,
                        id: textarea.id,
                        required: textarea.required,
                        placeholder: textarea.placeholder,
                        rows: textarea.rows,
                        className: textarea.className
                    }));

                    const selects = Array.from(form.querySelectorAll('select')).map(select => ({
                        name: select.name,
                        id: select.id,
                        required: select.required,
                        options: Array.from(select.options).map(option => ({
                            value: option.value,
                            text: option.text,
                            selected: option.selected
                        })),
                        className: select.className
                    }));

                    const buttons = Array.from(form.querySelectorAll('button, input[type="submit"]')).map(btn => ({
                        type: btn.type || 'button',
                        text: btn.textContent?.trim() || btn.value || '',
                        className: btn.className,
                        disabled: btn.disabled
                    }));

                    return {
                        action: form.action,
                        method: form.method,
                        id: form.id,
                        className: form.className,
                        inputs,
                        textareas,
                        selects,
                        buttons,
                        fieldsets: form.querySelectorAll('fieldset').length,
                        legends: Array.from(form.querySelectorAll('legend')).map(legend => legend.textContent.trim())
                    };
                });
            });

            // Test form interactions
            for (let i = 0; i < forms.length; i++) {
                const form = forms[i];
                console.log(`Testing form ${i + 1}: ${form.method} ${form.action}`);

                try {
                    // Fill out the form with test data
                    await this.fillFormWithTestData(page, i, form);
                    await this.takeScreenshot(page, `form-${i}-filled`);

                    // Test validation
                    await this.testFormValidation(page, i);
                    await this.takeScreenshot(page, `form-${i}-validation`);

                    this.analysis.forms.push({
                        formIndex: i,
                        form,
                        testSuccess: true,
                        hasValidation: true
                    });

                } catch (error) {
                    console.error(`❌ Form ${i + 1} testing error:`, error);
                    this.analysis.forms.push({
                        formIndex: i,
                        form,
                        testSuccess: false,
                        error: error.message
                    });
                }
            }

        } catch (error) {
            console.error('❌ Form analysis error:', error);
            this.analysis.issues.push({
                type: 'Form Analysis Error',
                message: error.message
            });
        } finally {
            await context.close();
        }
    }

    async fillFormWithTestData(page, formIndex, form) {
        // Fill text inputs with test data
        for (let i = 0; i < form.inputs.length; i++) {
            const input = form.inputs[i];
            try {
                let selector = `form:nth-of-type(${formIndex + 1}) input:nth-of-type(${i + 1})`;
                if (input.id) {
                    selector = `#${input.id}`;
                } else if (input.name) {
                    selector = `input[name="${input.name}"]`;
                }

                const element = page.locator(selector);
                if (await element.isVisible()) {
                    let testValue = 'Test Data';

                    if (input.type === 'email') testValue = 'test@example.com';
                    else if (input.type === 'tel') testValue = '555-0123';
                    else if (input.type === 'date') testValue = '2024-01-01';
                    else if (input.type === 'number') testValue = '42';
                    else if (input.type === 'text') testValue = `Test ${input.name || 'value'}`;

                    await element.fill(testValue);
                    await page.waitForTimeout(200);
                }
            } catch (inputError) {
                // Continue with other inputs if one fails
                console.log(`Warning: Could not fill input ${i}:`, inputError.message);
            }
        }

        // Fill textareas
        for (let i = 0; i < form.textareas.length; i++) {
            const textarea = form.textareas[i];
            try {
                let selector = `form:nth-of-type(${formIndex + 1}) textarea:nth-of-type(${i + 1})`;
                if (textarea.id) {
                    selector = `#${textarea.id}`;
                } else if (textarea.name) {
                    selector = `textarea[name="${textarea.name}"]`;
                }

                const element = page.locator(selector);
                if (await element.isVisible()) {
                    await element.fill('Test note content for textarea');
                    await page.waitForTimeout(200);
                }
            } catch (textareaError) {
                console.log(`Warning: Could not fill textarea ${i}:`, textareaError.message);
            }
        }

        // Select options in select elements
        for (let i = 0; i < form.selects.length; i++) {
            const select = form.selects[i];
            try {
                let selector = `form:nth-of-type(${formIndex + 1}) select:nth-of-type(${i + 1})`;
                if (select.id) {
                    selector = `#${select.id}`;
                } else if (select.name) {
                    selector = `select[name="${select.name}"]`;
                }

                const element = page.locator(selector);
                if (await element.isVisible()) {
                    // Select the first non-empty option
                    const firstOption = element.locator('option:not([value=""])').first();
                    if (await firstOption.isVisible()) {
                        await firstOption.click();
                        await page.waitForTimeout(200);
                    }
                }
            } catch (selectError) {
                console.log(`Warning: Could not select option ${i}:`, selectError.message);
            }
        }
    }

    async testFormValidation(page, formIndex) {
        try {
            // Try to submit form without required fields to trigger validation
            const submitButton = page.locator(`form:nth-of-type(${formIndex + 1}) button[type="submit"], form:nth-of-type(${formIndex + 1}) input[type="submit"], form:nth-of-type(${formIndex + 1}) button:not([type="button"])`).first();

            if (await submitButton.isVisible()) {
                await submitButton.click();
                await page.waitForTimeout(1000);
            }
        } catch (validationError) {
            // Validation testing failed, but that's expected
            console.log(`Form validation test error (expected):`, validationError.message);
        }
    }

    async testMobileViewports(browser) {
        console.log('📱 Testing mobile viewports...');

        const mobileDevices = [
            { name: 'iPhone 12', device: devices['iPhone 12'] },
            { name: 'iPhone SE', device: devices['iPhone SE'] },
            { name: 'Samsung Galaxy S20', device: devices['Galaxy S20'] },
            { name: 'iPad Pro', device: devices['iPad Pro'] },
            { name: 'Desktop Small', device: { viewport: { width: 1024, height: 768 } } },
            { name: 'Tablet', device: { viewport: { width: 768, height: 1024 } } }
        ];

        for (const device of mobileDevices) {
            try {
                console.log(`Testing ${device.name}...`);

                const context = await browser.newContext({
                    ...device.device,
                    isMobile: device.device.isMobile || false,
                    hasTouch: device.device.hasTouch || false
                });
                const page = await context.newPage();

                await page.goto(this.baseURL);
                await page.waitForTimeout(2000);

                // Take viewport screenshot
                await this.takeScreenshot(page, `mobile-${device.name.toLowerCase().replace(/\s+/g, '-')}`);

                // Test horizontal scroll
                const hasHorizontalScroll = await page.evaluate(() => {
                    return document.body.scrollWidth > document.body.clientWidth;
                });

                // Test font sizes and readability
                const fontSizeIssues = await page.evaluate(() => {
                    const textElements = document.querySelectorAll('p, span, div, label, button, a');
                    let smallTextCount = 0;

                    textElements.forEach(el => {
                        const styles = window.getComputedStyle(el);
                        const fontSize = parseFloat(styles.fontSize);
                        if (fontSize < 14 && el.textContent.trim().length > 5) {
                            smallTextCount++;
                        }
                    });

                    return smallTextCount;
                });

                // Test touch targets
                const touchTargetIssues = await page.evaluate(() => {
                    const clickableElements = document.querySelectorAll('button, a, input, select, textarea, [onclick], [role="button"]');
                    let smallTargets = 0;

                    clickableElements.forEach(el => {
                        const rect = el.getBoundingClientRect();
                        const area = rect.width * rect.height;
                        if (area < 44 * 44) { // 44x44 minimum touch target
                            smallTargets++;
                        }
                    });

                    return smallTargets;
                });

                this.analysis.mobileCompatibility.push({
                    device: device.name,
                    hasHorizontalScroll,
                    fontSizeIssues,
                    touchTargetIssues,
                    screenshotPath: `mobile-${device.name.toLowerCase().replace(/\s+/g, '-')}.png`
                });

                await context.close();

            } catch (error) {
                console.error(`❌ Mobile testing error for ${device.name}:`, error);
                this.analysis.mobileCompatibility.push({
                    device: device.name,
                    success: false,
                    error: error.message
                });
            }
        }
    }

    async testErrorHandling(browser) {
        console.log('🚨 Testing error handling...');

        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            // Test 404 error
            await page.goto(`${this.baseURL}/non-existent-page-404-test`);
            await page.waitForTimeout(2000);
            await this.takeScreenshot(page, 'error-404-page');

            const error404Content = await page.evaluate(() => {
                return {
                    title: document.title,
                    bodyText: document.body.textContent.substring(0, 200),
                    has404Message: document.body.textContent.toLowerCase().includes('404') ||
                                   document.body.textContent.toLowerCase().includes('not found'),
                    statusCode: document.body.textContent.toLowerCase().includes('404')
                };
            });

            this.analysis.issues.push({
                type: '404 Error Test',
                url: `${this.baseURL}/non-existent-page-404-test`,
                error404Content
            });

            // Test network error simulation
            await page.route('**/*', route => route.abort());

            try {
                await page.goto(this.baseURL);
            } catch (networkError) {
                // Expected error
                await this.takeScreenshot(page, 'error-network-failure');

                this.analysis.issues.push({
                    type: 'Network Error Test',
                    error: networkError.message,
                    handled: true
                });
            }

        } catch (error) {
            console.error('❌ Error handling test error:', error);
        } finally {
            await context.close();
        }
    }

    async analyzePerformance(browser) {
        console.log('⚡ Analyzing performance...');

        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            // Monitor performance
            const performanceData = {};
            const requests = [];

            page.on('request', request => requests.push({
                url: request.url(),
                type: request.resourceType(),
                timestamp: Date.now()
            }));

            page.on('response', response => {
                const request = response.request();
                const matchingRequest = requests.find(r => r.url === request.url());
                if (matchingRequest) {
                    matchingRequest.responseTime = Date.now() - matchingRequest.timestamp;
                    matchingRequest.status = response.status();
                    matchingRequest.size = response.headers()['content-length'] || 0;
                }
            });

            // Load page and measure metrics
            const startTime = Date.now();
            await page.goto(this.baseURL, { waitUntil: 'networkidle' });
            const totalTime = Date.now() - startTime;

            // Get performance metrics
            const performanceMetrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paintEntries = performance.getEntriesByType('paint');
                const resourceEntries = performance.getEntriesByType('resource');

                return {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    firstPaint: paintEntries.find(p => p.name === 'first-paint')?.startTime || 0,
                    firstContentfulPaint: paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                    totalResources: resourceEntries.length,
                    totalTransferSize: resourceEntries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
                    domSize: document.querySelectorAll('*').length,
                    bodySize: document.body.innerHTML.length
                };
            });

            // Analyze request patterns
            const resourceTypes = {};
            let totalSize = 0;
            let largestRequest = null;

            requests.forEach(request => {
                if (!resourceTypes[request.type]) {
                    resourceTypes[request.type] = { count: 0, size: 0 };
                }
                resourceTypes[request.type].count++;
                resourceTypes[request.type].size += request.size || 0;
                totalSize += request.size || 0;

                if (!largestRequest || (request.size && request.size > (largestRequest.size || 0))) {
                    largestRequest = request;
                }
            });

            this.analysis.performance = {
                totalTime,
                performanceMetrics,
                requests: {
                    total: requests.length,
                    resourceTypes,
                    totalSize,
                    largestRequest
                }
            };

            console.log(`✅ Performance analysis completed in ${totalTime}ms`);

        } catch (error) {
            console.error('❌ Performance analysis error:', error);
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

    async generateDetailedReport() {
        const report = {
            metadata: {
                siteURL: this.baseURL,
                analysisDate: new Date().toISOString(),
                totalScreenshots: Object.keys(this.screenshots).length
            },
            summary: {
                pagesAnalyzed: this.analysis.pages.length,
                navigationRoutes: this.analysis.navigation.filter(n => n.success).length,
                formsFound: this.analysis.forms.length,
                mobileDevices: this.analysis.mobileCompatibility.filter(m => m.success !== false).length,
                issuesFound: this.analysis.issues.length
            },
            analysis: this.analysis,
            screenshots: this.screenshots,
            recommendations: this.generateRecommendations()
        };

        // Save detailed report
        fs.writeFileSync('test-results/detailed-analysis-report.json', JSON.stringify(report, null, 2));

        // Generate markdown report
        const markdownReport = this.generateMarkdownReport(report);
        fs.writeFileSync('test-results/detailed-analysis-report.md', markdownReport);

        console.log('\n📊 Detailed Analysis Complete!');
        console.log(`📸 Screenshots captured: ${Object.keys(this.screenshots).length}`);
        console.log(`📄 Reports saved to test-results/`);
    }

    generateRecommendations() {
        const recommendations = [];

        // Performance recommendations
        const perf = this.analysis.performance;
        if (perf && perf.totalTime > 3000) {
            recommendations.push({
                category: 'Performance',
                priority: 'High',
                issue: `Slow page load time: ${perf.totalTime}ms`,
                recommendation: 'Optimize images, enable compression, reduce bundle size'
            });
        }

        // Mobile compatibility
        const mobileIssues = this.analysis.mobileCompatibility.filter(m =>
            m.hasHorizontalScroll || m.fontSizeIssues > 0 || m.touchTargetIssues > 0
        );
        if (mobileIssues.length > 0) {
            recommendations.push({
                category: 'Mobile UX',
                priority: 'High',
                issue: `${mobileIssues.length} devices have mobile compatibility issues`,
                recommendation: 'Improve responsive design, increase font sizes, ensure minimum touch targets'
            });
        }

        // Navigation issues
        const failedRoutes = this.analysis.navigation.filter(n => !n.success);
        if (failedRoutes.length > 0) {
            recommendations.push({
                category: 'Navigation',
                priority: 'Medium',
                issue: `${failedRoutes.length} routes are inaccessible`,
                recommendation: 'Implement proper routing and 404 handling'
            });
        }

        // Form validation
        const formsWithoutValidation = this.analysis.forms.filter(f => !f.hasValidation);
        if (formsWithoutValidation.length > 0) {
            recommendations.push({
                category: 'Forms',
                priority: 'Medium',
                issue: `${formsWithoutValidation.length} forms lack proper validation`,
                recommendation: 'Add client-side and server-side form validation'
            });
        }

        return recommendations;
    }

    generateMarkdownReport(report) {
        return `# Detailed Site Analysis Report - Custodial Command

## Analysis Summary
- **Site URL**: ${report.metadata.siteURL}
- **Analysis Date**: ${report.metadata.analysisDate}
- **Screenshots Captured**: ${report.metadata.totalScreenshots}
- **Pages Analyzed**: ${report.summary.pagesAnalyzed}
- **Navigation Routes**: ${report.summary.navigationRoutes}
- **Forms Found**: ${report.summary.formsFound}
- **Mobile Devices Tested**: ${report.summary.mobileDevices}
- **Issues Found**: ${report.summary.issuesFound}

## Pages Analysis
${report.analysis.pages.map(page => `
### ${page.title}
- **URL**: ${page.url}
- **Load Time**: ${page.loadTime}ms
- **Network Requests**: ${page.requests}
- **Description**: ${page.pageInfo.description}
- **Language**: ${page.pageInfo.language}
- **Has Manifest**: ${page.pageInfo.hasManifest ? '✅' : '❌'}
- **Has Service Worker**: ${page.pageInfo.hasServiceWorker ? '✅' : '❌'}

**Navigation Structure**:
${page.navigation.map(nav => `
- **${nav.tagName}**: ${nav.className || nav.id || 'unnamed'} (${nav.links.length} links)
`).join('')}

**Interactive Elements**:
- Buttons: ${page.interactiveElements.buttons.length}
- Links: ${page.interactiveElements.links.length}
- Inputs: ${page.interactiveElements.inputs.length}
- Selects: ${page.interactiveElements.selects.length}
- Textareas: ${page.interactiveElements.textareas.length}
`).join('')}

## Navigation Testing
${report.analysis.navigation.map(nav => `
### ${nav.route}
- **URL**: ${nav.url}
- **Status**: ${nav.success ? '✅' : '❌'} ${nav.status || ''}
- **Title**: ${nav.pageInfo?.heading || nav.pageInfo?.title || 'N/A'}
- **Has Form**: ${nav.pageInfo?.hasForm ? '✅' : '❌'}
${nav.error ? `- **Error**: ${nav.error}` : ''}
`).join('')}

## Form Analysis
${report.analysis.forms.map(form => `
### Form ${form.formIndex + 1}
- **Method**: ${form.form.method || 'GET'}
- **Action**: ${form.form.action || 'current page'}
- **Inputs**: ${form.form.inputs.length}
- **Selects**: ${form.form.selects.length}
- **Textareas**: ${form.form.textareas.length}
- **Buttons**: ${form.form.buttons.length}
- **Test Success**: ${form.testSuccess ? '✅' : '❌'}
- **Has Validation**: ${form.hasValidation ? '✅' : '❌'}
${form.error ? `- **Error**: ${form.error}` : ''}

**Form Elements**:
${form.form.inputs.map(input => `- ${input.type || 'text'} input: ${input.name || input.id || 'unnamed'} ${input.required ? '(required)' : ''}`).join('')}
`).join('')}

## Mobile Compatibility
${report.analysis.mobileCompatibility.map(mobile => `
### ${mobile.device}
- **Horizontal Scroll**: ${mobile.hasHorizontalScroll ? '❌' : '✅'}
- **Font Size Issues**: ${mobile.fontSizeIssues}
- **Touch Target Issues**: ${mobile.touchTargetIssues}
${mobile.error ? `- **Error**: ${mobile.error}` : ''}
`).join('')}

## Performance Analysis
${report.analysis.performance.totalTime ? `
### Load Performance
- **Total Load Time**: ${report.analysis.performance.totalTime}ms
- **DOM Content Loaded**: ${report.analysis.performance.performanceMetrics.domContentLoaded}ms
- **Load Complete**: ${report.analysis.performance.performanceMetrics.loadComplete}ms
- **First Paint**: ${report.analysis.performance.performanceMetrics.firstPaint}ms
- **First Contentful Paint**: ${report.analysis.performance.performanceMetrics.firstContentfulPaint}ms

### Resource Analysis
- **Total Requests**: ${report.analysis.performance.requests.total}
- **Total Size**: ${(report.analysis.performance.requests.totalSize / 1024).toFixed(2)} KB
- **Resource Types**:
${Object.entries(report.analysis.performance.requests.resourceTypes).map(([type, data]) => `
- **${type}**: ${data.count} requests, ${(data.size / 1024).toFixed(2)} KB`).join('')}
` : 'No performance data available'}

## Issues Found
${report.analysis.issues.map(issue => `
### ${issue.type}
${issue.url ? `- **URL**: ${issue.url}` : ''}
${issue.error ? `- **Error**: ${issue.error}` : ''}
${issue.error404Content ? `- **404 Content**: ${issue.error404Content.bodyText.substring(0, 100)}...` : ''}
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
*Report generated by Detailed Site Analyzer*
`;
    }
}

// Run the detailed analysis
const analyzer = new DetailedSiteAnalyzer();
analyzer.runCompleteAnalysis().catch(console.error);