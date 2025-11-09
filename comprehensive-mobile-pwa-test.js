/**
 * Comprehensive Mobile PWA Test Suite for Custodial Command
 * Tests all mobile-specific functionality, PWA features, and touch interactions
 */

import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';

class MobilePWATester {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseURL = baseUrl;
        this.screenshots = {};
        this.testResults = {
            pwaInstallation: [],
            touchInteractions: [],
            responsiveDesign: [],
            offlineFunctionality: [],
            mobilePerformance: [],
            cameraIntegration: [],
            locationServices: [],
            backgroundSync: [],
            accessibilityMobile: [],
            deviceCompatibility: []
        };
        this.startTime = Date.now();

        // Mobile device configurations for testing
        this.mobileDevices = [
            { name: 'iPhone SE', width: 375, height: 667, userAgent: 'iPhone' },
            { name: 'iPhone 12', width: 390, height: 844, userAgent: 'iPhone' },
            { name: 'iPhone 14 Pro Max', width: 430, height: 932, userAgent: 'iPhone' },
            { name: 'iPad', width: 768, height: 1024, userAgent: 'iPad' },
            { name: 'Android Mobile', width: 360, height: 640, userAgent: 'Android' },
            { name: 'Android Large', width: 412, height: 892, userAgent: 'Android' }
        ];
    }

    async runAllTests() {
        console.log('🚀 Starting comprehensive mobile PWA testing...');

        // Create test results directory
        if (!fs.existsSync('mobile-test-results')) {
            fs.mkdirSync('mobile-test-results');
        }

        const browser = await chromium.launch({
            headless: false,
            slowMo: 50,
            args: [
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                '--allow-running-insecure-content',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });

        try {
            // Test PWA Installation Capabilities
            await this.testPWAInstallation(browser);

            // Test Touch Interactions and Mobile UI
            await this.testTouchInteractions(browser);

            // Test Responsive Design Across Devices
            await this.testResponsiveDesign(browser);

            // Test Offline Functionality
            await this.testOfflineFunctionality(browser);

            // Test Mobile Performance
            await this.testMobilePerformance(browser);

            // Test Camera Integration
            await this.testCameraIntegration(browser);

            // Test Location Services
            await this.testLocationServices(browser);

            // Test Background Sync
            await this.testBackgroundSync(browser);

            // Test Mobile Accessibility
            await this.testMobileAccessibility(browser);

            // Test Device Compatibility
            await this.testDeviceCompatibility(browser);

        } catch (error) {
            console.error('❌ Test suite error:', error);
            this.testResults.errors = [{
                type: 'Suite Error',
                message: error.message,
                stack: error.stack
            }];
        } finally {
            await browser.close();
            await this.generateReport();
        }
    }

    async testPWAInstallation(browser) {
        console.log('📱 Testing PWA installation capabilities...');

        const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
            mobile: true,
            hasTouch: true
        });
        const page = await context.newPage();

        try {
            // Test PWA Manifest
            console.log('Testing PWA manifest...');
            await page.goto(this.baseURL);
            await page.waitForTimeout(2000);

            // Check for manifest link
            const manifestLink = await page.locator('link[rel="manifest"]').count();
            const manifestExists = manifestLink > 0;

            // Test manifest content if available
            let manifestContent = null;
            if (manifestExists) {
                const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
                if (manifestHref) {
                    try {
                        const response = await page.goto(`${this.baseURL}${manifestHref}`);
                        if (response && response.ok()) {
                            manifestContent = await response.json();
                        }
                    } catch (e) {
                        console.log('Could not fetch manifest content:', e.message);
                    }
                }
            }

            // Test Service Worker Registration
            console.log('Testing service worker...');
            const serviceWorkerSupport = await page.evaluate(() => {
                return 'serviceWorker' in navigator;
            });

            const serviceWorkerRegistered = await page.evaluate(async () => {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    return registration && registration.active;
                } catch (e) {
                    return false;
                }
            });

            // Test PWA Installability
            console.log('Testing PWA installability...');
            const installability = await page.evaluate(() => {
                return 'beforeinstallprompt' in window;
            });

            // Test App-like Display Characteristics
            const displayMode = await page.evaluate(() => {
                return window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser';
            });

            // Test Theme Color and Mobile Meta Tags
            const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
            const mobileOptimized = await page.locator('meta[name="mobile-web-app-capable"]').count();
            const appleMobileCapable = await page.locator('meta[name="apple-mobile-web-app-capable"]').count();

            this.testResults.pwaInstallation.push({
                testName: 'PWA Manifest',
                passed: manifestExists,
                details: manifestExists ? 'Manifest found' : 'No manifest link found',
                manifestContent
            });

            this.testResults.pwaInstallation.push({
                testName: 'Service Worker',
                passed: serviceWorkerSupport && serviceWorkerRegistered,
                details: serviceWorkerSupport ?
                    (serviceWorkerRegistered ? 'Service worker registered' : 'Service worker not registered') :
                    'Service worker not supported'
            });

            this.testResults.pwaInstallation.push({
                testName: 'Installability',
                passed: installability,
                details: installability ? 'Install prompt available' : 'Install prompt not available'
            });

            this.testResults.pwaInstallation.push({
                testName: 'Display Mode',
                passed: displayMode === 'standalone',
                details: `Current display mode: ${displayMode}`
            });

            this.testResults.pwaInstallation.push({
                testName: 'Mobile Optimization',
                passed: mobileOptimized > 0 || appleMobileCapable > 0,
                details: `Mobile meta tags: ${mobileOptimized + appleMobileCapable}`
            });

            this.testResults.pwaInstallation.push({
                testName: 'Theme Color',
                passed: themeColor !== null,
                details: themeColor ? `Theme color: ${themeColor}` : 'No theme color set'
            });

            await this.takeScreenshot(page, 'pwa-installation-test');

        } catch (error) {
            console.error('PWA installation testing error:', error);
            this.testResults.pwaInstallation.push({
                testName: 'PWA Installation Error',
                passed: false,
                error: error.message
            });
        } finally {
            await context.close();
        }
    }

    async testTouchInteractions(browser) {
        console.log('👆 Testing touch interactions...');

        const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
            mobile: true,
            hasTouch: true
        });
        const page = await context.newPage();

        try {
            await page.goto(this.baseURL);
            await page.waitForTimeout(2000);

            // Test minimum touch target size (44px x 44px)
            console.log('Testing touch target sizes...');
            const touchTargets = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, a, input[type="button"], [role="button"]'));
                const smallTargets = buttons.filter(btn => {
                    const rect = btn.getBoundingClientRect();
                    return rect.width < 44 || rect.height < 44;
                });
                return {
                    total: buttons.length,
                    smallTargets: smallTargets.length,
                    smallTargetDetails: smallTargets.map(btn => ({
                        tag: btn.tagName,
                        text: btn.textContent?.slice(0, 50) || '',
                        width: btn.getBoundingClientRect().width,
                        height: btn.getBoundingClientRect().height
                    }))
                };
            });

            // Test touch gestures
            console.log('Testing touch gestures...');

            // Test tap interactions
            const navigationItems = await page.locator('nav a, header a, [role="navigation"] a').all();
            let successfulTaps = 0;

            for (let i = 0; i < Math.min(navigationItems.length, 5); i++) {
                try {
                    await navigationItems[i].tap();
                    await page.waitForTimeout(500);
                    successfulTaps++;
                    await page.goBack();
                    await page.waitForTimeout(500);
                } catch (e) {
                    console.log(`Tap test failed for item ${i}:`, e.message);
                }
            }

            // Test swipe gestures (if implemented)
            console.log('Testing swipe gestures...');
            const swipeSupport = await page.evaluate(() => {
                // Check for touch event listeners
                const hasTouchListeners = ['touchstart', 'touchmove', 'touchend'].some(eventType =>
                    window.getEventListeners?.(window)?.[eventType] ||
                    document.body[`on${eventType}`] !== null
                );
                return hasTouchListeners;
            });

            // Test mobile menu toggle
            console.log('Testing mobile menu...');
            const mobileMenuButton = await page.locator('[class*="menu"], [class*="hamburger"], button[aria-expanded]').first();
            let mobileMenuWorks = false;

            if (await mobileMenuButton.isVisible()) {
                await mobileMenuButton.tap();
                await page.waitForTimeout(500);
                mobileMenuWorks = await mobileMenuButton.getAttribute('aria-expanded') === 'true';
                await this.takeScreenshot(page, 'mobile-menu-open');
            }

            // Test form interactions on mobile
            console.log('Testing mobile form interactions...');
            const formInputs = await page.locator('input, select, textarea').all();
            let formInteractionSuccess = 0;

            for (let i = 0; i < Math.min(formInputs.length, 3); i++) {
                try {
                    await formInputs[i].tap();
                    await page.waitForTimeout(300);

                    // Check if virtual keyboard would appear (simulated)
                    const isFocused = await formInputs[i].evaluate(el => document.activeElement === el);
                    if (isFocused) formInteractionSuccess++;

                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(200);
                } catch (e) {
                    console.log(`Form interaction test failed for input ${i}:`, e.message);
                }
            }

            this.testResults.touchInteractions.push({
                testName: 'Touch Target Sizes',
                passed: touchTargets.smallTargets === 0,
                details: `${touchTargets.total} touch targets, ${touchTargets.smallTargets} too small (< 44px)`,
                smallTargets: touchTargets.smallTargets
            });

            this.testResults.touchInteractions.push({
                testName: 'Tap Interactions',
                passed: successfulTaps > 0,
                details: `${successfulTaps}/${Math.min(navigationItems.length, 5)} tap tests successful`
            });

            this.testResults.touchInteractions.push({
                testName: 'Swipe Support',
                passed: swipeSupport,
                details: swipeSupport ? 'Touch event listeners detected' : 'No touch event listeners found'
            });

            this.testResults.touchInteractions.push({
                testName: 'Mobile Menu',
                passed: mobileMenuWorks || !(await mobileMenuButton.isVisible()),
                details: mobileMenuWorks ? 'Mobile menu functional' : 'Mobile menu not working or not present'
            });

            this.testResults.touchInteractions.push({
                testName: 'Mobile Forms',
                passed: formInteractionSuccess > 0,
                details: `${formInteractionSuccess}/${Math.min(formInputs.length, 3)} form interactions successful`
            });

            await this.takeScreenshot(page, 'touch-interactions-test');

        } catch (error) {
            console.error('Touch interactions testing error:', error);
            this.testResults.touchInteractions.push({
                testName: 'Touch Interactions Error',
                passed: false,
                error: error.message
            });
        } finally {
            await context.close();
        }
    }

    async testResponsiveDesign(browser) {
        console.log('📐 Testing responsive design...');

        for (const device of this.mobileDevices) {
            console.log(`Testing ${device.name} (${device.width}x${device.height})...`);

            const context = await browser.newContext({
                viewport: { width: device.width, height: device.height },
                userAgent: `Mozilla/5.0 (${device.userAgent})`,
                mobile: device.width < 768,
                hasTouch: true
            });
            const page = await context.newPage();

            try {
                await page.goto(this.baseURL);
                await page.waitForTimeout(2000);

                // Test viewport meta tag
                const viewportMeta = await page.locator('meta[name="viewport"]').count();
                const hasViewportMeta = viewportMeta > 0;

                // Test horizontal scrolling (should not be required)
                const hasHorizontalScroll = await page.evaluate(() => {
                    return document.body.scrollWidth > document.body.clientWidth;
                });

                // Test readable font sizes (minimum 16px on mobile)
                const fontSizes = await page.evaluate(() => {
                    const textElements = Array.from(document.querySelectorAll('p, li, td, label, span'));
                    const sizes = textElements.map(el => {
                        const style = window.getComputedStyle(el);
                        return parseFloat(style.fontSize);
                    });
                    return {
                        average: sizes.reduce((a, b) => a + b, 0) / sizes.length,
                        minimum: Math.min(...sizes),
                        smallElements: sizes.filter(size => size < 16).length
                    };
                });

                // Test touch spacing between interactive elements
                const touchSpacing = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button, a, input'));
                    let spacingIssues = 0;

                    for (let i = 0; i < buttons.length - 1; i++) {
                        const rect1 = buttons[i].getBoundingClientRect();
                        const rect2 = buttons[i + 1].getBoundingClientRect();

                        if (rect1.bottom < rect2.top) {
                            // Vertical spacing
                            const verticalSpacing = rect2.top - rect1.bottom;
                            if (verticalSpacing < 8) spacingIssues++;
                        } else if (rect1.right < rect2.left) {
                            // Horizontal spacing
                            const horizontalSpacing = rect2.left - rect1.right;
                            if (horizontalSpacing < 8) spacingIssues++;
                        }
                    }

                    return spacingIssues;
                });

                // Test mobile-specific UI adaptations
                const mobileUI = await page.evaluate(() => {
                    const mobileMenu = document.querySelector('[class*="mobile"], [class*="menu"]');
                    const hamburgerMenu = document.querySelector('[class*="hamburger"], .menu-toggle');
                    const collapsedElements = document.querySelectorAll('[class*="collapse"], [class*="expand"]');

                    return {
                        hasMobileMenu: !!mobileMenu,
                        hasHamburgerMenu: !!hamburgerMenu,
                        collapsibleElements: collapsedElements.length
                    };
                });

                // Test content adaptability
                const contentAdaptability = await page.evaluate(() => {
                    const images = Array.from(document.querySelectorAll('img'));
                    const responsiveImages = images.filter(img => {
                        const style = window.getComputedStyle(img);
                        return style.maxWidth === '100%' || style.width === '100%' || style.height === 'auto';
                    });

                    const tables = Array.from(document.querySelectorAll('table'));
                    const scrollableTables = tables.filter(table => {
                        const parent = table.parentElement;
                        const style = window.getComputedStyle(parent);
                        return style.overflowX === 'auto' || style.overflowX === 'scroll';
                    });

                    return {
                        totalImages: images.length,
                        responsiveImages: responsiveImages.length,
                        totalTables: tables.length,
                        scrollableTables: scrollableTables.length
                    };
                });

                const responsiveScore = [
                    hasViewportMeta ? 1 : 0,
                    !hasHorizontalScroll ? 1 : 0,
                    fontSizes.smallElements === 0 ? 1 : 0,
                    touchSpacing === 0 ? 1 : 0
                ].reduce((a, b) => a + b, 0);

                this.testResults.responsiveDesign.push({
                    deviceName: device.name,
                    resolution: `${device.width}x${device.height}`,
                    passed: responsiveScore >= 3,
                    score: responsiveScore,
                    maxScore: 4,
                    details: {
                        hasViewportMeta,
                        hasHorizontalScroll,
                        fontSizes,
                        touchSpacing,
                        mobileUI,
                        contentAdaptability
                    }
                });

                await this.takeScreenshot(page, `responsive-${device.name.toLowerCase().replace(/\s+/g, '-')}`);

            } catch (error) {
                console.error(`Responsive design testing error for ${device.name}:`, error);
                this.testResults.responsiveDesign.push({
                    deviceName: device.name,
                    passed: false,
                    error: error.message
                });
            } finally {
                await context.close();
            }
        }
    }

    async testOfflineFunctionality(browser) {
        console.log('🌐 Testing offline functionality...');

        const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
            mobile: true,
            hasTouch: true,
            serviceWorkers: 'allow'
        });
        const page = await context.newPage();

        try {
            // Load the app normally first
            await page.goto(this.baseURL);
            await page.waitForTimeout(3000);

            // Take screenshot of online version
            await this.takeScreenshot(page, 'online-version');

            // Test service worker cache
            console.log('Testing service worker cache...');
            const serviceWorkerState = await page.evaluate(async () => {
                if (!('serviceWorker' in navigator)) {
                    return { supported: false, state: 'not_supported' };
                }

                try {
                    const registration = await navigator.serviceWorker.ready;
                    return {
                        supported: true,
                        state: registration.active?.state || 'no_active_worker',
                        scope: registration.scope
                    };
                } catch (e) {
                    return { supported: true, state: 'registration_failed', error: e.message };
                }
            });

            // Go offline
            console.log('Simulating offline mode...');
            await page.setOffline(true);
            await page.waitForTimeout(1000);

            // Test page loads offline
            const offlineLoadSuccess = await page.reload({ waitUntil: 'networkidle', timeout: 10000 })
                .then(() => true)
                .catch(() => false);

            // Check if content is available offline
            const offlineContent = await page.evaluate(() => {
                const body = document.body;
                return {
                    hasContent: body.innerText.length > 100,
                    title: document.title,
                    hasError: body.innerText.toLowerCase().includes('offline') ||
                            body.innerText.toLowerCase().includes('no internet')
                };
            });

            // Test form functionality offline
            const offlineFormTest = await page.evaluate(() => {
                const forms = document.querySelectorAll('form');
                const inputs = document.querySelectorAll('input, textarea, select');
                const buttons = document.querySelectorAll('button, input[type="submit"]');

                return {
                    formsFound: forms.length,
                    inputsFound: inputs.length,
                    buttonsFound: buttons.length,
                    canInteract: buttons.length > 0
                };
            });

            // Test data persistence
            console.log('Testing data persistence offline...');

            // Try to fill out a form offline
            const offlineFormData = {
                school: 'Offline Test School',
                date: new Date().toISOString().split('T')[0],
                locationDescription: 'Offline test location'
            };

            let formFilledOffline = false;
            try {
                await page.fill('input[name*="school"], #school', offlineFormData.school);
                await page.fill('input[name*="date"], #date', offlineFormData.date);
                await page.fill('input[name*="location"], textarea[name*="location"]', offlineFormData.locationDescription);
                formFilledOffline = true;
            } catch (e) {
                console.log('Form filling failed offline:', e.message);
            }

            // Test local storage usage
            const localStorageUsage = await page.evaluate(() => {
                try {
                    localStorage.setItem('offline-test', 'offline-data');
                    const retrieved = localStorage.getItem('offline-test');
                    localStorage.removeItem('offline-test');
                    return { supported: true, working: retrieved === 'offline-data' };
                } catch (e) {
                    return { supported: false, error: e.message };
                }
            });

            // Go back online
            await page.setOffline(false);
            await page.waitForTimeout(1000);

            // Take screenshot of recovery
            await this.takeScreenshot(page, 'offline-recovery');

            this.testResults.offlineFunctionality.push({
                testName: 'Service Worker Cache',
                passed: serviceWorkerState.supported && serviceWorkerState.state === 'activated',
                details: serviceWorkerState
            });

            this.testResults.offlineFunctionality.push({
                testName: 'Offline Page Load',
                passed: offlineLoadSuccess,
                details: offlineLoadSuccess ? 'Page loads successfully offline' : 'Page fails to load offline'
            });

            this.testResults.offlineFunctionality.push({
                testName: 'Offline Content Availability',
                passed: offlineContent.hasContent && !offlineContent.hasError,
                details: offlineContent
            });

            this.testResults.offlineFunctionality.push({
                testName: 'Offline Form Functionality',
                passed: offlineFormTest.canInteract && formFilledOffline,
                details: { ...offlineFormTest, formFilledOffline }
            });

            this.testResults.offlineFunctionality.push({
                testName: 'Data Persistence',
                passed: localStorageUsage.supported && localStorageUsage.working,
                details: localStorageUsage
            });

        } catch (error) {
            console.error('Offline functionality testing error:', error);
            this.testResults.offlineFunctionality.push({
                testName: 'Offline Functionality Error',
                passed: false,
                error: error.message
            });
        } finally {
            await context.close();
        }
    }

    async testMobilePerformance(browser) {
        console.log('⚡ Testing mobile performance...');

        const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
            mobile: true,
            hasTouch: true
        });
        const page = await context.newPage();

        try {
            // Enable performance monitoring
            await page.goto(this.baseURL, { waitUntil: 'networkidle' });

            // Get Core Web Vitals for mobile
            const webVitals = await page.evaluate(() => {
                return new Promise((resolve) => {
                    const vitals = {};

                    // Largest Contentful Paint (LCP)
                    try {
                        new PerformanceObserver((list) => {
                            const entries = list.getEntries();
                            const lastEntry = entries[entries.length - 1];
                            vitals.LCP = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
                        }).observe({ entryTypes: ['largest-contentful-paint'] });
                    } catch (e) {
                        vitals.LCP = null;
                    }

                    // First Input Delay (FID)
                    try {
                        new PerformanceObserver((list) => {
                            const entries = list.getEntries();
                            if (entries.length > 0) {
                                vitals.FID = entries[0].processingStart - entries[0].startTime;
                            }
                        }).observe({ entryTypes: ['first-input'] });
                    } catch (e) {
                        vitals.FID = null;
                    }

                    // Cumulative Layout Shift (CLS)
                    try {
                        let clsValue = 0;
                        new PerformanceObserver((list) => {
                            for (const entry of list.getEntries()) {
                                if (!entry.hadRecentInput) {
                                    clsValue += entry.value;
                                }
                            }
                            vitals.CLS = clsValue;
                        }).observe({ entryTypes: ['layout-shift'] });
                    } catch (e) {
                        vitals.CLS = null;
                    }

                    // Timeout after 5 seconds
                    setTimeout(() => resolve(vitals), 5000);
                });
            });

            // Get performance metrics
            const performanceMetrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paintEntries = performance.getEntriesByType('paint');
                const resourceEntries = performance.getEntriesByType('resource');

                return {
                    // Navigation timing
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    firstPaint: paintEntries.find(p => p.name === 'first-paint')?.startTime || 0,
                    firstContentfulPaint: paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0,

                    // Resource loading
                    totalResources: resourceEntries.length,
                    resourceTypes: resourceEntries.reduce((acc, resource) => {
                        const type = resource.name.split('.').pop().split('?')[0];
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                    }, {}),

                    // Network performance
                    transferSize: resourceEntries.reduce((sum, r) => sum + (r.transferSize || 0), 0),
                    encodedBodySize: resourceEntries.reduce((sum, r) => sum + (r.encodedBodySize || 0), 0)
                };
            });

            // Test memory usage
            const memoryUsage = await page.evaluate(() => {
                if (performance.memory) {
                    return {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize,
                        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                    };
                }
                return null;
            });

            // Test rendering performance
            const renderingPerformance = await page.evaluate(() => {
                return new Promise((resolve) => {
                    let frameCount = 0;
                    let startTime = performance.now();

                    const countFrame = () => {
                        frameCount++;
                        const currentTime = performance.now();

                        if (currentTime - startTime >= 1000) {
                            resolve({
                                fps: frameCount,
                                frameTime: 1000 / frameCount
                            });
                        } else {
                            requestAnimationFrame(countFrame);
                        }
                    };

                    requestAnimationFrame(countFrame);
                });
            });

            // Test touch responsiveness
            const touchResponsiveness = await page.evaluate(() => {
                return new Promise((resolve) => {
                    const startTime = performance.now();

                    const touchHandler = (e) => {
                        const responseTime = performance.now() - startTime;
                        document.removeEventListener('touchstart', touchHandler);
                        resolve(responseTime);
                    };

                    document.addEventListener('touchstart', touchHandler);

                    // Simulate touch
                    setTimeout(() => {
                        document.removeEventListener('touchstart', touchHandler);
                        resolve(null);
                    }, 1000);

                    // Create a touch event
                    const touch = new TouchEvent('touchstart', {
                        bubbles: true,
                        cancelable: true,
                        touches: [{ clientX: 100, clientY: 100 }]
                    });
                    document.body.dispatchEvent(touch);
                });
            });

            // Evaluate performance scores
            const performanceScore = this.calculatePerformanceScore({
                webVitals,
                performanceMetrics,
                memoryUsage,
                renderingPerformance
            });

            this.testResults.mobilePerformance.push({
                testName: 'Mobile Performance Score',
                passed: performanceScore >= 80,
                score: performanceScore,
                details: {
                    webVitals,
                    performanceMetrics,
                    memoryUsage,
                    renderingPerformance,
                    touchResponsiveness
                }
            });

            this.testResults.mobilePerformance.push({
                testName: 'Core Web Vitals',
                passed: this.evaluateWebVitals(webVitals),
                details: webVitals
            });

            await this.takeScreenshot(page, 'mobile-performance-test');

        } catch (error) {
            console.error('Mobile performance testing error:', error);
            this.testResults.mobilePerformance.push({
                testName: 'Mobile Performance Error',
                passed: false,
                error: error.message
            });
        } finally {
            await context.close();
        }
    }

    async testCameraIntegration(browser) {
        console.log('📸 Testing camera integration...');

        const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
            mobile: true,
            hasTouch: true,
            permissions: ['camera'],
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
        });
        const page = await context.newPage();

        try {
            await page.goto(this.baseURL);
            await page.waitForTimeout(2000);

            // Test camera API availability
            const cameraAPI = await page.evaluate(async () => {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    return { available: false, reason: 'getUserMedia not supported' };
                }

                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                    return {
                        available: true,
                        videoDevices: videoDevices.length,
                        devices: videoDevices.map(d => ({ id: d.deviceId, label: d.label }))
                    };
                } catch (e) {
                    return { available: true, error: e.message };
                }
            });

            // Test file input for camera
            const cameraInputs = await page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="camera"]').all();

            // Test photo capture functionality
            let photoCaptureWorks = false;
            let photoUploadWorks = false;

            if (cameraInputs.length > 0) {
                const fileInput = cameraInputs[0];

                try {
                    // Test file selection
                    const file = {
                        name: 'test-photo.jpg',
                        mimeType: 'image/jpeg',
                        buffer: Buffer.from('fake image data')
                    };

                    await fileInput.setInputFiles(file);
                    photoUploadWorks = true;

                    // Check if preview is shown
                    await page.waitForTimeout(1000);
                    const imagePreview = await page.locator('img[src*="data:"], img[src*="blob:"]').count();
                    photoCaptureWorks = imagePreview > 0;

                } catch (e) {
                    console.log('Photo upload test failed:', e.message);
                }
            }

            // Test image compression functionality
            const imageCompression = await page.evaluate(() => {
                // Check if image compression utilities are loaded
                return typeof window.compressImage !== 'undefined' ||
                       typeof window.ImageCompressor !== 'undefined' ||
                       document.querySelector('script[src*="compressor"]') !== null;
            });

            // Test camera-specific features
            const cameraFeatures = await page.evaluate(() => {
                const features = {
                    hasFileInput: document.querySelector('input[type="file"][accept*="image"]') !== null,
                    hasCameraButton: document.querySelector('[class*="camera"], [class*="photo"], button:has-text("Photo")') !== null,
                    hasImagePreview: document.querySelector('img[src*="data:"], img[src*="blob:"], .image-preview') !== null,
                    maxImages: 5 // Default expected limit
                };

                // Check for multiple image support
                const imageContainers = document.querySelectorAll('[class*="image"], .photo-container');
                features.imageContainers = imageContainers.length;

                return features;
            });

            // Test mobile camera experience
            const mobileCameraExperience = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                const cameraButtons = Array.from(buttons).filter(btn =>
                    btn.textContent?.toLowerCase().includes('camera') ||
                    btn.textContent?.toLowerCase().includes('photo') ||
                    btn.textContent?.toLowerCase().includes('image')
                );

                return {
                    cameraButtonsFound: cameraButtons.length,
                    touchFriendly: cameraButtons.every(btn => {
                        const rect = btn.getBoundingClientRect();
                        return rect.width >= 44 && rect.height >= 44;
                    })
                };
            });

            this.testResults.cameraIntegration.push({
                testName: 'Camera API Support',
                passed: cameraAPI.available,
                details: cameraAPI
            });

            this.testResults.cameraIntegration.push({
                testName: 'Photo Upload',
                passed: photoUploadWorks,
                details: photoUploadWorks ? 'File upload works' : 'File upload failed'
            });

            this.testResults.cameraIntegration.push({
                testName: 'Photo Preview',
                passed: photoCaptureWorks,
                details: photoCaptureWorks ? 'Image preview displayed' : 'No image preview'
            });

            this.testResults.cameraIntegration.push({
                testName: 'Image Compression',
                passed: imageCompression,
                details: imageCompression ? 'Image compression available' : 'No image compression detected'
            });

            this.testResults.cameraIntegration.push({
                testName: 'Camera Features',
                passed: cameraFeatures.hasFileInput,
                details: cameraFeatures
            });

            this.testResults.cameraIntegration.push({
                testName: 'Mobile Camera UX',
                passed: mobileCameraExperience.cameraButtonsFound > 0,
                details: mobileCameraExperience
            });

            await this.takeScreenshot(page, 'camera-integration-test');

        } catch (error) {
            console.error('Camera integration testing error:', error);
            this.testResults.cameraIntegration.push({
                testName: 'Camera Integration Error',
                passed: false,
                error: error.message
            });
        } finally {
            await context.close();
        }
    }

    async testLocationServices(browser) {
        console.log('📍 Testing location services...');

        const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
            mobile: true,
            hasTouch: true,
            permissions: ['geolocation'],
            geolocation: { latitude: 40.7128, longitude: -74.0060 }, // NYC coordinates
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
        });
        const page = await context.newPage();

        try {
            await page.goto(this.baseURL);
            await page.waitForTimeout(2000);

            // Test Geolocation API availability
            const geolocationAPI = await page.evaluate(() => {
                return {
                    available: 'geolocation' in navigator,
                    permissionState: 'unknown' // Will be checked after permission request
                };
            });

            // Test location permission request
            let locationPermissionGranted = false;
            let locationData = null;

            try {
                locationData = await page.evaluate(async () => {
                    if (!navigator.geolocation) {
                        throw new Error('Geolocation not supported');
                    }

                    return new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                resolve({
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                                    accuracy: position.coords.accuracy,
                                    timestamp: position.timestamp
                                });
                            },
                            (error) => {
                                reject(new Error(`Geolocation error: ${error.message}`));
                            },
                            {
                                timeout: 5000,
                                enableHighAccuracy: true
                            }
                        );
                    });
                });

                locationPermissionGranted = true;
            } catch (e) {
                console.log('Location access test:', e.message);
            }

            // Test location-based features in the app
            const locationFeatures = await page.evaluate(() => {
                const locationInputs = document.querySelectorAll('input[name*="location"], input[placeholder*="location"]');
                const locationButtons = document.querySelectorAll('[class*="location"], button:has-text("Location")');
                const gpsButtons = document.querySelectorAll('[class*="gps"], button:has-text("GPS")');

                return {
                    locationInputs: locationInputs.length,
                    locationButtons: locationButtons.length,
                    gpsButtons: gpsButtons.length,
                    hasLocationField: locationInputs.length > 0
                };
            });

            // Test indoor positioning fallbacks
            const indoorPositioning = await page.evaluate(() => {
                // Check for manual location entry
                const manualLocationFields = document.querySelectorAll('input[name*="room"], input[name*="building"], select[name*="floor"]');

                // Check for QR code or NFC support indicators
                const qrCodeFeatures = document.querySelectorAll('[class*="qr"], [class*="qrcode"]');
                const nfcFeatures = document.querySelectorAll('[class*="nfc"]');

                return {
                    manualLocationFields: manualLocationFields.length,
                    qrCodeSupport: qrCodeFeatures.length > 0,
                    nfcSupport: nfcFeatures.length > 0,
                    hasFallbacks: manualLocationFields.length > 0
                };
            });

            // Test location persistence
            const locationPersistence = await page.evaluate(() => {
                try {
                    const testLocation = { lat: 40.7128, lng: -74.0060, building: 'Test Building' };
                    localStorage.setItem('lastLocation', JSON.stringify(testLocation));
                    const retrieved = JSON.parse(localStorage.getItem('lastLocation'));
                    localStorage.removeItem('lastLocation');

                    return {
                        supported: true,
                        working: retrieved && retrieved.lat === testLocation.lat
                    };
                } catch (e) {
                    return { supported: false, error: e.message };
                }
            });

            // Test location accuracy features
            const locationAccuracy = await page.evaluate(() => {
                const accuracyIndicators = document.querySelectorAll('[class*="accuracy"], .accuracy-indicator');
                const gpsStrengthIndicators = document.querySelectorAll('[class*="signal"], [class*="strength"]');

                return {
                    accuracyIndicators: accuracyIndicators.length,
                    signalIndicators: gpsStrengthIndicators.length,
                    hasAccuracyFeatures: accuracyIndicators.length > 0 || gpsStrengthIndicators.length > 0
                };
            });

            this.testResults.locationServices.push({
                testName: 'Geolocation API',
                passed: geolocationAPI.available,
                details: geolocationAPI
            });

            this.testResults.locationServices.push({
                testName: 'Location Permission',
                passed: locationPermissionGranted,
                details: locationPermissionGranted ? 'Permission granted' : 'Permission denied or not requested'
            });

            this.testResults.locationServices.push({
                testName: 'Location Data',
                passed: locationData !== null,
                details: locationData || 'No location data obtained'
            });

            this.testResults.locationServices.push({
                testName: 'Location Features',
                passed: locationFeatures.hasLocationField,
                details: locationFeatures
            });

            this.testResults.locationServices.push({
                testName: 'Indoor Positioning',
                passed: indoorPositioning.hasFallbacks,
                details: indoorPositioning
            });

            this.testResults.locationServices.push({
                testName: 'Location Persistence',
                passed: locationPersistence.supported && locationPersistence.working,
                details: locationPersistence
            });

            this.testResults.locationServices.push({
                testName: 'Location Accuracy',
                passed: locationAccuracy.hasAccuracyFeatures,
                details: locationAccuracy
            });

            await this.takeScreenshot(page, 'location-services-test');

        } catch (error) {
            console.error('Location services testing error:', error);
            this.testResults.locationServices.push({
                testName: 'Location Services Error',
                passed: false,
                error: error.message
            });
        } finally {
            await context.close();
        }
    }

    async testBackgroundSync(browser) {
        console.log('🔄 Testing background sync...');

        const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
            mobile: true,
            hasTouch: true,
            serviceWorkers: 'allow',
            offline: false
        });
        const page = await context.newPage();

        try {
            await page.goto(this.baseURL);
            await page.waitForTimeout(2000);

            // Test background sync API support
            const backgroundSyncAPI = await page.evaluate(() => {
                return {
                    serviceWorkerSupported: 'serviceWorker' in navigator,
                    syncSupported: 'serviceWorker' in navigator &&
                                  'SyncManager' in window,
                    backgroundFetchSupported: 'backgroundFetch' in window
                };
            });

            // Test offline data collection
            console.log('Testing offline data collection...');

            // Fill out a form while online
            await page.fill('input[name*="school"], #school', 'Background Sync Test');
            await page.fill('input[name*="date"], #date', new Date().toISOString().split('T')[0]);
            await page.fill('textarea[name*="notes"], textarea[placeholder*="notes"]', 'Test background sync functionality');

            // Store data locally (simulate offline storage)
            const offlineData = await page.evaluate(() => {
                const formData = {
                    school: 'Background Sync Test',
                    date: new Date().toISOString().split('T')[0],
                    notes: 'Test background sync functionality',
                    timestamp: Date.now(),
                    synced: false
                };

                try {
                    // Store in localStorage
                    localStorage.setItem('pendingInspection', JSON.stringify(formData));

                    // Store in IndexedDB if available
                    if ('indexedDB' in window) {
                        // This would require actual IndexedDB implementation
                        console.log('IndexedDB available for offline storage');
                    }

                    return { success: true, stored: true };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            });

            // Go offline and test data persists
            await page.setOffline(true);
            await page.waitForTimeout(1000);

            // Verify data is still accessible offline
            const offlineDataAccess = await page.evaluate(() => {
                try {
                    const stored = localStorage.getItem('pendingInspection');
                    return {
                        accessible: stored !== null,
                        data: stored ? JSON.parse(stored) : null
                    };
                } catch (e) {
                    return { accessible: false, error: e.message };
                }
            });

            // Test sync queue functionality
            const syncQueue = await page.evaluate(() => {
                try {
                    // Check for sync queue indicators
                    const syncIndicators = document.querySelectorAll('[class*="sync"], .sync-status');
                    const pendingIndicators = document.querySelectorAll('[class*="pending"], .pending-sync');
                    const offlineIndicators = document.querySelectorAll('[class*="offline"], .offline-mode');

                    return {
                        syncIndicators: syncIndicators.length,
                        pendingIndicators: pendingIndicators.length,
                        offlineIndicators: offlineIndicators.length,
                        hasSyncUI: syncIndicators.length > 0 || pendingIndicators.length > 0
                    };
                } catch (e) {
                    return { error: e.message };
                }
            });

            // Test sync on reconnection
            console.log('Testing sync on reconnection...');

            // Add more data while offline
            const additionalOfflineData = await page.evaluate(() => {
                const additionalData = {
                    additionalField: 'Added while offline',
                    timestamp: Date.now(),
                    synced: false
                };

                try {
                    const existing = JSON.parse(localStorage.getItem('pendingInspection') || '{}');
                    const updated = { ...existing, ...additionalData };
                    localStorage.setItem('pendingInspection', JSON.stringify(updated));
                    return { success: true };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            });

            // Go back online
            await page.setOffline(false);
            await page.waitForTimeout(2000);

            // Test automatic sync trigger
            const syncTrigger = await page.evaluate(() => {
                // Check if sync is triggered automatically
                const syncStatus = document.querySelector('.sync-status, [data-sync-status]');
                const successMessages = document.querySelectorAll('[class*="success"], .sync-success');

                return {
                    syncStatusElement: syncStatus !== null,
                    successMessages: successMessages.length,
                    automaticSyncDetected: successMessages.length > 0
                };
            });

            // Test conflict resolution
            const conflictResolution = await page.evaluate(() => {
                // Check for conflict resolution UI
                const conflictDialogs = document.querySelectorAll('[class*="conflict"], .sync-conflict');
                const resolutionOptions = document.querySelectorAll('[class*="resolve"], .conflict-resolution');

                return {
                    conflictDialogs: conflictDialogs.length,
                    resolutionOptions: resolutionOptions.length,
                    hasConflictResolution: conflictDialogs.length > 0
                };
            });

            this.testResults.backgroundSync.push({
                testName: 'Background Sync API',
                passed: backgroundSyncAPI.serviceWorkerSupported,
                details: backgroundSyncAPI
            });

            this.testResults.backgroundSync.push({
                testName: 'Offline Data Collection',
                passed: offlineData.success && offlineData.stored,
                details: offlineData
            });

            this.testResults.backgroundSync.push({
                testName: 'Offline Data Access',
                passed: offlineDataAccess.accessible,
                details: offlineDataAccess
            });

            this.testResults.backgroundSync.push({
                testName: 'Sync Queue',
                passed: syncQueue.hasSyncUI,
                details: syncQueue
            });

            this.testResults.backgroundSync.push({
                testName: 'Sync on Reconnection',
                passed: additionalOfflineData.success && syncTrigger.automaticSyncDetected,
                details: { additionalOfflineData, syncTrigger }
            });

            this.testResults.backgroundSync.push({
                testName: 'Conflict Resolution',
                passed: conflictResolution.hasConflictResolution,
                details: conflictResolution
            });

            await this.takeScreenshot(page, 'background-sync-test');

        } catch (error) {
            console.error('Background sync testing error:', error);
            this.testResults.backgroundSync.push({
                testName: 'Background Sync Error',
                passed: false,
                error: error.message
            });
        } finally {
            await context.close();
        }
    }

    async testMobileAccessibility(browser) {
        console.log('♿ Testing mobile accessibility...');

        const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
            mobile: true,
            hasTouch: true
        });
        const page = await context.newPage();

        try {
            await page.goto(this.baseURL);
            await page.waitForTimeout(2000);

            // Test touch target accessibility
            const touchTargets = await page.evaluate(() => {
                const interactiveElements = Array.from(document.querySelectorAll(
                    'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
                ));

                const smallTargets = interactiveElements.filter(element => {
                    const rect = element.getBoundingClientRect();
                    return rect.width < 44 || rect.height < 44;
                });

                const closelySpaced = [];
                for (let i = 0; i < interactiveElements.length - 1; i++) {
                    const rect1 = interactiveElements[i].getBoundingClientRect();
                    const rect2 = interactiveElements[i + 1].getBoundingClientRect();

                    const horizontalSpacing = Math.abs(rect1.left - rect2.left);
                    const verticalSpacing = Math.abs(rect1.top - rect2.top);

                    if ((horizontalSpacing < 8 && horizontalSpacing > 0) ||
                        (verticalSpacing < 8 && verticalSpacing > 0)) {
                        closelySpaced.push(i);
                    }
                }

                return {
                    totalInteractive: interactiveElements.length,
                    smallTargets: smallTargets.length,
                    closelySpaced: closelySpaced.length,
                    touchAccessible: smallTargets.length === 0 && closelySpaced.length === 0
                };
            });

            // Test mobile keyboard navigation
            const keyboardNavigation = await page.evaluate(() => {
                const focusableElements = Array.from(document.querySelectorAll(
                    'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
                ));

                let currentFocusIndex = 0;
                const navigationSequence = [];

                // Simulate Tab navigation
                for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
                    focusableElements[i].focus();
                    if (document.activeElement === focusableElements[i]) {
                        navigationSequence.push({
                            element: focusableElements[i].tagName,
                            visible: focusableElements[i].offsetWidth > 0 && focusableElements[i].offsetHeight > 0,
                            index: i
                        });
                    }
                }

                return {
                    focusableElements: focusableElements.length,
                    navigableElements: navigationSequence.length,
                    keyboardAccessible: navigationSequence.length > 0
                };
            });

            // Test mobile screen reader compatibility
            const screenReaderSupport = await page.evaluate(() => {
                // Check for ARIA labels and roles
                const ariaLabels = document.querySelectorAll('[aria-label], [aria-labelledby]');
                const ariaRoles = document.querySelectorAll('[role]');
                const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                const landmarks = document.querySelectorAll('header, nav, main, section, article, aside, footer');

                // Check for form labels
                const inputs = document.querySelectorAll('input, textarea, select');
                const labeledInputs = Array.from(inputs).filter(input => {
                    const label = document.querySelector(`label[for="${input.id}"]`);
                    const ariaLabel = input.getAttribute('aria-label');
                    const ariaLabelledBy = input.getAttribute('aria-labelledby');
                    const placeholder = input.getAttribute('placeholder');

                    return label || ariaLabel || ariaLabelledBy || placeholder;
                });

                return {
                    ariaLabels: ariaLabels.length,
                    ariaRoles: ariaRoles.length,
                    headings: headings.length,
                    landmarks: landmarks.length,
                    totalInputs: inputs.length,
                    labeledInputs: labeledInputs.length,
                    screenReaderReady: ariaLabels.length > 0 && headings.length > 0
                };
            });

            // Test color contrast for mobile
            const colorContrast = await page.evaluate(() => {
                const textElements = Array.from(document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, label'));

                let lowContrastElements = 0;
                let totalTextElements = 0;

                textElements.forEach(element => {
                    const styles = window.getComputedStyle(element);
                    const fontSize = parseFloat(styles.fontSize);
                    const fontWeight = styles.fontWeight;

                    // Only check visible text elements
                    if (element.offsetWidth > 0 && element.offsetHeight > 0 &&
                        element.textContent.trim().length > 0) {

                        totalTextElements++;

                        // Simple contrast check (would need actual calculation for production)
                        const color = styles.color;
                        const backgroundColor = styles.backgroundColor;

                        // This is a simplified check - real contrast calculation would be more complex
                        if (color === backgroundColor ||
                            (color.includes('rgba(0, 0, 0, 0') && backgroundColor.includes('rgba(0, 0, 0, 0'))) {
                            lowContrastElements++;
                        }
                    }
                });

                return {
                    totalTextElements,
                    lowContrastElements,
                    contrastRatio: totalTextElements > 0 ? ((totalTextElements - lowContrastElements) / totalTextElements) * 100 : 100
                };
            });

            // Test mobile gesture accessibility
            const gestureAccessibility = await page.evaluate(() => {
                // Check for alternative input methods
                const swipeAlternatives = document.querySelectorAll('[class*="swipe-alternative"], .swipe-alt');
                const touchAlternatives = document.querySelectorAll('[aria-label*="swipe"], [title*="swipe"]');
                const keyboardAlternatives = document.querySelectorAll('[class*="keyboard"], .keyboard-shortcut');

                return {
                    swipeAlternatives: swipeAlternatives.length,
                    touchAlternatives: touchAlternatives.length,
                    keyboardAlternatives: keyboardAlternatives.length,
                    hasGestureAlternatives: swipeAlternatives.length > 0 || touchAlternatives.length > 0
                };
            });

            // Test mobile viewport accessibility
            const viewportAccessibility = await page.evaluate(() => {
                const viewport = document.querySelector('meta[name="viewport"]');
                const scalable = viewport?.getAttribute('user-scalable') !== 'no';
                const maximumScale = parseFloat(viewport?.getAttribute('maximum-scale') || '10');

                // Check for readable text sizes
                const textElements = Array.from(document.querySelectorAll('p, li, span, div'));
                const readableText = textElements.filter(el => {
                    const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
                    return fontSize >= 16; // WCAG recommendation for mobile
                });

                return {
                    viewportMeta: viewport !== null,
                    scalable,
                    maximumScale,
                    totalTextElements: textElements.length,
                    readableTextElements: readableText.length,
                    readabilityScore: textElements.length > 0 ? (readableText.length / textElements.length) * 100 : 0
                };
            });

            this.testResults.accessibilityMobile.push({
                testName: 'Touch Target Accessibility',
                passed: touchTargets.touchAccessible,
                details: touchTargets
            });

            this.testResults.accessibilityMobile.push({
                testName: 'Keyboard Navigation',
                passed: keyboardNavigation.keyboardAccessible,
                details: keyboardNavigation
            });

            this.testResults.accessibilityMobile.push({
                testName: 'Screen Reader Support',
                passed: screenReaderSupport.screenReaderReady,
                details: screenReaderSupport
            });

            this.testResults.accessibilityMobile.push({
                testName: 'Color Contrast',
                passed: colorContrast.contrastRatio >= 90,
                details: colorContrast
            });

            this.testResults.accessibilityMobile.push({
                testName: 'Gesture Accessibility',
                passed: gestureAccessibility.hasGestureAlternatives,
                details: gestureAccessibility
            });

            this.testResults.accessibilityMobile.push({
                testName: 'Viewport Accessibility',
                passed: viewportAccessibility.viewportMeta && viewportAccessibility.scalable,
                details: viewportAccessibility
            });

            await this.takeScreenshot(page, 'mobile-accessibility-test');

        } catch (error) {
            console.error('Mobile accessibility testing error:', error);
            this.testResults.accessibilityMobile.push({
                testName: 'Mobile Accessibility Error',
                passed: false,
                error: error.message
            });
        } finally {
            await context.close();
        }
    }

    async testDeviceCompatibility(browser) {
        console.log('📱 Testing device compatibility...');

        for (const device of this.mobileDevices) {
            console.log(`Testing device compatibility for ${device.name}...`);

            const context = await browser.newContext({
                viewport: { width: device.width, height: device.height },
                userAgent: this.getUserAgent(device),
                mobile: device.width < 768,
                hasTouch: true,
                deviceScaleFactor: device.width >= 768 ? 1 : 2 // Higher DPI for phones
            });
            const page = await context.newPage();

            try {
                // Test basic functionality
                await page.goto(this.baseURL, { waitUntil: 'networkidle' });
                await page.waitForTimeout(2000);

                // Test page load and rendering
                const pageLoadTest = await page.evaluate(() => {
                    return {
                        title: document.title,
                        hasContent: document.body.innerText.length > 100,
                        hasErrors: document.body.innerText.toLowerCase().includes('error'),
                        renderComplete: document.readyState === 'complete'
                    };
                });

                // Test device-specific features
                const deviceFeatures = await page.evaluate((deviceInfo) => {
                    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
                    const isAndroid = /Android/.test(navigator.userAgent);

                    return {
                        isIOS,
                        isAndroid,
                        touchSupported: 'ontouchstart' in window,
                        devicePixelRatio: window.devicePixelRatio || 1,
                        screenOrientation: screen.orientation?.type || 'unknown',
                        viewportWidth: window.innerWidth,
                        viewportHeight: window.innerHeight
                    };
                }, device);

                // Test mobile-specific UI elements
                const mobileUIElements = await page.evaluate(() => {
                    const mobileMenu = document.querySelector('[class*="mobile"], [class*="menu"]');
                    const hamburgerMenu = document.querySelector('[class*="hamburger"], .menu-toggle');
                    const backButtons = document.querySelectorAll('[class*="back"], .back-button');
                    const mobileNavigation = document.querySelector('[class*="mobile-nav"], .mobile-navigation');

                    return {
                        hasMobileMenu: !!mobileMenu,
                        hasHamburgerMenu: !!hamburgerMenu,
                        backButtonsCount: backButtons.length,
                        hasMobileNavigation: !!mobileNavigation
                    };
                });

                // Test touch interactions specific to device
                const touchTest = await page.evaluate(() => {
                    const interactiveElements = document.querySelectorAll('button, a, input, [role="button"]');
                    let touchResponsiveElements = 0;

                    interactiveElements.forEach(element => {
                        const rect = element.getBoundingClientRect();
                        // Check if element is large enough for touch on this device
                        if (rect.width >= 44 && rect.height >= 44) {
                            touchResponsiveElements++;
                        }
                    });

                    return {
                        totalInteractive: interactiveElements.length,
                        touchResponsive: touchResponsiveElements,
                        touchResponsiveRatio: interactiveElements.length > 0 ? touchResponsiveElements / interactiveElements.length : 1
                    };
                });

                // Test performance on device
                const performanceTest = await page.evaluate(() => {
                    const startTime = performance.now();

                    // Simple performance test
                    let counter = 0;
                    for (let i = 0; i < 1000; i++) {
                        counter += i;
                    }

                    const endTime = performance.now();

                    return {
                        computationTime: endTime - startTime,
                        memoryUsed: performance.memory ? performance.memory.usedJSHeapSize : null,
                        devicePerformance: endTime - startTime < 10 // Good performance if under 10ms
                    };
                });

                // Test form inputs on mobile
                const mobileFormTest = await page.evaluate(() => {
                    const inputs = document.querySelectorAll('input, textarea, select');
                    const numberInputs = document.querySelectorAll('input[type="number"], input[type="tel"], input[type="email"]');
                    const dateInputs = document.querySelectorAll('input[type="date"], input[type="datetime-local"]');
                    const fileInputs = document.querySelectorAll('input[type="file"]');

                    return {
                        totalInputs: inputs.length,
                        numberInputs: numberInputs.length,
                        dateInputs: dateInputs.length,
                        fileInputs: fileInputs.length,
                        mobileOptimized: numberInputs.length > 0 || dateInputs.length > 0
                    };
                });

                // Calculate device compatibility score
                const compatibilityScore = this.calculateDeviceCompatibility({
                    pageLoadTest,
                    deviceFeatures,
                    mobileUIElements,
                    touchTest,
                    performanceTest,
                    mobileFormTest
                });

                this.testResults.deviceCompatibility.push({
                    deviceName: device.name,
                    resolution: `${device.width}x${device.height}`,
                    passed: compatibilityScore >= 80,
                    score: compatibilityScore,
                    details: {
                        pageLoadTest,
                        deviceFeatures,
                        mobileUIElements,
                        touchTest,
                        performanceTest,
                        mobileFormTest
                    }
                });

                await this.takeScreenshot(page, `device-${device.name.toLowerCase().replace(/\s+/g, '-')}`);

            } catch (error) {
                console.error(`Device compatibility testing error for ${device.name}:`, error);
                this.testResults.deviceCompatibility.push({
                    deviceName: device.name,
                    passed: false,
                    error: error.message
                });
            } finally {
                await context.close();
            }
        }
    }

    getUserAgent(device) {
        const userAgents = {
            'iPhone SE': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
            'iPhone 12': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
            'iPhone 14 Pro Max': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'iPad': 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
            'Android Mobile': 'Mozilla/5.0 (Linux; Android 11; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
            'Android Large': 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.101 Mobile Safari/537.36'
        };

        return userAgents[device.name] || `Mozilla/5.0 (${device.userAgent})`;
    }

    calculatePerformanceScore(metrics) {
        let score = 0;
        let maxScore = 100;

        // Web Vitals scoring (40 points)
        if (metrics.webVitals.LCP && metrics.webVitals.LCP < 2500) score += 15;
        else if (metrics.webVitals.LCP && metrics.webVitals.LCP < 4000) score += 10;

        if (metrics.webVitals.FID && metrics.webVitals.FID < 100) score += 15;
        else if (metrics.webVitals.FID && metrics.webVitals.FID < 300) score += 10;

        if (metrics.webVitals.CLS && metrics.webVitals.CLS < 0.1) score += 10;
        else if (metrics.webVitals.CLS && metrics.webVitals.CLS < 0.25) score += 5;

        // Load performance (30 points)
        if (metrics.performanceMetrics.domContentLoaded < 1500) score += 15;
        else if (metrics.performanceMetrics.domContentLoaded < 3000) score += 10;

        if (metrics.performanceMetrics.firstContentfulPaint < 1800) score += 15;
        else if (metrics.performanceMetrics.firstContentfulPaint < 3000) score += 10;

        // Memory usage (15 points)
        if (metrics.memoryUsage && metrics.memoryUsage.usedJSHeapSize < 50 * 1024 * 1024) score += 15;
        else if (metrics.memoryUsage && metrics.memoryUsage.usedJSHeapSize < 100 * 1024 * 1024) score += 10;

        // Rendering performance (15 points)
        if (metrics.renderingPerformance && metrics.renderingPerformance.fps >= 55) score += 15;
        else if (metrics.renderingPerformance && metrics.renderingPerformance.fps >= 30) score += 10;

        return Math.min(score, maxScore);
    }

    evaluateWebVitals(webVitals) {
        if (!webVitals.LCP || !webVitals.FID || !webVitals.CLS) return false;

        return (
            webVitals.LCP < 2500 && // Good LCP
            webVitals.FID < 100 &&  // Good FID
            webVitals.CLS < 0.1     // Good CLS
        );
    }

    calculateDeviceCompatibility(metrics) {
        let score = 0;
        const maxScore = 100;

        // Page load success (20 points)
        if (metrics.pageLoadTest.renderComplete && !metrics.pageLoadTest.hasErrors) {
            score += 20;
        }

        // Device features (20 points)
        if (metrics.deviceFeatures.touchSupported) score += 10;
        if (metrics.deviceFeatures.devicePixelRatio >= 1) score += 10;

        // Mobile UI (20 points)
        if (metrics.mobileUIElements.hasMobileMenu || metrics.mobileUIElements.hasHamburgerMenu) score += 10;
        if (metrics.mobileUIElements.backButtonsCount > 0) score += 10;

        // Touch responsiveness (20 points)
        if (metrics.touchTest.touchResponsiveRatio >= 0.8) score += 20;
        else if (metrics.touchTest.touchResponsiveRatio >= 0.6) score += 15;
        else if (metrics.touchTest.touchResponsiveRatio >= 0.4) score += 10;

        // Performance (10 points)
        if (metrics.performanceTest.devicePerformance) score += 10;
        else if (metrics.performanceTest.computationTime < 50) score += 5;

        // Mobile forms (10 points)
        if (metrics.mobileFormTest.mobileOptimized) score += 10;
        else if (metrics.mobileFormTest.totalInputs > 0) score += 5;

        return Math.min(score, maxScore);
    }

    async takeScreenshot(page, name) {
        try {
            const screenshotPath = `mobile-test-results/${name}.png`;
            await page.screenshot({
                fullPage: true,
                path: screenshotPath
            });
            this.screenshots[name] = screenshotPath;
            console.log(`📸 Screenshot saved: ${screenshotPath}`);
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
            summary: this.generateSummary(),
            results: this.testResults,
            screenshots: this.screenshots,
            recommendations: this.generateRecommendations()
        };

        // Save comprehensive mobile PWA report
        fs.writeFileSync('mobile-test-results/comprehensive-mobile-pwa-test-report.json', JSON.stringify(report, null, 2));

        // Generate markdown report
        const markdownReport = this.generateMarkdownReport(report);
        fs.writeFileSync('mobile-test-results/comprehensive-mobile-pwa-test-report.md', markdownReport);

        // Save to Obsidian vault
        const obsidianPath = '/Volumes/Extreme SSD/Obsidian/Mobile PWA Testing Report.md';
        fs.writeFileSync(obsidianPath, markdownReport);

        console.log('\n📊 Comprehensive Mobile PWA Testing Complete!');
        console.log(`⏱️ Total test time: ${totalTime}ms`);
        console.log(`📸 Screenshots taken: ${Object.keys(this.screenshots).length}`);
        console.log('\n📄 Reports saved to:');
        console.log('- mobile-test-results/comprehensive-mobile-pwa-test-report.json');
        console.log('- mobile-test-results/comprehensive-mobile-pwa-test-report.md');
        console.log('- /Volumes/Extreme SSD/Obsidian/Mobile PWA Testing Report.md');
    }

    generateSummary() {
        const summary = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            categoryResults: {}
        };

        // Count tests by category
        Object.entries(this.testResults).forEach(([category, tests]) => {
            if (Array.isArray(tests)) {
                const categoryPassed = tests.filter(test => test.passed).length;
                const categoryTotal = tests.length;

                summary.categoryResults[category] = {
                    passed: categoryPassed,
                    total: categoryTotal,
                    score: categoryTotal > 0 ? Math.round((categoryPassed / categoryTotal) * 100) : 0
                };

                summary.totalTests += categoryTotal;
                summary.passedTests += categoryPassed;
            }
        });

        summary.failedTests = summary.totalTests - summary.passedTests;
        summary.overallScore = summary.totalTests > 0 ? Math.round((summary.passedTests / summary.totalTests) * 100) : 0;

        return summary;
    }

    generateRecommendations() {
        const recommendations = [];
        const summary = this.generateSummary();

        // Analyze PWA Installation
        const pwaResults = this.testResults.pwaInstallation || [];
        const pwaIssues = pwaResults.filter(test => !test.passed);

        if (pwaIssues.length > 0) {
            recommendations.push({
                category: 'PWA Installation',
                priority: 'High',
                issue: 'PWA installation features incomplete',
                recommendation: 'Add service worker registration, create proper manifest, implement install prompts',
                affectedTests: pwaIssues.map(t => t.testName)
            });
        }

        // Analyze Touch Interactions
        const touchResults = this.testResults.touchInteractions || [];
        const touchIssues = touchResults.filter(test => !test.passed);

        if (touchIssues.length > 0) {
            recommendations.push({
                category: 'Touch Interactions',
                priority: 'High',
                issue: 'Touch interaction barriers detected',
                recommendation: 'Ensure all touch targets are at least 44px x 44px, add proper touch feedback, implement mobile-specific gestures',
                affectedTests: touchIssues.map(t => t.testName)
            });
        }

        // Analyze Responsive Design
        const responsiveResults = this.testResults.responsiveDesign || [];
        const responsiveIssues = responsiveResults.filter(test => !test.passed);

        if (responsiveIssues.length > 0) {
            recommendations.push({
                category: 'Responsive Design',
                priority: 'High',
                issue: 'Responsive design issues on mobile devices',
                recommendation: 'Implement proper viewport meta tags, ensure readable font sizes, prevent horizontal scrolling',
                affectedTests: responsiveIssues.map(t => `${t.deviceName} (${t.resolution})`)
            });
        }

        // Analyze Offline Functionality
        const offlineResults = this.testResults.offlineFunctionality || [];
        const offlineIssues = offlineResults.filter(test => !test.passed);

        if (offlineIssues.length > 0) {
            recommendations.push({
                category: 'Offline Functionality',
                priority: 'Critical',
                issue: 'Offline functionality limitations',
                recommendation: 'Implement service worker caching, add offline form support, enable data persistence',
                affectedTests: offlineIssues.map(t => t.testName)
            });
        }

        // Analyze Mobile Performance
        const performanceResults = this.testResults.mobilePerformance || [];
        const performanceIssues = performanceResults.filter(test => !test.passed);

        if (performanceIssues.length > 0) {
            recommendations.push({
                category: 'Mobile Performance',
                priority: 'High',
                issue: 'Mobile performance optimization needed',
                recommendation: 'Optimize images for mobile, reduce JavaScript bundle size, implement lazy loading, improve Core Web Vitals',
                affectedTests: performanceIssues.map(t => t.testName)
            });
        }

        // Analyze Camera Integration
        const cameraResults = this.testResults.cameraIntegration || [];
        const cameraIssues = cameraResults.filter(test => !test.passed);

        if (cameraIssues.length > 0) {
            recommendations.push({
                category: 'Camera Integration',
                priority: 'Medium',
                issue: 'Camera integration incomplete',
                recommendation: 'Add proper file input handling, implement image compression, add photo preview functionality',
                affectedTests: cameraIssues.map(t => t.testName)
            });
        }

        // Analyze Location Services
        const locationResults = this.testResults.locationServices || [];
        const locationIssues = locationResults.filter(test => !test.passed);

        if (locationIssues.length > 0) {
            recommendations.push({
                category: 'Location Services',
                priority: 'Medium',
                issue: 'Location services integration limited',
                recommendation: 'Implement geolocation API integration, add indoor positioning fallbacks, enable location tagging',
                affectedTests: locationIssues.map(t => t.testName)
            });
        }

        // Analyze Background Sync
        const syncResults = this.testResults.backgroundSync || [];
        const syncIssues = syncResults.filter(test => !test.passed);

        if (syncIssues.length > 0) {
            recommendations.push({
                category: 'Background Sync',
                priority: 'Medium',
                issue: 'Background sync functionality missing',
                recommendation: 'Implement background sync API, add offline data queuing, enable automatic sync on reconnection',
                affectedTests: syncResults.map(t => t.testName)
            });
        }

        // Analyze Mobile Accessibility
        const accessibilityResults = this.testResults.accessibilityMobile || [];
        const accessibilityIssues = accessibilityResults.filter(test => !test.passed);

        if (accessibilityIssues.length > 0) {
            recommendations.push({
                category: 'Mobile Accessibility',
                priority: 'High',
                issue: 'Mobile accessibility barriers detected',
                recommendation: 'Improve touch target sizes, add proper ARIA labels, ensure keyboard navigation, check color contrast',
                affectedTests: accessibilityIssues.map(t => t.testName)
            });
        }

        // Analyze Device Compatibility
        const deviceResults = this.testResults.deviceCompatibility || [];
        const deviceIssues = deviceResults.filter(test => !test.passed);

        if (deviceIssues.length > 0) {
            recommendations.push({
                category: 'Device Compatibility',
                priority: 'High',
                issue: 'Device compatibility issues detected',
                recommendation: 'Test on specific problematic devices, implement device-specific optimizations, ensure cross-platform compatibility',
                affectedTests: deviceIssues.map(t => `${t.deviceName} (${t.resolution})`)
            });
        }

        // Overall recommendations based on score
        if (summary.overallScore < 70) {
            recommendations.push({
                category: 'Overall Mobile PWA Quality',
                priority: 'Critical',
                issue: `Overall mobile PWA score is ${summary.overallScore}% (below 70%)`,
                recommendation: 'Comprehensive mobile optimization needed. Focus on PWA features, responsive design, and touch interactions.',
                affectedTests: ['Overall mobile experience']
            });
        } else if (summary.overallScore < 85) {
            recommendations.push({
                category: 'Overall Mobile PWA Quality',
                priority: 'Medium',
                issue: `Overall mobile PWA score is ${summary.overallScore}% (room for improvement)`,
                recommendation: 'Mobile experience is good but can be improved. Focus on the specific issues identified above.',
                affectedTests: ['Overall mobile experience']
            });
        }

        return recommendations;
    }

    generateMarkdownReport(report) {
        const { metadata, summary, results, screenshots, recommendations } = report;

        return `# Comprehensive Mobile PWA Test Report - Custodial Command

## Test Summary
- **Site URL**: ${metadata.siteURL}
- **Test Date**: ${metadata.testDate}
- **Total Test Time**: ${metadata.totalTestTime}ms
- **Screenshots Taken**: ${metadata.screenshotsTaken}
- **Overall Score**: ${summary.overallScore}%
- **Total Tests**: ${summary.totalTests}
- **Passed**: ${summary.passedTests}
- **Failed**: ${summary.failedTests}

## Category Results

### PWA Installation Features
${this.generateCategoryMarkdown(summary.categoryResults.pwaInstallation || {}, results.pwaInstallation || [])}

### Touch Interactions
${this.generateCategoryMarkdown(summary.categoryResults.touchInteractions || {}, results.touchInteractions || [])}

### Responsive Design
${this.generateCategoryMarkdown(summary.categoryResults.responsiveDesign || {}, results.responsiveDesign || [])}

### Offline Functionality
${this.generateCategoryMarkdown(summary.categoryResults.offlineFunctionality || {}, results.offlineFunctionality || [])}

### Mobile Performance
${this.generateCategoryMarkdown(summary.categoryResults.mobilePerformance || {}, results.mobilePerformance || [])}

### Camera Integration
${this.generateCategoryMarkdown(summary.categoryResults.cameraIntegration || {}, results.cameraIntegration || [])}

### Location Services
${this.generateCategoryMarkdown(summary.categoryResults.locationServices || {}, results.locationServices || [])}

### Background Sync
${this.generateCategoryMarkdown(summary.categoryResults.backgroundSync || {}, results.backgroundSync || [])}

### Mobile Accessibility
${this.generateCategoryMarkdown(summary.categoryResults.accessibilityMobile || {}, results.accessibilityMobile || [])}

### Device Compatibility
${this.generateCategoryMarkdown(summary.categoryResults.deviceCompatibility || {}, results.deviceCompatibility || [])}

## Detailed Test Results

### PWA Installation Tests
${this.generateDetailedTestMarkdown(results.pwaInstallation || [], 'PWA Installation')}

### Touch Interaction Tests
${this.generateDetailedTestMarkdown(results.touchInteractions || [], 'Touch Interactions')}

### Responsive Design Tests
${this.generateDetailedTestMarkdown(results.responsiveDesign || [], 'Responsive Design')}

### Offline Functionality Tests
${this.generateDetailedTestMarkdown(results.offlineFunctionality || [], 'Offline Functionality')}

### Mobile Performance Tests
${this.generateDetailedTestMarkdown(results.mobilePerformance || [], 'Mobile Performance')}

### Camera Integration Tests
${this.generateDetailedTestMarkdown(results.cameraIntegration || [], 'Camera Integration')}

### Location Services Tests
${this.generateDetailedTestMarkdown(results.locationServices || [], 'Location Services')}

### Background Sync Tests
${this.generateDetailedTestMarkdown(results.backgroundSync || [], 'Background Sync')}

### Mobile Accessibility Tests
${this.generateDetailedTestMarkdown(results.accessibilityMobile || [], 'Mobile Accessibility')}

### Device Compatibility Tests
${this.generateDetailedTestMarkdown(results.deviceCompatibility || [], 'Device Compatibility')}

## Recommendations

${recommendations.map(rec => `
### ${rec.category} (${rec.priority})
- **Issue**: ${rec.issue}
- **Recommendation**: ${rec.recommendation}
- **Affected Tests**: ${rec.affectedTests.join(', ')}
`).join('')}

## Screenshots

${Object.entries(screenshots).map(([name, path]) => `
### ${name}
![](${path})
`).join('')}

## Next Steps

1. **Critical Issues**: Address all critical priority recommendations immediately
2. **High Priority**: Focus on high-priority items to improve mobile experience
3. **Medium Priority**: Implement medium-priority improvements for better PWA functionality
4. **Testing**: Regular testing on actual mobile devices recommended
5. **Monitoring**: Implement mobile performance monitoring in production

## Device-Specific Notes

${results.deviceCompatibility?.map(device => `
### ${device.deviceName} (${device.resolution})
- **Compatibility Score**: ${device.score}%
- **Status**: ${device.passed ? '✅ Compatible' : '❌ Issues detected'}
${device.details ? `- **Details**: Device-specific testing completed with focus on ${device.details.deviceFeatures?.isIOS ? 'iOS' : 'Android'} optimizations` : ''}
`).join('') || '- No device compatibility tests completed'}

---

*Report generated by Comprehensive Mobile PWA Test Suite*
*Test Date: ${new Date().toLocaleString()}*
*Total Testing Duration: ${Math.round(metadata.totalTestTime / 1000)} seconds*
`;
    }

    generateCategoryMarkdown(categoryResults, testResults) {
        if (!testResults || testResults.length === 0) {
            return '- No tests run in this category';
        }

        return `
- **Score**: ${categoryResults.score}% (${categoryResults.passed}/${categoryResults.total} tests passed)
- **Status**: ${categoryResults.score >= 80 ? '✅ Good' : categoryResults.score >= 60 ? '⚠️ Needs Improvement' : '❌ Poor'}
${testResults.map(test => `
  - **${test.testName}**: ${test.passed ? '✅ Passed' : '❌ Failed'}${test.details ? ` - ${test.details}` : ''}`).join('')}
`;
    }

    generateDetailedTestMarkdown(testResults, categoryName) {
        if (!testResults || testResults.length === 0) {
            return `### ${categoryName}\nNo tests run in this category.\n`;
        }

        return `
### ${categoryName}
${testResults.map(test => `
#### ${test.testName}
- **Status**: ${test.passed ? '✅ Passed' : '❌ Failed'}
${test.details ? `- **Details**: ${JSON.stringify(test.details, null, 2)}` : ''}
${test.error ? `- **Error**: ${test.error}` : ''}
${test.score ? `- **Score**: ${test.score}%` : ''}
`).join('')}
`;
    }
}

// Create test-results directory if it doesn't exist
if (!fs.existsSync('mobile-test-results')) {
    fs.mkdirSync('mobile-test-results');
}

// Run the comprehensive mobile PWA test suite
const tester = new MobilePWATester();
tester.runAllTests().catch(console.error);