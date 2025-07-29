/**
 * Legacy mobile detection and optimization hooks
 * Works with older browsers and provides fallbacks
 */
import { useState, useEffect } from 'react';

export function useLegacyMobile() {
  var [state, setState] = useState({
    isMobile: false,
    isTouch: false,
    isFirefox: false,
    isLowEndDevice: false,
    viewportWidth: 0,
    viewportHeight: 0
  });

  useEffect(function() {
    function detectCapabilities() {
      var userAgent = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
      
      // Safe viewport dimension detection with comprehensive fallbacks
      var viewportWidth = 320; // Default fallback
      var viewportHeight = 568; // Default fallback
      
      try {
        if (typeof window !== 'undefined') {
          if (window.innerWidth && typeof window.innerWidth === 'number') {
            viewportWidth = window.innerWidth;
          } else if (document && document.documentElement && document.documentElement.clientWidth) {
            viewportWidth = document.documentElement.clientWidth;
          }
          
          if (window.innerHeight && typeof window.innerHeight === 'number') {
            viewportHeight = window.innerHeight;
          } else if (document && document.documentElement && document.documentElement.clientHeight) {
            viewportHeight = document.documentElement.clientHeight;
          }
        }
      } catch (error) {
        console.warn('Error detecting viewport dimensions, using fallbacks:', error);
      }
      
      var isMobile = viewportWidth <= 768 || 
                     /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      var isTouch = false;
      try {
        if (typeof window !== 'undefined') {
          isTouch = 'ontouchstart' in window;
        }
        if (typeof navigator !== 'undefined') {
          if (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) {
            isTouch = true;
          }
          if ((navigator as any).msMaxTouchPoints && (navigator as any).msMaxTouchPoints > 0) {
            isTouch = true;
          }
        }
      } catch (error) {
        console.warn('Error detecting touch capabilities, using fallback:', error);
      }
      
      var isFirefox = userAgent.toLowerCase().indexOf('firefox') > -1;
      
      // Simple low-end device detection with safe property access
      var isLowEndDevice = false;
      try {
        if (typeof navigator !== 'undefined') {
          if ((navigator as any).deviceMemory && typeof (navigator as any).deviceMemory === 'number' && (navigator as any).deviceMemory <= 2) {
            isLowEndDevice = true;
          }
          if ((navigator as any).hardwareConcurrency && typeof (navigator as any).hardwareConcurrency === 'number' && (navigator as any).hardwareConcurrency <= 2) {
            isLowEndDevice = true;
          }
        }
      } catch (error) {
        console.warn('Error detecting device capabilities, using fallback:', error);
      }
      
      setState({
        isMobile: isMobile,
        isTouch: isTouch,
        isFirefox: isFirefox,
        isLowEndDevice: isLowEndDevice,
        viewportWidth: viewportWidth,
        viewportHeight: viewportHeight
      });
    }

    // Initial detection
    detectCapabilities();
    
    // Update on resize (throttled)
    var resizeTimer: any;
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(detectCapabilities, 250);
    }
    
    // Safe event listener attachment with error handling
    try {
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
      }
    } catch (error) {
      console.warn('Error attaching event listeners:', error);
    }
    
    return function() {
      try {
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', handleResize);
          window.removeEventListener('orientationchange', handleResize);
        }
        clearTimeout(resizeTimer);
      } catch (error) {
        console.warn('Error removing event listeners:', error);
      }
    };
  }, []);

  return state;
}

export function useLegacyPerformance() {
  var [metrics, setMetrics] = useState({
    memoryUsage: 0,
    renderTime: 0,
    isSlowDevice: false
  });

  useEffect(function() {
    var startTime = Date.now();
    
    function updateMetrics() {
      var renderTime = Date.now() - startTime;
      var memoryUsage = 0;
      var isSlowDevice = false;
      
      // Check memory usage if available
      if ((performance as any).memory) {
        var memory = (performance as any).memory;
        memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        isSlowDevice = memoryUsage > 0.7 || renderTime > 1000;
      } else {
        // Fallback: assume slow device if render takes too long
        isSlowDevice = renderTime > 1000;
      }
      
      setMetrics({
        memoryUsage: memoryUsage,
        renderTime: renderTime,
        isSlowDevice: isSlowDevice
      });
    }
    
    // Update metrics after initial render
    setTimeout(updateMetrics, 100);
    
    // Periodic memory monitoring for low-end devices
    var interval = setInterval(function() {
      if ((performance as any).memory) {
        var memory = (performance as any).memory;
        var currentUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (currentUsage > 0.8) {
          console.warn('[Performance] High memory usage:', Math.round(currentUsage * 100) + '%');
        }
        
        setMetrics(function(prev) {
          return {
            ...prev,
            memoryUsage: currentUsage,
            isSlowDevice: prev.isSlowDevice || currentUsage > 0.7
          };
        });
      }
    }, 5000);
    
    return function() {
      clearInterval(interval);
    };
  }, []);

  return metrics;
}

export function useLegacyTouch() {
  var [touchState, setTouchState] = useState({
    isTouch: false,
    touchPoints: 0,
    lastTouchTime: 0
  });

  useEffect(function() {
    var isTouch = 'ontouchstart' in window || 
                  navigator.maxTouchPoints > 0 || 
                  (navigator as any).msMaxTouchPoints > 0;
    
    function handleTouchStart(e: TouchEvent) {
      setTouchState({
        isTouch: true,
        touchPoints: e.touches.length,
        lastTouchTime: Date.now()
      });
    }
    
    function handleTouchEnd() {
      setTouchState(function(prev) {
        return {
          ...prev,
          touchPoints: 0
        };
      });
    }
    
    if (isTouch) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    setTouchState(function(prev) {
      return {
        ...prev,
        isTouch: isTouch
      };
    });
    
    return function() {
      if (isTouch) {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, []);

  return touchState;
}

// Network optimization for slower connections
export function useLegacyNetwork() {
  var [networkState, setNetworkState] = useState({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown'
  });

  useEffect(function() {
    function updateNetworkState() {
      var connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
      
      var isSlowConnection = false;
      var connectionType = 'unknown';
      
      if (connection) {
        connectionType = connection.effectiveType || connection.type || 'unknown';
        isSlowConnection = connectionType === 'slow-2g' || connectionType === '2g' || 
                          (connection.downlink && connection.downlink < 1);
      }
      
      setNetworkState({
        isOnline: navigator.onLine,
        isSlowConnection: isSlowConnection,
        connectionType: connectionType
      });
    }
    
    updateNetworkState();
    
    function handleOnline() {
      updateNetworkState();
    }
    
    function handleOffline() {
      setNetworkState(function(prev) {
        return {
          ...prev,
          isOnline: false
        };
      });
    }
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection changes if available
    var connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkState);
    }
    
    return function() {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkState);
      }
    };
  }, []);

  return networkState;
}