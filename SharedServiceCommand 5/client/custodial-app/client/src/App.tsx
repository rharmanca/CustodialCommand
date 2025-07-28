import { useState } from 'react';
import CustodialInspectionPage from './pages/custodial-inspection';
import InspectionDataPage from './pages/inspection-data';
import CustodialNotesPage from './pages/custodial-notes';

function App() {
  const [currentPage, setCurrentPage] = useState('Home');
  const [isInstallSectionOpen, setIsInstallSectionOpen] = useState(false);

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
            
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-amber-900 mb-6 font-inter-bold">Custodial Inspection Tracker</h2>
              <p className="text-xl text-amber-800 font-inter-regular mb-8">
                Professional facility maintenance tracking and inspection system
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <button 
                  onClick={() => setCurrentPage('Custodial Inspection')}
                  className="retro-button bg-green-700 hover:bg-green-800 border-green-500"
                >
                  Submit New Inspection
                </button>
                <button 
                  onClick={() => setCurrentPage('Inspection Data')}
                  className="retro-button bg-blue-700 hover:bg-blue-800 border-blue-500"
                >
                  View Inspection Data
                </button>
                <button 
                  onClick={() => setCurrentPage('Custodial Notes')}
                  className="retro-button bg-yellow-700 hover:bg-yellow-800 border-yellow-500"
                >
                  Submit Quick Note
                </button>
              </div>
            </div>
          </div>
        );
      case 'Custodial Inspection':
        return <CustodialInspectionPage onBack={() => setCurrentPage('Home')} />;
      case 'Inspection Data':
        return <InspectionDataPage onBack={() => setCurrentPage('Home')} />;
      case 'Custodial Notes':
        return <CustodialNotesPage onBack={() => setCurrentPage('Home')} />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-200 text-gray-900 font-inter-regular p-4 flex flex-col items-center">
      {/* Header section with app title */}
      <header className="w-full max-w-4xl header-container p-6 rounded-lg shadow-xl mb-8">
        <h1 className="text-6xl font-extrabold text-center uppercase retro-header tracking-widest font-inter-bold">
          Custodial Tracker
        </h1>
      </header>

      {/* Main content area */}
      <main className="w-full max-w-4xl bg-white rounded-lg shadow-2xl p-8">
        {renderPageContent()}
      </main>
    </div>
  );
}

export default App;