/**
 * ============================================================================
 * LA PEZCADERIA ERP — COMPONENTE: B2BClientHeaderBar
 * ============================================================================
 * Barra superior táctil del Portal B2B HORECA.
 * Permite cambiar de restaurante en modo ERP comercial, seleccionar la sucursal
 * de entrega y acceder directamente al cajón de plantillas y carrito.
 */

import React from 'react';
import { Store, Building2, Repeat, ShoppingCart, ChevronDown } from 'lucide-react';
import type { B2BCustomerProfile } from '../../../../types/b2bCustomerPortal.types';

export interface B2BClientHeaderBarProps {
  clientes: B2BCustomerProfile[];
  clienteActivo: B2BCustomerProfile | null;
  onSeleccionarCliente: (clienteId: string) => void;
  sucursalSeleccionadaId: string;
  onSeleccionarSucursal: (sucursalId: string) => void;
  itemCount: number;
  totalEstimadoCop: number;
  onOpenCart: () => void;
  onOpenTemplates: () => void;
  modoAcceso: 'ERP_COMERCIAL' | 'PORTAL_CLIENTE';
  onToggleModoAcceso?: () => void;
}

export const B2BClientHeaderBar: React.FC<B2BClientHeaderBarProps> = ({
  clientes,
  clienteActivo,
  onSeleccionarCliente,
  sucursalSeleccionadaId,
  onSeleccionarSucursal,
  itemCount,
  totalEstimadoCop,
  onOpenCart,
  onOpenTemplates,
  modoAcceso,
  onToggleModoAcceso,
}) => {
  return (
    <header
      data-testid="b2b-client-header-bar"
      className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Identidad y Selector de Cliente */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Store className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Canal HORECA
              </span>
              {onToggleModoAcceso && (
                <button
                  type="button"
                  onClick={onToggleModoAcceso}
                  className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2"
                  data-testid="btn-toggle-modo-acceso"
                >
                  {modoAcceso === 'ERP_COMERCIAL' ? 'Vista Comercial' : 'Vista Restaurante'}
                </button>
              )}
            </div>

            {modoAcceso === 'ERP_COMERCIAL' ? (
              <div className="relative mt-1">
                <select
                  data-testid="select-cliente-horeca"
                  value={clienteActivo?.id || ''}
                  onChange={(e) => onSeleccionarCliente(e.target.value)}
                  className="w-full text-base font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg py-1.5 pl-2.5 pr-8 focus:ring-2 focus:ring-blue-500 focus:outline-hidden appearance-none cursor-pointer"
                  aria-label="Seleccionar cliente HORECA"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razonSocial} (NIT: {c.nit}) — Tarifa {c.tipoPrecio}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <h1 className="text-lg font-bold text-slate-900 truncate">
                {clienteActivo?.razonSocial || 'Cliente HORECA'}
              </h1>
            )}
          </div>
        </div>

        {/* Selector de Sucursal y Acciones */}
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {/* Selector de Sucursal de Entrega */}
          {clienteActivo && clienteActivo.sucursales.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
              <label htmlFor="select-sucursal-entrega" className="font-medium text-slate-600">Sede:</label>
              <select
                id="select-sucursal-entrega"
                data-testid="select-sucursal-entrega"
                value={sucursalSeleccionadaId}
                onChange={(e) => onSeleccionarSucursal(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 focus:outline-hidden cursor-pointer"
              >
                {clienteActivo.sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.ciudad})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botón de Plantillas Recurrentes */}
          <button
            type="button"
            data-testid="btn-open-recurring-templates"
            onClick={onOpenTemplates}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-sm transition-colors border border-slate-300 focus:ring-2 focus:ring-slate-400 focus:outline-hidden cursor-pointer"
          >
            <Repeat className="w-4 h-4 text-blue-600" />
            <span>Plantillas Semanales</span>
          </button>

          {/* Botón Táctil de Carrito */}
          <button
            type="button"
            data-testid="btn-open-cart-drawer"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-sm transition-colors focus:ring-2 focus:ring-emerald-400 focus:outline-hidden cursor-pointer"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span
                  data-testid="cart-badge-count"
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                >
                  {itemCount}
                </span>
              )}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-[10px] uppercase font-bold text-emerald-100 tracking-wider">
                Total Carrito
              </span>
              <span className="text-sm font-black">
                ${totalEstimadoCop.toLocaleString('es-CO')}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
