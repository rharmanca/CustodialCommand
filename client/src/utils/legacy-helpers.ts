/**
 * Legacy helper functions for older browser compatibility
 * Uses ES5 syntax and avoids modern JavaScript features
 */

// Object.assign polyfill for older browsers
export function legacyAssign(target: any) {
  var args = Array.prototype.slice.call(arguments, 1);
  
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }
  
  var to = Object(target);
  
  for (var index = 0; index < args.length; index++) {
    var nextSource = args[index];
    
    if (nextSource != null) {
      for (var nextKey in nextSource) {
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  
  return to;
}

// Array.find polyfill
export function legacyFind<T>(array: T[], predicate: (item: T, index: number) => boolean): T | undefined {
  for (var i = 0; i < array.length; i++) {
    if (predicate(array[i], i)) {
      return array[i];
    }
  }
  return undefined;
}

// Array.includes polyfill
export function legacyIncludes<T>(array: T[], searchElement: T): boolean {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === searchElement) {
      return true;
    }
  }
  return false;
}

// Debounce function for performance
export function legacyDebounce(func: Function, wait: number) {
  var timeout: any;
  return function(this: any) {
    var context = this;
    var args = arguments;
    var later = function() {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll/resize events
export function legacyThrottle(func: Function, limit: number) {
  var inThrottle: boolean;
  return function(this: any) {
    var args = arguments;
    var context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(function() {
        inThrottle = false;
      }, limit);
    }
  };
}

// Safe addEventListener with fallback
export function legacyAddEventListener(
  element: any, 
  event: string, 
  handler: Function, 
  useCapture?: boolean
) {
  if (element.addEventListener) {
    element.addEventListener(event, handler, useCapture || false);
  } else if (element.attachEvent) {
    element.attachEvent('on' + event, handler);
  } else {
    element['on' + event] = handler;
  }
}

// Safe removeEventListener with fallback
export function legacyRemoveEventListener(
  element: any, 
  event: string, 
  handler: Function, 
  useCapture?: boolean
) {
  if (element.removeEventListener) {
    element.removeEventListener(event, handler, useCapture || false);
  } else if (element.detachEvent) {
    element.detachEvent('on' + event, handler);
  } else {
    element['on' + event] = null;
  }
}

// Get viewport dimensions with fallbacks and error protection
export function legacyGetViewportSize() {
  var width = 320; // Default fallback mobile width
  var height = 568; // Default fallback mobile height
  
  try {
    if (typeof window !== 'undefined' && window.innerWidth !== null && typeof window.innerWidth === 'number') {
      width = window.innerWidth;
      height = window.innerHeight || height;
    } else if (typeof document !== 'undefined' && document.documentElement && 
               document.documentElement.clientWidth !== null && typeof document.documentElement.clientWidth === 'number') {
      width = document.documentElement.clientWidth;
      height = document.documentElement.clientHeight || height;
    } else if (typeof document !== 'undefined' && document.body && 
               document.body.clientWidth !== null && typeof document.body.clientWidth === 'number') {
      width = document.body.clientWidth;
      height = document.body.clientHeight || height;
    }
  } catch (error) {
    console.warn('Error getting viewport dimensions, using fallbacks:', error);
  }
  
  // Ensure we always return valid dimensions object
  return { 
    width: width || 320, 
    height: height || 568 
  };
}

// Touch detection with fallbacks
export function legacyIsTouchDevice() {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || 
         (navigator && navigator.maxTouchPoints > 0) || 
         (navigator && (navigator as any).msMaxTouchPoints > 0);
}

// Simple mobile detection
export function legacyIsMobile() {
  var viewport = legacyGetViewportSize();
  var userAgent = navigator.userAgent || '';
  
  return viewport.width <= 768 || 
         /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

// Memory-efficient image lazy loading
export function legacyLazyLoadImage(img: HTMLImageElement, src: string) {
  var isIntersecting = false;
  
  function checkVisibility() {
    try {
      var rect = img.getBoundingClientRect();
      var viewportSize = legacyGetViewportSize();
      var viewportHeight = viewportSize ? viewportSize.height : 568;
      
      // Ensure rect exists and has required properties
      if (rect && typeof rect.top === 'number' && typeof rect.bottom === 'number') {
        isIntersecting = rect.top < viewportHeight + 200 && rect.bottom > -200;
      } else {
        isIntersecting = true; // Fallback to visible if we can't determine
      }
    } catch (error) {
      console.warn('Error checking image visibility, defaulting to visible:', error);
      isIntersecting = true;
    }
    
    if (isIntersecting && !img.src) {
      img.src = src;
      img.style.opacity = '0';
      img.onload = function() {
        img.style.transition = 'opacity 0.3s ease';
        img.style.opacity = '1';
      };
    }
  }
  
  // Check on scroll with throttling
  var throttledCheck = legacyThrottle(checkVisibility, 100);
  legacyAddEventListener(window, 'scroll', throttledCheck);
  legacyAddEventListener(window, 'resize', throttledCheck);
  
  // Initial check
  checkVisibility();
}

// Performance monitoring for low-end devices
export function legacyPerformanceMonitor() {
  var start = Date.now();
  var memoryWarning = false;
  
  return {
    mark: function(label: string) {
      var now = Date.now();
      console.log('[Performance] ' + label + ': ' + (now - start) + 'ms');
      
      // Simple memory check
      if ((performance as any).memory) {
        var memory = (performance as any).memory;
        var memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (memoryUsage > 0.8 && !memoryWarning) {
          console.warn('[Performance] High memory usage detected: ' + 
                      Math.round(memoryUsage * 100) + '%');
          memoryWarning = true;
        }
      }
    }
  };
}