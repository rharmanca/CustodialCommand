
// React scheduler polyfill - ensure performance object exists and is writable
(function() {
  if (typeof performance === 'undefined') {
    const mockPerformance = {
      now: function() { return Date.now(); },
      mark: function() {},
      measure: function() {},
      getEntriesByName: function() { return []; },
      getEntriesByType: function() { return []; },
      clearMarks: function() {},
      clearMeasures: function() {},
      timeOrigin: Date.now()
    };
    
    // Make it writable so React can add properties
    Object.defineProperty(globalThis, 'performance', {
      value: mockPerformance,
      writable: true,
      configurable: true
    });
  }
  
  // Ensure the performance object is extensible for React scheduler
  if (typeof performance !== 'undefined' && !Object.isExtensible(performance)) {
    try {
      Object.defineProperty(performance, 'unstable_now', {
        value: performance.now.bind(performance),
        writable: true,
        configurable: true
      });
    } catch (e) {
      // Fallback if we can't modify performance object
      console.warn('Could not extend performance object for React scheduler');
    }
  }
})();

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/android-fixes.css";

// Register service worker for offline PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered successfully:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 5 * 60 * 1000); // Check every 5 minutes
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Could not find root element");
}

const root = createRoot(container);
root.render(<App />);
