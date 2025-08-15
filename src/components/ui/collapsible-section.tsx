import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function CollapsibleSection({
  title,
  children,
  defaultCollapsed = true,
  className,
  titleClassName,
  contentClassName,
  disabled = false
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = () => {
    if (!disabled) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className={classNames("border border-gray-200 rounded-lg overflow-hidden", className || "")}>
      <button
        type="button"
        onClick={toggleCollapsed}
        disabled={disabled}
        className={classNames(
          "w-full justify-between p-4 h-auto font-medium text-left hover:bg-gray-50 border-none rounded-none flex items-center bg-transparent cursor-pointer",
          disabled ? "cursor-not-allowed opacity-50" : "",
          titleClassName || ""
        )}
      >
        <span className="text-base">{title}</span>
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5 transition-transform duration-200" />
        ) : (
          <ChevronDown className="w-5 h-5 transition-transform duration-200" />
        )}
      </button>
      
      <div
        className={classNames(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "max-h-0" : "max-h-[2000px]"
        )}
      >
        <div className={classNames("p-4 pt-0", contentClassName || "")}>
          {children}
        </div>
      </div>
    </div>
  );
}