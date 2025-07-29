/**
 * Legacy-compatible image loader with lazy loading for older devices
 */
import React, { useState, useEffect, useRef } from 'react';

interface LegacyImageProps {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
}

export function LegacyImage({ 
  src, 
  alt, 
  fallback, 
  className = '', 
  style = {},
  loading = 'lazy'
}: LegacyImageProps) {
  var [isLoaded, setIsLoaded] = useState(false);
  var [isInView, setIsInView] = useState(loading === 'eager');
  var [hasError, setHasError] = useState(false);
  var imgRef = useRef<HTMLImageElement>(null);
  var observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(function() {
    if (loading === 'lazy' && !isInView) {
      // Fallback for browsers without IntersectionObserver
      if (typeof IntersectionObserver === 'undefined') {
        // Use scroll-based lazy loading
        var checkVisibility = function() {
          if (!imgRef.current) return;
          
          var rect = imgRef.current.getBoundingClientRect();
          var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
          
          if (rect.top < viewportHeight + 200 && rect.bottom > -200) {
            setIsInView(true);
            window.removeEventListener('scroll', checkVisibility);
            window.removeEventListener('resize', checkVisibility);
          }
        };
        
        window.addEventListener('scroll', checkVisibility);
        window.addEventListener('resize', checkVisibility);
        checkVisibility(); // Initial check
        
        return function() {
          window.removeEventListener('scroll', checkVisibility);
          window.removeEventListener('resize', checkVisibility);
        };
      } else {
        // Use IntersectionObserver for modern browsers
        observerRef.current = new IntersectionObserver(
          function(entries) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                setIsInView(true);
                if (observerRef.current && imgRef.current) {
                  observerRef.current.unobserve(imgRef.current);
                }
              }
            });
          },
          { rootMargin: '200px' }
        );
        
        if (imgRef.current) {
          observerRef.current.observe(imgRef.current);
        }
        
        return function() {
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        };
      }
    }
  }, [loading, isInView]);

  var handleLoad = function() {
    setIsLoaded(true);
  };

  var handleError = function() {
    setHasError(true);
    setIsLoaded(true);
  };

  var imageStyles: React.CSSProperties = {
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease',
    ...style
  };

  var placeholderStyles: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    color: '#9ca3af',
    fontSize: '14px'
  };

  // Show placeholder while not in view or loading
  if (!isInView) {
    return (
      <div 
        ref={imgRef}
        className={className}
        style={{ ...placeholderStyles, ...style }}
      >
        Loading...
      </div>
    );
  }

  // Show error state with fallback
  if (hasError) {
    if (fallback) {
      return (
        <img
          ref={imgRef}
          src={fallback}
          alt={alt}
          className={className}
          style={imageStyles}
          onLoad={handleLoad}
        />
      );
    }
    
    return (
      <div 
        className={className}
        style={{ ...placeholderStyles, ...style }}
      >
        Failed to load image
      </div>
    );
  }

  // Show actual image
  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      style={imageStyles}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}

// WebP detection with JPEG fallback
export function detectWebPSupport(): Promise<boolean> {
  return new Promise(function(resolve) {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    
    var webP = new Image();
    webP.onload = webP.onerror = function() {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

interface OptimizedImageProps extends LegacyImageProps {
  webpSrc?: string;
  jpegSrc?: string;
}

export function OptimizedImage({ webpSrc, jpegSrc, src, ...props }: OptimizedImageProps) {
  var [supportsWebP, setSupportsWebP] = useState<boolean | null>(null);

  useEffect(function() {
    detectWebPSupport().then(setSupportsWebP);
  }, []);

  var imageSrc = src;
  if (supportsWebP !== null) {
    if (supportsWebP && webpSrc) {
      imageSrc = webpSrc;
    } else if (!supportsWebP && jpegSrc) {
      imageSrc = jpegSrc;
    }
  }

  return <LegacyImage {...props} src={imageSrc} />;
}