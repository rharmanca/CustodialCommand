// Comprehensive WCAG AA Accessibility Validation Utility
// This utility provides automated accessibility checking and reporting

interface AccessibilityRule {
  id: string;
  name: string;
  description: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  check: () => AccessibilityViolation[];
}

interface AccessibilityViolation {
  ruleId: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  message: string;
  element: Element;
  selector: string;
  recommendation: string;
}

interface AccessibilityReport {
  score: number;
  violations: AccessibilityViolation[];
  passes: string[];
  timestamp: Date;
  metadata: {
    totalElements: number;
    checkedRules: number;
    browserInfo: string;
  };
}

class AccessibilityValidator {
  private rules: AccessibilityRule[] = [];
  private report: AccessibilityReport | null = null;

  constructor() {
    this.initializeRules();
  }

  private initializeRules(): void {
    // WCAG 2.2 AA Compliance Rules
    this.rules = [
      {
        id: 'page-title',
        name: 'Page Title',
        description: 'Document must have a descriptive title',
        impact: 'serious',
        check: () => this.checkPageTitle()
      },
      {
        id: 'html-lang',
        name: 'HTML Language',
        description: 'HTML element must have a lang attribute',
        impact: 'serious',
        check: () => this.checkHtmlLang()
      },
      {
        id: 'page-structure',
        name: 'Page Structure',
        description: 'Page must have proper heading structure',
        impact: 'moderate',
        check: () => this.checkPageStructure()
      },
      {
        id: 'image-alt',
        name: 'Image Alt Text',
        description: 'Images must have appropriate alt text',
        impact: 'critical',
        check: () => this.checkImageAlt()
      },
      {
        id: 'form-labels',
        name: 'Form Labels',
        description: 'Form elements must have proper labels',
        impact: 'critical',
        check: () => this.checkFormLabels()
      },
      {
        id: 'link-text',
        name: 'Link Text',
        description: 'Links must have descriptive text',
        impact: 'moderate',
        check: () => this.checkLinkText()
      },
      {
        id: 'focus-order',
        name: 'Focus Order',
        description: 'Focus must follow a logical order',
        impact: 'serious',
        check: () => this.checkFocusOrder()
      },
      {
        id: 'keyboard-access',
        name: 'Keyboard Access',
        description: 'All interactive elements must be keyboard accessible',
        impact: 'critical',
        check: () => this.checkKeyboardAccess()
      },
      {
        id: 'color-contrast',
        name: 'Color Contrast',
        description: 'Text must have sufficient color contrast',
        impact: 'serious',
        check: () => this.checkColorContrast()
      },
      {
        id: 'aria-labels',
        name: 'ARIA Labels',
        description: 'ARIA attributes must be used correctly',
        impact: 'moderate',
        check: () => this.checkAriaLabels()
      },
      {
        id: 'skip-links',
        name: 'Skip Links',
        description: 'Skip links must be available for keyboard navigation',
        impact: 'moderate',
        check: () => this.checkSkipLinks()
      },
      {
        id: 'error-handling',
        name: 'Error Handling',
        description: 'Form errors must be clearly identified',
        impact: 'serious',
        check: () => this.checkErrorHandling()
      }
    ];
  }

  private checkPageTitle(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const title = document.title;

    if (!title || title.trim().length === 0) {
      violations.push({
        ruleId: 'page-title',
        impact: 'serious',
        message: 'Document missing title',
        element: document.documentElement,
        selector: 'html',
        recommendation: 'Add a descriptive title to the document using <title> tag'
      });
    } else if (title.length > 60) {
      violations.push({
        ruleId: 'page-title',
        impact: 'minor',
        message: 'Page title too long',
        element: document.querySelector('title')!,
        selector: 'title',
        recommendation: 'Keep page titles under 60 characters for better readability'
      });
    }

    return violations;
  }

  private checkHtmlLang(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const html = document.documentElement;
    const lang = html.getAttribute('lang');

    if (!lang) {
      violations.push({
        ruleId: 'html-lang',
        impact: 'serious',
        message: 'HTML element missing lang attribute',
        element: html,
        selector: 'html',
        recommendation: 'Add lang attribute to HTML element (e.g., <html lang="en">)'
      });
    } else if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(lang)) {
      violations.push({
        ruleId: 'html-lang',
        impact: 'minor',
        message: 'Invalid lang attribute format',
        element: html,
        selector: 'html',
        recommendation: 'Use proper language code format (e.g., "en", "en-US")'
      });
    }

    return violations;
  }

  private checkPageStructure(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    let hasH1 = false;

    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.charAt(1));

      // Check for h1
      if (currentLevel === 1) hasH1 = true;

      // Check for skipped levels
      if (index > 0 && currentLevel > previousLevel + 1) {
        violations.push({
          ruleId: 'page-structure',
          impact: 'moderate',
          message: `Skipped heading level: h${previousLevel} to h${currentLevel}`,
          element: heading,
          selector: `${heading.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
          recommendation: 'Use heading levels sequentially without skipping levels'
        });
      }

      // Check for empty headings
      if (!heading.textContent?.trim()) {
        violations.push({
          ruleId: 'page-structure',
          impact: 'minor',
          message: 'Empty heading found',
          element: heading,
          selector: `${heading.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
          recommendation: 'Provide descriptive text for all headings'
        });
      }

      previousLevel = currentLevel;
    });

    if (!hasH1) {
      violations.push({
        ruleId: 'page-structure',
        impact: 'moderate',
        message: 'Missing h1 heading',
        element: document.body,
        selector: 'body',
        recommendation: 'Add a single h1 heading that describes the page content'
      });
    }

    return violations;
  }

  private checkImageAlt(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const images = document.querySelectorAll('img');

    images.forEach((img, index) => {
      const alt = img.getAttribute('alt');

      if (alt === null) {
        violations.push({
          ruleId: 'image-alt',
          impact: 'critical',
          message: 'Image missing alt attribute',
          element: img,
          selector: `img:nth-of-type(${index + 1})`,
          recommendation: 'Add alt attribute to all images. Use alt="" for decorative images'
        });
      } else if (alt.length > 125) {
        violations.push({
          ruleId: 'image-alt',
          impact: 'minor',
          message: 'Alt text too long',
          element: img,
          selector: `img:nth-of-type(${index + 1})`,
          recommendation: 'Keep alt text concise (under 125 characters). Use longdesc for complex images'
        });
      }
    });

    return violations;
  }

  private checkFormLabels(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const inputs = document.querySelectorAll('input, select, textarea');

    inputs.forEach((input, index) => {
      const id = input.id;
      const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : false;
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledBy = input.getAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        violations.push({
          ruleId: 'form-labels',
          impact: 'critical',
          message: 'Form element missing label',
          element: input,
          selector: `${input.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
          recommendation: 'Add a label element, aria-label, or aria-labelledby attribute'
        });
      }

      // Check for required field indicators
      if (input.hasAttribute('required')) {
        const hasAriaRequired = input.getAttribute('aria-required') === 'true';
        const labelHasRequired = hasLabel && hasLabel.textContent?.includes('*');

        if (!hasAriaRequired && !labelHasRequired) {
          violations.push({
            ruleId: 'form-labels',
            impact: 'moderate',
            message: 'Required field not clearly indicated',
            element: input,
            selector: `${input.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
            recommendation: 'Clearly indicate required fields with visual indicators and aria-required'
          });
        }
      }
    });

    return violations;
  }

  private checkLinkText(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const links = document.querySelectorAll('a[href]');
    const linkTexts = new Set<string>();

    links.forEach((link, index) => {
      const text = link.textContent?.trim() || '';
      const href = link.getAttribute('href') || '';

      // Check for empty links
      if (!text && !link.querySelector('img')) {
        violations.push({
          ruleId: 'link-text',
          impact: 'moderate',
          message: 'Empty link text',
          element: link,
          selector: `a:nth-of-type(${index + 1})`,
          recommendation: 'Provide descriptive text for all links'
        });
      }

      // Check for generic link text
      const genericTexts = ['click here', 'read more', 'learn more', 'here', 'more'];
      if (genericTexts.includes(text.toLowerCase())) {
        violations.push({
          ruleId: 'link-text',
          impact: 'minor',
          message: `Generic link text: "${text}"`,
          element: link,
          selector: `a:nth-of-type(${index + 1})`,
          recommendation: 'Use more descriptive link text that indicates the destination'
        });
      }

      // Check for duplicate link text
      if (linkTexts.has(text) && text) {
        violations.push({
          ruleId: 'link-text',
          impact: 'minor',
          message: `Duplicate link text: "${text}"`,
          element: link,
          selector: `a:nth-of-type(${index + 1})`,
          recommendation: 'Ensure link text is unique or provides context'
        });
      } else {
        linkTexts.add(text);
      }

      // Check for new window warnings
      if (link.getAttribute('target') === '_blank' &&
          !link.getAttribute('aria-label')?.includes('opens') &&
          !link.getAttribute('rel')?.includes('noopener')) {
        violations.push({
          ruleId: 'link-text',
          impact: 'minor',
          message: 'Link opens new window without warning',
          element: link,
          selector: `a:nth-of-type(${index + 1})`,
          recommendation: 'Add aria-label warning and rel="noopener" for external links'
        });
      }
    });

    return violations;
  }

  private checkFocusOrder(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Check for negative tabindex
    document.querySelectorAll('[tabindex="-1"]').forEach((element, index) => {
      violations.push({
        ruleId: 'focus-order',
        impact: 'moderate',
        message: 'Element with negative tabindex',
        element,
        selector: `[tabindex="-1"]:nth-of-type(${index + 1})`,
        recommendation: 'Avoid negative tabindex as it can trap keyboard users'
      });
    });

    // Check for tabindex > 0
    document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').forEach((element) => {
      const tabindex = element.getAttribute('tabindex');
      if (tabindex && parseInt(tabindex) > 0) {
        violations.push({
          ruleId: 'focus-order',
          impact: 'minor',
          message: `Element with tabindex="${tabindex}"`,
          element,
          selector: `[tabindex="${tabindex}"]`,
          recommendation: 'Use tabindex="0" or let natural document order determine focus sequence'
        });
      }
    });

    return violations;
  }

  private checkKeyboardAccess(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // Check for elements that might not be keyboard accessible
    const interactiveElements = document.querySelectorAll('div[onclick], span[onclick], [role="button"]:not(button)');

    interactiveElements.forEach((element, index) => {
      if (!element.hasAttribute('tabindex')) {
        violations.push({
          ruleId: 'keyboard-access',
          impact: 'serious',
          message: 'Interactive element not keyboard accessible',
          element,
          selector: `${element.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
          recommendation: 'Add tabindex="0" and keyboard event handlers to interactive elements'
        });
      }
    });

    return violations;
  }

  private checkColorContrast(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // This is a simplified check - in production, you'd use a proper color contrast library
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');

    textElements.forEach((element, index) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      // Basic check for transparent backgrounds
      if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
        violations.push({
          ruleId: 'color-contrast',
          impact: 'moderate',
          message: 'Element with transparent background may have poor contrast',
          element,
          selector: `${element.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
          recommendation: 'Ensure text has sufficient contrast against its background'
        });
      }
    });

    return violations;
  }

  private checkAriaLabels(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // Check for incorrect ARIA usage
    document.querySelectorAll('[aria-label], [aria-labelledby]').forEach((element, index) => {
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledBy = element.getAttribute('aria-labelledby');

      if (ariaLabel && ariaLabel.trim().length === 0) {
        violations.push({
          ruleId: 'aria-labels',
          impact: 'minor',
          message: 'Empty aria-label attribute',
          element,
          selector: `[aria-label]:nth-of-type(${index + 1})`,
          recommendation: 'Provide meaningful aria-label text or remove empty attribute'
        });
      }

      if (ariaLabelledBy) {
        const referencedElement = document.getElementById(ariaLabelledBy);
        if (!referencedElement) {
          violations.push({
            ruleId: 'aria-labels',
            impact: 'moderate',
            message: `aria-labelledby references non-existent element: ${ariaLabelledBy}`,
            element,
            selector: `[aria-labelledby="${ariaLabelledBy}"]`,
            recommendation: 'Ensure aria-labelledby references valid element IDs'
          });
        }
      }
    });

    return violations;
  }

  private checkSkipLinks(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const skipLinks = document.querySelectorAll('a[href^="#"]');

    // Check if skip links exist and are functional
    if (skipLinks.length === 0) {
      violations.push({
        ruleId: 'skip-links',
        impact: 'moderate',
        message: 'No skip links found',
        element: document.body,
        selector: 'body',
        recommendation: 'Add skip links for keyboard navigation to main content areas'
      });
    } else {
      skipLinks.forEach((link, index) => {
        const href = link.getAttribute('href');
        if (href && href !== '#') {
          const target = document.querySelector(href);
          if (!target) {
            violations.push({
              ruleId: 'skip-links',
              impact: 'minor',
              message: `Skip link references non-existent target: ${href}`,
              element: link,
              selector: `a[href="${href}"]`,
              recommendation: 'Ensure skip links reference valid element IDs'
            });
          }
        }
      });
    }

    return violations;
  }

  private checkErrorHandling(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // Check for form error messages
    const invalidElements = document.querySelectorAll('[aria-invalid="true"], .error, .invalid');

    invalidElements.forEach((element, index) => {
      const describedBy = element.getAttribute('aria-describedby');

      if (!describedBy) {
        violations.push({
          ruleId: 'error-handling',
          impact: 'serious',
          message: 'Invalid form field without associated error message',
          element,
          selector: `[aria-invalid="true"]:nth-of-type(${index + 1})`,
          recommendation: 'Associate error messages with form fields using aria-describedby'
        });
      } else {
        const errorElement = document.getElementById(describedBy);
        if (!errorElement) {
          violations.push({
            ruleId: 'error-handling',
            impact: 'moderate',
            message: `Error message element not found: ${describedBy}`,
            element,
            selector: `[aria-describedby="${describedBy}"]`,
            recommendation: 'Ensure aria-describedby references valid error message elements'
          });
        }
      }
    });

    return violations;
  }

  public runAudit(): AccessibilityReport {
    const allViolations: AccessibilityViolation[] = [];
    const passes: string[] = [];

    this.rules.forEach(rule => {
      const violations = rule.check();
      allViolations.push(...violations);

      if (violations.length === 0) {
        passes.push(rule.name);
      }
    });

    // Calculate score (100 - (violations × impact weight))
    const impactWeights = { critical: 20, serious: 10, moderate: 5, minor: 2 };
    const score = Math.max(0, 100 - allViolations.reduce((total, violation) =>
      total + impactWeights[violation.impact], 0));

    this.report = {
      score,
      violations: allViolations.sort((a, b) => {
        const impactOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
        return impactOrder[a.impact] - impactOrder[b.impact];
      }),
      passes,
      timestamp: new Date(),
      metadata: {
        totalElements: document.querySelectorAll('*').length,
        checkedRules: this.rules.length,
        browserInfo: navigator.userAgent
      }
    };

    return this.report;
  }

  public getReport(): AccessibilityReport | null {
    return this.report;
  }

  public exportReport(): string {
    if (!this.report) return 'No report available';

    const report = this.report;
    let output = `# Accessibility Audit Report\n\n`;
    output += `Generated: ${report.timestamp.toISOString()}\n`;
    output += `WCAG AA Score: ${report.score}/100\n`;
    output += `Violations: ${report.violations.length}\n`;
    output += `Passed Checks: ${report.passes.length}\n\n`;

    if (report.violations.length > 0) {
      output += `## Violations (${report.violations.length})\n\n`;

      const criticalViolations = report.violations.filter(v => v.impact === 'critical');
      const seriousViolations = report.violations.filter(v => v.impact === 'serious');
      const moderateViolations = report.violations.filter(v => v.impact === 'moderate');
      const minorViolations = report.violations.filter(v => v.impact === 'minor');

      if (criticalViolations.length > 0) {
        output += `### Critical (${criticalViolations.length})\n\n`;
        criticalViolations.forEach((violation, index) => {
          output += `${index + 1}. **${violation.message}**\n`;
          output += `   - Element: \`${violation.selector}\`\n`;
          output += `   - Recommendation: ${violation.recommendation}\n\n`;
        });
      }

      if (seriousViolations.length > 0) {
        output += `### Serious (${seriousViolations.length})\n\n`;
        seriousViolations.forEach((violation, index) => {
          output += `${index + 1}. **${violation.message}**\n`;
          output += `   - Element: \`${violation.selector}\`\n`;
          output += `   - Recommendation: ${violation.recommendation}\n\n`;
        });
      }

      if (moderateViolations.length > 0) {
        output += `### Moderate (${moderateViolations.length})\n\n`;
        moderateViolations.forEach((violation, index) => {
          output += `${index + 1}. **${violation.message}**\n`;
          output += `   - Element: \`${violation.selector}\`\n`;
          output += `   - Recommendation: ${violation.recommendation}\n\n`;
        });
      }

      if (minorViolations.length > 0) {
        output += `### Minor (${minorViolations.length})\n\n`;
        minorViolations.forEach((violation, index) => {
          output += `${index + 1}. **${violation.message}**\n`;
          output += `   - Element: \`${violation.selector}\`\n`;
          output += `   - Recommendation: ${violation.recommendation}\n\n`;
        });
      }
    }

    if (report.passes.length > 0) {
      output += `## Passed Checks (${report.passes.length})\n\n`;
      report.passes.forEach(check => {
        output += `✅ ${check}\n`;
      });
      output += '\n';
    }

    output += `## Metadata\n\n`;
    output += `- Total Elements Checked: ${report.metadata.totalElements}\n`;
    output += `- Rules Applied: ${report.metadata.checkedRules}\n`;
    output += `- Browser: ${report.metadata.browserInfo}\n`;

    return output;
  }
}

// Export for use in components and testing
export const accessibilityValidator = new AccessibilityValidator();
export { AccessibilityValidator };
export type { AccessibilityRule, AccessibilityViolation, AccessibilityReport };