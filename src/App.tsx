// ACCESSIBILITY STATUS: ✅ COMPLETE
// Semantic HTML: header, nav, main, footer with proper roles
// ARIA labels: Extensive coverage on all interactive elements
// Skip links: Implemented for keyboard navigation
// Screen reader support: Live regions, announcements, SR-only content
// Last verified: December 2025

import React, { useState, useEffect, Suspense, lazy } from "react";
import { useIsMobile } from "./hooks/use-mobile";
import { useCustomNotifications } from "@/hooks/use-custom-notifications";
import SafeLocalStorage from "@/utils/SafeLocalStorage";
import { Toaster } from "@/components/ui/toaster";
import { NotificationContainer } from "@/components/ui/custom-notification";
import { OfflineStatus } from "@/components/ui/offline-status";
import { EnhancedNotifications, useEnhancedNotifications } from "@/components/ui/enhanced-notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { initKeyboardNavigationDetector } from "@/utils/keyboardNavigationDetector";

// Phase 1 Enhancement Components
import MobileBottomNav from "@/components/ui/MobileBottomNav";
import { useIsMobile as useIsMobileEnhanced } from "@/hooks/use-mobile";
import {
  useScreenReaderAnnouncer,
  SkipLink,
  useKeyboardNavigation,
  useKeyboardNavigationEnhanced,
  useAccessibilityTester,
  useResponsiveText,
  useScreenReaderDetection,
  useColorContrast
} from "@/components/ui/AccessibilityEnhancements";
import custodialDutyImage from "./assets/assets_task_01k0ah80j5ebdamsccd7rpnaeh_1752700412_img_0_1752768056345.webp";
import sharedServicesImage from "./assets/assets_task_01k0ahgtr1egvvpjk9qvwtzvyg_1752700690_img_1_1752767788234.webp";

// Workflow integration components
import {
  FloatingActionButton,
  QuickCaptureCard,
  ReviewInspectionsCard,
} from "@/components/ui/FloatingActionButton";
import { usePendingCount } from "@/hooks/usePendingCount";

// Lazy load page components for code splitting - reduces initial bundle size
// Each page is loaded only when the user navigates to it
const CustodialInspectionPage = lazy(() => import("./pages/custodial-inspection"));
const InspectionDataPage = lazy(() => import("./pages/inspection-data"));
const CustodialNotesPage = lazy(() => import("./pages/custodial-notes"));
const WholeBuildingInspectionPage = lazy(() => import("./pages/whole-building-inspection"));
const RatingCriteriaPage = lazy(() => import("./pages/rating-criteria"));
const AdminInspectionsPage = lazy(() => import("./pages/admin-inspections"));
const MonthlyFeedbackPage = lazy(() => import("./pages/monthly-feedback"));
const ScoresDashboard = lazy(() => import("./pages/scores-dashboard"));
const AnalyticsDashboard = lazy(() => import("./pages/analytics-dashboard"));
const QuickCapturePage = lazy(() => import("./pages/quick-capture"));
const PhotoFirstReviewPage = lazy(() => import("./pages/photo-first-review"));
const NotFoundPage = lazy(() => import("./pages/not-found"));

// Loading skeleton component with accessibility support
const PageLoadingSkeleton = () => (
  <div 
    className="min-h-screen bg-background flex items-center justify-center p-4"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div className="text-center max-w-md mx-auto">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" aria-hidden="true"></div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Loading...</h2>
      <p className="text-muted-foreground">Please wait while we load the page.</p>
      <span className="sr-only">Page content is loading</span>
    </div>
  </div>
);

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="modern-button bg-primary hover:bg-primary/90 border-primary text-primary-foreground"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
const [currentPage, setCurrentPage] = useState<
    | "Custodial"
    | "Custodial Inspection"
    | "Custodial Notes"
    | "Inspection Data"
    | "Whole Building Inspection"
    | "Rating Criteria"
    | "admin-inspections"
    | "Monthly Feedback"
    | "Scores Dashboard"
    | "Analytics Dashboard"
    | "Quick Capture"
    | "Photo Review"
  >("Custodial");
  const [isInstallSectionOpen, setIsInstallSectionOpen] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [showInstallSuccess, setShowInstallSuccess] = useState(false);
  
  // Scroll direction state for FAB visibility
  const [showFab, setShowFab] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Phase 1: Enhanced mobile detection and accessibility
  const isMobile = useIsMobile();
  const { announce } = useScreenReaderAnnouncer();

  // Enhanced accessibility features
  useKeyboardNavigation();
  useKeyboardNavigationEnhanced();
  const { runQuickAudit } = useAccessibilityTester();
  const { textSize, increaseTextSize, decreaseTextSize } = useResponsiveText();
  const hasScreenReader = useScreenReaderDetection();
  const { meetsWCAGAA } = useColorContrast();
  const { pendingCount: pendingInspectionCount } = usePendingCount({ pollingMs: 30_000 });

  // Initialize CSRF protection on app load
  useEffect(() => {
    // Dynamically import to avoid circular dependencies
    import('@/utils/csrf').then(({ initializeCsrf }) => {
      initializeCsrf().catch((error) => {
        console.warn('[App] CSRF initialization failed:', error);
      });
    });
  }, []);

  // Development: Run accessibility audit in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const auditInterval = setInterval(() => {
        const audit = runQuickAudit();
        if (audit.total > 0) {
          console.group('🔍 Accessibility Audit Results');
          console.log(`Score: ${audit.score}/100 (${audit.total} violations)`);
          audit.violations.forEach((violation, index) => {
            console.warn(`${index + 1}. ${violation}`);
          });
          console.groupEnd();
        }
      }, 10000); // Run audit every 10 seconds in development

      return () => clearInterval(auditInterval);
    }
  }, [runQuickAudit]);

  // Custom notifications hook
  const { notifications, removeNotification } = useCustomNotifications();

  // Enhanced notifications hook
  const {
    notifications: enhancedNotifications,
    removeNotification: removeEnhancedNotification,
    showSuccess,
    showError,
    showInfo,
    showOffline
  } = useEnhancedNotifications();

  // Initialize keyboard navigation detector for enhanced accessibility
  useEffect(() => {
    const cleanup = initKeyboardNavigationDetector();
    return cleanup;
  }, []);

  // Scroll direction detection for FAB visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show FAB when scrolling up or near top, hide when scrolling down
      if (currentScrollY < 50) {
        setShowFab(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past threshold - hide FAB
        setShowFab(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show FAB
        setShowFab(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Phase 1: Announce page changes to screen readers
  useEffect(() => {
    if (currentPage !== "Custodial") {
      const pageNames: Record<string, string> = {
        "Custodial Inspection": "Single Area Inspection Form",
        "Custodial Notes": "Custodial Concern Reporting Form",
        "Inspection Data": "Inspection Data and Reports",
        "Whole Building Inspection": "Whole Building Inspection Form",
        "Rating Criteria": "Rating Criteria Reference Guide",
        "admin-inspections": "Admin Inspections Panel",
        "Monthly Feedback": "Monthly Feedback Reports",
        "Scores Dashboard": "Building Scores Dashboard",
        "Analytics Dashboard": "Analytics Dashboard",
        "Quick Capture": "Quick Photo Capture",
        "Photo Review": "Photo-First Review"
      };

      announce(`Navigated to ${pageNames[currentPage] || currentPage}`);
    }
  }, [currentPage, announce]);

  // Globally disable native HTML5 validation popups (Safari/iOS) and rely on our JS validation
  useEffect(() => {
    const applyGlobalNoValidate = () => {
      const forms = document.querySelectorAll('form');
      forms.forEach((form) => {
        // Disable built-in validation UI
        (form as HTMLFormElement).noValidate = true;
        // Soften overly strict inputs if any were authored with pattern attributes
        form.querySelectorAll('input[pattern]').forEach((el) => {
          // Keep attribute for semantics but prevent native popup by moving to data-* (optional)
          const input = el as HTMLInputElement;
          input.setAttribute('data-pattern', input.getAttribute('pattern') || '');
          input.removeAttribute('pattern');
        });
        // Prevent default invalid UI if any slips through
        form.addEventListener('invalid', (e) => {
          e.preventDefault();
        }, true);
      });
    };

    // Run now and after HMR/renders that may add forms
    applyGlobalNoValidate();
    const observer = new MutationObserver(applyGlobalNoValidate);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Detect PWA installation status
  useEffect(() => {
    const checkPWAStatus = () => {
      // Check if app is running in standalone mode (installed PWA)
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://");

      setIsPWAInstalled(isStandalone);

      // Show success message if just installed
      if (isStandalone && !SafeLocalStorage.getItem("pwa-install-shown")) {
        setShowInstallSuccess(true);
        SafeLocalStorage.setItem("pwa-install-shown", "true");
        setTimeout(() => setShowInstallSuccess(false), 5000);

        // Show enhanced notification
        showSuccess(
          "App Installed Successfully!",
          "You can now access Custodial Command directly from your home screen.",
          { duration: 5000 }
        );
      }
    };

    checkPWAStatus();

    // Automatic cache invalidation and version check
    const checkForUpdates = () => {
      const currentVersion = 'v6';
      const storedVersion = SafeLocalStorage.getItem('app-version');

      // If version changed, clear cache and reload
      if (storedVersion && storedVersion !== currentVersion) {
        console.log('App version updated, clearing cache...');

        // Clear all caches
        if ('caches' in window) {
          caches.keys().then((cacheNames) => {
            cacheNames.forEach((cacheName) => {
              caches.delete(cacheName);
            });
          });
        }

        // Clear localStorage except for essential data
        const essentialKeys = ['app-version', 'pwa-install-shown'];
        const allKeys = SafeLocalStorage.keys();
        const keysToRemove = allKeys.filter(key => !essentialKeys.includes(key));
        keysToRemove.forEach(key => SafeLocalStorage.removeItem(key));

        // Update version and reload
        SafeLocalStorage.setItem('app-version', currentVersion);
        showInfo('App Updated', '🔄 App updated! Reloading with latest version...');
        setTimeout(() => window.location.reload(), 2000);
        return;
      }

      // Store current version
      SafeLocalStorage.setItem('app-version', currentVersion);
    };

    checkForUpdates();

    // Listen for app install events
    const handleAppInstalled = () => {
      setIsPWAInstalled(true);
      setShowInstallSuccess(true);
      SafeLocalStorage.setItem("pwa-install-shown", "true");
      setTimeout(() => setShowInstallSuccess(false), 5000);

      // Show enhanced notification
      showSuccess(
        "App Installed Successfully!",
        "You can now access Custodial Command directly from your home screen.",
        { duration: 5000 }
      );
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", checkPWAStatus);

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener("change", checkPWAStatus);
    };
  }, []);

  const navLinks = [{ name: "Home", path: "Custodial" as const }];

  const renderPageContent = () => {
    try {
      switch (currentPage) {
        case "Custodial":
          return (
            <div className="p-8 text-center">
              {/* PWA Installation Status */}
              <div className="mb-8 max-w-2xl mx-auto">
                {/* Success notification */}
                {showInstallSuccess && (
                  <div className="mb-4 p-4 bg-accent/20 border-2 border-accent/50 rounded-lg shadow-md">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-2xl">✅</span>
                      <span className="text-lg font-bold text-accent-foreground">
                        App Successfully Installed!
                      </span>
                    </div>
                    <p className="text-center text-accent-foreground mt-2">
                      You can now access Custodial Command directly from your
                      home screen.
                    </p>
                  </div>
                )}

                {/* Current status display */}
                {isPWAInstalled ? (
                  <div className="mb-4 p-4 bg-accent/20 border-2 border-accent/50 rounded-lg shadow-md">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-xl">📱</span>
                      <span className="text-lg font-bold text-accent-foreground">
                        Running as Installed App
                      </span>
                      <span className="text-xl">✅</span>
                    </div>
                    <p className="text-center text-accent-foreground mt-1 text-sm">
                      App is installed and working offline-ready
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      setIsInstallSectionOpen(!isInstallSectionOpen)
                    }
                    className="w-full p-4 bg-amber-100 border-2 border-amber-300 rounded-lg shadow-md hover:bg-amber-150 transition-colors flex items-center justify-between"
                  >
                    <span className="text-lg font-bold text-amber-900">
                      📱 Install on Your Mobile Device
                    </span>
                    <span className="text-amber-900 text-xl">
                      {isInstallSectionOpen ? "−" : "+"}
                    </span>
                  </button>
                )}

                {!isPWAInstalled && isInstallSectionOpen && (
                  <div className="mt-4 p-6 bg-amber-50 border-2 border-amber-300 rounded-lg shadow-md">
                    <div className="text-amber-800 space-y-3">
                      <div className="bg-white p-3 rounded border border-amber-200">
                        <p className="font-semibold text-amber-900 mb-1">
                          iPhone/iPad:
                        </p>
                        <p className="text-sm">
                          1. Tap the Share button (□↗) in Safari
                        </p>
                        <p className="text-sm">
                          2. Scroll down and tap "Add to Home Screen"
                        </p>
                        <p className="text-sm">
                          3. Tap "Add" to install the app
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded border border-amber-200">
                        <p className="font-semibold text-amber-900 mb-1">
                          Android:
                        </p>
                        <p className="text-sm">
                          1. Tap the menu (⋮) in Chrome or your browser
                        </p>
                        <p className="text-sm">
                          2. Select "Add to Home screen" or "Install app"
                        </p>
                        <p className="text-sm">
                          3. Tap "Add" or "Install" to confirm
                        </p>
                      </div>
                      <p className="text-center text-sm font-medium text-amber-700 mt-3">
                        Once installed, access the app directly from your home
                        screen like any other app!
                      </p>
                      <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded">
                        <p className="text-center text-sm font-medium text-accent-foreground">
                          ✓ Works offline after installation - previously viewed
                          pages remain accessible
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Actions - Inspections and Reports */}
              <div className="space-y-6 mb-6">
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-2">
                    Submit Inspections
                  </h2>
                  <div className="responsive-grid">
                    <button
                      onClick={() => setCurrentPage("Custodial Notes")}
                      className="modern-button bg-blue-600 hover:bg-blue-700 border-blue-600 text-white shadow-md hover:shadow-lg transition-shadow"
                    >
                      <span className="flex items-center justify-center gap-2">
                        📝 Report A Custodial Concern
                      </span>
                    </button>
                    <button
                      onClick={() => setCurrentPage("Custodial Inspection")}
                      className="modern-button bg-blue-600 hover:bg-blue-700 border-blue-600 text-white shadow-md hover:shadow-lg transition-shadow"
                    >
                      <span className="flex items-center justify-center gap-2">
                        🔍 Single Area Inspection
                      </span>
                    </button>
                    <button
                      onClick={() => setCurrentPage("Whole Building Inspection")}
                      className="modern-button bg-blue-600 hover:bg-blue-700 border-blue-600 text-white shadow-md hover:shadow-lg transition-shadow"
                    >
                      <span className="flex items-center justify-center gap-2">
                        🏢 Building Inspection
                      </span>
                    </button>
                  </div>
                </div>

                {/* Workflow Features - Quick Capture and Photo Review */}
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-2">
                    Workflow
                  </h2>
                  <div className="space-y-3">
                    {/* Quick Capture - shown prominently on mobile */}
                    <div className="lg:hidden">
                      <QuickCaptureCard
                        onClick={() => setCurrentPage("Quick Capture")}
                      />
                    </div>
                    {/* Quick Capture - shown as secondary option on desktop */}
                    <div className="hidden lg:block">
                      <QuickCaptureCard
                        onClick={() => setCurrentPage("Quick Capture")}
                      />
                    </div>
                    {/* Review Inspections - shown prominently on desktop */}
                    <ReviewInspectionsCard
                      onClick={() => setCurrentPage("Photo Review")}
                      pendingCount={pendingInspectionCount}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-2">
                    View & Reports
                  </h2>
                  <div className="responsive-grid">
                    <button
                      onClick={() => setCurrentPage("Scores Dashboard")}
                      className="modern-button bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-md hover:shadow-lg transition-shadow"
                    >
                      <span className="flex items-center justify-center gap-2">
                        📈 Building Scores Dashboard
                      </span>
                    </button>
                    <button
                      onClick={() => setCurrentPage("Analytics Dashboard")}
                      className="modern-button bg-teal-600 hover:bg-teal-700 border-teal-600 text-white shadow-md hover:shadow-lg transition-shadow"
                    >
                      <span className="flex items-center justify-center gap-2">
                        📊 Analytics Dashboard
                      </span>
                    </button>
                    <button
                      onClick={() => setCurrentPage("Inspection Data")}
                      className="modern-button bg-green-600 hover:bg-green-700 border-green-600 text-white shadow-md hover:shadow-lg transition-shadow"
                    >
                      <span className="flex items-center justify-center gap-2">
                        📊 View Data & Reports
                      </span>
                    </button>
                    <button
                      onClick={() => setCurrentPage("Monthly Feedback")}
                      className="modern-button bg-purple-600 hover:bg-purple-700 border-purple-600 text-white shadow-md hover:shadow-lg transition-shadow"
                    >
                      <span className="flex items-center justify-center gap-2">
                        📄 Monthly Feedback Reports
                      </span>
                    </button>
                    <button
                      onClick={() => setCurrentPage("Rating Criteria")}
                      className="modern-button bg-gray-600 hover:bg-gray-700 border-gray-600 text-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="flex items-center justify-center gap-2">
                        ℹ️ Rating Criteria Guide
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-lg text-muted-foreground text-center">
                Cleanliness is a duty for all.
              </p>

              {/* Floating Action Button for Quick Capture (mobile only) */}
              <FloatingActionButton
                onClick={() => setCurrentPage("Quick Capture")}
                icon="camera"
                variant="capture"
                aria-label="Quick capture photos"
                badge={pendingInspectionCount > 0 ? pendingInspectionCount : undefined}
                visible={showFab}
              />
            </div>
          );
        case "Custodial Inspection":
          return (
            <Suspense fallback={<PageLoadingSkeleton />}>
              <CustodialInspectionPage
                onBack={() => setCurrentPage("Custodial")}
              />
            </Suspense>
          );
        case "Inspection Data":
          return (
            <Suspense fallback={<PageLoadingSkeleton />}>
              <InspectionDataPage onBack={() => setCurrentPage("Custodial")} />
            </Suspense>
          );
        case "Custodial Notes":
          return (
            <Suspense fallback={<PageLoadingSkeleton />}>
              <CustodialNotesPage onBack={() => setCurrentPage("Custodial")} />
            </Suspense>
          );
        case "Whole Building Inspection":
          return (
            <Suspense fallback={<PageLoadingSkeleton />}>
              <WholeBuildingInspectionPage
                onBack={() => setCurrentPage("Custodial")}
              />
            </Suspense>
          );
        case "Rating Criteria":
          return (
            <Suspense fallback={<PageLoadingSkeleton />}>
              <RatingCriteriaPage onBack={() => setCurrentPage("Custodial")} />
            </Suspense>
          );
        case "admin-inspections":
          return (
            <Suspense fallback={<PageLoadingSkeleton />}>
              <AdminInspectionsPage onBack={() => setCurrentPage("Custodial")} />
            </Suspense>
          );
        case "Monthly Feedback":
          return (
            <Suspense fallback={<PageLoadingSkeleton />}>
              <MonthlyFeedbackPage onBack={() => setCurrentPage("Custodial")} />
            </Suspense>
          );
        case "Scores Dashboard":
          return (
            <Suspense fallback={<PageLoadingSkeleton />}>
              <ScoresDashboard onBack={() => setCurrentPage("Custodial")} />
            </Suspense>
          );
        case "Analytics Dashboard":
          return (
            <Suspense fallback={<PageLoadingSkeleton />}>
              <AnalyticsDashboard onBack={() => setCurrentPage("Custodial")} />
            </Suspense>
          );
        case "Quick Capture":
          return (
            <Suspense fallback={<PageLoadingSkeleton />}>
              <QuickCapturePage onBack={() => setCurrentPage("Custodial")} />
            </Suspense>
          );
        case "Photo Review":
          return (
            <Suspense fallback={<PageLoadingSkeleton />}>
              <PhotoFirstReviewPage />
            </Suspense>
          );
        default:
          return (
            <Suspense fallback={<PageLoadingSkeleton />}>
              <NotFoundPage onBack={() => setCurrentPage("Custodial")} />
            </Suspense>
          );
      }
    } catch (error) {
      console.error("Error rendering page:", error);
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Error Loading Page
          </h1>
          <p className="mt-2 text-gray-600">
            Something went wrong. Please try again.
          </p>
          <button
            onClick={() => setCurrentPage("Custodial")}
            className="mt-4 modern-button bg-primary hover:bg-primary/90 border-primary text-primary-foreground"
          >
            Return Home
          </button>
        </div>
      );
    }
  };

  return (
    <ErrorBoundary>
      {/* QueryClientProvider and Router are now wrapped within ErrorBoundary */}
      <QueryClientProvider client={queryClient}>
        <Router>
          <div
            className="bg-background text-foreground min-h-screen pb-16 lg:pb-0"
            data-testid="app-container"
            lang="en"
          >
            {/* Enhanced Skip Links for keyboard navigation */}
            <div className="sr-only" role="navigation" aria-label="Skip links">
              <SkipLink href="#main-content">Skip to main content</SkipLink>
              <SkipLink href="#navigation">Skip to navigation</SkipLink>
              <SkipLink href="#footer">Skip to footer</SkipLink>
            </div>

            <div className="main-container">
              {/* Header section with app title */}
              <header
                className="w-full header-container rounded-xl shadow-sm"
                role="banner"
              >
                <h1 className="font-bold modern-header tracking-tight" id="app-title">
                  CA Custodial Command
                </h1>
                <div className="sr-only" aria-live="polite">
                  {hasScreenReader && "Screen reader mode detected"}
                </div>
              </header>

              {/* Navigation section */}
              <nav
                className="w-full nav-container rounded-xl shadow-sm"
                role="navigation"
                aria-labelledby="app-title"
                id="navigation"
              >
                <div className="button-container" role="menubar">
                  {navLinks.map((link) => (
                    <button
                      key={link.name}
                      onClick={() => setCurrentPage(link.path)}
                      className={`modern-button ${currentPage === link.path ? "bg-primary/80" : ""
                        }`}
                      role="menuitem"
                      aria-current={currentPage === link.path ? "page" : undefined}
                      aria-label={`${link.name} page${currentPage === link.path ? ", current page" : ""}`}
                    >
                      {link.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage("admin-inspections")}
                    className="modern-button bg-red-600 hover:bg-red-700 border-red-600 text-white"
                    role="menuitem"
                    aria-label="Admin inspections panel"
                    aria-current={currentPage === "admin-inspections" ? "page" : undefined}
                  >
                    Admin
                  </button>
                </div>
              </nav>

              {/* Text size controls for accessibility */}
              <div
                className="w-full nav-container rounded-xl shadow-sm mb-4"
                role="toolbar"
                aria-label="Text size controls"
              >
                <div className="button-container">
                  <button
                    onClick={decreaseTextSize}
                    className="modern-button bg-secondary hover:bg-secondary/80"
                    aria-label="Decrease text size"
                    disabled={textSize === 'small'}
                  >
                    <span aria-hidden="true">A-</span>
                    <span className="sr-only">Decrease text size</span>
                  </button>
                  <span
                    className="text-sm text-muted-foreground px-2"
                    aria-live="polite"
                    aria-label={`Current text size: ${textSize}`}
                  >
                    Text Size: {textSize.charAt(0).toUpperCase() + textSize.slice(1)}
                  </span>
                  <button
                    onClick={increaseTextSize}
                    className="modern-button bg-secondary hover:bg-secondary/80"
                    aria-label="Increase text size"
                    disabled={textSize === 'large'}
                  >
                    <span aria-hidden="true">A+</span>
                    <span className="sr-only">Increase text size</span>
                  </button>
                </div>
              </div>

              {/* Offline Status */}
              <OfflineStatus className="mb-4" />

              {/* Main content area */}
              <main
                id="main-content"
                className="w-full content-area rounded-xl shadow-sm"
                role="main"
                aria-label="Main content"
                tabIndex={-1}
              >
                {renderPageContent()}
              </main>
            </div>

            {/* Footer section */}
            <footer
              className="w-full mt-6 text-center text-muted-foreground text-sm"
              role="contentinfo"
              id="footer"
            >
              <p>
                &copy; 2025 Shared Service Command. All rights reserved. For the
                People!
              </p>
              <div className="mt-2 text-xs">
                <span aria-label="Accessibility information">
                  WCAG 2.2 AA Compliant | Screen reader friendly
                </span>
              </div>
            </footer>

            {/* Phase 1: Mobile Bottom Navigation - replaces sidebar on mobile */}
            <MobileBottomNav className="lg:hidden" />

            {/* Enhanced notification region */}
            <div
              aria-live="polite"
              aria-label="Application notifications"
              role="region"
            >
              <Toaster />
              <NotificationContainer
                notifications={notifications}
                onRemove={removeNotification}
              />
              <EnhancedNotifications
                notifications={enhancedNotifications}
                onRemove={removeEnhancedNotification}
              />
            </div>

            {/* Screen reader announcements */}
            <div
              className="sr-only"
              aria-live="assertive"
              aria-atomic="true"
              id="screen-reader-announcements"
            />
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
