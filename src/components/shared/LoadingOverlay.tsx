interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="bg-card p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
        {/* Spinner */}
        <div className="flex justify-center mb-4">
          <div
            className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"
            aria-hidden="true"
          />
        </div>

        {/* Message */}
        <p className="text-center text-foreground font-medium text-lg">
          {message}
        </p>

        {/* Screen reader only text */}
        <span className="sr-only">{message}</span>
      </div>
    </div>
  );
}
