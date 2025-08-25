import React, { useState, useEffect } from 'react';
import CustodialInspectionPage from './pages/custodial-inspection';
import InspectionDataPage from './pages/inspection-data';
import CustodialNotesPage from './pages/custodial-notes';
import WholeBuildingInspectionPage from './pages/whole-building-inspection';
import RatingCriteriaPage from './pages/rating-criteria';
import AdminInspectionsPage from "./pages/admin-inspections";
import { useIsMobile } from './hooks/use-mobile';
import { useCustomNotifications } from '@/hooks/use-custom-notifications';
import { Toaster } from "@/components/ui/toaster";
import { NotificationContainer } from "@/components/ui/custom-notification";
import { QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import custodialDutyImage from './assets/assets_task_01k0ah80j5ebdamsccd7rpnaeh_1752700412_img_0_1752768056345.webp';
import sharedServicesImage from './assets/assets_task_01k0ahgtr1egvvpjk9qvwtzvyg_1752700690_img_1_1752767788234.webp';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): {hasError: boolean} {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please refresh the page to try again.</p>
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
  const [currentPage, setCurrentPage] = useState<'Custodial' | 'Custodial Inspection' | 'Custodial Notes' | 'Inspection Data' | 'Whole Building Inspection' | 'Rating Criteria' | 'admin-inspections'>('Custodial');
  const [isInstallSectionOpen, setIsInstallSectionOpen] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [showInstallSuccess, setShowInstallSuccess] = useState(false);

  // Custom notifications hook
  const { notifications, removeNotification } = useCustomNotifications();

  // Detect PWA installation status
  useEffect(() => {
    const checkPWAStatus = () => {
      // Check if app is running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');

      setIsPWAInstalled(isStandalone);

      // Show success message if just installed
      if (isStandalone && !localStorage.getItem('pwa-install-shown')) {
        setShowInstallSuccess(true);
        localStorage.setItem('pwa-install-shown', 'true');
        setTimeout(() => setShowInstallSuccess(false), 5000);
      }
    };

    checkPWAStatus();

    // Listen for app install events
    const handleAppInstalled = () => {
      setIsPWAInstalled(true);
      setShowInstallSuccess(true);
      localStorage.setItem('pwa-install-shown', 'true');
      setTimeout(() => setShowInstallSuccess(false), 5000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWAStatus);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', checkPWAStatus);
    };
  }, []);

  const navLinks = [
    { name: 'Home', path: 'Custodial' as const },
  ];

  const renderPageContent = () => {
    try {
      switch (currentPage) {
        case 'Custodial':
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
                      You can now access Custodial Command directly from your home screen.
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
                    onClick={() => setIsInstallSectionOpen(!isInstallSectionOpen)}
                    className="w-full p-4 bg-amber-100 border-2 border-amber-300 rounded-lg shadow-md hover:bg-amber-150 transition-colors flex items-center justify-between"
                  >
                    <span className="text-lg font-bold text-amber-900">📱 Install on Your Mobile Device</span>
                    <span className="text-amber-900 text-xl">
                      {isInstallSectionOpen ? '−' : '+'}
                    </span>
                  </button>
                )}

                {!isPWAInstalled && isInstallSectionOpen && (
                  <div className="mt-4 p-6 bg-amber-50 border-2 border-amber-300 rounded-lg shadow-md">
                    <div className="text-amber-800 space-y-3">
                      <div className="bg-white p-3 rounded border border-amber-200">
                        <p className="font-semibold text-amber-900 mb-1">iPhone/iPad:</p>
                        <p className="text-sm">1. Tap the Share button (□↗) in Safari</p>
                        <p className="text-sm">2. Scroll down and tap "Add to Home Screen"</p>
                        <p className="text-sm">3. Tap "Add" to install the app</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-amber-200">
                        <p className="font-semibold text-amber-900 mb-1">Android:</p>
                        <p className="text-sm">1. Tap the menu (⋮) in Chrome or your browser</p>
                        <p className="text-sm">2. Select "Add to Home screen" or "Install app"</p>
                        <p className="text-sm">3. Tap "Add" or "Install" to confirm</p>
                      </div>
                      <p className="text-center text-sm font-medium text-amber-700 mt-3">
                        Once installed, access the app directly from your home screen like any other app!
                      </p>
                      <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded">
                        <p className="text-center text-sm font-medium text-accent-foreground">
                          ✓ Works offline after installation - previously viewed pages remain accessible
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="responsive-grid mb-6">
                <button 
                  onClick={() => setCurrentPage('Custodial Notes')}
                  className="modern-button bg-accent hover:bg-accent/90 border-accent text-accent-foreground"
                >
                  Report A Custodial Concern
                </button>
                <button 
                  onClick={() => setCurrentPage('Custodial Inspection')}
                  className="modern-button bg-primary hover:bg-primary/90 border-primary text-primary-foreground"
                >
                  Single Area Inspection
                </button>
                <button 
                  onClick={() => setCurrentPage('Whole Building Inspection')}
                  className="modern-button bg-secondary hover:bg-secondary/90 border-secondary text-secondary-foreground"
                >
                  Building Inspection
                </button>
                <button 
                  onClick={() => setCurrentPage('Rating Criteria')}
                  className="modern-button bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
                >
                  Rating Criteria Guide
                </button>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground font-medium text-center">
                    Note: Best viewed on desktop
                  </p>
                  <button 
                    onClick={() => setCurrentPage('Inspection Data')}
                    className="modern-button bg-muted hover:bg-muted/90 border-muted text-muted-foreground"
                  >
                    View Data & Reports
                  </button>
                </div>
              </div>
              <div className="flex justify-center mb-6">
                <img 
                  src={custodialDutyImage} 
                  alt="Custodial Duty" 
                  className="responsive-image shadow-lg max-w-[280px] sm:max-w-xs md:max-w-sm lg:max-w-md" 
                />
              </div>
              <p className="text-lg text-muted-foreground text-center">
                Cleanliness is a duty for all.
              </p>
            </div>
          );
        case 'Custodial Inspection':
          return <CustodialInspectionPage onBack={() => setCurrentPage('Custodial')} />;
        case 'Inspection Data':
          return <InspectionDataPage onBack={() => setCurrentPage('Custodial')} />;
        case 'Custodial Notes':
          return <CustodialNotesPage onBack={() => setCurrentPage('Custodial')} />;
        case 'Whole Building Inspection':
          return <WholeBuildingInspectionPage onBack={() => setCurrentPage('Custodial')} />;
        case 'Rating Criteria':
          return <RatingCriteriaPage onBack={() => setCurrentPage('Custodial')} />;
        case 'admin-inspections':
          return <AdminInspectionsPage onBack={() => setCurrentPage('Custodial')} />;
        default:
          return (
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold">Page Not Found</h1>
              <button 
                onClick={() => setCurrentPage('Custodial')}
                className="mt-4 modern-button bg-primary hover:bg-primary/90 border-primary text-primary-foreground"
              >
                Return Home
              </button>
            </div>
          );
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Page</h1>
          <p className="mt-2 text-gray-600">Something went wrong. Please try again.</p>
          <button 
            onClick={() => setCurrentPage('Custodial')}
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
                  Custodial Command
                </h1>
              </header>

              {/* Navigation section */}
              <nav className="w-full nav-container rounded-xl shadow-sm">
                <div className="button-container">
                  {navLinks.map((link) => (
                    <button
                      key={link.name}
                      onClick={() => setCurrentPage(link.path)}
                      className={`modern-button ${currentPage === link.path ? 'bg-primary/80' : ''}`}
                    >
                      {link.name}
                    </button>
                  ))}
                  <button 
                    onClick={() => setCurrentPage('admin-inspections')}
                    className="modern-button bg-red-600 hover:bg-red-700 border-red-600 text-white"
                  >
                    Admin
                  </button>
                </div>
              </nav>

              {/* Main content area */}
              <main className="w-full content-area rounded-xl shadow-sm">
                {renderPageContent()}
              </main>
            </div>

            {/* Footer section */}
            <footer className="w-full mt-6 text-center text-muted-foreground text-sm">
              <p>&copy; 2025 Shared Service Command. All rights reserved. For the People!</p>
            </footer>

            <Toaster />
            <NotificationContainer 
              notifications={notifications} 
              onRemove={removeNotification} 
            />
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;