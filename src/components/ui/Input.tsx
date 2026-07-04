import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      error = false,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    // Clases base modernas y limpias integrando tokens del Design System
    const baseContainerClasses = 'flex items-center rounded-xl border bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200';
    const activeClasses = 'focus-within:ring-2 focus-within:ring-[var(--primary-color)]/20 focus-within:border-[var(--primary-color)] outline-none';
    const disabledClasses = 'disabled:cursor-not-allowed disabled:opacity-50 bg-slate-50';
    
    const errorClasses = error 
      ? 'border-red-500 focus-within:ring-red-500/20 focus-within:border-red-500' 
      : 'border-slate-200';
      
    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <div className={`flex flex-col gap-1.5 ${widthClass}`}>
        <div 
          className={`${baseContainerClasses} ${activeClasses} ${errorClasses} ${disabled ? disabledClasses : ''} ${className}`}
        >
          {leftIcon && (
            <div className="mr-2 flex items-center justify-center text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            className="w-full bg-transparent p-0 border-none focus:ring-0 outline-none text-[var(--text-primary)] placeholder:text-slate-400"
            {...props}
          />
          {rightIcon && (
            <div className="ml-2 flex items-center justify-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {helperText && (
          <span className={`text-xs ${error ? 'text-red-500' : 'text-slate-500'}`}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
