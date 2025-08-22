
import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
import "./index.css";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState;

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Application Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2>Something went wrong</h2>
          <p>The application encountered an unexpected error.</p>
          <details style={{ marginTop: '10px', textAlign: 'left' }}>
            <summary>Error Details</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#007cba',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Could not find root element");
}

const root = createRoot(container);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
