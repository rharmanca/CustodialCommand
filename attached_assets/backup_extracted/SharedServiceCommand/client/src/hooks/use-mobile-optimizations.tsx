
import { useEffect, useState } from 'react';
import { useIsMobile } from './use-mobile';

interface MobileOptimizations {
  isMobile: boolean;
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
  screenHeight: number;
  isKeyboardOpen: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export function useMobileOptimizations(): MobileOptimizations {
  const { isMobile, isTouch, orientation } = useIsMobile();
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    const initialHeight = window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      setScreenHeight(currentHeight);
      
      // Detect keyboard on mobile (height reduction > 150px indicates keyboard)
      if (isMobile) {
        const heightDiff = initialHeight - currentHeight;
        setIsKeyboardOpen(heightDiff > 150);
      }
    };

    const handleOrientationChange = () => {
      // Delay to allow for orientation change to complete
      setTimeout(() => {
        handleResize();
      }, 100);
    };

    // Get safe area insets from CSS environment variables
    const updateSafeAreaInsets = () => {
      if (typeof window !== 'undefined' && window.CSS && window.CSS.supports('padding', 'env(safe-area-inset-top)')) {
        const computedStyle = getComputedStyle(document.documentElement);
        setSafeAreaInsets({
          top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
          bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
          left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
          right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
        });
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    updateSafeAreaInsets();
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isMobile]);

  return {
    isMobile,
    isTouch,
    orientation,
    screenHeight,
    isKeyboardOpen,
    safeAreaInsets
  };
}
