
import React from 'react';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function MobileCard({ children, className = '', title }: MobileCardProps) {
  return (
    <div className={`w-full max-w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 bg-gradient-to-r from-amber-100 to-orange-100 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-amber-900">{title}</h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
