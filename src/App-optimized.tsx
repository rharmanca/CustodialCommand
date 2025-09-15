import React, { useState, useEffect, Suspense } from "react";
import { useIsMobile } from "./hooks/use-mobile";
import { useCustomNotifications } from "@/hooks/use-custom-notifications";
import { Toaster } from "@/components/ui/toaster";
import { NotificationContainer } from "@/components/ui/custom-notification";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { SuspenseWrapper } from "@/components/suspense-wrapper";
import LoadingSpinner from "@/components/ui/loading-spinner";
import custodialDutyImage from "./assets/assets_task_01k0ah80j5ebdamsccd7rpnaeh_1752700412_img_0_1752768056345.webp";
import sharedServicesImage from "./assets/assets_task_01k0ahgtr1egvvpjk9qvwtzvyg_1752700690_img_1_1752767788234.webp";

// Lazy load page components
import {
  LazyCustodialInspection,
  LazyWholeBuildingInspection,
  LazyWholeBuildingInspectionRefactored,
  LazyInspectionData,
  LazyCustodialNotes,
  LazyRatingCriteria,
  LazyAdminInspections,
  LazyNotFound
} from "@/components/lazy-pages";

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

function AppContent() {
  const [currentPage, setCurrentPage] = useState<string>("home");
  const isMobile = useIsMobile();
  const { notifications, addNotification, removeNotification } = useCustomNotifications();

  // Handle navigation
  const navigateTo = (page: string) => {
    setCurrentPage(page);
    // Update URL without page reload
    window.history.pushState({}, "", `/${page}`);
  };

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.slice(1) || "home";
      setCurrentPage(path);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Initialize page from URL
  useEffect(() => {
    const path = window.location.pathname.slice(1) || "home";
    setCurrentPage(path);
  }, []);

  // Render current page with lazy loading
  const renderCurrentPage = () => {
    switch (currentPage) {
      case "custodial-inspection":
        return (
          <SuspenseWrapper loadingText="Loading inspection form...">
            <LazyCustodialInspection onBack={() => navigateTo("home")} />
          </SuspenseWrapper>
        );
      case "whole-building-inspection":
        return (
          <SuspenseWrapper loadingText="Loading building inspection...">
            <LazyWholeBuildingInspection onBack={() => navigateTo("home")} />
          </SuspenseWrapper>
        );
      case "whole-building-inspection-refactored":
        return (
          <SuspenseWrapper loadingText="Loading optimized building inspection...">
            <LazyWholeBuildingInspectionRefactored onBack={() => navigateTo("home")} />
          </SuspenseWrapper>
        );
      case "inspection-data":
        return (
          <SuspenseWrapper loadingText="Loading inspection data...">
            <LazyInspectionData onBack={() => navigateTo("home")} />
          </SuspenseWrapper>
        );
      case "custodial-notes":
        return (
          <SuspenseWrapper loadingText="Loading custodial notes...">
            <LazyCustodialNotes onBack={() => navigateTo("home")} />
          </SuspenseWrapper>
        );
      case "rating-criteria":
        return (
          <SuspenseWrapper loadingText="Loading rating criteria...">
            <LazyRatingCriteria onBack={() => navigateTo("home")} />
          </SuspenseWrapper>
        );
      case "admin-inspections":
        return (
          <SuspenseWrapper loadingText="Loading admin panel...">
            <LazyAdminInspections onBack={() => navigateTo("home")} />
          </SuspenseWrapper>
        );
      default:
        return (
          <SuspenseWrapper loadingText="Loading page...">
            <LazyNotFound onBack={() => navigateTo("home")} />
          </SuspenseWrapper>
        );
    }
  };

  // Home page component
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Custodial Command
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional custodial inspection and management system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Custodial Inspection */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧹</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Custodial Inspection
              </h3>
              <p className="text-gray-600 mb-4">
                Complete detailed inspections of individual rooms and areas
              </p>
              <button
                onClick={() => navigateTo("custodial-inspection")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Start Inspection
              </button>
            </div>
          </div>

          {/* Whole Building Inspection */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Whole Building Inspection
              </h3>
              <p className="text-gray-600 mb-4">
                Comprehensive building-wide inspection with multiple areas
              </p>
              <button
                onClick={() => navigateTo("whole-building-inspection")}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Start Building Inspection
              </button>
            </div>
          </div>

          {/* Optimized Building Inspection */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border-2 border-purple-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Optimized Building Inspection
              </h3>
              <p className="text-gray-600 mb-4">
                New optimized version with better performance
              </p>
              <button
                onClick={() => navigateTo("whole-building-inspection-refactored")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Try Optimized Version
              </button>
            </div>
          </div>

          {/* Inspection Data */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Inspection Data
              </h3>
              <p className="text-gray-600 mb-4">
                View and analyze completed inspection results
              </p>
              <button
                onClick={() => navigateTo("inspection-data")}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                View Data
              </button>
            </div>
          </div>

          {/* Custodial Notes */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Custodial Notes
              </h3>
              <p className="text-gray-600 mb-4">
                Add and manage custodial notes and observations
              </p>
              <button
                onClick={() => navigateTo("custodial-notes")}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Add Notes
              </button>
            </div>
          </div>

          {/* Rating Criteria */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Rating Criteria
              </h3>
              <p className="text-gray-600 mb-4">
                View detailed rating criteria and standards
              </p>
              <button
                onClick={() => navigateTo("rating-criteria")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                View Criteria
              </button>
            </div>
          </div>
        </div>

        {/* Admin Section */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Admin Panel
            </h3>
            <p className="text-gray-600 mb-4">
              Access administrative functions and reports
            </p>
            <button
              onClick={() => navigateTo("admin-inspections")}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Admin Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {currentPage === "home" ? <HomePage /> : renderCurrentPage()}
      
      {/* Notifications */}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppContent />
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
