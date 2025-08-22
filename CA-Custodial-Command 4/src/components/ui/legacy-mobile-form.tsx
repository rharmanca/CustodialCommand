/**
 * Legacy mobile-optimized form components for Firefox mobile compatibility
 * Uses simplified layouts and larger touch targets
 */
import React from 'react';

interface LegacySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export function LegacySelect({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select an option",
  disabled = false 
}: LegacySelectProps) {
  var selectStyles: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px', // Prevent zoom on iOS
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
    color: disabled ? '#9ca3af' : '#374151',
    minHeight: '44px',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\'><polygon points=\'6,8 0,0 12,0\' style=\'fill:%23666666\'/></svg>")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '12px 8px',
    paddingRight: '40px',
    cursor: disabled ? 'not-allowed' : 'pointer'
  };

  var handleChange = function(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value);
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      style={selectStyles}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(function(option) {
        return (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        );
      })}
    </select>
  );
}

interface LegacyTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

export function LegacyTextarea({ 
  value, 
  onChange, 
  placeholder = "",
  rows = 4,
  disabled = false 
}: LegacyTextareaProps) {
  var textareaStyles: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px', // Prevent zoom on iOS
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
    color: disabled ? '#9ca3af' : '#374151',
    minHeight: '100px',
    resize: 'vertical',
    fontFamily: 'inherit'
  };

  var handleChange = function(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
  };

  return (
    <textarea
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      style={textareaStyles}
    />
  );
}

interface LegacyRatingProps {
  value: number | null;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}

export function LegacyRating({ 
  value, 
  onChange, 
  label,
  disabled = false 
}: LegacyRatingProps) {
  var containerStyles: React.CSSProperties = {
    marginBottom: '16px',
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#ffffff'
  };

  var labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '12px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#374151'
  };

  var ratingContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  };

  var ratingButtonStyles = function(rating: number): React.CSSProperties {
    var isSelected = value === rating;
    return {
      padding: '12px 16px',
      fontSize: '16px',
      fontWeight: '500',
      border: '2px solid ' + (isSelected ? '#3b82f6' : '#d1d5db'),
      borderRadius: '6px',
      backgroundColor: isSelected ? '#3b82f6' : '#ffffff',
      color: isSelected ? '#ffffff' : '#374151',
      cursor: disabled ? 'not-allowed' : 'pointer',
      minWidth: '60px',
      textAlign: 'center' as const,
      transition: 'all 0.2s ease',
      opacity: disabled ? '0.5' : '1'
    };
  };

  var handleRatingClick = function(rating: number) {
    return function() {
      if (!disabled) {
        onChange(rating);
      }
    };
  };

  return (
    <div style={containerStyles}>
      <label style={labelStyles}>{label}</label>
      <div style={ratingContainerStyles}>
        {[1, 2, 3, 4, 5].map(function(rating) {
          return (
            <button
              key={rating}
              type="button"
              onClick={handleRatingClick(rating)}
              style={ratingButtonStyles(rating)}
              disabled={disabled}
            >
              {rating}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface LegacyFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
}

export function LegacyForm({ children, onSubmit }: LegacyFormProps) {
  var formStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '16px'
  };

  var handleSubmit = function(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} style={formStyles}>
      {children}
    </form>
  );
}

interface LegacyFieldGroupProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

export function LegacyFieldGroup({ label, children, required = false }: LegacyFieldGroupProps) {
  var groupStyles: React.CSSProperties = {
    marginBottom: '20px'
  };

  var labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#374151'
  };

  return (
    <div style={groupStyles}>
      <label style={labelStyles}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
      </label>
      {children}
    </div>
  );
}