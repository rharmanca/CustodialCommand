import { useState, useEffect } from 'react';
import CustodialInspectionPage from './pages/custodial-inspection';
import InspectionDataPage from './pages/inspection-data';
import CustodialNotesPage from './pages/custodial-notes';
import WholeBuildingInspectionPage from './pages/whole-building-inspection';
import RatingCriteriaPage from './pages/rating-criteria';
import { useIsMobile } from './hooks/use-mobile';
import sharedServicesImage from '@assets/assets_task_01k0ahgtr1egvvpjk9qvwtzvyg_1752700690_img_1_1752767788234.webp';
import custodialDutyImage from '@assets/assets_task_01k0ah80j5ebdamsccd7rpnaeh_1752700412_img_0_1752768056345.webp';
import AdminInspectionsPage from "./pages/admin-inspections";
import { useToast } from '@/hooks/use-toast';
import { Toaster } from "@/components/ui/toaster";

function App() {
  const [currentPage, setCurrentPage] = useState<'Custodial' | 'Custodial Inspection' | 'Custodial Notes' | 'Inspection Data' | 'Whole Building Inspection' | 'Rating Criteria' | 'admin-inspections'>('Custodial');
  const [isInstallSectionOpen, setIsInstallSectionOpen] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [showInstallSuccess, setShowInstallSuccess] = useState(false);
  const { isMobile, isTouch, orientation } = useIsMobile();

  // Force toast positioning with inline styles
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'toast-positioning-override';
    style.textContent = `
      [data-radix-toast-viewport] {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        bottom: auto !important;
        left: auto !important;
        z-index: 9999999 !important;
        max-width: 400px !important;
        width: auto !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-end !important;
        transform: none !important;
      }
      
      [data-radix-toast-viewport] > * {
        margin-bottom: 8px !important;
        background: white !important;
        border: 2px solid #22c55e !important;
        border-radius: 8px !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById('toast-positioning-override');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

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
    window.addEventListener('appinstalled', () => {
      setIsPWAInstalled(true);
      setShowInstallSuccess(true);
      localStorage.setItem('pwa-install-shown', 'true');
      setTimeout(() => setShowInstallSuccess(false), 5000);
    });

    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkPWAStatus);

    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkPWAStatus);
    };
  }, []);

  const navLinks = [
    { name: 'Home', path: 'Custodial' as const },
  ];

  const renderPageContent = () => {
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


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => setCurrentPage('Custodial Notes')}
                className="modern-button bg-red-700 hover:bg-red-800 border-red-700 text-white w-full shadow-lg hover:shadow-xl transform transition-all duration-200"
              >
                Report A Custodial Concern
              </button>
              <button 
                onClick={() => setCurrentPage('Custodial Inspection')}
                className="modern-button bg-amber-700 hover:bg-amber-800 border-amber-700 text-white w-full shadow-lg hover:shadow-xl transform transition-all duration-200"
              >
                Inspect Using Criteria
              </button>
              <button 
                onClick={() => setCurrentPage('Whole Building Inspection')}
                className="modern-button bg-red-600 hover:bg-red-700 border-red-600 text-white w-full shadow-lg hover:shadow-xl transform transition-all duration-200"
              >
                Building Inspection
              </button>
              <button 
                onClick={() => setCurrentPage('Rating Criteria')}
                className="modern-button bg-amber-600 hover:bg-amber-700 border-amber-600 text-white w-full shadow-lg hover:shadow-xl transform transition-all duration-200"
              >
                Rating Criteria Guide
              </button>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground font-medium text-center">
                  Note: Best viewed on desktop
                </p>
                <button 
                  onClick={() => setCurrentPage('Inspection Data')}
                  className="modern-button bg-red-500 hover:bg-red-600 border-red-500 text-white w-full shadow-lg hover:shadow-xl transform transition-all duration-200"
                >
                  View Data & Reports
                </button>
              </div>
            </div>
            <div className="flex justify-center mb-6 sm:mb-8">
              <img 
                src={custodialDutyImage} 
                alt="Custodial Duty" 
                className="rounded-lg shadow-lg w-full max-w-[280px] sm:max-w-xs md:max-w-sm lg:max-w-md h-auto" 
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
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6 flex flex-col items-center">
      {/* Header section with app title */}
      <header className="w-full max-w-4xl header-container p-6 rounded-xl shadow-sm mb-8">
        <h1 className="font-bold text-center modern-header tracking-tight">
          Custodial Command
        </h1>
      </header>

      {/* Navigation section */}
      <nav className="w-full max-w-4xl nav-container p-4 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-2 sm:gap-3 md:gap-4">
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
            className="modern-button bg-amber-800 hover:bg-amber-900 border-amber-800 text-white shadow-lg hover:shadow-xl transform transition-all duration-200"
          >
            Admin
          </button>
        </div>
      </nav>

      {/* Main content area */}
      <main className="w-full max-w-4xl content-area p-6 rounded-xl shadow-sm">
        {renderPageContent()}
      </main>

      {/* Footer section */}
      <footer className="w-full max-w-4xl mt-8 text-center text-muted-foreground text-sm px-2">
        <p>&copy; 2025 Shared Service Command. All rights reserved. For the People!</p>
      </footer>
      <Toaster />
    </div>
  );
}

export default App;