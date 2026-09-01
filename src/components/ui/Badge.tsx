import React, { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'A' | 'B' | 'C' | 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm';
  
  const variants = {
    'A': 'bg-[var(--color-emerald-a,var(--success-color))] text-white border border-emerald-400',
    'B': 'bg-[var(--color-cyan-wave,var(--accent-color))] text-white border border-cyan-400',
    'C': 'bg-[var(--color-slate-b,var(--text-secondary))] text-white border border-slate-400',
    'success': 'bg-[var(--success-color)] text-white border border-[var(--success-color)]',
    'warning': 'bg-[#F59E0B] text-white border border-[#F59E0B]',
    'danger': 'bg-[var(--danger-color)] text-white border border-[var(--danger-color)]',
    'primary': 'bg-[var(--primary-color)] text-white border border-[var(--primary-color)]',
    'outline': 'bg-transparent text-[var(--text-secondary)] border border-[var(--border-color)]',
    'default': 'bg-gray-100 text-gray-800 border border-gray-200'
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
