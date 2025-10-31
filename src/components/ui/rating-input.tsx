import React, { memo } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RatingInput: React.FC<RatingInputProps> = memo(({
  value,
  onChange,
  label,
  description,
  disabled = false,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (rating: number) => {
    if (!disabled) {
      onChange(rating);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, rating: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleStarClick(rating);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
        {value > 0 && (
          <span className="text-xs text-muted-foreground">
            {value}/5
          </span>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleStarClick(rating)}
            onKeyDown={(e) => handleKeyDown(e, rating)}
            disabled={disabled}
            className={cn(
              'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm',
              'p-2 min-w-[44px] min-h-[44px] flex items-center justify-center',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110',
              value >= rating
                ? 'text-yellow-400'
                : 'text-gray-300 hover:text-yellow-200'
            )}
            aria-label={`Rate ${rating} star${rating > 1 ? 's' : ''}`}
            tabIndex={disabled ? -1 : 0}
          >
            <Star 
              className={cn(
                sizeClasses[size],
                value >= rating ? 'fill-current' : ''
              )}
            />
          </button>
        ))}
      </div>
      
      {value > 0 && (
        <div className="text-xs text-muted-foreground">
          {getRatingDescription(value)}
        </div>
      )}
    </div>
  );
});

const getRatingDescription = (rating: number): string => {
  switch (rating) {
    case 1:
      return 'Unacceptable';
    case 2:
      return 'Below Standard';
    case 3:
      return 'Acceptable';
    case 4:
      return 'Ordinary Tidiness';
    case 5:
      return 'Orderly Spotlessness';
    default:
      return '';
  }
};

RatingInput.displayName = 'RatingInput';

export default RatingInput;
