import React from 'react';

interface DenseTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  isActive?: boolean;
}

export const DenseTableRow: React.FC<DenseTableRowProps> = ({
  children,
  className = '',
  isActive = false,
  ...props
}) => {
  return (
    <tr
      className={`h-7 sm:h-8 border-b border-zinc-800/80 text-xs transition-colors group select-none ${
        isActive ? 'bg-zinc-800/60' : 'hover:bg-zinc-850/50'
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};
