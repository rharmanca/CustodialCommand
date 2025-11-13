import React, { useEffect, useMemo, useRef } from 'react';

// Touch gesture types
export interface TouchGesture {
  type: 'tap' | 'swipe' | 'pinch' | 'longpress';
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  duration?: number;
  scale?: number;
}

// Touch event handler type
export type TouchHandler = (gesture: TouchGesture) => void;

// Touch configuration
export interface TouchConfig {
  swipeThreshold: number;
  longPressDelay: number;
  tapTimeout: number;
  preventScroll: boolean;
}

const defaultConfig: TouchConfig = {
  swipeThreshold: 50,
  longPressDelay: 500,
  tapTimeout: 300,
  preventScroll: false,
};

// Enhanced touch hook for gesture recognition
export const useTouch = (handler: TouchHandler, config: Partial<TouchConfig> = {}) => {
  const elementRef = useRef<HTMLElement>(null);

  const touchConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);

  const touchState = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    isLongPress: false,
    longPressTimer: null as NodeJS.Timeout | null,
    initialDistance: 0,
    lastScale: 1,
  });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (touchConfig.preventScroll) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      const state = touchState.current;

      state.startX = touch.clientX;
      state.startY = touch.clientY;
      state.startTime = Date.now();
      state.isLongPress = false;

      // Handle multi-touch for pinch gestures
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        state.initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2),
        );
      }

      // Start long press timer
      state.longPressTimer = setTimeout(() => {
        state.isLongPress = true;
        handler({
          type: 'longpress',
          duration: Date.now() - state.startTime,
        });
      }, touchConfig.longPressDelay);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchConfig.preventScroll) {
        e.preventDefault();
      }

      const state = touchState.current;

      // Clear long press timer on move
      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
      }

      // Handle pinch gesture
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2),
        );

        if (state.initialDistance > 0) {
          const scale = currentDistance / state.initialDistance;
          if (Math.abs(scale - state.lastScale) > 0.1) {
            handler({
              type: 'pinch',
              scale,
            });
            state.lastScale = scale;
          }
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const state = touchState.current;
      const endTime = Date.now();
      const duration = endTime - state.startTime;

      // Clear long press timer
      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
      }

      // Don't process if it was a long press
      if (state.isLongPress) {
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - state.startX;
      const deltaY = state.startY - touch.clientY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Determine gesture type
      if (distance < 10 && duration < touchConfig.tapTimeout) {
        // Tap gesture
        handler({
          type: 'tap',
          duration,
        });
      } else if (distance > touchConfig.swipeThreshold) {
        // Swipe gesture
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        let direction: 'left' | 'right' | 'up' | 'down';
        if (absX > absY) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        handler({
          type: 'swipe',
          direction,
          distance,
          duration,
        });
      }
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, {
      passive: !touchConfig.preventScroll,
    });
    element.addEventListener('touchmove', handleTouchMove, { passive: !touchConfig.preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Store current state for cleanup
    const currentTouchState = touchState.current;

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);

      // Clear any pending timers
      if (currentTouchState.longPressTimer) {
        clearTimeout(currentTouchState.longPressTimer);
      }
    };
  }, [handler, touchConfig]);

  return elementRef;
};

// Mobile-specific utilities
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isTouch = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getViewportSize = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export const isLandscape = () => {
  return window.innerWidth > window.innerHeight;
};

// Touch-friendly component wrapper
export const withTouchEnhancements = <P extends object>(Component: React.ComponentType<P>) => {
  return React.forwardRef<HTMLElement, P & { onTouch?: TouchHandler }>((props, ref) => {
    const { onTouch, ...componentProps } = props;
    const touchRef = useTouch(onTouch || (() => {}));

    // Merge refs if needed
    const mergedRef = (element: HTMLElement) => {
      if (touchRef) touchRef.current = element;
      if (ref) {
        if (typeof ref === 'function') {
          ref(element);
        } else {
          ref.current = element;
        }
      }
    };

    return React.createElement(Component, { ...(componentProps as P), ref: mergedRef });
  });
};

// Performance optimizations for mobile
export const optimizeForMobile = () => {
  // Disable hover effects on touch devices
  if (isTouch()) {
    document.documentElement.classList.add('touch-device');
  }

  // Add viewport meta tag if not present
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(viewport);
  }

  // Optimize scrolling performance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (document.body.style as any).webkitOverflowScrolling = 'touch';

  // Prevent zoom on input focus (iOS)
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    (input as HTMLElement).style.fontSize = '16px';
  });
};

// Touch feedback utilities
export const addTouchFeedback = (element: HTMLElement) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (element.style as any).webkitTapHighlightColor = 'rgba(0, 0, 0, 0.1)';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (element.style as any).webkitUserSelect = 'none';
  element.style.userSelect = 'none';

  const handleTouchStart = () => {
    element.style.opacity = '0.7';
    element.style.transform = 'scale(0.98)';
  };

  const handleTouchEnd = () => {
    element.style.opacity = '1';
    element.style.transform = 'scale(1)';
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });
  element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
    element.removeEventListener('touchcancel', handleTouchEnd);
  };
};
