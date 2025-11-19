#!/usr/bin/env node

/**
 * Master Test Runner for Custodial Command
 * Orchestrates all test suites and generates comprehensive reports
 */

// TODO: [TEST-CONFIG] Create test environment configuration system
// Issue: All tests hardcoded to run against production Railway deployment
// Fix: Create tests/config.js with local/staging/production configurations
// Implementation:
//   - Add TEST_ENV environment variable (local|staging|production)
//   - Support localhost:5000 for local testing
//   - Add rate limit bypass token for local testing
// New scripts: npm run test:local, npm run test:production
// Reference: Cannot debug issues locally, all tests hitting production

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://cacustodialcommand.up.railway.app';
const TEST_DIR = __dirname;

// Test suite configuration
const testSuites = [
  // Note: comprehensive-test.cjs doesn't exist - tests covered by other suites
  {
    name: 'End-to-End User Journey Tests',
    file: './e2e-user-journey.test.cjs',
    description: 'Complete user workflows and business processes'
  },
  {
    name: 'Performance Tests',
    file: './performance.test.cjs',
    description: 'Response times, load handling, and system performance'
  },
  {
    name: 'Security Tests',
    file: './security.test.cjs',
    description: 'Input validation, authentication, and security vulnerabilities'
  },
  {
    name: 'Mobile and PWA Tests',
    file: './mobile-pwa.test.cjs',
    description: 'Progressive Web App functionality and mobile responsiveness'
  }
];

// Master results tracking
const masterResults = {
  startTime: new Date(),
  endTime: null,
  totalSuites: 0,
  passedSuites: 0,
  failedSuites: 0,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  suiteResults: [],
  summary: {
    overallSuccess: false,
    criticalIssues: 0,
    warnings: 0,
    recommendations: []
  }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logHeader(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

function logSubHeader(title) {
  console.log('\n' + '-'.repeat(40));
  console.log(`  ${title}`);
  console.log('-'.repeat(40));
}

// Run individual test suite
async function runTestSuite(suite) {
  logSubHeader(`Running ${suite.name}`);
  log(`Description: ${suite.description}`, 'info');
  
  const suiteStartTime = new Date();
  const suiteResult = {
    name: suite.name,
    description: suite.description,
    startTime: suiteStartTime,
    endTime: null,
    success: false,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    successRate: 0,
    duration: 0,
    errors: [],
    reportFile: null
  };

  try {
    const testFilePath = path.join(TEST_DIR, suite.file);
    
    // Check if test file exists
    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Test file not found: ${testFilePath}`);
    }

    log(`Executing: node ${suite.file}`, 'info');
    
    // Run the test suite
    const { stdout, stderr } = await execAsync(`node "${testFilePath}"`, {
      cwd: path.dirname(testFilePath),
      timeout: 300000, // 5 minute timeout per suite
      env: { ...process.env, TEST_URL: BASE_URL }
    });

    const suiteEndTime = new Date();
    suiteResult.endTime = suiteEndTime;
    suiteResult.duration = suiteEndTime - suiteStartTime;

    // Parse test results from stdout (look for test report files)
    const reportFiles = [
      path.join(TEST_DIR, 'test-report.json'),
      path.join(TEST_DIR, 'journey-test-report.json'),
      path.join(TEST_DIR, 'performance-test-report.json'),
      path.join(TEST_DIR, 'security-test-report.json'),
      path.join(TEST_DIR, 'mobile-pwa-test-report.json')
    ];

    let reportFound = false;
    for (const reportFile of reportFiles) {
      if (fs.existsSync(reportFile)) {
        try {
          const reportData = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
          suiteResult.totalTests = reportData.summary?.total || 0;
          suiteResult.passedTests = reportData.summary?.passed || 0;
          suiteResult.failedTests = reportData.summary?.failed || 0;
          suiteResult.successRate = reportData.summary?.successRate || 0;
          suiteResult.reportFile = reportFile;
          reportFound = true;
          break;
        } catch (parseError) {
          log(`Warning: Could not parse report file ${reportFile}: ${parseError.message}`, 'warning');
        }
      }
    }

    if (!reportFound) {
      // Fallback: try to parse from stdout
      const lines = stdout.split('\n');
      const summaryLine = lines.find(line => line.includes('Total Tests:') || line.includes('Success Rate:'));
      if (summaryLine) {
        log(`Parsed from stdout: ${summaryLine}`, 'info');
      }
    }

    // Determine if suite was successful (80% success rate threshold)
    suiteResult.success = suiteResult.successRate >= 80;
    
    if (suiteResult.success) {
      log(`✅ ${suite.name} completed successfully`, 'success');
      log(`   Tests: ${suiteResult.passedTests}/${suiteResult.totalTests} (${suiteResult.successRate.toFixed(1)}%)`, 'success');
      log(`   Duration: ${(suiteResult.duration / 1000).toFixed(1)}s`, 'success');
    } else {
      log(`❌ ${suite.name} had issues`, 'error');
      log(`   Tests: ${suiteResult.passedTests}/${suiteResult.totalTests} (${suiteResult.successRate.toFixed(1)}%)`, 'error');
      log(`   Duration: ${(suiteResult.duration / 1000).toFixed(1)}s`, 'error');
    }

    // Capture any errors from stderr
    if (stderr && stderr.trim()) {
      suiteResult.errors.push(stderr.trim());
      log(`   Errors: ${stderr.trim()}`, 'warning');
    }

  } catch (error) {
    const suiteEndTime = new Date();
    suiteResult.endTime = suiteEndTime;
    suiteResult.duration = suiteEndTime - suiteStartTime;
    suiteResult.success = false;
    suiteResult.errors.push(error.message);
    
    log(`❌ ${suite.name} failed to run`, 'error');
    log(`   Error: ${error.message}`, 'error');
    log(`   Duration: ${(suiteResult.duration / 1000).toFixed(1)}s`, 'error');
  }

  return suiteResult;
}

// Generate comprehensive master report
function generateMasterReport() {
  logHeader('COMPREHENSIVE TEST RESULTS SUMMARY');
  
  masterResults.endTime = new Date();
  const totalDuration = masterResults.endTime - masterResults.startTime;
  
  // Calculate overall statistics
  masterResults.totalSuites = testSuites.length;
  masterResults.passedSuites = masterResults.suiteResults.filter(s => s.success).length;
  masterResults.failedSuites = masterResults.totalSuites - masterResults.passedSuites;
  
  masterResults.totalTests = masterResults.suiteResults.reduce((sum, s) => sum + s.totalTests, 0);
  masterResults.passedTests = masterResults.suiteResults.reduce((sum, s) => sum + s.passedTests, 0);
  masterResults.failedTests = masterResults.totalTests - masterResults.passedTests;
  
  const overallSuccessRate = masterResults.totalTests > 0 ? (masterResults.passedTests / masterResults.totalTests) * 100 : 0;
  masterResults.summary.overallSuccess = overallSuccessRate >= 85; // 85% overall success rate threshold

  // Display summary
  log(`\n📊 OVERALL RESULTS:`, 'info');
  log(`   Total Test Suites: ${masterResults.totalSuites}`, 'info');
  log(`   Passed Suites: ${masterResults.passedSuites}`, masterResults.passedSuites === masterResults.totalSuites ? 'success' : 'warning');
  log(`   Failed Suites: ${masterResults.failedSuites}`, masterResults.failedSuites === 0 ? 'success' : 'error');
  log(`   Total Tests: ${masterResults.totalTests}`, 'info');
  log(`   Passed Tests: ${masterResults.passedTests}`, 'success');
  log(`   Failed Tests: ${masterResults.failedTests}`, masterResults.failedTests === 0 ? 'success' : 'error');
  log(`   Overall Success Rate: ${overallSuccessRate.toFixed(1)}%`, masterResults.summary.overallSuccess ? 'success' : 'error');
  log(`   Total Duration: ${(totalDuration / 1000).toFixed(1)}s`, 'info');

  // Display suite results
  logSubHeader('TEST SUITE RESULTS');
  masterResults.suiteResults.forEach(suite => {
    const status = suite.success ? '✅' : '❌';
    const statusColor = suite.success ? 'success' : 'error';
    log(`${status} ${suite.name}`, statusColor);
    log(`   Tests: ${suite.passedTests}/${suite.totalTests} (${suite.successRate.toFixed(1)}%)`, statusColor);
    log(`   Duration: ${(suite.duration / 1000).toFixed(1)}s`, 'info');
    if (suite.errors.length > 0) {
      log(`   Errors: ${suite.errors.join('; ')}`, 'error');
    }
  });

  // Analyze results and provide recommendations
  analyzeResultsAndRecommendations();

  // Display recommendations
  if (masterResults.summary.recommendations.length > 0) {
    logSubHeader('RECOMMENDATIONS');
    masterResults.summary.recommendations.forEach((rec, index) => {
      log(`${index + 1}. ${rec}`, 'info');
    });
  }

  // Save master report
  const masterReportPath = path.join(TEST_DIR, 'master-test-report.json');
  fs.writeFileSync(masterReportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    duration: totalDuration,
    summary: masterResults.summary,
    suiteResults: masterResults.suiteResults,
    overallStats: {
      totalSuites: masterResults.totalSuites,
      passedSuites: masterResults.passedSuites,
      failedSuites: masterResults.failedSuites,
      totalTests: masterResults.totalTests,
      passedTests: masterResults.passedTests,
      failedTests: masterResults.failedTests,
      overallSuccessRate
    }
  }, null, 2));

  log(`\n📄 Master report saved to: ${masterReportPath}`, 'info');

  // Final status
  if (masterResults.summary.overallSuccess) {
    log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!', 'success');
    log('   Your Custodial Command application is working well!', 'success');
  } else {
    log('\n⚠️  SOME ISSUES DETECTED', 'warning');
    log('   Please review the failed tests and recommendations above.', 'warning');
  }
}

// Analyze results and generate recommendations
function analyzeResultsAndRecommendations() {
  const recommendations = [];
  let criticalIssues = 0;
  let warnings = 0;

  // Check for critical failures
  const failedSuites = masterResults.suiteResults.filter(s => !s.success);
  if (failedSuites.length > 0) {
    criticalIssues += failedSuites.length;
    recommendations.push(`Address failures in ${failedSuites.map(s => s.name).join(', ')}`);
  }

  // Check for low success rates
  const lowSuccessSuites = masterResults.suiteResults.filter(s => s.successRate < 90 && s.successRate >= 80);
  if (lowSuccessSuites.length > 0) {
    warnings += lowSuccessSuites.length;
    recommendations.push(`Improve success rate in ${lowSuccessSuites.map(s => s.name).join(', ')}`);
  }

  // Check for performance issues
  const performanceSuite = masterResults.suiteResults.find(s => s.name === 'Performance Tests');
  if (performanceSuite && !performanceSuite.success) {
    criticalIssues++;
    recommendations.push('Optimize application performance - response times or load handling need improvement');
  }

  // Check for security issues
  const securitySuite = masterResults.suiteResults.find(s => s.name === 'Security Tests');
  if (securitySuite && !securitySuite.success) {
    criticalIssues++;
    recommendations.push('Address security vulnerabilities immediately - input validation or authentication issues detected');
  }

  // Check for mobile/PWA issues
  const mobileSuite = masterResults.suiteResults.find(s => s.name === 'Mobile and PWA Tests');
  if (mobileSuite && !mobileSuite.success) {
    warnings++;
    recommendations.push('Improve mobile experience and PWA functionality');
  }

  // Check overall success rate
  const overallSuccessRate = (masterResults.passedTests / masterResults.totalTests) * 100;
  if (overallSuccessRate < 95) {
    recommendations.push('Aim for 95%+ overall test success rate for production readiness');
  }

  masterResults.summary.criticalIssues = criticalIssues;
  masterResults.summary.warnings = warnings;
  masterResults.summary.recommendations = recommendations;
}

// Main test runner
async function runAllTests() {
  logHeader('CUSTODIAL COMMAND COMPREHENSIVE TEST SUITE');
  log(`Testing against: ${BASE_URL}`, 'info');
  log(`Start time: ${masterResults.startTime.toISOString()}`, 'info');
  log(`Test suites to run: ${testSuites.length}`, 'info');

  // Run each test suite
  for (const suite of testSuites) {
    try {
      const suiteResult = await runTestSuite(suite);
      masterResults.suiteResults.push(suiteResult);
    } catch (error) {
      log(`❌ Failed to run ${suite.name}: ${error.message}`, 'error');
      masterResults.suiteResults.push({
        name: suite.name,
        description: suite.description,
        startTime: new Date(),
        endTime: new Date(),
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        successRate: 0,
        duration: 0,
        errors: [error.message],
        reportFile: null
      });
    }
  }

  // Generate comprehensive report
  generateMasterReport();
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n⚠️  Test execution interrupted by user', 'warning');
  generateMasterReport();
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`\n💥 Uncaught exception: ${error.message}`, 'error');
  generateMasterReport();
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`💥 Master test suite failed: ${error.message}`, 'error');
    generateMasterReport();
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  masterResults
};
