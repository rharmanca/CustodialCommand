import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  useScreenReaderAnnouncer,
  useAriaAttributes,
  useFormAccessibility,
  useFocusTrap
} from './AccessibilityEnhancements';

interface AccessibleFormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  error?: string;
  description?: string;
  options?: Array<{ value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  validationPattern?: string;
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
}

// Enhanced form field with comprehensive accessibility
const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  id,
  label,
  type = 'text',
  placeholder,
  required = false,
  error,
  description,
  options,
  value,
  onChange,
  className,
  validationPattern,
  minLength,
  maxLength,
  autoComplete
}) => {
  const { setAriaDescribedBy, setAriaInvalid, setAriaRequired } = useAriaAttributes();
  const { announce } = useScreenReaderAnnouncer();
  const [isFocused, setIsFocused] = useState(false);

  const describedByIds: string[] = [];
  if (description) describedByIds.push(`${id}-description`);
  if (error) describedByIds.push(`${id}-error`);

  const handleFieldChange = useCallback((newValue: string) => {
    onChange?.(newValue);

    // Announce errors to screen readers
    if (error) {
      announce(`Error: ${error}`, 'assertive');
    }
  }, [onChange, error, announce]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    // Validate field on blur if required
    if (required && !value?.trim()) {
      announce(`${label} is required`, 'assertive');
    }
  }, [required, value, label, announce]);

  const renderInput = () => {
    const commonProps = {
      id,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        handleFieldChange(e.target.value),
      onFocus: handleFocus,
      onBlur: handleBlur,
      required,
      'aria-describedby': describedByIds.length > 0 ? describedByIds.join(' ') : undefined,
      'aria-invalid': error ? true : false,
      'aria-required': required ? true : false,
      className: cn(
        'w-full px-4 py-3 border-2 rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-opacity-20',
        error
          ? 'border-destructive bg-destructive/5 focus:border-destructive focus:ring-destructive'
          : isFocused
          ? 'border-primary bg-primary/5 focus:border-primary focus:ring-primary'
          : 'border-muted-foreground/30 bg-background hover:border-muted-foreground/50',
        className
      )
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            placeholder={placeholder}
            minLength={minLength}
            maxLength={maxLength}
            rows={4}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id={id}
              checked={value === 'true'}
              onChange={(e) => handleFieldChange(e.target.checked ? 'true' : 'false')}
              className={cn(
                'w-5 h-5 border-2 rounded transition-all duration-200',
                'focus:outline-none focus:ring-4 focus:ring-opacity-20',
                error
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-primary focus:ring-primary'
              )}
              aria-describedby={describedByIds.join(' ')}
              aria-invalid={error ? true : false}
              aria-required={required ? true : false}
            />
            <label htmlFor={id} className="text-foreground font-medium">
              {label}
              {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
            </label>
          </div>
        );

      case 'radio':
        return (
          <fieldset className="space-y-2">
            <legend className="font-medium text-foreground">
              {label}
              {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
            </legend>
            {options?.map((option, index) => (
              <div key={option.value} className="flex items-center space-x-3">
                <input
                  type="radio"
                  id={`${id}-${index}`}
                  name={id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  className={cn(
                    'w-4 h-4 border-2 transition-all duration-200',
                    'focus:outline-none focus:ring-4 focus:ring-opacity-20',
                    error
                      ? 'border-destructive focus:ring-destructive'
                      : 'border-primary focus:ring-primary'
                  )}
                  aria-describedby={describedByIds.join(' ')}
                />
                <label htmlFor={`${id}-${index}`} className="text-foreground">
                  {option.label}
                </label>
              </div>
            ))}
          </fieldset>
        );

      default:
        return (
          <input
            {...commonProps}
            type={type}
            placeholder={placeholder}
            pattern={validationPattern}
            minLength={minLength}
            maxLength={maxLength}
            autoComplete={autoComplete}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-2', type === 'radio' ? 'space-y-3' : 'space-y-2')}>
      {type !== 'checkbox' && type !== 'radio' && (
        <label
          htmlFor={id}
          className={cn(
            'font-medium text-foreground',
            error && 'text-destructive',
            isFocused && 'text-primary'
          )}
        >
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-label="required field">
              *
            </span>
          )}
        </label>
      )}

      {description && (
        <div
          id={`${id}-description`}
          className="text-sm text-muted-foreground"
          aria-live="polite"
        >
          {description}
        </div>
      )}

      {renderInput()}

      {error && (
        <div
          id={`${id}-error`}
          className="text-sm text-destructive font-medium flex items-center space-x-2"
          role="alert"
          aria-live="assertive"
        >
          <span aria-hidden="true">⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

interface AccessibleFormProps {
  onSubmit: (data: Record<string, string>) => void;
  fields: AccessibleFormFieldProps[];
  submitText?: string;
  submitting?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// Main accessible form component
const AccessibleForm: React.FC<AccessibleFormProps> = ({
  onSubmit,
  fields,
  submitText = 'Submit',
  submitting = false,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const { announce } = useScreenReaderAnnouncer();
  const { validateForms } = useFormAccessibility();

  // Initialize form data
  useEffect(() => {
    const initialData: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.value !== undefined) {
        initialData[field.id] = field.value;
      }
    });
    setFormData(initialData);
  }, [fields]);

  const validateField = useCallback((field: AccessibleFormFieldProps, value: string): string | null => {
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }

    if (field.minLength && value.length < field.minLength) {
      return `${field.label} must be at least ${field.minLength} characters`;
    }

    if (field.maxLength && value.length > field.maxLength) {
      return `${field.label} must be no more than ${field.maxLength} characters`;
    }

    if (field.type === 'email' && value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (field.type === 'tel' && value) {
      const phonePattern = /^[\d\s\-\+\(\)]+$/;
      if (!phonePattern.test(value)) {
        return 'Please enter a valid phone number';
      }
    }

    return null;
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach((field) => {
      const error = validateField(field, formData[field.id] || '');
      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);

    if (!isValid) {
      const errorCount = Object.keys(newErrors).length;
      announce(`Form has ${errorCount} error${errorCount > 1 ? 's' : ''}`, 'assertive');
    }

    return isValid;
  }, [fields, formData, validateField, announce]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);

    if (validateForm()) {
      announce('Form submitted successfully', 'polite');
      onSubmit(formData);
    }

    setIsValidating(false);
  }, [validateForm, formData, onSubmit, announce]);

  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));

    // Clear error for this field when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  }, [errors]);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-6', className)}
      noValidate
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      <div className="sr-only" aria-live="polite">
        {isValidating && 'Validating form...'}
      </div>

      {fields.map((field) => (
        <AccessibleFormField
          key={field.id}
          {...field}
          value={formData[field.id] || ''}
          onChange={(value) => handleFieldChange(field.id, value)}
          error={errors[field.id]}
        />
      ))}

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span aria-label="Required fields indicator">
            <span className="text-destructive">*</span> Required fields
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting || isValidating}
          className={cn(
            'px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium',
            'transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-20',
            'hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
            submitting || isValidating ? 'animate-pulse' : ''
          )}
          aria-describedby={Object.keys(errors).length > 0 ? 'form-errors' : undefined}
        >
          {submitting ? 'Submitting...' : isValidating ? 'Validating...' : submitText}
        </button>
      </div>

      {Object.keys(errors).length > 0 && (
        <div
          id="form-errors"
          className="text-sm text-destructive font-medium"
          role="alert"
          aria-live="assertive"
        >
          Please correct the errors above before submitting.
        </div>
      )}
    </form>
  );
};

export { AccessibleForm, AccessibleFormField };
export type { AccessibleFormFieldProps, AccessibleFormProps };