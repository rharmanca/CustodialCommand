import React from 'react';
import { cn } from '@/lib/utils';
import { Check, AlertCircle, Clock } from 'lucide-react';

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
  className?: string;
  showLabels?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const FormProgress = ({
  currentStep,
  totalSteps,
  stepTitles = [],
  className,
  showLabels = true,
  variant = 'default'
}: FormProgressProps) => {
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'pending';
  };

  const getStepIcon = (status: 'completed' | 'active' | 'pending') => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4" />;
      case 'active':
        return <Clock className="h-4 w-4 animate-pulse" />;
      case 'pending':
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepColor = (status: 'completed' | 'active' | 'pending') => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500';
      case 'active':
        return 'bg-blue-500 text-white border-blue-500 animate-pulse';
      case 'pending':
        return 'bg-gray-100 text-gray-400 border-gray-300';
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn("mb-4", className)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {progressPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn("mb-6 p-4 bg-gray-50 rounded-lg", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Form Progress
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">
              {progressPercentage}% Complete
            </span>
            <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              Step {currentStep}/{totalSteps}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const status = getStepStatus(stepNumber);
            const title = stepTitles[index] || `Step ${stepNumber}`;

            return (
              <div key={stepNumber} className="flex items-center space-x-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200",
                    getStepColor(status)
                  )}
                >
                  {getStepIcon(status)}
                </div>
                <div className="flex-1">
                  <div className={cn(
                    "font-medium text-sm",
                    status === 'active' ? 'text-blue-600' :
                    status === 'completed' ? 'text-green-600' : 'text-gray-500'
                  )}>
                    {title}
                  </div>
                  {status === 'completed' && (
                    <div className="flex items-center text-green-600 text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Completed
                    </div>
                  )}
                  {status === 'active' && (
                    <div className="flex items-center text-blue-600 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      In Progress
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {showLabels && (
            <>
              <span className="text-sm font-medium text-gray-700">
                Progress
              </span>
              <div className="h-px w-4 bg-gray-300" />
            </>
          )}
          <span className="text-sm font-medium text-gray-900">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {progressPercentage}% Complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${progressPercentage}%` }}
        >
          {progressPercentage > 0 && (
            <div className="absolute right-0 top-0 h-full w-2 bg-white rounded-full opacity-30 animate-pulse" />
          )}
        </div>
      </div>

      {/* Step indicators */}
      {showLabels && (
        <div className="flex justify-between">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const status = getStepStatus(stepNumber);
            const title = stepTitles[index];

            return (
              <div
                key={stepNumber}
                className={cn(
                  "flex flex-col items-center text-xs transition-colors duration-200",
                  status === 'completed' && 'text-green-600',
                  status === 'active' && 'text-blue-600 font-semibold',
                  status === 'pending' && 'text-gray-400'
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 mb-1 flex items-center justify-center transition-all duration-200",
                    getStepColor(status)
                  )}
                >
                  {getStepIcon(status)}
                </div>
                {title && (
                  <span className="text-center leading-tight max-w-[60px]">
                    {title}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FormProgress;