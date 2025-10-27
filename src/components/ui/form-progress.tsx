import React from 'react';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { Progress } from './progress';
import { Badge } from './badge';

interface FormStep {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  required: boolean;
  error?: string;
}

interface FormProgressProps {
  steps: FormStep[];
  currentStep?: string;
  className?: string;
}

export function FormProgress({ steps, currentStep, className }: FormProgressProps) {
  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  const hasErrors = steps.some(step => step.error);

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Form Progress</span>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">
                {completedSteps} of {totalSteps} completed
              </span>
              {hasErrors && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Issues
                </Badge>
              )}
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="space-y-2">
          {steps.map((step, index) => {
            const isCurrent = currentStep === step.id;
            const isCompleted = step.completed;
            const hasError = step.error;

            return (
              <div
                key={step.id}
                className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-blue-50 border border-blue-200'
                    : isCompleted
                    ? 'bg-green-50 border border-green-200'
                    : hasError
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : hasError ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className={`text-sm font-medium ${
                      isCompleted ? 'text-green-900' : 
                      hasError ? 'text-red-900' : 
                      isCurrent ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {step.title}
                    </h4>
                    {step.required && !isCompleted && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  
                  {step.description && (
                    <p className={`text-xs mt-1 ${
                      isCompleted ? 'text-green-700' : 
                      hasError ? 'text-red-700' : 
                      isCurrent ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {step.description}
                    </p>
                  )}
                  
                  {hasError && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      {step.error}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion Status */}
        {completedSteps === totalSteps && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Form is ready to submit!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
