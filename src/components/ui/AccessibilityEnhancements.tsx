import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

// Skip to main content link for keyboard navigation
const SkipLink = ({ href, children, className }: SkipLinkProps) => {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 transition-all duration-200 hover:bg-blue-700",
        className
      )}
    >
      {children}
    </a>
  );
};

// Enhanced focus visible utility
const useFocusVisible = () => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleFocusIn = () => {
      element.classList.add('focus-visible');
      element.classList.remove('focus-not-visible');
    };

    const handleFocusOut = () => {
      element.classList.remove('focus-visible');
      element.classList.add('focus-not-visible');
    };

    element.addEventListener('focusin', handleFocusIn);
    element.addEventListener('focusout', handleFocusOut);

    // Initial state
    if (document.activeElement === element) {
      element.classList.add('focus-visible');
    } else {
      element.classList.add('focus-not-visible');
    }

    return () => {
      element.removeEventListener('focusin', handleFocusIn);
      element.removeEventListener('focus-out', handleFocusOut);
    };
  }, []);

  return ref;
};

// Live region announcer for screen readers
interface LiveRegionProps {
  politeness?: 'polite' | 'assertive' | 'off';
  ariaLive?: 'polite' | 'assertive' | 'off';
  children?: React.ReactNode;
}

const LiveRegion = ({
  politeness = 'polite',
  ariaLive = 'polite',
  children
}: LiveRegionProps) => {
  return (
    <div
      aria-live={ariaLive}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
};

// Announcer for screen reader messages
const useScreenReaderAnnouncer = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  };

  return { announce };
};

// Enhanced keyboard navigation hook
const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === 'Escape') {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>;

        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }

      // Handle Tab + Shift for backwards navigation
      if (event.key === 'Tab' && event.shiftKey) {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>;

        if (focusableElements.length > 0) {
          const lastElement = focusableElements[focusableElements.length - 1];
          if (document.activeElement === lastElement) {
            event.preventDefault();
            if (focusableElements.length > 1) {
              focusableElements[0].focus();
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};

// Enhanced WCAG AA Color contrast checker with HSL support
const useColorContrast = () => {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
      r: Math.round(255 * f(0)),
      g: Math.round(255 * f(8)),
      b: Math.round(255 * f(4))
    };
  };

  const parseColor = (color: string) => {
    // Handle HSL values from CSS variables
    if (color.includes('hsl')) {
      const matches = color.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
      if (matches) {
        const [, h, s, l] = matches.map(Number);
        return hslToRgb(h, s, l);
      }
    }

    // Handle hex colors
    if (color.startsWith('#')) {
      return hexToRgb(color);
    }

    return null;
  };

  const getLuminance = (rgb: { r: number; g: number; b: number }) => {
    const { r, g, b } = rgb;
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLin = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLin = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLin = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
  };

  const getContrastRatio = (foreground: string, background: string): number => {
    const fgRgb = parseColor(foreground);
    const bgRgb = parseColor(background);

    if (!fgRgb || !bgRgb) return 0;

    const fgLuminance = getLuminance(fgRgb);
    const bgLuminance = getLuminance(bgRgb);

    const lighter = fgLuminance > bgLuminance;
    const L1 = lighter ? fgLuminance : bgLuminance;
    const L2 = lighter ? bgLuminance : fgLuminance;

    return (L1 + 0.05) / (L2 + 0.05);
  };

  const meetsWCAGAA = (foreground: string, background: string) => {
    return getContrastRatio(foreground, background) >= 4.5;
  };

  const meetsWCAGAAA = (foreground: string, background: string) => {
    return getContrastRatio(foreground, background) >= 7;
  };

  const meetsWCAGAALarge = (foreground: string, background: string) => {
    return getContrastRatio(foreground, background) >= 3;
  };

  return {
    getContrastRatio,
    meetsWCAGAA,
    meetsWCAGAAA,
    meetsWCAGAALarge,
    parseColor
  };
};

// ARIA attributes helper
const useAriaAttributes = () => {
  const getAriaLabel = (element: HTMLElement): string | null => {
    return element.getAttribute('aria-label') || element.textContent?.trim() || null;
  };

  const setAriaLabel = (element: HTMLElement, label: string) => {
    element.setAttribute('aria-label', label);
  };

  const setAriaDescribedBy = (element: HTMLElement, describedBy: string[]) => {
    element.setAttribute('aria-describedby', describedBy.join(' '));
  };

  const setAriaExpanded = (element: HTMLElement, expanded: boolean) => {
    element.setAttribute('aria-expanded', expanded.toString());
  };

  const setAriaHidden = (element: HTMLElement, hidden: boolean) => {
    element.setAttribute('aria-hidden', hidden.toString());
  };

  const setRole = (element: HTMLElement, role: string) => {
    element.setAttribute('role', role);
  };

  const setAriaInvalid = (element: HTMLElement, invalid: boolean | string) => {
    element.setAttribute('aria-invalid', invalid.toString());
  };

  const setAriaRequired = (element: HTMLElement, required: boolean) => {
    element.setAttribute('aria-required', required.toString());
  };

  return {
    getAriaLabel,
    setAriaLabel,
    setAriaDescribedBy,
    setAriaExpanded,
    setAriaHidden,
    setRole,
    setAriaInvalid,
    setAriaRequired
  };
};

// Focus trap for modals and dropdowns
const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Backwards navigation
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Forward navigation
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
};

// Enhanced WCAG 2.2 features

// Heading hierarchy checker
const useHeadingHierarchy = () => {
  const validateHeadingStructure = useCallback(() => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const violations: string[] = [];
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.charAt(1));

      // Check for skipped heading levels
      if (index > 0 && currentLevel > previousLevel + 1) {
        violations.push(`Skipped heading level: h${previousLevel} to h${currentLevel} at "${heading.textContent}"`);
      }

      // Check for empty headings
      if (!heading.textContent?.trim()) {
        violations.push(`Empty ${heading.tagName} found`);
      }

      previousLevel = currentLevel;
    });

    return violations;
  }, []);

  const getHeadingOutline = useCallback(() => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    return Array.from(headings).map(heading => ({
      level: parseInt(heading.tagName.charAt(1)),
      text: heading.textContent?.trim() || '',
      id: heading.id || ''
    }));
  }, []);

  return { validateHeadingStructure, getHeadingOutline };
};

// Alt text validator for images
const useAltTextValidator = () => {
  const validateImages = useCallback(() => {
    const images = document.querySelectorAll('img');
    const violations: string[] = [];

    images.forEach((img, index) => {
      const alt = img.getAttribute('alt');

      // Check for missing alt text
      if (alt === null) {
        violations.push(`Image ${index + 1}: Missing alt attribute`);
      }

      // Check for decorative images not marked as such
      if (alt === '' && !img.getAttribute('role')) {
        violations.push(`Image ${index + 1}: Decorative image should have role="presentation" or alt=""`);
      }

      // Check for overly long alt text
      if (alt && alt.length > 125) {
        violations.push(`Image ${index + 1}: Alt text too long (${alt.length} chars), consider using longdesc`);
      }
    });

    return violations;
  }, []);

  return { validateImages };
};

// Link text validator
const useLinkTextValidator = () => {
  const validateLinks = useCallback(() => {
    const links = document.querySelectorAll('a[href]');
    const violations: string[] = [];
    const linkTexts = new Set<string>();

    links.forEach((link, index) => {
      const text = link.textContent?.trim() || '';
      const href = link.getAttribute('href') || '';

      // Check for empty links
      if (!text && !link.querySelector('img')) {
        violations.push(`Link ${index + 1}: Empty link text`);
      }

      // Check for generic link text
      const genericTexts = ['click here', 'read more', 'learn more', 'here', 'more'];
      if (genericTexts.includes(text.toLowerCase())) {
        violations.push(`Link ${index + 1}: Generic link text "${text}" - be more descriptive`);
      }

      // Check for duplicate link text with different destinations
      if (linkTexts.has(text)) {
        violations.push(`Link ${index + 1}: Duplicate link text "${text}" - ensure context or make unique`);
      } else {
        linkTexts.add(text);
      }

      // Check if link opens in new window without warning
      if (link.getAttribute('target') === '_blank' && !link.getAttribute('aria-label')?.includes('opens')) {
        violations.push(`Link ${index + 1}: Opens new window without accessibility warning`);
      }
    });

    return violations;
  }, []);

  return { validateLinks };
};

// Form accessibility validator
const useFormAccessibility = () => {
  const validateForms = useCallback(() => {
    const forms = document.querySelectorAll('form');
    const violations: string[] = [];

    forms.forEach((form, formIndex) => {
      const inputs = form.querySelectorAll('input, select, textarea');

      inputs.forEach((input, inputIndex) => {
        const inputType = input.tagName.toLowerCase();
        const inputId = input.id;

        // Check for proper labels
        const hasLabel = inputId ? document.querySelector(`label[for="${inputId}"]`) : false;
        const hasAriaLabel = input.getAttribute('aria-label');
        const hasAriaLabelledBy = input.getAttribute('aria-labelledby');

        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
          violations.push(`Form ${formIndex + 1}, ${inputType} ${inputIndex + 1}: Missing label or aria-label`);
        }

        // Check for required field indicators
        if (input.hasAttribute('required')) {
          const hasAriaRequired = input.getAttribute('aria-required') === 'true';
          const labelHasRequired = hasLabel && hasLabel?.textContent?.includes('*');

          if (!hasAriaRequired && !labelHasRequired) {
            violations.push(`Form ${formIndex + 1}, ${inputType} ${inputIndex + 1}: Required field not clearly indicated`);
          }
        }

        // Check for error messages
        if (input.classList.contains('error') || input.getAttribute('aria-invalid') === 'true') {
          const errorId = input.getAttribute('aria-describedby');
          const hasErrorMessage = errorId && document.getElementById(errorId);

          if (!hasErrorMessage) {
            violations.push(`Form ${formIndex + 1}, ${inputType} ${inputIndex + 1}: Invalid field has no error message`);
          }
        }
      });
    });

    return violations;
  }, []);

  return { validateForms };
};

// Focus management system
const useFocusManagement = () => {
  const [focusHistory, setFocusHistory] = useState<HTMLElement[]>([]);

  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      setFocusHistory(prev => [...prev.slice(-9), activeElement]);
    }
  }, []);

  const restoreFocus = useCallback((stepsBack: number = 1) => {
    const targetIndex = Math.max(0, focusHistory.length - stepsBack);
    const targetElement = focusHistory[targetIndex];

    if (targetElement && targetElement.focus) {
      targetElement.focus();
      return true;
    }
    return false;
  }, [focusHistory]);

  const clearFocusHistory = useCallback(() => {
    setFocusHistory([]);
  }, []);

  useEffect(() => {
    const handleFocusIn = () => saveFocus();
    document.addEventListener('focusin', handleFocusIn);

    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [saveFocus]);

  return { saveFocus, restoreFocus, clearFocusHistory, focusHistory };
};

// Screen reader detection
const useScreenReaderDetection = () => {
  const [hasScreenReader, setHasScreenReader] = useState(false);

  useEffect(() => {
    // Basic detection using common screen reader patterns
    const userAgent = navigator.userAgent.toLowerCase();
    const hasScreenReaderHint =
      userAgent.includes('nvda') ||
      userAgent.includes(' jaws') ||
      userAgent.includes('dragon') ||
      window.speechSynthesis !== undefined;

    // Test for reduced motion preference (common for screen reader users)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Test for high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    setHasScreenReader(hasScreenReaderHint || prefersReducedMotion || prefersHighContrast);
  }, []);

  return hasScreenReader;
};

// Accessibility testing helper
const useAccessibilityTester = () => {
  const runQuickAudit = useCallback(() => {
    const violations: string[] = [];

    // Check heading hierarchy
    const { validateHeadingStructure } = useHeadingHierarchy();
    violations.push(...validateHeadingStructure());

    // Check images
    const { validateImages } = useAltTextValidator();
    violations.push(...validateImages());

    // Check links
    const { validateLinks } = useLinkTextValidator();
    violations.push(...validateLinks());

    // Check forms
    const { validateForms } = useFormAccessibility();
    violations.push(...validateForms());

    // Check for proper lang attribute
    if (!document.documentElement.getAttribute('lang')) {
      violations.push('Missing lang attribute on html element');
    }

    // Check for page title
    if (!document.title || document.title.length === 0) {
      violations.push('Missing or empty page title');
    }

    return {
      violations,
      score: Math.max(0, 100 - (violations.length * 5)),
      total: violations.length
    };
  }, []);

  return { runQuickAudit };
};

// Responsive text accessibility
const useResponsiveText = () => {
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('medium');

  const increaseTextSize = useCallback(() => {
    setTextSize(prev => {
      if (prev === 'small') return 'medium';
      if (prev === 'medium') return 'large';
      return 'large';
    });
  }, []);

  const decreaseTextSize = useCallback(() => {
    setTextSize(prev => {
      if (prev === 'large') return 'medium';
      if (prev === 'medium') return 'small';
      return 'small';
    });
  }, []);

  const resetTextSize = useCallback(() => {
    setTextSize('medium');
  }, []);

  return { textSize, increaseTextSize, decreaseTextSize, resetTextSize };
};

// Keyboard navigation enhancer
const useKeyboardNavigationEnhanced = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Enhanced keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '+':
          case '=':
            // Increase text size
            event.preventDefault();
            document.body.style.fontSize = 'larger';
            break;
          case '-':
            // Decrease text size
            event.preventDefault();
            document.body.style.fontSize = 'smaller';
            break;
          case '0':
            // Reset text size
            event.preventDefault();
            document.body.style.fontSize = '';
            break;
        }
      }

      // Alt + key shortcuts for screen readers
      if (event.altKey) {
        switch (event.key) {
          case 'm':
            // Skip to main content
            event.preventDefault();
            const main = document.querySelector('main, [role="main"]') as HTMLElement;
            if (main) {
              main.focus();
              main.scrollIntoView();
            }
            break;
          case 'n':
            // Skip to navigation
            event.preventDefault();
            const nav = document.querySelector('nav, [role="navigation"]') as HTMLElement;
            if (nav) {
              nav.focus();
              nav.scrollIntoView();
            }
            break;
          case 'h':
            // Jump to first heading
            event.preventDefault();
            const h1 = document.querySelector('h1') as HTMLElement;
            if (h1) {
              h1.focus();
              h1.scrollIntoView();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};

export {
  SkipLink,
  LiveRegion,
  useFocusVisible,
  useScreenReaderAnnouncer,
  useKeyboardNavigation,
  useColorContrast,
  useAriaAttributes,
  useFocusTrap,
  // Enhanced WCAG 2.2 features
  useHeadingHierarchy,
  useAltTextValidator,
  useLinkTextValidator,
  useFormAccessibility,
  useFocusManagement,
  useScreenReaderDetection,
  useAccessibilityTester,
  useResponsiveText,
  useKeyboardNavigationEnhanced
};