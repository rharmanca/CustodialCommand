/**
 * TagBadge Components
 * Display badges for inspection tags with color coding
 */

import { INSPECTION_TAGS, getTagById } from '@shared/tags';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface TagBadgeProps {
  tagId: string;
  size?: 'sm' | 'md';
  onRemove?: () => void;
}

export function TagBadge({ tagId, size = 'md', onRemove }: TagBadgeProps) {
  const tag = getTagById(tagId);

  if (!tag) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
        Unknown
      </span>
    );
  }

  const Icon = tag.icon;

  // Color mappings
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    slate: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        colorClasses[tag.color as keyof typeof colorClasses] || colorClasses.slate,
        sizeClasses[size]
      )}
    >
      <Icon className={iconSizes[size]} />
      <span>{tag.label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors"
          aria-label={`Remove ${tag.label} tag`}
        >
          <X className={cn(iconSizes[size], 'opacity-60')} />
        </button>
      )}
    </span>
  );
}

export interface TagBadgeListProps {
  tags: string[];
  maxVisible?: number;
  size?: 'sm' | 'md';
  onRemove?: (tagId: string) => void;
  className?: string;
}

export function TagBadgeList({
  tags,
  maxVisible = 3,
  size = 'md',
  onRemove,
  className,
}: TagBadgeListProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visibleTags.map((tagId) => (
        <TagBadge
          key={tagId}
          tagId={tagId}
          size={size}
          onRemove={onRemove ? () => onRemove(tagId) : undefined}
        />
      ))}
      {hiddenCount > 0 && (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-gray-100 text-gray-600 font-medium',
            size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
          )}
        >
          +{hiddenCount} more
        </span>
      )}
    </div>
  );
}

export interface TagFilterListProps {
  selected: string[];
  onToggle: (tagId: string) => void;
  className?: string;
}

export function TagFilterList({ selected, onToggle, className }: TagFilterListProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {INSPECTION_TAGS.map((tag) => {
        const isSelected = selected.includes(tag.id);
        const Icon = tag.icon;

        // Color mappings for selected/unselected states
        const colorClasses = {
          blue: isSelected
            ? 'bg-blue-500 text-white border-blue-500'
            : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50',
          amber: isSelected
            ? 'bg-amber-500 text-white border-amber-500'
            : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50',
          red: isSelected
            ? 'bg-red-500 text-white border-red-500'
            : 'bg-white text-red-700 border-red-200 hover:bg-red-50',
          slate: isSelected
            ? 'bg-slate-500 text-white border-slate-500'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
        };

        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggle(tag.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
              colorClasses[tag.color as keyof typeof colorClasses] || colorClasses.slate,
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1'
            )}
            aria-pressed={isSelected}
          >
            <Icon className="w-4 h-4" />
            <span>{tag.label}</span>
          </button>
        );
      })}
    </div>
  );
}
