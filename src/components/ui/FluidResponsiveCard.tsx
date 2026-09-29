import React from 'react';

interface FluidResponsiveCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const FluidResponsiveCard: React.FC<FluidResponsiveCardProps> = ({
  title,
  subtitle,
  badge,
  rightAction,
  children,
  className = '',
}) => {
  return (
    <div
      className={`@container w-full p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-sm shadow-sm space-y-2 text-xs transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 pb-1.5">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-semibold text-zinc-200 truncate text-balance">{title}</span>
          {badge}
        </div>
        {rightAction && <div className="shrink-0">{rightAction}</div>}
      </div>
      {subtitle && <p className="text-[11px] text-zinc-400 text-pretty">{subtitle}</p>}
      <div className="pt-0.5">{children}</div>
    </div>
  );
};

