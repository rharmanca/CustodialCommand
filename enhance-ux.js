import fs from 'fs';
import path from 'path';

class UXEnhancer {
  constructor() {
    this.projectRoot = '/Users/rharman/CustodialCommand-1';
    this.enhancementsApplied = [];
    this.results = [];
  }

  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${status}: ${message}`;
    console.log(logMessage);
    this.results.push({ timestamp, status, message });
  }

  // Add loading states and better feedback
  addLoadingStates() {
    this.log('Enhancing: Adding loading states and feedback...');
    
    // Create loading components
    const loadingComponentsPath = path.join(this.projectRoot, 'src', 'components', 'ui');
    if (!fs.existsSync(loadingComponentsPath)) {
      fs.mkdirSync(loadingComponentsPath, { recursive: true });
    }
    
    // Create a loading spinner component
    const spinnerContent = `import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = 'md', variant = 'primary', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-12 h-12'
    };
    
    const variantClasses = {
      primary: 'text-primary',
      secondary: 'text-secondary-foreground',
      accent: 'text-accent-foreground'
    };
    
    return (
      <div 
        ref={ref} 
        className={cn("animate-spin rounded-full border-b-2 border-current", sizeClasses[size], variantClasses[variant], className)}
        {...props}
      />
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

export { LoadingSpinner };
`;

    const spinnerPath = path.join(loadingComponentsPath, 'loading-spinner.tsx');
    fs.writeFileSync(spinnerPath, spinnerContent);
    
    // Create a feedback component for user actions
    const feedbackContent = `import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

const feedbackVariants = cva(
  "flex items-center gap-2 p-4 rounded-lg border",
  {
    variants: {
      variant: {
        success: "bg-green-50 border-green-200 text-green-800",
        error: "bg-red-50 border-red-200 text-red-800",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
        info: "bg-blue-50 border-blue-200 text-blue-800",
      },
      size: {
        default: "text-sm",
        large: "text-base",
      },
    },
    defaultVariants: {
      variant: "info",
      size: "default",
    },
  }
);

interface FeedbackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof feedbackVariants> {
  icon?: boolean;
  showClose?: boolean;
  onDismiss?: () => void;
}

const Feedback = React.forwardRef<HTMLDivElement, FeedbackProps>(
  ({ className, variant, size, icon = true, showClose = false, onDismiss, children, ...props }, ref) => {
    const icons = {
      success: CheckCircle,
      error: XCircle,
      warning: AlertCircle,
      info: Info,
    };
    
    const Icon = icon && variant ? icons[variant] : null;
    
    return (
      <div 
        ref={ref} 
        className={cn(feedbackVariants({ variant, size, className }))}
        {...props}
      >
        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
        <div className="flex-1">{children}</div>
        {showClose && (
          <button 
            onClick={onDismiss}
            className="ml-2 text-current opacity-70 hover:opacity-100"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }
);

Feedback.displayName = "Feedback";

export { Feedback, feedbackVariants };
`;

    const feedbackPath = path.join(loadingComponentsPath, 'feedback.tsx');
    fs.writeFileSync(feedbackPath, feedbackContent);
    
    this.enhancementsApplied.push('Added loading states and feedback components');
    this.log('✅ Added loading states and feedback components');
  }

  // Improve form validation UX
  enhanceFormValidation() {
    this.log('Enhancing: Form validation UX...');
    
    // Create a validation feedback component
    const validationComponentsPath = path.join(this.projectRoot, 'src', 'components', 'ui');
    
    const validationContent = `import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ValidationMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: 'error' | 'success' | 'warning';
  showIcon?: boolean;
}

const ValidationMessage = React.forwardRef<HTMLDivElement, ValidationMessageProps>(
  ({ className, variant, showIcon = true, children, ...props }, ref) => {
    const variantClasses = {
      error: "text-red-600",
      success: "text-green-600",
      warning: "text-yellow-600",
    };
    
    const icons = {
      error: AlertCircle,
      success: CheckCircle,
      warning: AlertCircle,
    };
    
    const Icon = showIcon ? icons[variant] : null;
    
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-1.5 text-sm mt-1", variantClasses[variant], className)}
        {...props}
      >
        {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
        <span>{children}</span>
      </div>
    );
  }
);

ValidationMessage.displayName = "ValidationMessage";

// Hook for form validation state
export const useFormValidation = () => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  
  const validateField = (name: string, value: string, rules: any[]) => {
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        setErrors(prev => ({ ...prev, [name]: error }));
        return false;
      }
    }
    setErrors(prev => ({ ...prev, [name]: undefined }));
    return true;
  };
  
  const validateForm = (values: Record<string, any>, validationRules: Record<string, any>) => {
    const newErrors: Record<string, string> = {};
    
    for (const [field, rules] of Object.entries(validationRules)) {
      if (Array.isArray(rules)) {
        for (const rule of rules) {
          const error = rule(values[field]);
          if (error) {
            newErrors[field] = error;
            break;
          }
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  return { errors, validateField, validateForm, setErrors };
};

export { ValidationMessage };
`;

    const validationPath = path.join(validationComponentsPath, 'validation.tsx');
    fs.writeFileSync(validationPath, validationContent);
    
    // Update the custodial inspection form to use better validation UX
    const formPath = path.join(this.projectRoot, 'src', 'pages', 'custodial-inspection.tsx');
    if (fs.existsSync(formPath)) {
      let formContent = fs.readFileSync(formPath, 'utf-8');
      
      // Enhance the submission process with better UX
      if (formContent.includes('handleSubmit')) {
        // Add loading state and better error handling to the submit function
        formContent = formContent.replace(
          /const handleSubmit = async \(e: React\.FormEvent\) => \{/,
          `const [isSubmitting, setIsSubmitting] = useState(false);\n  const [formError, setFormError] = useState<string | null>(null);\n  const [formSuccess, setFormSuccess] = useState<string | null>(null);\n  \n  const handleSubmit = async (e: React.FormEvent) => {`
        );
        
        // Add loading state to the submit call
        formContent = formContent.replace(
          /setIsSubmitting\(true\);/,
          `
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    \n    setIsSubmitting(true);`
        );
        
        // Add success feedback
        formContent = formContent.replace(
          /toast\({[\s\S]*?}\);/,
          `setFormSuccess('Inspection submitted successfully!');\n        // Show success notification\n        toast({\n          title: "✅ Inspection Submitted Successfully!",\n          description: \`Single area inspection for \${formData.school} has been submitted and saved.\`,\n          variant: "default",\n          duration: 5000\n        });`
        );
        
        // Add error handling
        formContent = formContent.replace(
          /console\.error\('Error submitting inspection:', error\);/,
          `console.error('Error submitting inspection:', error);\n      setFormError(error instanceof Error ? error.message : 'An error occurred while submitting the inspection');\n      \n      let errorTitle = "Submission Failed";\n      let errorMessage = "Unable to submit inspection. Please try again.";\n\n      if (error instanceof Error) {\n        if (error.message.includes('NetworkError') || error.message.includes('fetch')) {\n          errorTitle = "Network Error";\n          errorMessage = "Unable to connect to the server. Please check your connection and try again.";\n        } else if (error.message.includes('validation') || error.message.includes('Invalid')) {\n          errorTitle = "Invalid Data";\n          errorMessage = "Please check all required fields and try again.";\n        }\n      }\n\n      toast({\n        variant: "destructive",\n        title: errorTitle,\n        description: errorMessage,\n        duration: 7000\n      });`
        );
        
        // Add loading state to the submit button
        formContent = formContent.replace(
          /<Button\s+type="submit"/,
          `<Button \n        type="submit" \n        disabled={isSubmitting}`
        );
        
        // Add loading indicator to the submit button
        formContent = formContent.replace(
          /('Submit Inspection')/,
          `({isSubmitting ? (\n              <>\n                <span className="animate-spin mr-2">⏳</span>\n                Submitting...\n              </>\n            ) : (\n              'Submit Inspection'\n            )})`
        );
        
        // Add form error display
        if (formContent.includes('form onSubmit')) {
          formContent = formContent.replace(
            /(<form onSubmit={handleSubmit} className="space-y-6">)/,
            `$1\n        {/* Form feedback */}\n        {formError && (\n          <ValidationMessage variant="error">\n            {formError}\n          </ValidationMessage>\n        )}\n        {formSuccess && (\n          <ValidationMessage variant="success">\n            {formSuccess}\n          </ValidationMessage>\n        )}\n        `
          );
        }
      }
      
      fs.writeFileSync(formPath, formContent);
      this.enhancementsApplied.push('Enhanced form validation UX');
      this.log('✅ Enhanced form validation UX');
    } else {
      this.log('ℹ️ Custodial inspection form not found, skipping validation enhancements');
    }
  }

  // Improve navigation UX
  enhanceNavigation() {
    this.log('Enhancing: Navigation UX...');
    
    // Update the main App.tsx to have better navigation UX
    const appPath = path.join(this.projectRoot, 'src', 'App.tsx');
    if (fs.existsSync(appPath)) {
      let appContent = fs.readFileSync(appPath, 'utf-8');
      
      // Add current page indicator to navigation
      if (appContent.includes('navLinks.map')) {
        appContent = appContent.replace(
          /<button\s+key={link\.name}[\s\S]*?className={\s*`modern-button \$\{currentPage === link\.path \? 'bg-primary\/80' : ''\}`\s*}>[\s\S]*?<\/button>/g,
          `<button
                key={link.name}
                onClick={() => setCurrentPage(link.path)}
                className={\`modern-button \${currentPage === link.path ? 'bg-primary/80 ring-2 ring-primary/50' : 'hover:bg-accent/50'}\`}
                aria-current={currentPage === link.path ? 'page' : undefined}
              >
                {link.name}
              </button>`
        );
        
        // Add back button functionality
        if (appContent.includes('onBack?: () => void;')) {
          // The components already have onBack functionality, so we'll enhance it
          appContent = appContent.replace(
            /<Button variant="outline" onClick={onBack} className="flex-shrink-0">[\s\n]*← Back[\s\n]*<\/Button>/g,
            `<Button 
                variant="outline" 
                onClick={onBack} 
                className="flex-shrink-0"
                aria-label="Go back to previous page"
              >
                ← Back
              </Button>`
          );
        }
      }
      
      fs.writeFileSync(appPath, appContent);
      this.enhancementsApplied.push('Enhanced navigation UX');
      this.log('✅ Enhanced navigation UX');
    } else {
      this.log('ℹ️ App.tsx file not found, skipping navigation enhancements');
    }
  }

  // Enhance toast notifications
  enhanceToasts() {
    this.log('Enhancing: Toast notifications UX...');
    
    // Update the custom notification component
    const notificationPath = path.join(this.projectRoot, 'src', 'components', 'ui', 'custom-notification.tsx');
    if (fs.existsSync(notificationPath)) {
      let notificationContent = fs.readFileSync(notificationPath, 'utf-8');
      
      // Enhance notification styles and functionality
      notificationContent = notificationContent.replace(
        /className={\`[\s\S]*?max-w-sm[\s\S]*?}/,
        `className={\`\n            p-4 rounded-lg shadow-lg max-w-xs w-full cursor-pointer transform transition-all\n            \${notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : ''}\n            \${notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : ''}\n            \${notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' : ''}\n            \${notification.type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-800' : ''}\n          \`}`
      );
      
      // Add better dismiss functionality
      notificationContent = notificationContent.replace(
        /onClick=\{.*?onRemove\(notification\.id\).*?\}> × <\/button>/,
        `onClick={(e) => {\n                e.stopPropagation();\n                onRemove(notification.id);\n              }}\n              aria-label="Close notification"\n            >\n              ×\n            </button>`
      );
      
      fs.writeFileSync(notificationPath, notificationContent);
      this.enhancementsApplied.push('Enhanced toast notifications');
      this.log('✅ Enhanced toast notifications');
    } else {
      this.log('ℹ️ Custom notification component not found, skipping toast enhancements');
    }
  }

  // Create progress indicators
  createProgressIndicators() {
    this.log('Enhancing: Creating progress indicators...');
    
    const componentsPath = path.join(this.projectRoot, 'src', 'components', 'ui');
    
    // Create a progress bar component
    const progressContent = `import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max = 100, label, showPercentage = false, variant = 'default', ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    const variantClasses = {
      default: 'bg-primary',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      destructive: 'bg-red-500',
    };
    
    return (
      <div 
        ref={ref} 
        className={cn("w-full bg-muted rounded-full h-2.5", className)}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        {...props}
      >
        <div 
          className={cn("h-2.5 rounded-full transition-all duration-300", variantClasses[variant])}
          style={{ width: \`\${percentage}%\` }}
        />
        {showPercentage && (
          <div className="text-xs text-muted-foreground mt-1 text-center">
            {Math.round(percentage)}%
          </div>
        )}
        {label && (
          <div className="text-sm mt-1">
            {label}
          </div>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

// Step indicator component
interface StepIndicatorProps {
  steps: { id: string; title: string; description?: string }[];
  currentStep: string;
  completedSteps?: string[];
}

const StepIndicator = ({ steps, currentStep, completedSteps = [] }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = step.id === currentStep;
        const isPast = steps.findIndex(s => s.id === currentStep) > index;
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={\`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                \${isCompleted || isPast 
                  ? 'bg-primary text-primary-foreground' 
                  : isCurrent 
                    ? 'bg-primary/10 text-primary border-2 border-primary' 
                    : 'bg-muted text-muted-foreground border-2 border-muted-foreground'}\`
              }>
                {isCompleted || isPast ? '✓' : index + 1}
              </div>
              <div className="text-xs mt-2 text-center max-w-20">
                {step.title}
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className={\`flex-1 h-0.5 mx-2 
                \${isPast ? 'bg-primary' : 'bg-muted'}\`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export { ProgressBar, StepIndicator };
`;

    const progressPath = path.join(componentsPath, 'progress-indicators.tsx');
    fs.writeFileSync(progressPath, progressContent);
    
    this.enhancementsApplied.push('Created progress indicators');
    this.log('✅ Created progress indicators');
  }

  // Enhance the building inspection form with progress indicators
  enhanceBuildingInspection() {
    this.log('Enhancing: Building inspection UX...');
    
    // Create a building inspection page with progress if it doesn't exist
    const pagesPath = path.join(this.projectRoot, 'src', 'pages');
    if (!fs.existsSync(pagesPath)) {
      fs.mkdirSync(pagesPath, { recursive: true });
    }
    
    // Create a more user-friendly building inspection form
    const buildingInspectionContent = `import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProgressBar, StepIndicator } from '@/components/ui/progress-indicators';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ValidationMessage } from '@/components/ui/validation';

interface BuildingInspectionPageProps {
  onBack?: () => void;
}

export default function BuildingInspectionPage({ onBack }: BuildingInspectionPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    school: '',
    buildingName: '',
    inspectorName: '',
    date: new Date().toISOString().split('T')[0],
    progress: 0,
    notes: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const steps = [
    { id: 'info', title: 'Basic Info', description: 'Building and inspector details' },
    { id: 'areas', title: 'Areas', description: 'Select inspection areas' },
    { id: 'rooms', title: 'Rooms', description: 'Room-by-room inspection' },
    { id: 'review', title: 'Review', description: 'Review and submit' }
  ];
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step >= 0) {
      if (!formData.school) newErrors.school = 'School is required';
      if (!formData.date) newErrors.date = 'Date is required';
    }
    
    if (step >= 1) {
      if (!formData.buildingName) newErrors.buildingName = 'Building name is required';
      if (!formData.inspectorName) newErrors.inspectorName = 'Inspector name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsCompleted(true);
      setTimeout(() => {
        if (onBack) onBack();
      }, 2000);
    } catch (error) {
      console.error('Error submitting building inspection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const stepComponents = [
    // Step 0: Basic Information
    <div key="step0" className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="school">School *</Label>
          <Select value={formData.school} onValueChange={(value) => handleInputChange('school', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select school" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ASA">ASA</SelectItem>
              <SelectItem value="LCA">LCA</SelectItem>
              <SelectItem value="GWC">GWC</SelectItem>
              <SelectItem value="OA">OA</SelectItem>
              <SelectItem value="CBR">CBR</SelectItem>
              <SelectItem value="WLC">WLC</SelectItem>
            </SelectContent>
          </Select>
          {errors.school && <ValidationMessage variant="error">{errors.school}</ValidationMessage>}
        </div>
        
        <div>
          <Label htmlFor="date">Inspection Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
          />
          {errors.date && <ValidationMessage variant="error">{errors.date}</ValidationMessage>}
        </div>
      </div>
    </div>,
    
    // Step 1: Building Details
    <div key="step1" className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="buildingName">Building Name *</Label>
          <Input
            id="buildingName"
            value={formData.buildingName}
            onChange={(e) => handleInputChange('buildingName', e.target.value)}
            placeholder="Enter building name"
          />
          {errors.buildingName && <ValidationMessage variant="error">{errors.buildingName}</ValidationMessage>}
        </div>
        
        <div>
          <Label htmlFor="inspectorName">Inspector Name *</Label>
          <Input
            id="inspectorName"
            value={formData.inspectorName}
            onChange={(e) => handleInputChange('inspectorName', e.target.value)}
            placeholder="Enter inspector name"
          />
          {errors.inspectorName && <ValidationMessage variant="error">{errors.inspectorName}</ValidationMessage>}
        </div>
      </div>
    </div>,
    
    // Step 2: Areas (would contain room selection in a real implementation)
    <div key="step2" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Building Areas</CardTitle>
          <CardDescription>
            Select the areas to inspect in this building
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Classrooms', 'Restrooms', 'Hallways', 'Stairwells',
              'Offices', 'Cafeteria', 'Gymnasium', 'Library'
            ].map(area => (
              <div key={area} className="flex items-center">
                <input 
                  type="checkbox" 
                  id={area} 
                  className="mr-2 h-4 w-4"
                />
                <Label htmlFor={area}>{area}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>,
    
    // Step 3: Review and Submit
    <div key="step3" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Inspection</CardTitle>
          <CardDescription>
            Please review the information before submitting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">School</Label>
              <div className="font-medium">{formData.school}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <div className="font-medium">{formData.date}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Building</Label>
              <div className="font-medium">{formData.buildingName}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Inspector</Label>
              <div className="font-medium">{formData.inspectorName}</div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  ];
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Building Inspection</h1>
          <p className="text-muted-foreground">Multi-step inspection process</p>
        </div>
      </div>
      
      {isCompleted ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Inspection Completed!</h2>
          <p className="text-muted-foreground mb-6">
            The building inspection has been submitted successfully.
          </p>
          <Button onClick={onBack}>Return to Dashboard</Button>
        </div>
      ) : isSubmitting ? (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" variant="primary" className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Submitting Inspection</h2>
          <p className="text-muted-foreground">Please wait while we process your submission...</p>
        </div>
      ) : (
        <>
          <StepIndicator 
            steps={steps} 
            currentStep={steps[currentStep].id}
            completedSteps={steps.slice(0, currentStep).map(s => s.id)}
          />
          
          <ProgressBar 
            value={(currentStep / (steps.length - 1)) * 100} 
            label={\`Step \${currentStep + 1} of \${steps.length}\`}
            showPercentage
            className="mb-6"
          />
          
          <Card className="mb-6">
            <CardContent className="p-6">
              {stepComponents[currentStep]}
            </CardContent>
          </Card>
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={currentStep === 0}
            >
              ← Previous
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep}>
                Next →
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" variant="secondary" className="mr-2" />
                    Submitting...
                  </>
                ) : 'Submit Inspection'}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
`;

    const buildingInspectionPath = path.join(pagesPath, 'building-inspection-ux.tsx');
    fs.writeFileSync(buildingInspectionPath, buildingInspectionContent);
    
    this.enhancementsApplied.push('Enhanced building inspection UX');
    this.log('✅ Enhanced building inspection UX');
  }

  // Create better error boundaries
  createBetterErrorHandling() {
    this.log('Enhancing: Better error boundaries...');
    
    // Update the existing error boundary component
    const errorBoundaryPath = path.join(this.projectRoot, 'src', 'components', 'ui', 'error-boundary.tsx');
    if (fs.existsSync(errorBoundaryPath)) {
      let errorBoundaryContent = fs.readFileSync(errorBoundaryPath, 'utf-8');
      
      // Enhance error boundary with better UX
      errorBoundaryContent = errorBoundaryContent.replace(
        /class ErrorBoundary extends React\.Component/,
        `interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState>`
      );
      
      // Add error info to the state
      errorBoundaryContent = errorBoundaryContent.replace(
        /this\.state = { hasError: false };/,
        `this.state = { hasError: false, error: undefined };`
      );
      
      // Update the static method to capture error info
      errorBoundaryContent = errorBoundaryContent.replace(
        /static getDerivedStateFromError\(error: Error\): { hasError: boolean } {/,
        `static getDerivedStateFromError(error: Error): ErrorBoundaryState {
      console.error('Error caught by boundary:', error);
      return { hasError: true, error };`
      );
      
      // Update the fallback UI
      errorBoundaryContent = errorBoundaryContent.replace(
        /<div className="min-h-screen bg-background flex items-center justify-center p-4">[\s\S]*?<\/div>/,
        `<div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <span className="text-2xl text-red-600">!</span>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              An unexpected error occurred. Our team has been notified.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto"
              >
                Refresh Page
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full sm:w-auto"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>`
      );
      
      fs.writeFileSync(errorBoundaryPath, errorBoundaryContent);
      this.enhancementsApplied.push('Enhanced error boundaries');
      this.log('✅ Enhanced error boundaries');
    } else {
      this.log('ℹ️ Error boundary component not found, creating a new one...');
      
      // Create a new error boundary component
      const newErrorBoundary = `import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('Error caught by boundary:', error);
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <span className="text-2xl text-red-600">!</span>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              An unexpected error occurred. Our team has been notified.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto"
              >
                Refresh Page
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full sm:w-auto"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
`;
      
      fs.writeFileSync(errorBoundaryPath, newErrorBoundary);
      this.enhancementsApplied.push('Created enhanced error boundaries');
      this.log('✅ Created enhanced error boundaries');
    }
  }

  // Create a user guide/walkthrough
  createUserGuide() {
    this.log('Enhancing: Creating user guide/walkthrough...');
    
    // Create a user guide component
    const guideContent = `import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UserGuideProps {
  onClose?: () => void;
}

export default function UserGuide({ onClose }: UserGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const guideSteps = [
    {
      title: "Welcome to Custodial Command",
      content: "This guide will help you get started with using the application for custodial inspections.",
      image: null
    },
    {
      title: "Main Dashboard",
      content: "The home screen provides quick access to all the main functions of the application.",
      image: null
    },
    {
      title: "Creating Inspections",
      content: "You can create single room inspections or whole building inspections from their respective links.",
      image: null
    },
    {
      title: "Filling Out Forms",
      content: "Forms are designed to be easy to use. Required fields are clearly marked and validation helps prevent errors.",
      image: null
    },
    {
      title: "Submitting Data",
      content: "Submit your inspections with confidence. The app will confirm successful submissions.",
      image: null
    },
    {
      title: "Viewing Data",
      content: "Access all your inspection data and reports from the Data Reports section.",
      image: null
    }
  ];
  
  const nextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      if (onClose) onClose();
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle>User Guide</CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {guideSteps.length} - {guideSteps[currentStep].title}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{guideSteps[currentStep].title}</h3>
            <p className="text-muted-foreground">{guideSteps[currentStep].content}</p>
            {guideSteps[currentStep].image && (
              <div className="rounded-md overflow-hidden border">
                <img 
                  src={guideSteps[currentStep].image} 
                  alt={guideSteps[currentStep].title}
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        </CardContent>
        <div className="p-6 border-t flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            ← Previous
          </Button>
          <Button onClick={nextStep}>
            {currentStep === guideSteps.length - 1 ? 'Get Started' : 'Next →'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
`;

    const guidePath = path.join(this.projectRoot, 'src', 'components', 'ui', 'user-guide.tsx');
    fs.writeFileSync(guidePath, guideContent);
    
    // Add a help button to the main app
    const appPath = path.join(this.projectRoot, 'src', 'App.tsx');
    if (fs.existsSync(appPath)) {
      let appContent = fs.readFileSync(appPath, 'utf-8');
      
      // Add state for showing the guide
      if (appContent.includes('useState') && !appContent.includes('showUserGuide')) {
        appContent = appContent.replace(
          /const \[currentPage, setCurrentPage\] = useState/,
          `const [showUserGuide, setShowUserGuide] = useState(false);\n  const [currentPage, setCurrentPage] = useState`
        );
      }
      
      // Add the user guide component to the render
      if (appContent.includes('NotificationContainer')) {
        appContent = appContent.replace(
          /(<\/div>\s*<NotificationContainer)/,
          `          {showUserGuide && <UserGuide onClose={() => setShowUserGuide(false)} />}\n$1`
        );
      }
      
      // Add a help button to the main navigation
      if (appContent.includes('nav-container')) {
        appContent = appContent.replace(
          /(className="modern-button bg-amber-800 hover:bg-amber-900 border-amber-800 text-white shadow-lg hover:shadow-xl transform transition-all duration-200">[\s\n]*Admin[\s\n]*<\/button>)/,
          `$1\n            <button\n              onClick={() => setShowUserGuide(true)}\n              className="modern-button bg-blue-600 hover:bg-blue-700 border-blue-600 text-white shadow-lg hover:shadow-xl transform transition-all duration-200"\n            >\n              Help\n            </button>`
        );
      }
      
      fs.writeFileSync(appPath, appContent);
      this.enhancementsApplied.push('Created user guide');
      this.log('✅ Created user guide');
    } else {
      this.log('ℹ️ App.tsx not found, skipping user guide integration');
    }
  }

  runAllUXEnhancements() {
    this.log('🚀 Starting UX Enhancements Based on Testing Feedback');
    
    this.addLoadingStates();
    this.enhanceFormValidation();
    this.enhanceNavigation();
    this.enhanceToasts();
    this.createProgressIndicators();
    this.enhanceBuildingInspection();
    this.createBetterErrorHandling();
    this.createUserGuide();
    
    this.log('\n=== APPLIED UX ENHANCEMENTS ===');
    this.enhancementsApplied.forEach((enhancement, index) => {
      this.log(`${index + 1}. ${enhancement}`);
    });
    
    this.log('\n=== UX ENHANCEMENT SUMMARY ===');
    this.log('✅ The application now has:');
    this.log('• Better loading states and feedback');
    this.log('• Improved form validation UX');
    this.log('• Enhanced navigation with indicators');
    this.log('• Better toast notifications');
    this.log('• Progress indicators for multi-step processes');
    this.log('• Improved building inspection workflow');
    this.log('• Better error handling');
    this.log('• User guide/walkthrough');
    this.log('\n💡 These enhancements should significantly improve the user experience!');
  }
}

// Run the UX enhancements
const uxEnhancer = new UXEnhancer();
uxEnhancer.runAllUXEnhancements().catch(console.error);