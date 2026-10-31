import React from 'react';
import { Loader2 } from 'lucide-react';

export type PosButtonVariant = 'primary' | 'secondary' | 'danger' | 'action' | 'ghost';
export type PosButtonSize = 'compact' | 'touch' | 'large';

export interface PosButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PosButtonVariant;
  size?: PosButtonSize;
  shortcutBadge?: string;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<PosButtonVariant, string> = {
  primary: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 focus:ring-emerald-500/50 border border-emerald-400/30 font-bold',
  secondary: 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/60 focus:ring-slate-500/50 backdrop-blur-sm',
  danger: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 focus:ring-rose-500/50',
  action: 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 focus:ring-cyan-500/50',
  ghost: 'bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border border-transparent',
};

const sizeStyles: Record<PosButtonSize, string> = {
  compact: 'min-h-[38px] px-3 py-1.5 text-xs gap-1.5',
  touch: 'min-h-[48px] min-w-[48px] px-4 py-2.5 text-sm gap-2',
  large: 'min-h-[54px] px-6 py-3 text-base gap-3',
};

export const PosButton: React.FC<PosButtonProps> = ({
  children,
  variant = 'primary',
  size = 'touch',
  shortcutBadge,
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl select-none transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const isInteractiveDisabled = disabled || isLoading;

  return (
    <button
      type={props.type || 'button'}
      disabled={isInteractiveDisabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-current" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>
      )}

      {children && <span className="truncate">{children}</span>}

      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0 items-center">{rightIcon}</span>
      )}

      {!isLoading && shortcutBadge && (
        <kbd className="ml-1.5 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-black/40 border border-white/10 text-slate-300 shadow-inner">
          {shortcutBadge}
        </kbd>
      )}
    </button>
  );
};
