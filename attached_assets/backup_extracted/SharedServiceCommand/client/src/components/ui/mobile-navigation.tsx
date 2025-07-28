
import React from 'react';
import { Button } from './button';

interface MobileNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  navLinks: { name: string; path: string }[];
}

export function MobileNavigation({ currentPage, onPageChange, navLinks }: MobileNavigationProps) {
  return (
    <nav className="w-full mb-6 px-2">
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-2 sm:justify-center">
        {navLinks.map((link) => (
          <Button
            key={link.path}
            onClick={() => onPageChange(link.path)}
            className={`retro-button w-full sm:flex-1 sm:min-w-[120px] h-12 text-base font-medium ${
              currentPage === link.path ? 'active bg-amber-600 text-white' : 'bg-white text-amber-800 hover:bg-amber-50'
            } border-2 border-amber-600 rounded-lg shadow-md transition-all duration-200`}
            variant="outline"
          >
            {link.name}
          </Button>
        ))}
      </div>
    </nav>
  );
}
