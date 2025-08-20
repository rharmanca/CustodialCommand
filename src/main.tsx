
<old_str>import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Could not find root element");
}

const root = createRoot(container);
root.render(<App />);</old_str>
<new_str>import { createRoot } from "react-dom/client";
import App from "./App-simple";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Could not find root element");
}

const root = createRoot(container);
root.render(<App />);</new_str>
