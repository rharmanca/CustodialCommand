
import React from 'react';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function MobileCard({ children, className = '', title }: MobileCardProps) {
  return (
    <div className={`w-full max-w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mx-2 sm:mx-0 ${className}`}>
      {title && (
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-amber-100 to-orange-100 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold text-amber-900 leading-tight">{title}</h3>
        </div>
      )}
      <div className="p-4 sm:p-6 space-y-4">
        {children}
      </div>
    </div>
  );
}
