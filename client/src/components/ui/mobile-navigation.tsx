
import React from 'react';
import { Button } from './button';

interface MobileNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  navLinks: { name: string; path: string }[];
}

export function MobileNavigation({ currentPage, onPageChange, navLinks }: MobileNavigationProps) {
  return (
    <nav className="w-full mb-6">
      <div className="flex flex-wrap gap-2 justify-center">
        {navLinks.map((link) => (
          <Button
            key={link.path}
            onClick={() => onPageChange(link.path)}
            className={`retro-button flex-1 min-w-[120px] ${
              currentPage === link.path ? 'active' : ''
            }`}
            variant="outline"
          >
            {link.name}
          </Button>
        ))}
      </div>
    </nav>
  );
}
