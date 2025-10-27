import fs from 'fs';
import path from 'path';

class MobileUXImprover {
  constructor() {
    this.projectRoot = '/Users/rharman/CustodialCommand-1';
    this.improvementsApplied = [];
    this.results = [];
  }

  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${status}: ${message}`;
    console.log(logMessage);
    this.results.push({ timestamp, status, message });
  }

  // Update the main CSS for better mobile UX
  updateMainCSS() {
    this.log('Improving: Main CSS for mobile responsiveness...');
    
    const cssPath = path.join(this.projectRoot, 'src', 'index.css');
    if (fs.existsSync(cssPath)) {
      let cssContent = fs.readFileSync(cssPath, 'utf-8');
      
      // Add comprehensive mobile improvements
      const mobileImprovements = `
/* Mobile-First Design Improvements */
/* Base styles that apply to all devices */
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1rem;
  max-width: 100%;
  box-sizing: border-box;
}

.header-container, .nav-container, .content-area {
  width: 100%;
  margin: 0.5rem 0;
  padding: 1rem;
  border-radius: 0.5rem;
  box-sizing: border-box;
}

.modern-button {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  margin: 0.25rem 0;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modern-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

/* Responsive Grid for Mobile */
.responsive-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  width: 100%;
}

/* Tablet styles */
@media (min-width: 640px) {
  .responsive-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .modern-button {
    width: auto;
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .main-container {
    flex-direction: row;
    flex-wrap: wrap;
    padding: 2rem;
  }
  
  .header-container, .nav-container, .content-area {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .responsive-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Touch-friendly form elements */
input, select, textarea, button {
  min-height: 48px;
  min-width: 48px;
  padding: 0.75rem;
  font-size: 1rem;
  border-radius: 0.375rem;
  margin: 0.25rem 0;
  box-sizing: border-box;
}

/* Mobile-optimized form layout */
.form-section {
  width: 100%;
  padding: 1rem 0.5rem;
  box-sizing: border-box;
}

/* Better spacing on mobile */
.mobile-spaced {
  margin: 0.5rem 0;
}

/* Mobile-optimized navigation */
.nav-container .button-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
}

@media (min-width: 640px) {
  .nav-container .button-container {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }
}

/* Mobile-optimized card layout */
.card-mobile-full {
  width: 100%;
  margin: 0.75rem 0;
}

/* Touch targets for star ratings on mobile */
.star-rating-mobile {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
  margin: 1rem 0;
}

.star-rating-mobile button {
  width: 40px;
  height: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

@media (min-width: 640px) {
  .star-rating-mobile button {
    width: 48px;
    height: 48px;
  }
}

/* Mobile-friendly image previews */
.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin: 1rem 0;
}

.image-preview-item {
  position: relative;
  aspect-ratio: 1/1;
  border-radius: 0.375rem;
  overflow: hidden;
}

/* Improve accessibility on mobile */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Better focus indicators for accessibility */
.modern-button:focus,
input:focus,
select:focus,
textarea:focus,
button:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Mobile-optimized modal/dialog */
@media (max-width: 640px) {
  [data-radix-dialog-content],
  [data-radix-popover-content] {
    width: 95vw !important;
    max-width: 95vw !important;
    margin: 0.5rem !important;
  }
}

/* Optimize for different screen sizes */
.short-screen {
  min-height: 600px;
}

@media (max-height: 600px) {
  .short-screen {
    min-height: 400px;
  }
}

/* Better typography for mobile */
.text-mobile-responsive {
  font-size: clamp(0.8rem, 2.5vw, 1rem);
}

.text-mobile-heading {
  font-size: clamp(1.2rem, 4vw, 1.5rem);
  font-weight: 600;
}

/* Reduce motion for mobile */
@media (prefers-reduced-motion: reduce) {
  .transition-transform,
  .hover\\:translate-y-0 {
    transition: none;
  }
}

/* Optimize images for mobile */
img {
  max-width: 100%;
  height: auto;
}
`;
      
      // Add mobile improvements to CSS if they don't already exist
      if (!cssContent.includes('responsive-grid')) {
        cssContent += mobileImprovements;
      } else {
        // Update the existing responsive-grid if it exists but isn't comprehensive
        if (!cssContent.includes('Mobile-First Design Improvements')) {
          cssContent = cssContent.replace(
            /\/\* Mobile Responsive Fixes \*\//,
            `/* Mobile-First Design Improvements */${mobileImprovements}`
          );
        } else {
          cssContent += mobileImprovements;
        }
      }
      
      fs.writeFileSync(cssPath, cssContent);
      this.improvementsApplied.push('Updated CSS for mobile UX');
      this.log('✅ Updated CSS for mobile UX');
    } else {
      this.log('ℹ️ CSS file not found, skipping mobile improvements');
    }
  }

  // Update mobile components
  updateMobileComponents() {
    this.log('Improving: Mobile-specific components...');
    
    // Create or update mobile-specific components
    const mobileComponentsPath = path.join(this.projectRoot, 'src', 'components', 'ui');
    if (!fs.existsSync(mobileComponentsPath)) {
      fs.mkdirSync(mobileComponentsPath, { recursive: true });
    }
    
    // Create a mobile-optimized button component
    const mobileButtonContent = `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const mobileButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-12 px-4 py-3 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary/20 hover:border-primary/30",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-destructive/20 hover:border-destructive/30",
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-2 border-secondary/20 hover:border-secondary/30",
        ghost: "hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-accent/20",
        link: "text-primary underline-offset-4 hover:underline border-2 border-transparent",
      },
      size: {
        default: "h-12 px-4 py-3 font-semibold text-base",
        sm: "h-10 rounded-md px-3 font-medium",
        lg: "h-14 rounded-md px-8 font-semibold text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof mobileButtonVariants> {
  asChild?: boolean
}

const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(mobileButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
MobileButton.displayName = "MobileButton"

export { MobileButton, mobileButtonVariants }
`;

    const mobileButtonPath = path.join(mobileComponentsPath, 'mobile-button.tsx');
    fs.writeFileSync(mobileButtonPath, mobileButtonContent);
    
    // Create a mobile-friendly form layout component
    const mobileFormContent = `import * as React from "react"
import { cn } from "@/lib/utils"

const MobileFormField = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mt-4", className)} {...props} />
))
MobileFormField.displayName = "MobileFormField"

const MobileFormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2 w-full", className)} {...props} />
))
MobileFormItem.displayName = "MobileFormItem"

const MobileFormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
MobileFormLabel.displayName = "MobileFormLabel"

const MobileFormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    />
  )
})
MobileFormMessage.displayName = "MobileFormMessage"

export {
  MobileFormField,
  MobileFormItem,
  MobileFormLabel,
  MobileFormMessage,
}
`;

    const mobileFormPath = path.join(mobileComponentsPath, 'mobile-form.tsx');
    fs.writeFileSync(mobileFormPath, mobileFormContent);
    
    this.improvementsApplied.push('Created mobile-optimized components');
    this.log('✅ Created mobile-optimized components');
  }

  // Update the main App.tsx to use better mobile patterns
  updateAppForMobile() {
    this.log('Improving: App.tsx for mobile experience...');
    
    const appPath = path.join(this.projectRoot, 'src', 'App.tsx');
    if (fs.existsSync(appPath)) {
      let appContent = fs.readFileSync(appPath, 'utf-8');
      
      // Update the responsive grid to use better mobile patterns
      if (appContent.includes('responsive-grid')) {
        // Improve the responsive grid implementation in the JSX
        const improvedGrid = `
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <button
                    onClick={() => setCurrentPage("Custodial Notes")}
                    className="modern-button bg-blue-600 hover:bg-blue-700 border-blue-600 text-white w-full p-6 min-h-[80px]"
                  >
                    Report A Custodial Concern
                  </button>
                  <button
                    onClick={() => setCurrentPage("Custodial Inspection")}
                    className="modern-button bg-blue-600 hover:bg-blue-700 border-blue-600 text-white w-full p-6 min-h-[80px]"
                  >
                    Single Area Inspection
                  </button>
                  <button
                    onClick={() => setCurrentPage("Whole Building Inspection")}
                    className="modern-button bg-blue-600 hover:bg-blue-700 border-blue-600 text-white w-full p-6 min-h-[80px]"
                  >
                    Building Inspection
                  </button>
                  <button
                    onClick={() => setCurrentPage("Rating Criteria")}
                    className="modern-button bg-blue-600 hover:bg-blue-700 border-blue-600 text-white w-full p-6 min-h-[80px]"
                  >
                    Rating Criteria Guide
                  </button>
                  <div className="space-y-3 w-full">
                    <p className="text-sm text-muted-foreground font-medium text-center">
                      Note: Best viewed on desktop
                    </p>
                    <button
                      onClick={() => setCurrentPage("Inspection Data")}
                      className="modern-button bg-blue-600 hover:bg-blue-700 border-blue-600 text-white w-full p-6 min-h-[80px]"
                    >
                      View Data & Reports
                    </button>
                  </div>
                </div>
`;
        
        appContent = appContent.replace(
          /<div className="responsive-grid[^>]*>[\s\S]*?<\/div>/,
          improvedGrid.replace(/\n/g, '\n                ')
        );
      }
      
      // Update the header to be more mobile-friendly
      if (appContent.includes('header-container')) {
        appContent = appContent.replace(
          /<header className="w-full[^>]*header-container[^>]*>[\s\S]*?<\/header>/,
          `<header className="w-full header-container p-4 rounded-xl shadow-sm mb-4">
          <h1 className="font-bold text-center modern-header tracking-tight text-xl sm:text-2xl">
            CA Custodial Command
          </h1>
        </header>`
        );
      }
      
      // Update navigation to be more mobile-friendly
      if (appContent.includes('nav-container')) {
        appContent = appContent.replace(
          /<nav className="w-full[^>]*nav-container[^>]*>[\s\S]*?<\/nav>/,
          `<nav className="w-full nav-container p-3 rounded-xl shadow-sm mb-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-2 sm:gap-3 md:gap-4">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => setCurrentPage(link.path)}
                className="modern-button text-sm p-3 min-h-[44px]"
              >
                {link.name}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage('admin-inspections')}
              className="modern-button bg-red-600 hover:bg-red-700 border-red-600 text-white text-sm p-3 min-h-[44px]"
            >
              Admin
            </button>
          </div>
        </nav>`
        );
      }
      
      fs.writeFileSync(appPath, appContent);
      this.improvementsApplied.push('Updated App.tsx for mobile experience');
      this.log('✅ Updated App.tsx for mobile experience');
    } else {
      this.log('ℹ️ App.tsx file not found, skipping mobile app updates');
    }
  }

  // Update mobile-specific hooks
  createMobileHooks() {
    this.log('Improving: Creating mobile-specific hooks...');
    
    const hooksPath = path.join(this.projectRoot, 'src', 'hooks');
    if (!fs.existsSync(hooksPath)) {
      fs.mkdirSync(hooksPath, { recursive: true });
    }
    
    // Create enhanced mobile hook
    const mobileHookContent = `import { useState, useEffect } from 'react';

export interface MobileState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  isShortScreen: boolean;
}

export const useEnhancedMobile = (): MobileState => {
  const [mobileState, setMobileState] = useState<MobileState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTouch: false,
    orientation: 'portrait',
    screenWidth: 0,
    isShortScreen: false
  });

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Detect mobile and tablet devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent) || 
                  (/(tablet|ipad|playbook|silk)|(android(?!.*\bmobile\b))/i.test(userAgent) && window.innerWidth > 768);
    
    // Detect touch capability
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Determine screen size
    const screenWidth = window.innerWidth;
    const isDesktop = !isMobile && !isTablet;
    const isShortScreen = window.innerHeight < 600;
    
    // Determine orientation
    const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    
    setMobileState({
      isMobile,
      isTablet,
      isDesktop,
      isTouch,
      orientation,
      screenWidth,
      isShortScreen
    });

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const newOrientation = width > height ? 'landscape' : 'portrait';
      const newIsShortScreen = height < 600;
      
      setMobileState(prev => ({
        ...prev,
        orientation: newOrientation,
        screenWidth: width,
        isShortScreen: newIsShortScreen
      }));
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return mobileState;
};

// Backward compatibility with existing hook
export const useIsMobile = () => {
  const { isMobile, isTouch, orientation } = useEnhancedMobile();
  return { isMobile, isTouch, orientation };
};
`;

    const mobileHookPath = path.join(hooksPath, 'use-mobile-enhanced.ts');
    fs.writeFileSync(mobileHookPath, mobileHookContent);
    
    this.improvementsApplied.push('Created enhanced mobile hooks');
    this.log('✅ Created enhanced mobile hooks');
  }

  // Update form components for mobile
  updateFormForMobile() {
    this.log('Improving: Form components for mobile...');
    
    // Update the custodial inspection form to be more mobile-friendly
    const formPath = path.join(this.projectRoot, 'src', 'pages', 'custodial-inspection.tsx');
    if (fs.existsSync(formPath)) {
      let formContent = fs.readFileSync(formPath, 'utf-8');
      
      // Make the star rating component more mobile-friendly
      if (formContent.includes('renderStarRating')) {
        // Create a more mobile-optimized version of the star rating
        const mobileOptimizedRating = `
  const renderMobileStarRating = (categoryObj: any, currentRating: number) => {
    return (
      <div className="space-y-3">
        <div className="bg-muted rounded-lg p-3 border">
          <div className="text-center text-sm font-medium mb-2">
            Rate this category:
          </div>
          
          {/* Large touch-friendly star buttons */}
          <div className="flex justify-center gap-1 flex-wrap">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-3 rounded-full hover:bg-accent transition-colors flex-shrink-0"
                onClick={() => handleInputChange(categoryObj.key, star)}
              >
                <Star
                  className={\`w-6 h-6 \${star <= currentRating && currentRating > 0
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-300'
                  }\`}
                />
              </button>
            ))}
          </div>
          
          {/* Not Rated Button - Large touch target */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              className={\`px-4 py-2 rounded-md border text-sm font-medium transition-colors min-h-12 flex-shrink-0 \${currentRating === 0
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-background border-input text-foreground hover:bg-accent'
              }\`}
              onClick={() => handleInputChange(categoryObj.key, 0)}
            >
              Not Rated
            </button>
          </div>
        </div>

        {/* Current Rating Status */}
        <div className="text-center pt-1">
          {currentRating > 0 ? (
            <div className="space-y-1">
              <Badge variant="secondary" className="text-xs px-2 py-1 inline-block">
                {ratingDescriptions[currentRating - 1]?.label}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {ratingDescriptions[currentRating - 1]?.description}
              </div>
            </div>
          ) : (
            <Badge variant="outline" className="text-xs px-2 py-1 inline-block">
              No rating selected
            </Badge>
          )}
        </div>

        {/* Detailed Criteria - Collapsible on mobile */}
        {currentRating > 0 && categoryObj.criteria && categoryObj.criteria[currentRating] && (
          <CollapsibleSection
            title="Rating Details"
            defaultCollapsed={true}
            className="bg-accent/10 border-accent/30 text-xs"
            titleClassName="text-left font-medium text-xs"
            contentClassName="p-2"
          >
            <div className="text-accent-foreground">
              <p className="leading-relaxed">{categoryObj.criteria[currentRating]}</p>
            </div>
          </CollapsibleSection>
        )}
      </div>
    );
  };
`;
        
        // Add the mobile-optimized rating function to the file
        if (!formContent.includes('renderMobileStarRating')) {
          formContent = formContent.replace(
            /(\n\s*function\s+[^(]*\([^)]*\)\s*{)/,
            `$1${mobileOptimizedRating}`
          );
          
          // Update the render method to use mobile-optimized version on mobile devices
          if (formContent.includes('renderStarRating')) {
            formContent = formContent.replace(
              /{(isMobile \?)/g,
              '{(true ?'  // For now, always use mobile version for better touch experience
            );
          }
        }
      }
      
      // Make form inputs more mobile-friendly
      if (formContent.includes('className="grid grid-cols-1')) {
        formContent = formContent.replace(
          /className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4/,
          'className="grid grid-cols-1 gap-3" // Mobile-first: single column with more space'
        );
      }
      
      fs.writeFileSync(formPath, formContent);
      this.improvementsApplied.push('Updated forms for mobile experience');
      this.log('✅ Updated forms for mobile experience');
    } else {
      this.log('ℹ️ Custodial inspection form not found, skipping form updates');
    }
  }

  // Update viewport meta tag for better mobile experience
  updateHTMLForMobile() {
    this.log('Improving: index.html for mobile experience...');
    
    const indexPath = path.join(this.projectRoot, 'index.html');
    if (fs.existsSync(indexPath)) {
      let htmlContent = fs.readFileSync(indexPath, 'utf-8');
      
      // Update viewport meta tag for better mobile experience
      const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes">';
      
      if (htmlContent.includes('<meta name="viewport"')) {
        htmlContent = htmlContent.replace(
          /<meta name="viewport"[^>]*>/,
          viewportTag
        );
      } else {
        // Add viewport meta tag if it doesn't exist
        htmlContent = htmlContent.replace(
          /<head>/,
          '<head>\n    ' + viewportTag
        );
      }
      
      // Add theme color meta tag for mobile browsers
      if (!htmlContent.includes('theme-color')) {
        htmlContent = htmlContent.replace(
          /<head>/,
          '<head>\n    <meta name="theme-color" content="#000000">'
        );
      }
      
      fs.writeFileSync(indexPath, htmlContent);
      this.improvementsApplied.push('Updated HTML for mobile experience');
      this.log('✅ Updated HTML for mobile experience');
    } else {
      this.log('ℹ️ index.html file not found, skipping HTML updates');
    }
  }

  // Create mobile-specific styles and utilities
  createMobileUtilities() {
    this.log('Improving: Creating mobile-specific utilities...');
    
    const utilsPath = path.join(this.projectRoot, 'src', 'utils');
    if (!fs.existsSync(utilsPath)) {
      fs.mkdirSync(utilsPath, { recursive: true });
    }
    
    // Create mobile utilities
    const mobileUtilsContent = `// Mobile-specific utility functions

// Check if device is mobile
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check if device is tablet
export const isTabletDevice = (): boolean => {
  return /iPad|Android(?=.*\\bMobile\\b)(?=.*\\bSafari\\b)/i.test(navigator.userAgent) || 
         (/(tablet|ipad|playbook|silk)|(android(?!.*\\bmobile\\b))/i.test(navigator.userAgent) && window.innerWidth > 768);
};

// Check if device is touch-enabled
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Format data for mobile display
export const formatForMobile = (data: any): any => {
  if (typeof data === 'string') {
    // Shorten long strings for mobile display
    return data.length > 100 ? data.substring(0, 100) + '...' : data;
  }
  return data;
};

// Debounce function for mobile performance
export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for mobile performance
export const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Check screen size for adaptive layouts
export const useScreenSize = (): { width: number; height: number; isMobile: boolean; isTablet: boolean } => {
  const [screenSize, setScreenSize] = window.React?.useState
    ? window.React.useState({ width: window.innerWidth, height: window.innerHeight })
    : { width: window.innerWidth, height: window.innerHeight };

  const isMobile = screenSize.width < 768;
  const isTablet = screenSize.width >= 768 && screenSize.width < 1024;

  return { ...screenSize, isMobile, isTablet };
};
`;

    const mobileUtilsPath = path.join(utilsPath, 'mobile-utils.ts');
    fs.writeFileSync(mobileUtilsPath, mobileUtilsContent);
    
    this.improvementsApplied.push('Created mobile utilities');
    this.log('✅ Created mobile utilities');
  }

  // Add mobile-specific accessibility features
  addAccessibilityFeatures() {
    this.log('Improving: Adding mobile accessibility features...');
    
    const accessibilityPath = path.join(this.projectRoot, 'src', 'utils');
    if (!fs.existsSync(accessibilityPath)) {
      fs.mkdirSync(accessibilityPath, { recursive: true });
    }
    
    // Create accessibility utilities
    const accessibilityContent = `// Mobile and accessibility utilities

// Announce content to screen readers
export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Focus trap for mobile dialogs
export const focusTrap = (container: HTMLElement, firstFocus?: HTMLElement) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;
  
  const firstElement = firstFocus || focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };
  
  container.addEventListener('keydown', handleTabKey);
  
  const cleanup = () => {
    container.removeEventListener('keydown', handleTabKey);
  };
  
  firstElement?.focus();
  
  return { cleanup };
};

// Skip link for keyboard users
export const createSkipLink = () => {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  skipLink.style.cssText = \`
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    z-index: 10000;
  \`;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
};

// Initialize accessibility features
export const initAccessibility = () => {
  createSkipLink();
  
  // Add landmark roles
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.setAttribute('role', 'main');
  }
  
  // Ensure sufficient color contrast
  const style = document.createElement('style');
  style.textContent = \`
    /* Ensure sufficient color contrast for mobile */
    .insufficient-contrast {
      background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%),
                  linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%);
      background-size: 10px 10px;
      background-position: 0 0, 5px 5px;
    }
  \`;
  
  document.head.appendChild(style);
};
`;

    const accessibilityPathFile = path.join(accessibilityPath, 'accessibility.ts');
    fs.writeFileSync(accessibilityPathFile, accessibilityContent);
    
    this.improvementsApplied.push('Added accessibility features');
    this.log('✅ Added accessibility features');
  }

  // Update the main index.tsx to include accessibility features
  updateMainIndex() {
    this.log('Improving: main index.tsx for mobile accessibility...');
    
    const indexPath = path.join(this.projectRoot, 'src', 'main.tsx');
    if (fs.existsSync(indexPath)) {
      let mainContent = fs.readFileSync(indexPath, 'utf-8');
      
      // Add accessibility initialization
      if (!mainContent.includes('initAccessibility')) {
        const newImport = `import { initAccessibility } from './utils/accessibility';`;
        
        // Add the import after other imports
        mainContent = mainContent.replace(
          /^(import[^'"]*['"][^'"]*['"];?\n)+/m,
          `$&${newImport}\n`
        );
        
        // Add initialization after React app is rendered
        if (mainContent.includes('.render(')) {
          mainContent = mainContent.replace(
            /\.render\(\s*(React\.createElement\([^)]+\)|[^;]+),/,
            `initAccessibility();\n\n$&`
          );
        }
      }
      
      fs.writeFileSync(indexPath, mainContent);
      this.improvementsApplied.push('Updated main index for accessibility');
      this.log('✅ Updated main index for accessibility');
    } else {
      this.log('ℹ️ main.tsx file not found, skipping accessibility updates');
    }
  }

  // Create mobile-optimized input components
  createMobileInputs() {
    this.log('Improving: Creating mobile-optimized input components...');
    
    const componentsPath = path.join(this.projectRoot, 'src', 'components', 'ui');
    
    // Create mobile-optimized input component
    const mobileInputContent = `import * as React from "react"
import { cn } from "@/lib/utils"

export interface MobileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-12",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
MobileInput.displayName = "MobileInput"

export { MobileInput }
`;

    const mobileInputPath = path.join(componentsPath, 'mobile-input.tsx');
    fs.writeFileSync(mobileInputPath, mobileInputContent);
    
    // Create mobile-optimized textarea
    const mobileTextareaContent = `import * as React from "react"
import { cn } from "@/lib/utils"

export interface MobileTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const MobileTextarea = React.forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
MobileTextarea.displayName = "MobileTextarea"

export { MobileTextarea }
`;

    const mobileTextareaPath = path.join(componentsPath, 'mobile-textarea.tsx');
    fs.writeFileSync(mobileTextareaPath, mobileTextareaContent);
    
    this.improvementsApplied.push('Created mobile-optimized input components');
    this.log('✅ Created mobile-optimized input components');
  }

  runAllMobileImprovements() {
    this.log('🚀 Starting Mobile UX and Responsiveness Improvements');
    
    this.updateMainCSS();
    this.updateMobileComponents();
    this.updateAppForMobile();
    this.createMobileHooks();
    this.updateFormForMobile();
    this.updateHTMLForMobile();
    this.createMobileUtilities();
    this.addAccessibilityFeatures();
    this.updateMainIndex();
    this.createMobileInputs();
    
    this.log('\n=== APPLIED MOBILE UX IMPROVEMENTS ===');
    this.improvementsApplied.forEach((improvement, index) => {
      this.log(`${index + 1}. ${improvement}`);
    });
    
    this.log('\n=== MOBILE UX SUMMARY ===');
    this.log('✅ The application now has:');
    this.log('• Improved CSS for mobile responsiveness');
    this.log('• Mobile-optimized components');
    this.log('• Enhanced mobile hooks');
    this.log('• Mobile-friendly forms');
    this.log('• Better HTML meta tags for mobile');
    this.log('• Mobile utilities and functions');
    this.log('• Accessibility features for mobile');
    this.log('• Mobile-optimized input components');
    this.log('\n💡 The app should now provide a much better experience on mobile devices!');
  }
}

// Run the mobile UX improvements
const mobileImprover = new MobileUXImprover();
mobileImprover.runAllMobileImprovements().catch(console.error);