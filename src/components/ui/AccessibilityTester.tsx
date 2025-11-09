import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  useAccessibilityTester,
  useHeadingHierarchy,
  useAltTextValidator,
  useLinkTextValidator,
  useFormAccessibility,
  useColorContrast
} from './AccessibilityEnhancements';

interface AccessibilityViolation {
  rule: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  message: string;
  element: string;
  selector: string;
}

interface AccessibilityAuditResult {
  violations: AccessibilityViolation[];
  score: number;
  total: number;
  timestamp: Date;
}

// Mock axe-core integration (would install @axe-core/react in production)
const useAxeCore = () => {
  const runAxeAudit = async (): Promise<AccessibilityViolation[]> => {
    // In production, this would use @axe-core/react
    // For now, we'll simulate axe-core results with our custom validators
    const violations: AccessibilityViolation[] = [];

    // Check for missing alt text
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.hasAttribute('alt')) {
        violations.push({
          rule: 'image-alt',
          impact: 'critical',
          message: 'Images must have alternate text',
          element: `img[${index}]`,
          selector: `img:nth-child(${index + 1})`
        });
      }
    });

    // Check for missing labels
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
      const hasLabel = input.id ? document.querySelector(`label[for="${input.id}"]`) : false;
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledBy = input.getAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        violations.push({
          rule: 'label',
          impact: 'critical',
          message: 'Form elements must have labels',
          element: `${input.tagName.toLowerCase()}[${index}]`,
          selector: `${input.tagName.toLowerCase()}:nth-child(${index + 1})`
        });
      }
    });

    // Check for missing lang attribute
    if (!document.documentElement.hasAttribute('lang')) {
      violations.push({
        rule: 'html-has-lang',
        impact: 'serious',
        message: 'html element must have a lang attribute',
        element: 'html',
        selector: 'html'
      });
    }

    // Check for page title
    if (!document.title || document.title.trim().length === 0) {
      violations.push({
        rule: 'document-title',
        impact: 'serious',
        message: 'document must have a title',
        element: 'title',
        selector: 'title'
      });
    }

    return violations;
  };

  return { runAxeAudit };
};

// Real-time accessibility monitoring
export const AccessibilityMonitor: React.FC<{
  enabled?: boolean;
  showAlerts?: boolean;
  className?: string;
}> = ({ enabled = true, showAlerts = true, className }) => {
  const { runAxeAudit } = useAxeCore();
  const { runQuickAudit } = useAccessibilityTester();
  const [auditResults, setAuditResults] = useState<AccessibilityAuditResult | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(enabled);
  const [violationCount, setViolationCount] = useState(0);

  const runComprehensiveAudit = useCallback(async () => {
    try {
      // Run axe-core audit
      const axeViolations = await runAxeAudit();

      // Run our custom audits
      const customAudit = runQuickAudit();

      // Combine results
      const allViolations = [
        ...axeViolations,
        ...customAudit.violations.map((violation, index) => ({
          rule: 'custom-rule',
          impact: 'moderate' as const,
          message: violation,
          element: `element-${index}`,
          selector: `.element-${index}`
        }))
      ];

      const result: AccessibilityAuditResult = {
        violations: allViolations,
        score: Math.max(0, 100 - (allViolations.length * 5)),
        total: allViolations.length,
        timestamp: new Date()
      };

      setAuditResults(result);
      setViolationCount(allViolations.length);

      // Show browser notification if enabled
      if (showAlerts && allViolations.length > 0 && 'Notification' in window) {
        new Notification('Accessibility Issues Detected', {
          body: `${allViolations.length} accessibility violations found`,
          icon: '/favicon.ico'
        });
      }

      return result;
    } catch (error) {
      console.error('Accessibility audit failed:', error);
      return null;
    }
  }, [runAxeAudit, runQuickAudit, showAlerts]);

  // Auto-monitor on DOM changes
  useEffect(() => {
    if (!isMonitoring) return;

    const observer = new MutationObserver(() => {
      runComprehensiveAudit();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'role', 'alt', 'title']
    });

    // Initial audit
    runComprehensiveAudit();

    return () => observer.disconnect();
  }, [isMonitoring, runComprehensiveAudit]);

  // Periodic audits
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(runComprehensiveAudit, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isMonitoring, runComprehensiveAudit]);

  if (!enabled) return null;

  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      <div className="bg-background border-2 border-border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground">Accessibility Monitor</h3>
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={cn(
              'px-2 py-1 text-xs rounded',
              isMonitoring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            )}
          >
            {isMonitoring ? 'Active' : 'Paused'}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">WCAG Score:</span>
            <span className={cn(
              'font-semibold',
              auditResults?.score && auditResults.score >= 95 ? 'text-green-600' :
              auditResults?.score && auditResults.score >= 80 ? 'text-yellow-600' :
              'text-red-600'
            )}>
              {auditResults?.score || 0}/100
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Violations:</span>
            <span className={cn(
              'font-semibold',
              violationCount === 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {violationCount}
            </span>
          </div>

          <button
            onClick={runComprehensiveAudit}
            className="w-full mt-2 px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
          >
            Run Audit Now
          </button>

          {auditResults && auditResults.violations.length > 0 && (
            <details className="mt-2">
              <summary className="text-sm font-medium cursor-pointer">
                View Violations ({auditResults.violations.length})
              </summary>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {auditResults.violations.map((violation, index) => (
                  <div
                    key={index}
                    className={cn(
                      'text-xs p-2 rounded',
                      violation.impact === 'critical' ? 'bg-red-50 text-red-800' :
                      violation.impact === 'serious' ? 'bg-orange-50 text-orange-800' :
                      'bg-yellow-50 text-yellow-800'
                    )}
                  >
                    <div className="font-medium">{violation.message}</div>
                    <div className="text-xs opacity-75">{violation.element}</div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

// Accessibility testing toolbar
export const AccessibilityToolbar: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { runAxeAudit } = useAxeCore();
  const { runQuickAudit } = useAccessibilityTester();
  const { getHeadingOutline } = useHeadingHierarchy();
  const { validateImages } = useAltTextValidator();
  const { validateLinks } = useLinkTextValidator();
  const { validateForms } = useFormAccessibility();
  const { meetsWCAGAA } = useColorContrast();

  const [testResults, setTestResults] = useState<any>(null);
  const [activeTest, setActiveTest] = useState<string | null>(null);

  const runTest = async (testType: string) => {
    setActiveTest(testType);
    let results = null;

    try {
      switch (testType) {
        case 'axe':
          results = await runAxeAudit();
          break;
        case 'headings':
          const outline = getHeadingOutline();
          results = {
            type: 'heading-outline',
            data: outline
          };
          break;
        case 'images':
          results = validateImages();
          break;
        case 'links':
          results = validateLinks();
          break;
        case 'forms':
          results = validateForms();
          break;
        case 'comprehensive':
          results = runQuickAudit();
          break;
        default:
          results = { error: 'Unknown test type' };
      }
    } catch (error) {
      results = { error: error instanceof Error ? error.message : 'Test failed' };
    }

    setTestResults(results);
    setActiveTest(null);
  };

  return (
    <div className={cn('bg-background border border-border rounded-lg shadow-lg p-4', className)}>
      <h3 className="font-semibold text-foreground mb-4">Accessibility Testing Toolbar</h3>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => runTest('comprehensive')}
          disabled={activeTest !== null}
          className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          Comprehensive Audit
        </button>

        <button
          onClick={() => runTest('axe')}
          disabled={activeTest !== null}
          className="px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90 disabled:opacity-50"
        >
          Axe Core Test
        </button>

        <button
          onClick={() => runTest('headings')}
          disabled={activeTest !== null}
          className="px-3 py-2 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/90 disabled:opacity-50"
        >
          Heading Structure
        </button>

        <button
          onClick={() => runTest('images')}
          disabled={activeTest !== null}
          className="px-3 py-2 bg-muted text-muted-foreground rounded text-sm hover:bg-muted/90 disabled:opacity-50"
        >
          Image Alt Text
        </button>

        <button
          onClick={() => runTest('links')}
          disabled={activeTest !== null}
          className="px-3 py-2 bg-muted text-muted-foreground rounded text-sm hover:bg-muted/90 disabled:opacity-50"
        >
          Link Text
        </button>

        <button
          onClick={() => runTest('forms')}
          disabled={activeTest !== null}
          className="px-3 py-2 bg-muted text-muted-foreground rounded text-sm hover:bg-muted/90 disabled:opacity-50"
        >
          Form Labels
        </button>
      </div>

      {activeTest && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Running {activeTest} test...</p>
        </div>
      )}

      {testResults && !activeTest && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-foreground mb-2">Test Results</h4>

          {testResults.error ? (
            <div className="text-red-600 text-sm">Error: {testResults.error}</div>
          ) : testResults.type === 'heading-outline' ? (
            <div className="space-y-1">
              <div className="text-sm font-medium">Heading Structure:</div>
              {testResults.data.length === 0 ? (
                <div className="text-muted-foreground text-sm">No headings found</div>
              ) : (
                testResults.data.map((heading: any, index: number) => (
                  <div
                    key={index}
                    className="text-sm ml-4"
                    style={{ marginLeft: `${(heading.level - 1) * 16}px` }}
                  >
                    H{heading.level}: {heading.text}
                  </div>
                ))
              )}
            </div>
          ) : Array.isArray(testResults) ? (
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {testResults.length === 0 ? '✅ No issues found' : `Found ${testResults.length} issues:`}
              </div>
              {testResults.map((violation: string, index: number) => (
                <div key={index} className="text-sm text-red-600 ml-4">
                  • {violation}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {testResults.violations ? (
                <div>
                  <div>Score: {testResults.score}/100</div>
                  <div>Violations: {testResults.total}</div>
                </div>
              ) : (
                'Test completed successfully'
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { useAxeCore };
export type { AccessibilityViolation, AccessibilityAuditResult };