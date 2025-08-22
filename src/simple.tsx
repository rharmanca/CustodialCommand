// Simple working React component to test basic compilation
// @ts-nocheck
import { createRoot } from "react-dom/client";
import { jsx } from "react/jsx-runtime";

const App = () => {
  return jsx("div", {
    style: { 
      padding: "20px", 
      fontFamily: "Arial, sans-serif",
      textAlign: "center"
    },
    children: [
      jsx("h1", { children: "🎉 Custodial Command App is RUNNING!" }),
      jsx("p", { children: "Success! The React app is now loading properly." }),
      jsx("p", { children: "TypeScript compilation is working." })
    ]
  });
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(jsx(App, {}));
}