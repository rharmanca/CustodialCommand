
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
