
import { useCallback, useRef } from 'react';

interface UseTouchFriendlyOptions {
  onTap?: () => void;
  onLongPress?: () => void;
  longPressDelay?: number;
}

export function useTouchFriendly({ onTap, onLongPress, longPressDelay = 500 }: UseTouchFriendlyOptions) {
  const touchStartRef = useRef<number>(0);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback(() => {
    touchStartRef.current = Date.now();
    
    if (onLongPress) {
      longPressTimeoutRef.current = setTimeout(() => {
        onLongPress();
      }, longPressDelay);
    }
  }, [onLongPress, longPressDelay]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    const touchDuration = Date.now() - touchStartRef.current;
    if (touchDuration < longPressDelay && onTap) {
      onTap();
    }
  }, [onTap, longPressDelay]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };
}
