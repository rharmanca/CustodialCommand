import React, { useState, useEffect, lazy, Suspense } from "react";
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
import custodialDutyImage from "./assets/assets_task_01k0ah80j5ebdamsccd7rpnaeh_1752700412_img_0_1752768056345.webp";
import sharedServicesImage from "./assets/assets_task_01k0ahgtr1egvvpjk9qvwtzvyg_1752700690_img_1_1752767788234.webp";

// Lazy load route components
const CustodialInspectionPage = lazy(() => import("./pages/custodial-inspection"));
const InspectionDataPage = lazy(() => import("./pages/inspection-data"));
const CustodialNotesPage = lazy(() => import("./pages/custodial-notes"));
const WholeBuildingInspectionPage = lazy(() => import("./pages/whole-building-inspection"));
const RatingCriteriaPage = lazy(() => import("./pages/rating-criteria"));
const AdminInspectionsPage = lazy(() => import("./pages/admin-inspections"));
const MonthlyFeedbackPage = lazy(() => import("./pages/monthly-feedback"));
const ScoresDashboard = lazy(() => import("./pages/scores-dashboard"));

// Loading skeleton component
const PageLoadingSkeleton = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="text-center max-w-md mx-auto">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Loading...</h2>
      <p className="text-muted-foreground">Please wait while we load the page.</p>
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
  >("Custodial");
  const [isInstallSectionOpen, setIsInstallSectionOpen] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [showInstallSuccess, setShowInstallSuccess] = useState(false);

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
        default:
          return (
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold">Page Not Found</h1>
              <button
                onClick={() => setCurrentPage("Custodial")}
                className="mt-4 modern-button bg-primary hover:bg-primary/90 border-primary text-primary-foreground"
              >
                Return Home
              </button>
            </div>
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
          <div className="bg-background text-foreground">
            <div className="main-container">
              {/* Header section with app title */}
              <header className="w-full header-container rounded-xl shadow-sm">
                <h1 className="font-bold modern-header tracking-tight">
                  CA Custodial Command
                </h1>
              </header>

              {/* Navigation section */}
              <nav className="w-full nav-container rounded-xl shadow-sm">
                <div className="button-container">
                  {navLinks.map((link) => (
                    <button
                      key={link.name}
                      onClick={() => setCurrentPage(link.path)}
                      className={`modern-button ${
                        currentPage === link.path ? "bg-primary/80" : ""
                      }`}
                    >
                      {link.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage("admin-inspections")}
                    className="modern-button bg-red-600 hover:bg-red-700 border-red-600 text-white"
                  >
                    Admin
                  </button>
                </div>
              </nav>

              {/* Offline Status */}
              <OfflineStatus className="mb-4" />

              {/* Skip to content link for accessibility */}
              <a 
                href="#main-content" 
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
              >
                Skip to main content
              </a>

              {/* Main content area */}
              <main id="main-content" className="w-full content-area rounded-xl shadow-sm">
                {renderPageContent()}
              </main>
            </div>

            {/* Footer section */}
            <footer className="w-full mt-6 text-center text-muted-foreground text-sm">
              <p>
                &copy; 2025 Shared Service Command. All rights reserved. For the
                People!
              </p>
            </footer>

            <Toaster />
            <div aria-live="polite" aria-label="Notifications">
              <NotificationContainer
                notifications={notifications}
                onRemove={removeNotification}
              />
              <EnhancedNotifications
                notifications={enhancedNotifications}
                onRemove={removeEnhancedNotification}
              />
            </div>
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
