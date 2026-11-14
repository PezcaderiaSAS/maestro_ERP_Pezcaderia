import React from 'react';
import {
  Banknote,
  CreditCard,
  Smartphone,
  Calendar,
  Layers,
} from 'lucide-react';
import type { MetodoCobroPos } from './payment.types';

export interface PaymentMethodTabsProps {
  metodoActivo: MetodoCobroPos;
  onSelectMetodo: (metodo: MetodoCobroPos) => void;
}

interface MethodTabConfig {
  id: MetodoCobroPos;
  label: string;
  keyShortcut: string;
  icon: React.ComponentType<{ className?: string }>;
}

const METHODS: MethodTabConfig[] = [
  { id: 'EFECTIVO', label: 'Efectivo', keyShortcut: '1', icon: Banknote },
  { id: 'DATAFONO', label: 'Datáfono', keyShortcut: '2', icon: CreditCard },
  { id: 'TRANSFERENCIA', label: 'QR / Transf.', keyShortcut: '3', icon: Smartphone },
  { id: 'CREDITO', label: 'Crédito', keyShortcut: '4', icon: Calendar },
  { id: 'MIXTO', label: 'Mixto', keyShortcut: '5', icon: Layers },
];

export const PaymentMethodTabs: React.FC<PaymentMethodTabsProps> = ({
  metodoActivo,
  onSelectMetodo,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Métodos de pago disponibles"
      className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-slate-950/60 rounded-xl border border-white/5"
    >
      {METHODS.map((tab) => {
        const Icon = tab.icon;
        const isActive = metodoActivo === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            onClick={() => onSelectMetodo(tab.id)}
            type="button"
            className={`flex items-center justify-between sm:justify-center gap-2 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 min-h-[48px] select-none ${
              isActive
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-sm shadow-cyan-950/50 ring-1 ring-cyan-500/40'
                : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </div>
            <span
              className={`hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                isActive
                  ? 'bg-cyan-500/30 text-cyan-200'
                  : 'bg-white/5 text-slate-500'
              }`}
            >
              {tab.keyShortcut}
            </span>
          </button>
        );
      })}
    </div>
  );
};

