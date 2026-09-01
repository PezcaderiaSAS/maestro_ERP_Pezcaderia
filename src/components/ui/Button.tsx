import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  icon,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  fullWidth = false,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95';
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const variants = {
    primary: 'bg-[var(--primary-color)] text-white hover:bg-[var(--primary-hover)] focus:ring-[var(--primary-color)] shadow-md',
    secondary: 'bg-white text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-slate-50 focus:ring-slate-200 shadow-sm',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-slate-100 hover:text-[var(--text-primary)] focus:ring-slate-200',
    outline: 'bg-transparent text-[var(--primary-color)] border border-[var(--primary-color)] hover:bg-[var(--primary-light)] focus:ring-[var(--primary-color)]',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-md'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`;

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && (icon || leftIcon) && (
        <span className="mr-2 flex items-center justify-center">
          {icon || leftIcon}
        </span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="ml-2 flex items-center justify-center">
          {rightIcon}
        </span>
      )}
    </button>
  );
};
