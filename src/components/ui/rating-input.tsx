import React, { memo, useState } from 'react';
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
          <StarButton
            key={rating}
            rating={rating}
            currentValue={value}
            sizeClass={sizeClasses[size]}
            disabled={disabled}
            onClick={handleStarClick}
            onKeyDown={handleKeyDown}
            aria-label={`Rate ${rating} star${rating > 1 ? 's' : ''}`}
          />
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
interface StarButtonProps {
  rating: number;
  currentValue: number;
  sizeClass: string;
  disabled: boolean;
  onClick: (rating: number) => void;
  onKeyDown: (event: React.KeyboardEvent, rating: number) => void;
}

const StarButton: React.FC<StarButtonProps> = memo(({
  rating,
  currentValue,
  sizeClass,
  disabled,
  onClick,
  onKeyDown
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const isFilled = rating <= currentValue;
  const isHoverFilled = rating <= (isHovered ? rating : currentValue);
  
  const handleClick = () => {
    if (!disabled) {
      onClick(rating);
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    onKeyDown(event, rating);
  };
  
  const handleMouseDown = () => {
    if (!disabled) {
      setIsPressed(true);
    }
  };
  
  const handleMouseUp = () => {
    setIsPressed(false);
  };
  
  const handleMouseEnter = () => {
    if (!disabled) {
      setIsHovered(true);
    }
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      className={cn(
        'star-button gpu-accelerated focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm',
        'p-2 min-w-[44px] min-h-[44px] flex items-center justify-center',
        'transition-all duration-200 ease-out',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        isPressed ? 'scale-95' : 'scale-100',
        isHovered ? 'z-10' : ''
      )}
      aria-label={`Rate ${rating} star${rating > 1 ? 's' : ''}`}
      tabIndex={disabled ? -1 : 0}
    >
      <Star
        className={cn(
          sizeClass,
          'transition-all duration-200 ease-out',
          isFilled || (isHovered && rating <= (isHovered ? rating : currentValue))
            ? 'fill-current text-yellow-400 drop-shadow-sm star-filled'
            : 'text-gray-300 star-empty'
        )}
      />
    </button>
  );
});

StarButton.displayName = 'StarButton';
  }
};

RatingInput.displayName = 'RatingInput';

export default RatingInput;
