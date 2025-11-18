const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'https://cacustodialcommand.up.railway.app';
const RESULTS = {
  vulnerabilities: [],
  tests: [],
  timestamp: new Date().toISOString()
};

// Security test utilities
function addVulnerability(severity, category, title, description, poc) {
  RESULTS.vulnerabilities.push({
    severity,
    category,
    title,
    description,
    poc,
    timestamp: new Date().toISOString()
  });
  console.log(`[${severity}] ${category}: ${title}`);
}

function addTest(category, test, passed, details) {
  RESULTS.tests.push({
    category,
    test,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${category} - ${test}`);
}

// XSS Test Payloads
const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',
  'javascript:alert("XSS")',
  '<iframe src="javascript:alert(\'XSS\')">',
  '<body onload=alert("XSS")>',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
  '<IMG SRC="javascript:alert(\'XSS\');">',
  '<IMG SRC=JaVaScRiPt:alert(\'XSS\')>',
  '<SCRIPT/XSS SRC="http://evil.com/xss.js"></SCRIPT>',
  '<<SCRIPT>alert("XSS");//<</SCRIPT>',
  '\';alert(String.fromCharCode(88,83,83))//\';',
  '");alert("XSS");//'
];

// SQL Injection Payloads
const SQLI_PAYLOADS = [
  "' OR '1'='1",
  "' OR '1'='1' --",
  "' OR '1'='1' /*",
  "admin' --",
  "admin' #",
  "admin'/*",
  "' or 1=1--",
  "' or 1=1#",
  "' or 1=1/*",
  "') or '1'='1--",
  "') or ('1'='1--",
  "1' UNION SELECT NULL--",
  "1' UNION SELECT NULL,NULL--",
  "1' AND 1=0 UNION ALL SELECT 'admin', 'password'",
  "1'; DROP TABLE users--"
];

// Command Injection Payloads
const COMMAND_INJECTION_PAYLOADS = [
  '; ls -la',
  '| ls -la',
  '& ls -la',
  '&& ls -la',
  '; whoami',
  '| whoami',
  '`whoami`',
  '$(whoami)',
  '; cat /etc/passwd',
  '| cat /etc/passwd',
  '; ping -c 1 127.0.0.1',
  '& ping -c 1 127.0.0.1'
];

// Path Traversal Payloads
const PATH_TRAVERSAL_PAYLOADS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\config\\sam',
  '....//....//....//etc/passwd',
  '..%2F..%2F..%2Fetc%2Fpasswd',
  '..%252F..%252F..%252Fetc%252Fpasswd',
  '/etc/passwd',
  'C:\\windows\\system32\\config\\sam',
  '../../../../../../etc/passwd%00',
  '..//..//..//etc/passwd'
];

async function testInputValidation(page) {
  console.log('\n=== Starting Input Validation Tests ===\n');

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Find all input fields, textareas, and search boxes
    const inputs = await page.locator('input[type="text"], input[type="search"], input[type="email"], textarea').all();

    console.log(`Found ${inputs.length} input fields to test`);

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const inputName = await input.getAttribute('name') || await input.getAttribute('id') || `input_${i}`;

      // Test XSS
      for (const payload of XSS_PAYLOADS.slice(0, 5)) {
        try {
          await input.fill(payload);
          await page.waitForTimeout(500);

          // Check if script executed (in a real scenario)
          const pageContent = await page.content();
          if (pageContent.includes(payload) && !pageContent.includes('&lt;script&gt;')) {
            addVulnerability(
              'HIGH',
              'Cross-Site Scripting (XSS)',
              `Potential XSS in ${inputName}`,
              `Input field accepts unescaped script content: ${payload}`,
              `Field: ${inputName}, Payload: ${payload}`
            );
          } else {
            addTest('XSS', `${inputName} - ${payload.substring(0, 30)}`, true, 'Input properly sanitized');
          }
        } catch (error) {
          addTest('XSS', `${inputName} - ${payload.substring(0, 30)}`, false, `Error: ${error.message}`);
        }
      }

      // Test SQL Injection
      for (const payload of SQLI_PAYLOADS.slice(0, 5)) {
        try {
          await input.fill(payload);
          await page.waitForTimeout(500);

          // Look for SQL error messages
          const pageContent = await page.content();
          const sqlErrors = [
            'SQL syntax',
            'mysql_fetch',
            'ORA-',
            'PostgreSQL',
            'SQLite',
            'SQLSTATE',
            'mysqli',
            'PDOException'
          ];

          const hasSqlError = sqlErrors.some(err => pageContent.toLowerCase().includes(err.toLowerCase()));
          if (hasSqlError) {
            addVulnerability(
              'CRITICAL',
              'SQL Injection',
              `SQL Injection vulnerability in ${inputName}`,
              `Input field returned SQL error, indicating potential SQL injection`,
              `Field: ${inputName}, Payload: ${payload}`
            );
          } else {
            addTest('SQL Injection', `${inputName} - ${payload.substring(0, 30)}`, true, 'No SQL error detected');
          }
        } catch (error) {
          addTest('SQL Injection', `${inputName} - ${payload.substring(0, 30)}`, false, `Error: ${error.message}`);
        }
      }

      // Test Command Injection
      for (const payload of COMMAND_INJECTION_PAYLOADS.slice(0, 3)) {
        try {
          await input.fill(payload);
          await page.waitForTimeout(500);

          const pageContent = await page.content();
          // Check for command output indicators
          if (pageContent.includes('root:') || pageContent.includes('bin/bash') || pageContent.includes('uid=')) {
            addVulnerability(
              'CRITICAL',
              'Command Injection',
              `Command Injection vulnerability in ${inputName}`,
              `Input field executed system commands`,
              `Field: ${inputName}, Payload: ${payload}`
            );
          } else {
            addTest('Command Injection', `${inputName} - ${payload.substring(0, 30)}`, true, 'No command execution detected');
          }
        } catch (error) {
          addTest('Command Injection', `${inputName} - ${payload.substring(0, 30)}`, false, `Error: ${error.message}`);
        }
      }

      // Test Path Traversal
      for (const payload of PATH_TRAVERSAL_PAYLOADS.slice(0, 3)) {
        try {
          await input.fill(payload);
          await page.waitForTimeout(500);

          const pageContent = await page.content();
          // Check for file system content
          if (pageContent.includes('root:x:0:0') || pageContent.includes('[boot loader]')) {
            addVulnerability(
              'CRITICAL',
              'Path Traversal',
              `Path Traversal vulnerability in ${inputName}`,
              `Input field allowed file system access`,
              `Field: ${inputName}, Payload: ${payload}`
            );
          } else {
            addTest('Path Traversal', `${inputName} - ${payload.substring(0, 30)}`, true, 'No file system access detected');
          }
        } catch (error) {
          addTest('Path Traversal', `${inputName} - ${payload.substring(0, 30)}`, false, `Error: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.error('Error during input validation testing:', error);
    addTest('Input Validation', 'General', false, `Fatal error: ${error.message}`);
  }
}

async function testAuthentication(page) {
  console.log('\n=== Starting Authentication Tests ===\n');

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Look for login forms
    const loginForms = await page.locator('form').all();
    console.log(`Found ${loginForms.length} forms`);

    // Test weak password acceptance
    const passwordFields = await page.locator('input[type="password"]').all();

    if (passwordFields.length > 0) {
      const weakPasswords = ['123', '123456', 'password', 'admin', '12345678'];

      for (const weakPass of weakPasswords) {
        try {
          await passwordFields[0].fill(weakPass);
          await page.waitForTimeout(300);

          // Check if there's validation feedback
          const validationMsg = await page.locator('.error, .invalid, [role="alert"]').count();

          if (validationMsg === 0) {
            addVulnerability(
              'MEDIUM',
              'Weak Password Policy',
              'Weak passwords accepted',
              `System accepts weak password: ${weakPass}`,
              `Weak password "${weakPass}" not rejected by client-side validation`
            );
          } else {
            addTest('Authentication', `Weak password rejection - ${weakPass}`, true, 'Password properly validated');
          }
        } catch (error) {
          addTest('Authentication', `Weak password test - ${weakPass}`, false, `Error: ${error.message}`);
        }
      }
    }

    // Test session management
    const cookies = await page.context().cookies();

    for (const cookie of cookies) {
      if (!cookie.secure && cookie.name.toLowerCase().includes('session')) {
        addVulnerability(
          'MEDIUM',
          'Session Management',
          'Insecure session cookie',
          `Session cookie "${cookie.name}" missing Secure flag`,
          `Cookie: ${cookie.name}, Secure: ${cookie.secure}`
        );
      }

      if (!cookie.httpOnly && cookie.name.toLowerCase().includes('session')) {
        addVulnerability(
          'MEDIUM',
          'Session Management',
          'Session cookie vulnerable to XSS',
          `Session cookie "${cookie.name}" missing HttpOnly flag`,
          `Cookie: ${cookie.name}, HttpOnly: ${cookie.httpOnly}`
        );
      }

      if (cookie.sameSite === 'None' || !cookie.sameSite) {
        addVulnerability(
          'LOW',
          'Session Management',
          'Missing SameSite cookie attribute',
          `Cookie "${cookie.name}" missing SameSite protection`,
          `Cookie: ${cookie.name}, SameSite: ${cookie.sameSite || 'not set'}`
        );
      }
    }

    addTest('Authentication', 'Cookie security analysis', true, `Analyzed ${cookies.length} cookies`);

  } catch (error) {
    console.error('Error during authentication testing:', error);
    addTest('Authentication', 'General', false, `Fatal error: ${error.message}`);
  }
}

async function testFileUpload(page) {
  console.log('\n=== Starting File Upload Tests ===\n');

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const fileInputs = await page.locator('input[type="file"]').all();
    console.log(`Found ${fileInputs.length} file upload inputs`);

    if (fileInputs.length > 0) {
      // Test malicious file types
      const maliciousFiles = [
        { name: 'test.php', content: '<?php echo "test"; ?>' },
        { name: 'test.jsp', content: '<% out.println("test"); %>' },
        { name: 'test.exe', content: 'MZ\x90\x00' },
        { name: 'test.sh', content: '#!/bin/bash\necho test' },
        { name: '../../../test.txt', content: 'path traversal test' }
      ];

      for (const file of maliciousFiles) {
        try {
          // Create temporary file
          const tmpPath = `/tmp/${file.name}`;
          fs.writeFileSync(tmpPath, file.content);

          await fileInputs[0].setInputFiles(tmpPath);
          await page.waitForTimeout(500);

          // Check for error messages
          const errorMsg = await page.locator('.error, .invalid, [role="alert"]').count();

          if (errorMsg === 0) {
            addVulnerability(
              'HIGH',
              'File Upload',
              `Malicious file type accepted: ${file.name}`,
              'File upload does not properly validate file types',
              `File: ${file.name}, Type: ${file.name.split('.').pop()}`
            );
          } else {
            addTest('File Upload', `Malicious file rejection - ${file.name}`, true, 'File properly rejected');
          }

          // Cleanup
          fs.unlinkSync(tmpPath);
        } catch (error) {
          addTest('File Upload', `File test - ${file.name}`, false, `Error: ${error.message}`);
        }
      }
    } else {
      addTest('File Upload', 'File upload detection', true, 'No file upload functionality found');
    }

  } catch (error) {
    console.error('Error during file upload testing:', error);
    addTest('File Upload', 'General', false, `Fatal error: ${error.message}`);
  }
}

async function testAPIAndHeaders(page) {
  console.log('\n=== Starting API and Security Headers Tests ===\n');

  try {
    const response = await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const headers = response.headers();

    // Check security headers
    const securityHeaders = {
      'x-frame-options': { required: true, severity: 'MEDIUM', description: 'Protects against clickjacking' },
      'x-content-type-options': { required: true, severity: 'LOW', description: 'Prevents MIME sniffing' },
      'strict-transport-security': { required: true, severity: 'MEDIUM', description: 'Enforces HTTPS' },
      'content-security-policy': { required: true, severity: 'MEDIUM', description: 'Prevents XSS attacks' },
      'x-xss-protection': { required: false, severity: 'LOW', description: 'Legacy XSS protection' },
      'referrer-policy': { required: false, severity: 'LOW', description: 'Controls referrer information' }
    };

    for (const [headerName, config] of Object.entries(securityHeaders)) {
      if (!headers[headerName] && config.required) {
        addVulnerability(
          config.severity,
          'Security Headers',
          `Missing security header: ${headerName}`,
          config.description,
          `Header "${headerName}" not found in response`
        );
      } else if (headers[headerName]) {
        addTest('Security Headers', `${headerName} present`, true, `Value: ${headers[headerName]}`);
      }
    }

    // Check for information disclosure in headers
    const disclosureHeaders = ['x-powered-by', 'server', 'x-aspnet-version', 'x-aspnetmvc-version'];

    for (const headerName of disclosureHeaders) {
      if (headers[headerName]) {
        addVulnerability(
          'LOW',
          'Information Disclosure',
          `Sensitive header exposed: ${headerName}`,
          'Server reveals technology stack information',
          `${headerName}: ${headers[headerName]}`
        );
      } else {
        addTest('Information Disclosure', `${headerName} not exposed`, true, 'Header properly hidden');
      }
    }

    // Test CORS configuration
    const corsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch(window.location.href, {
          method: 'OPTIONS',
          headers: {
            'Origin': 'https://evil.com',
            'Access-Control-Request-Method': 'POST'
          }
        });
        return {
          headers: Object.fromEntries(response.headers.entries()),
          status: response.status
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    if (corsResponse.headers && corsResponse.headers['access-control-allow-origin'] === '*') {
      addVulnerability(
        'MEDIUM',
        'CORS Misconfiguration',
        'Overly permissive CORS policy',
        'Access-Control-Allow-Origin set to wildcard (*)',
        'CORS allows requests from any origin'
      );
    } else {
      addTest('CORS', 'CORS configuration', true, 'CORS properly configured or not overly permissive');
    }

  } catch (error) {
    console.error('Error during API and headers testing:', error);
    addTest('API Security', 'General', false, `Fatal error: ${error.message}`);
  }
}

async function testDataProtection(page) {
  console.log('\n=== Starting Data Protection Tests ===\n');

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Check for sensitive data in page source
    const pageContent = await page.content();
    const sensitivePatterns = [
      { pattern: /password\s*[:=]\s*["'][^"']+["']/gi, name: 'Hardcoded passwords' },
      { pattern: /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi, name: 'API keys' },
      { pattern: /secret\s*[:=]\s*["'][^"']+["']/gi, name: 'Secrets' },
      { pattern: /token\s*[:=]\s*["'][^"']+["']/gi, name: 'Tokens' },
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, name: 'Email addresses' },
      { pattern: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, name: 'SSN-like patterns' }
    ];

    for (const { pattern, name } of sensitivePatterns) {
      const matches = pageContent.match(pattern);
      if (matches && matches.length > 0) {
        addVulnerability(
          'MEDIUM',
          'Information Disclosure',
          `Sensitive data exposed: ${name}`,
          `Found ${matches.length} instances of ${name} in page source`,
          `Pattern: ${name}, Count: ${matches.length}`
        );
      } else {
        addTest('Data Protection', `${name} not exposed`, true, 'No sensitive data found in source');
      }
    }

    // Check if HTTPS is enforced
    const currentURL = page.url();
    if (currentURL.startsWith('http://')) {
      addVulnerability(
        'HIGH',
        'Encryption in Transit',
        'HTTPS not enforced',
        'Application accessible over unencrypted HTTP',
        `Current URL: ${currentURL}`
      );
    } else {
      addTest('Data Protection', 'HTTPS enforcement', true, 'Application uses HTTPS');
    }

    // Check for autocomplete on sensitive fields
    const sensitiveFields = await page.locator('input[type="password"], input[name*="credit"], input[name*="card"], input[name*="ssn"]').all();

    for (const field of sensitiveFields) {
      const autocomplete = await field.getAttribute('autocomplete');
      const fieldName = await field.getAttribute('name') || await field.getAttribute('id') || 'unknown';

      if (autocomplete !== 'off' && autocomplete !== 'new-password') {
        addVulnerability(
          'LOW',
          'Data Protection',
          `Autocomplete enabled on sensitive field: ${fieldName}`,
          'Sensitive input field allows browser autocomplete',
          `Field: ${fieldName}, Autocomplete: ${autocomplete || 'not set'}`
        );
      } else {
        addTest('Data Protection', `Autocomplete disabled on ${fieldName}`, true, 'Autocomplete properly configured');
      }
    }

  } catch (error) {
    console.error('Error during data protection testing:', error);
    addTest('Data Protection', 'General', false, `Fatal error: ${error.message}`);
  }
}

async function testCSRF(page) {
  console.log('\n=== Starting CSRF Protection Tests ===\n');

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Check for CSRF tokens in forms
    const forms = await page.locator('form').all();

    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      const formAction = await form.getAttribute('action') || 'unknown';

      // Look for CSRF token fields
      const csrfToken = await form.locator('input[name*="csrf"], input[name*="token"], input[type="hidden"]').count();

      if (csrfToken === 0) {
        addVulnerability(
          'MEDIUM',
          'CSRF Protection',
          `Form missing CSRF token: ${formAction}`,
          'Form does not include CSRF protection token',
          `Form action: ${formAction}, Token count: 0`
        );
      } else {
        addTest('CSRF Protection', `CSRF token in form ${i}`, true, `Found ${csrfToken} potential token fields`);
      }
    }

    // Test if forms work without referer header
    const testResult = await page.evaluate(async () => {
      try {
        const response = await fetch(window.location.href, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ test: 'data' })
        });
        return { status: response.status, ok: response.ok };
      } catch (error) {
        return { error: error.message };
      }
    });

    if (testResult.ok) {
      addVulnerability(
        'MEDIUM',
        'CSRF Protection',
        'POST request accepted without CSRF validation',
        'Application accepts POST requests without proper CSRF protection',
        `POST request status: ${testResult.status}`
      );
    } else {
      addTest('CSRF Protection', 'POST request validation', true, 'POST requests properly validated');
    }

  } catch (error) {
    console.error('Error during CSRF testing:', error);
    addTest('CSRF Protection', 'General', false, `Fatal error: ${error.message}`);
  }
}

async function testRateLimiting(page) {
  console.log('\n=== Starting Rate Limiting Tests ===\n');

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Send multiple rapid requests
    const requestCount = 50;
    const requests = [];

    for (let i = 0; i < requestCount; i++) {
      requests.push(
        page.evaluate(() => fetch(window.location.href).then(r => r.status))
      );
    }

    const results = await Promise.all(requests);
    const blockedRequests = results.filter(status => status === 429 || status === 503).length;

    if (blockedRequests === 0) {
      addVulnerability(
        'MEDIUM',
        'Rate Limiting',
        'No rate limiting detected',
        `Sent ${requestCount} rapid requests without being blocked`,
        `Requests sent: ${requestCount}, Blocked: 0`
      );
    } else {
      addTest('Rate Limiting', 'Rate limiting active', true, `${blockedRequests}/${requestCount} requests blocked`);
    }

  } catch (error) {
    console.error('Error during rate limiting testing:', error);
    addTest('Rate Limiting', 'General', false, `Fatal error: ${error.message}`);
  }
}

async function generateReport() {
  console.log('\n=== Generating Security Report ===\n');

  // Categorize vulnerabilities by severity
  const critical = RESULTS.vulnerabilities.filter(v => v.severity === 'CRITICAL');
  const high = RESULTS.vulnerabilities.filter(v => v.severity === 'HIGH');
  const medium = RESULTS.vulnerabilities.filter(v => v.severity === 'MEDIUM');
  const low = RESULTS.vulnerabilities.filter(v => v.severity === 'LOW');

  const report = {
    summary: {
      timestamp: RESULTS.timestamp,
      target: BASE_URL,
      totalTests: RESULTS.tests.length,
      passedTests: RESULTS.tests.filter(t => t.passed).length,
      failedTests: RESULTS.tests.filter(t => !t.passed).length,
      totalVulnerabilities: RESULTS.vulnerabilities.length,
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      low: low.length
    },
    vulnerabilities: {
      critical,
      high,
      medium,
      low
    },
    tests: RESULTS.tests,
    recommendations: generateRecommendations(RESULTS.vulnerabilities)
  };

  // Save report to file
  const reportPath = '/Volumes/Extreme SSD/Repositories/CustodialCommand/CustodialCommand/security_report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n✅ Security report saved to: ${reportPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total Tests: ${report.summary.totalTests}`);
  console.log(`   Passed: ${report.summary.passedTests}`);
  console.log(`   Failed: ${report.summary.failedTests}`);
  console.log(`\n🔍 Vulnerabilities Found:`);
  console.log(`   CRITICAL: ${critical.length}`);
  console.log(`   HIGH: ${high.length}`);
  console.log(`   MEDIUM: ${medium.length}`);
  console.log(`   LOW: ${low.length}`);

  return report;
}

function generateRecommendations(vulnerabilities) {
  const recommendations = [];

  const categories = [...new Set(vulnerabilities.map(v => v.category))];

  const remediationGuide = {
    'Cross-Site Scripting (XSS)': {
      priority: 'HIGH',
      remediation: 'Implement output encoding for all user input. Use Content Security Policy (CSP) headers. Sanitize input on both client and server side.',
      references: ['https://owasp.org/www-community/attacks/xss/', 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html']
    },
    'SQL Injection': {
      priority: 'CRITICAL',
      remediation: 'Use parameterized queries or prepared statements. Never concatenate user input into SQL queries. Implement input validation and use ORM frameworks.',
      references: ['https://owasp.org/www-community/attacks/SQL_Injection', 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html']
    },
    'Command Injection': {
      priority: 'CRITICAL',
      remediation: 'Avoid executing system commands with user input. Use API alternatives. If necessary, implement strict input validation and use safe libraries.',
      references: ['https://owasp.org/www-community/attacks/Command_Injection', 'https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html']
    },
    'Path Traversal': {
      priority: 'CRITICAL',
      remediation: 'Validate file paths against whitelist. Use built-in path sanitization functions. Never trust user input for file operations.',
      references: ['https://owasp.org/www-community/attacks/Path_Traversal', 'https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html']
    },
    'Session Management': {
      priority: 'HIGH',
      remediation: 'Set Secure, HttpOnly, and SameSite flags on session cookies. Implement session timeout. Use strong session ID generation.',
      references: ['https://owasp.org/www-community/controls/Session_Management_Cheat_Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html']
    },
    'Security Headers': {
      priority: 'MEDIUM',
      remediation: 'Implement all recommended security headers: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, Content-Security-Policy.',
      references: ['https://owasp.org/www-project-secure-headers/', 'https://securityheaders.com/']
    },
    'CSRF Protection': {
      priority: 'MEDIUM',
      remediation: 'Implement CSRF tokens for all state-changing operations. Use SameSite cookie attribute. Verify origin and referer headers.',
      references: ['https://owasp.org/www-community/attacks/csrf', 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html']
    },
    'Information Disclosure': {
      priority: 'MEDIUM',
      remediation: 'Remove technology stack information from headers. Avoid exposing sensitive data in source code or error messages. Implement proper error handling.',
      references: ['https://owasp.org/www-community/attacks/Information_Leak', 'https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html']
    },
    'File Upload': {
      priority: 'HIGH',
      remediation: 'Validate file types using content-based detection. Restrict file extensions. Store uploads outside web root. Scan for malware.',
      references: ['https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload', 'https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html']
    },
    'Rate Limiting': {
      priority: 'MEDIUM',
      remediation: 'Implement rate limiting on all API endpoints. Use exponential backoff. Monitor for abuse patterns.',
      references: ['https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks', 'https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html']
    },
    'CORS Misconfiguration': {
      priority: 'MEDIUM',
      remediation: 'Restrict CORS to trusted origins only. Never use wildcard (*) for Access-Control-Allow-Origin with credentials.',
      references: ['https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS']
    },
    'Weak Password Policy': {
      priority: 'MEDIUM',
      remediation: 'Enforce minimum password length (12+ characters). Require complexity. Implement password strength meter. Use password hashing (bcrypt, Argon2).',
      references: ['https://owasp.org/www-community/controls/Password_Storage_Cheat_Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html']
    },
    'Data Protection': {
      priority: 'HIGH',
      remediation: 'Encrypt sensitive data at rest and in transit. Use HTTPS everywhere. Disable autocomplete on sensitive fields. Implement data masking.',
      references: ['https://owasp.org/www-community/controls/Data_Protection', 'https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html']
    },
    'Encryption in Transit': {
      priority: 'CRITICAL',
      remediation: 'Enforce HTTPS for all connections. Implement HTTP Strict Transport Security (HSTS). Use strong TLS configurations.',
      references: ['https://owasp.org/www-community/controls/Transport_Layer_Protection_Cheat_Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html']
    }
  };

  for (const category of categories) {
    if (remediationGuide[category]) {
      const vulnsInCategory = vulnerabilities.filter(v => v.category === category);
      recommendations.push({
        category,
        count: vulnsInCategory.length,
        priority: remediationGuide[category].priority,
        remediation: remediationGuide[category].remediation,
        references: remediationGuide[category].references
      });
    }
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

async function runSecurityTests() {
  console.log('🔒 Starting Comprehensive Security Test Suite');
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log(`⏰ Started: ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Security Scanner) SecurityTest/1.0'
  });
  const page = await context.newPage();

  try {
    // Run all security tests
    await testInputValidation(page);
    await testAuthentication(page);
    await testFileUpload(page);
    await testAPIAndHeaders(page);
    await testDataProtection(page);
    await testCSRF(page);
    await testRateLimiting(page);

    // Generate comprehensive report
    const report = await generateReport();

    console.log('\n✅ Security testing complete!');

  } catch (error) {
    console.error('❌ Fatal error during security testing:', error);
  } finally {
    await browser.close();
  }
}

// Run the security tests
runSecurityTests();
