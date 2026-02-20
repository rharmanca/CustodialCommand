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
  ReviewInspectionsCard,
} from "@/components/ui/FloatingActionButton";
import { QuickCaptureCard } from "@/components/dashboard/QuickCaptureCard";
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
            <div className="p-4 sm:p-6 lg:p-8">
              {/* PWA Installation Status */}
              <div className="mb-6 max-w-2xl mx-auto">
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

              {/* Workflow Sections - Phase 12-01 Dashboard Reorganization */}
              <div className="max-w-6xl mx-auto space-y-4">
                {/* 
                  Mobile: Single column, stacked sections
                  Desktop: Two-column grid (Capture | Review), Analyze below
                */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  
                  {/* CAPTURE SECTION - Amber/Warm Theme */}
                  <section 
                    className="bg-amber-50/50 rounded-xl p-4 border border-amber-100"
                    aria-labelledby="capture-heading"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h2 id="capture-heading" className="text-lg font-bold text-amber-900">
                        Capture
                      </h2>
                      <p className="text-sm text-amber-700 ml-auto hidden sm:block">
                        Document issues in the field
                      </p>
                    </div>
                    
                    {/* Quick Capture Card - Primary Action */}
                    <QuickCaptureCard
                      onClick={() => setCurrentPage("Quick Capture")}
                      className="mb-4"
                    />
                    
                    {/* Secondary Capture Options */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide px-1">
                        Full Inspections
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => setCurrentPage("Custodial Notes")}
                          className="p-3 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors text-left"
                        >
                          <span className="text-sm font-medium text-amber-900">📝 Report Concern</span>
                        </button>
                        <button
                          onClick={() => setCurrentPage("Custodial Inspection")}
                          className="p-3 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors text-left"
                        >
                          <span className="text-sm font-medium text-amber-900">🔍 Single Area</span>
                        </button>
                        <button
                          onClick={() => setCurrentPage("Whole Building Inspection")}
                          className="p-3 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors text-left sm:col-span-2"
                        >
                          <span className="text-sm font-medium text-amber-900">🏢 Building Inspection</span>
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* REVIEW SECTION - Teal/Cool Theme */}
                  <section 
                    className="bg-teal-50/50 rounded-xl p-4 border border-teal-100"
                    aria-labelledby="review-heading"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <h2 id="review-heading" className="text-lg font-bold text-teal-900">
                        Review
                      </h2>
                      {pendingInspectionCount > 0 && (
                        <span 
                          className={`ml-auto px-2.5 py-1 rounded-full text-sm font-bold ${
                            pendingInspectionCount >= 5 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}
                          aria-label={`${pendingInspectionCount} inspections pending review`}
                        >
                          {pendingInspectionCount} pending
                        </span>
                      )}
                    </div>
                    
                    {/* Review Inspections Card */}
                    <ReviewInspectionsCard
                      onClick={() => setCurrentPage("Photo Review")}
                      pendingCount={pendingInspectionCount}
                    />
                  </section>
                </div>

                {/* ANALYZE SECTION - Slate/Neutral Theme */}
                <section 
                  className="bg-slate-50 rounded-xl p-4 border border-slate-200"
                  aria-labelledby="analyze-heading"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 id="analyze-heading" className="text-lg font-bold text-slate-900">
                      Analyze
                    </h2>
                    <p className="text-sm text-slate-600 ml-auto hidden sm:block">
                      View reports and insights
                    </p>
                  </div>
                  
                  {/* Analytics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => setCurrentPage("Scores Dashboard")}
                      className="p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-colors text-center"
                    >
                      <span className="text-2xl block mb-1">📈</span>
                      <span className="text-sm font-medium text-slate-900">Building Scores</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage("Analytics Dashboard")}
                      className="p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-colors text-center"
                    >
                      <span className="text-2xl block mb-1">📊</span>
                      <span className="text-sm font-medium text-slate-900">Analytics</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage("Inspection Data")}
                      className="p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-colors text-center"
                    >
                      <span className="text-2xl block mb-1">📋</span>
                      <span className="text-sm font-medium text-slate-900">Data & Reports</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage("Monthly Feedback")}
                      className="p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-colors text-center"
                    >
                      <span className="text-2xl block mb-1">📄</span>
                      <span className="text-sm font-medium text-slate-900">Monthly Feedback</span>
                    </button>
                  </div>
                  
                  {/* Rating Criteria - Secondary */}
                  <button
                    onClick={() => setCurrentPage("Rating Criteria")}
                    className="mt-3 w-full p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left flex items-center gap-2"
                  >
                    <span>ℹ️</span>
                    <span className="text-sm font-medium text-slate-700">Rating Criteria Guide</span>
                  </button>
                </section>
              </div>

              {/* Footer Tagline */}
              <p className="text-lg text-muted-foreground text-center mt-8">
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
