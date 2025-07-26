/**
 * Legacy mobile-optimized card component for older browsers
 * Uses table layout and inline styles for maximum compatibility
 */
import React from 'react';

interface LegacyMobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function LegacyMobileCard({ children, className = "", onClick }: LegacyMobileCardProps) {
  var baseStyles = {
    display: 'table',
    width: '100%',
    padding: '16px',
    marginBottom: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cursor: onClick ? 'pointer' : 'default',
    WebkitTapHighlightColor: 'rgba(0, 0, 0, 0.1)',
    minHeight: '60px'
  };

  var handleClick = function() {
    if (onClick) {
      onClick();
    }
  };

  var handleTouch = function(e: any) {
    // Add visual feedback for touch
    e.currentTarget.style.backgroundColor = '#f3f4f6';
    setTimeout(function() {
      if (e.currentTarget) {
        e.currentTarget.style.backgroundColor = '#ffffff';
      }
    }, 150);
  };

  return (
    <div
      className={className}
      style={baseStyles}
      onClick={handleClick}
      onTouchStart={handleTouch}
    >
      <div style={{ display: 'table-cell', verticalAlign: 'middle' }}>
        {children}
      </div>
    </div>
  );
}

interface LegacyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function LegacyButton({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  size = 'md'
}: LegacyButtonProps) {
  var sizeStyles = {
    sm: { padding: '8px 16px', fontSize: '14px', minHeight: '36px' },
    md: { padding: '12px 24px', fontSize: '16px', minHeight: '44px' },
    lg: { padding: '16px 32px', fontSize: '18px', minHeight: '52px' }
  };

  var variantStyles = {
    primary: {
      backgroundColor: disabled ? '#9ca3af' : '#3b82f6',
      color: '#ffffff',
      border: 'none'
    },
    secondary: {
      backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
      color: disabled ? '#9ca3af' : '#374151',
      border: '1px solid #d1d5db'
    }
  };

  var baseStyles: React.CSSProperties = {
    display: 'inline-block',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: '500',
    textAlign: 'center',
    textDecoration: 'none',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.2s ease',
    ...sizeStyles[size],
    ...variantStyles[variant]
  };

  var handleClick = function() {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      style={baseStyles}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

interface LegacyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}

export function LegacyInput({ 
  value, 
  onChange, 
  placeholder = "", 
  type = "text",
  disabled = false 
}: LegacyInputProps) {
  var baseStyles = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px', // Prevent zoom on iOS
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
    color: disabled ? '#9ca3af' : '#374151',
    minHeight: '44px',
    boxSizing: 'border-box' as const
  };

  var handleChange = function(e: any) {
    onChange(e.target.value);
  };

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      style={baseStyles}
    />
  );
}