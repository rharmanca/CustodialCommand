/**
 * TagSelector Component
 * Multi-select tag picker for categorizing inspection issues
 */

import { useState } from 'react';
import { INSPECTION_TAGS, type InspectionTag } from '@shared/tags';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';

export interface TagSelectorProps {
  selected: string[];
  onChange: (tags: string[]) => void;
  maxSelection?: number;
  disabled?: boolean;
}

export function TagSelector({
  selected,
  onChange,
  maxSelection = 3,
  disabled = false,
}: TagSelectorProps) {
  const [showMaxWarning, setShowMaxWarning] = useState(false);

  const handleTagClick = (tagId: string) => {
    if (disabled) return;

    if (selected.includes(tagId)) {
      // Deselect
      onChange(selected.filter((id) => id !== tagId));
      setShowMaxWarning(false);
    } else {
      // Select (if under max)
      if (selected.length >= maxSelection) {
        setShowMaxWarning(true);
        setTimeout(() => setShowMaxWarning(false), 2000);
        return;
      }
      onChange([...selected, tagId]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {selected.length} of {maxSelection} selected
        </span>
        {showMaxWarning && (
          <span className="text-xs text-amber-600 flex items-center gap-1 animate-pulse">
            <AlertCircle className="w-3 h-3" />
            Maximum {maxSelection} tags
          </span>
        )}
      </div>

      {/* Tag grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {INSPECTION_TAGS.map((tag) => {
          const isSelected = selected.includes(tag.id);
          const Icon = tag.icon;

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleTagClick(tag.id)}
              disabled={disabled || (!isSelected && selected.length >= maxSelection)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all min-h-[80px]',
                'hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                isSelected
                  ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                  : 'border-border bg-card hover:border-amber-200 hover:bg-amber-50/30',
                disabled && 'opacity-50 cursor-not-allowed',
                !isSelected && selected.length >= maxSelection && 'opacity-40 cursor-not-allowed'
              )}
              aria-pressed={isSelected}
              aria-label={`${tag.label}: ${tag.description}`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <span className="absolute top-1 right-1 text-amber-600">
                  <Check className="w-4 h-4" />
                </span>
              )}

              {/* Icon */}
              <Icon
                className={cn(
                  'w-6 h-6 transition-colors',
                  isSelected ? 'text-amber-600' : 'text-muted-foreground'
                )}
              />

              {/* Label */}
              <span
                className={cn(
                  'text-xs font-medium text-center leading-tight',
                  isSelected ? 'text-amber-900' : 'text-foreground'
                )}
              >
                {tag.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Select up to {maxSelection} tags to categorize this issue. This helps managers filter and analyze patterns.
      </p>
    </div>
  );
}
