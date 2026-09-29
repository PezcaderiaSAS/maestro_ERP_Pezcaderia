import React from 'react';

export type DenseBadgeVariant = 'emerald' | 'amber' | 'sky' | 'rose' | 'zinc' | 'purple';

interface DenseBadgeProps {
  label: string;
  variant?: DenseBadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

const variantStyles: Record<DenseBadgeVariant, string> = {
  emerald: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50',
  amber: 'bg-amber-950/60 text-amber-400 border-amber-800/50',
  sky: 'bg-sky-950/60 text-sky-400 border-sky-800/50',
  rose: 'bg-rose-950/60 text-rose-400 border-rose-800/50',
  zinc: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60',
  purple: 'bg-purple-950/60 text-purple-400 border-purple-800/50',
};

export const DenseBadge: React.FC<DenseBadgeProps> = ({
  label,
  variant = 'zinc',
  className = '',
  icon,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium tracking-tight rounded-sm border uppercase ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="w-3 h-3 flex items-center justify-center">{icon}</span>}
      <span>{label}</span>
    </span>
  );
};
