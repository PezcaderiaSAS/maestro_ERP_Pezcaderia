import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  glass = true,
  ...props 
}) => {
  const baseClasses = 'rounded-xl overflow-hidden transition-all duration-300';
  // If glass is true, we apply the global utility .glass-panel created in index.css
  const themeClasses = glass ? 'glass-panel' : 'bg-white shadow-md border border-[var(--border-color)]';
  
  return (
    <div className={`${baseClasses} ${themeClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};
