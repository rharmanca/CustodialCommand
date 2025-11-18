import { test } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const APP_URL = 'https://cacustodialcommand.up.railway.app';

test.describe('Lighthouse Performance Audit', () => {

  test('Desktop Lighthouse Audit', async () => {
    console.log('\n=== Running Lighthouse Audit (Desktop) ===');

    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu'],
    });

    const options = {
      logLevel: 'info' as const,
      output: 'json' as const,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
      formFactor: 'desktop' as const,
      screenEmulation: {
        mobile: false,
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttling: {
        rttMs: 40,
        throughputKbps: 10 * 1024,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    };

    const runnerResult = await lighthouse(APP_URL, options);

    if (!runnerResult) {
      throw new Error('Lighthouse audit failed');
    }

    const { lhr } = runnerResult;

    console.log('\n=== Lighthouse Scores (Desktop) ===');
    console.log(`Performance: ${(lhr.categories.performance.score! * 100).toFixed(0)}/100`);
    console.log(`Accessibility: ${(lhr.categories.accessibility.score! * 100).toFixed(0)}/100`);
    console.log(`Best Practices: ${(lhr.categories['best-practices'].score! * 100).toFixed(0)}/100`);
    console.log(`SEO: ${(lhr.categories.seo.score! * 100).toFixed(0)}/100`);

    console.log('\n=== Performance Metrics (Desktop) ===');
    const metrics = lhr.audits;
    console.log(`First Contentful Paint: ${metrics['first-contentful-paint'].displayValue}`);
    console.log(`Largest Contentful Paint: ${metrics['largest-contentful-paint'].displayValue}`);
    console.log(`Total Blocking Time: ${metrics['total-blocking-time'].displayValue}`);
    console.log(`Cumulative Layout Shift: ${metrics['cumulative-layout-shift'].displayValue}`);
    console.log(`Speed Index: ${metrics['speed-index'].displayValue}`);
    console.log(`Time to Interactive: ${metrics['interactive'].displayValue}`);

    console.log('\n=== Opportunities (Desktop) ===');
    const opportunities = Object.values(lhr.audits)
      .filter((audit: any) => audit.details?.type === 'opportunity' && audit.score !== null && audit.score < 1)
      .sort((a: any, b: any) => (b.details?.overallSavingsMs || 0) - (a.details?.overallSavingsMs || 0))
      .slice(0, 5);

    opportunities.forEach((opp: any) => {
      const savings = opp.details?.overallSavingsMs
        ? ` (Save ~${(opp.details.overallSavingsMs / 1000).toFixed(2)}s)`
        : '';
      console.log(`  - ${opp.title}${savings}`);
    });

    console.log('\n=== Diagnostics (Desktop) ===');
    const diagnostics = Object.values(lhr.audits)
      .filter((audit: any) => audit.details?.type === 'diagnostic' && audit.score !== null && audit.score < 1)
      .slice(0, 5);

    diagnostics.forEach((diag: any) => {
      console.log(`  - ${diag.title}`);
    });

    await chrome.kill();
  });

  test('Mobile Lighthouse Audit', async () => {
    console.log('\n=== Running Lighthouse Audit (Mobile) ===');

    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu'],
    });

    const options = {
      logLevel: 'info' as const,
      output: 'json' as const,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
      formFactor: 'mobile' as const,
      screenEmulation: {
        mobile: true,
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        disabled: false,
      },
      throttling: {
        rttMs: 150,
        throughputKbps: 1.6 * 1024,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    };

    const runnerResult = await lighthouse(APP_URL, options);

    if (!runnerResult) {
      throw new Error('Lighthouse audit failed');
    }

    const { lhr } = runnerResult;

    console.log('\n=== Lighthouse Scores (Mobile) ===');
    console.log(`Performance: ${(lhr.categories.performance.score! * 100).toFixed(0)}/100`);
    console.log(`Accessibility: ${(lhr.categories.accessibility.score! * 100).toFixed(0)}/100`);
    console.log(`Best Practices: ${(lhr.categories['best-practices'].score! * 100).toFixed(0)}/100`);
    console.log(`SEO: ${(lhr.categories.seo.score! * 100).toFixed(0)}/100`);

    console.log('\n=== Performance Metrics (Mobile) ===');
    const metrics = lhr.audits;
    console.log(`First Contentful Paint: ${metrics['first-contentful-paint'].displayValue}`);
    console.log(`Largest Contentful Paint: ${metrics['largest-contentful-paint'].displayValue}`);
    console.log(`Total Blocking Time: ${metrics['total-blocking-time'].displayValue}`);
    console.log(`Cumulative Layout Shift: ${metrics['cumulative-layout-shift'].displayValue}`);
    console.log(`Speed Index: ${metrics['speed-index'].displayValue}`);
    console.log(`Time to Interactive: ${metrics['interactive'].displayValue}`);

    console.log('\n=== Opportunities (Mobile) ===');
    const opportunities = Object.values(lhr.audits)
      .filter((audit: any) => audit.details?.type === 'opportunity' && audit.score !== null && audit.score < 1)
      .sort((a: any, b: any) => (b.details?.overallSavingsMs || 0) - (a.details?.overallSavingsMs || 0))
      .slice(0, 5);

    opportunities.forEach((opp: any) => {
      const savings = opp.details?.overallSavingsMs
        ? ` (Save ~${(opp.details.overallSavingsMs / 1000).toFixed(2)}s)`
        : '';
      console.log(`  - ${opp.title}${savings}`);
    });

    console.log('\n=== Diagnostics (Mobile) ===');
    const diagnostics = Object.values(lhr.audits)
      .filter((audit: any) => audit.details?.type === 'diagnostic' && audit.score !== null && audit.score < 1)
      .slice(0, 5);

    diagnostics.forEach((diag: any) => {
      console.log(`  - ${diag.title}`);
    });

    await chrome.kill();
  });

  test('PWA Audit', async () => {
    console.log('\n=== Running PWA Audit ===');

    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu'],
    });

    const options = {
      logLevel: 'info' as const,
      output: 'json' as const,
      onlyCategories: ['pwa'],
      port: chrome.port,
    };

    const runnerResult = await lighthouse(APP_URL, options);

    if (!runnerResult) {
      throw new Error('Lighthouse audit failed');
    }

    const { lhr } = runnerResult;

    console.log('\n=== PWA Score ===');
    console.log(`PWA: ${(lhr.categories.pwa.score! * 100).toFixed(0)}/100`);

    console.log('\n=== PWA Audits ===');
    const pwaAudits = lhr.categories.pwa.auditRefs;

    pwaAudits.forEach((auditRef: any) => {
      const audit = lhr.audits[auditRef.id];
      const status = audit.score === 1 ? '✓' : '✗';
      console.log(`  ${status} ${audit.title}`);
    });

    await chrome.kill();
  });
});
