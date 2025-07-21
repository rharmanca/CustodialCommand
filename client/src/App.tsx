import { useState } from 'react';
import HomePage from './pages/home';
import CustodialInspectionPage from './pages/custodial-inspection';
import InspectionDataPage from './pages/inspection-data';
import CustodialNotesPage from './pages/custodial-notes';
import GalleryPage from './pages/gallery';
import WholeBuildingInspectionPage from './pages/whole-building-inspection';
import sharedServicesImage from '@assets/assets_task_01k0ahgtr1egvvpjk9qvwtzvyg_1752700690_img_1_1752767788234.webp';
import custodialDutyImage from '@assets/assets_task_01k0ah80j5ebdamsccd7rpnaeh_1752700412_img_0_1752768056345.webp';

function App() {
  const [currentPage, setCurrentPage] = useState('Home');
  const [isInstallSectionOpen, setIsInstallSectionOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: 'Home' },
    { name: 'Custodial', path: 'Custodial' },
    { name: 'Gallery', path: 'Gallery' },
  ];

  const renderPageContent = () => {
    switch (currentPage) {
      case 'Home':
        return (
          <div className="text-center p-8">
            {/* Collapsible Mobile Installation Instructions */}
            <div className="mb-8 max-w-2xl mx-auto">
              <button
                onClick={() => setIsInstallSectionOpen(!isInstallSectionOpen)}
                className="w-full p-4 bg-amber-100 border-2 border-amber-300 rounded-lg shadow-md hover:bg-amber-150 transition-colors flex items-center justify-between"
              >
                <span className="text-lg font-bold text-amber-900">📱 Install on Your Mobile Device</span>
                <span className="text-amber-900 text-xl">
                  {isInstallSectionOpen ? '−' : '+'}
                </span>
              </button>

              {isInstallSectionOpen && (
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
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-center text-sm font-medium text-green-700">
                        ✓ Works offline after installation - previously viewed pages remain accessible
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center mb-8">
              <img 
                src={sharedServicesImage} 
                alt="Shared Services Graphic" 
                className="rounded-lg shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-auto" 
              />
            </div>
          </div>
        );
      case 'Custodial':
        return (
          <div className="p-8 text-center">
            <button 
              onClick={() => setCurrentPage('Home')}
              className="back-button mb-4"
            >
              ← Back to Home
            </button>
            <h2 className="text-4xl font-bold text-amber-900 mb-6 font-inter-bold">Custodial Operations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <button 
                onClick={() => setCurrentPage('Custodial Inspection')}
                className="retro-button bg-green-700 hover:bg-green-800 border-green-500"
              >
                Submit New Inspection
              </button>
              <button 
                onClick={() => setCurrentPage('Whole Building Inspection')}
                className="retro-button bg-blue-700 hover:bg-blue-800 border-blue-500"
              >
                Submit Whole Building Inspection
              </button>
              <button 
                onClick={() => setCurrentPage('Inspection Data')}
                className="retro-button bg-purple-700 hover:bg-purple-800 border-purple-500"
              >
                View Data & Reports
              </button>
              <button 
                onClick={() => setCurrentPage('Custodial Notes')}
                className="retro-button bg-orange-700 hover:bg-orange-800 border-orange-500"
              >
                Submit Notes & Issues
              </button>
            </div>
            <div className="flex justify-center mb-8">
              <img 
                src={custodialDutyImage} 
                alt="Custodial Duty" 
                className="rounded-lg shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-md h-auto" 
              />
            </div>
            <p className="text-xl text-amber-800 font-inter-regular">
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
      case 'Gallery':
        return <GalleryPage onBack={() => setCurrentPage('Home')} />;
      case 'Whole Building Inspection':
        return <WholeBuildingInspectionPage onBack={() => setCurrentPage('Custodial')} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-200 text-gray-900 font-inter-regular p-4 flex flex-col items-center">
      {/* Header section with app title */}
      <header className="w-full max-w-4xl header-container p-6 rounded-lg shadow-xl mb-8 border-4 border-orange-400">
        <h1 className="text-6xl font-extrabold text-center uppercase retro-header tracking-widest font-inter-bold">
          Custodial Command
        </h1>
      </header>

      {/* Navigation section */}
      <nav className="w-full max-w-4xl nav-container p-4 rounded-lg shadow-lg mb-8 border-2 border-orange-300 flex flex-wrap justify-center gap-4">
        {navLinks.map((link) => (
          <button
            key={link.name}
            onClick={() => setCurrentPage(link.path)}
            className={`retro-button ${currentPage === link.path ? 'active' : ''}`}
          >
            {link.name}
          </button>
        ))}
      </nav>

      {/* Main content area */}
      <main className="w-full max-w-4xl content-area p-8 rounded-lg shadow-xl border-4 border-blue-800">
        {renderPageContent()}
      </main>

      {/* Footer section */}
      <footer className="w-full max-w-4xl mt-8 text-center text-gray-300 text-sm font-inter-regular">
        <p>&copy; 2025 Shared Service Command. All rights reserved. For the People!</p>
      </footer>
    </div>
  );
}

export default App;