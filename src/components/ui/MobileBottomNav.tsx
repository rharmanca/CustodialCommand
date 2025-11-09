import React from 'react';
import { useLocation } from 'wouter';
import { Home, Clipboard, Building, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  className?: string;
}

const MobileBottomNav = ({ className }: MobileBottomNavProps) => {
  const [location] = useLocation();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '/',
      active: location === '/',
    },
    {
      id: 'inspection',
      label: 'Inspect',
      icon: Clipboard,
      href: '/custodial-inspection',
      active: location === '/custodial-inspection',
    },
    {
      id: 'building',
      label: 'Building',
      icon: Building,
      href: '/whole-building-inspection',
      active: location === '/whole-building-inspection',
    },
    {
      id: 'data',
      label: 'Data',
      icon: BarChart3,
      href: '/inspection-data',
      active: location === '/inspection-data',
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: User,
      href: '/admin-inspections',
      active: location === '/admin-inspections',
    },
  ];

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden",
      className
    )}>
      <div className="grid grid-cols-5 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors duration-200 touch-manipulation",
                item.active
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900 active:scale-95"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-6 w-6 transition-transform duration-200",
                    item.active && "scale-110"
                  )}
                />
                {item.active && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                )}
              </div>
              <span className={cn(
                "mt-1 font-medium text-[10px] leading-tight",
                item.active && "font-semibold"
              )}>
                {item.label}
              </span>
            </a>
          );
        })}
      </div>

      {/* Add safe area padding for mobile devices with home indicators */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </div>
  );
};

export default MobileBottomNav;