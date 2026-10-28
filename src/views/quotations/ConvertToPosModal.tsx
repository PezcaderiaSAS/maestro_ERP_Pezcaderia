// src/views/quotations/ConvertToPosModal.tsx
// Modal de Conversión Atómica de Cotización B2B a Preventa POS con Reserva Hard-Hold (SPEC-040)

import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  ArrowRight,
  Warehouse,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  UserCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';
import type { B2BQuotation, QuotationToPosConversion } from '../../types/b2bQuotation.types';
import type { Prefactura } from '../../types/prefactura.types';
import { b2bQuotationService } from '../../services/b2bQuotationService';
import { useAuthStore } from '../../store/useAuthStore';
import { PriceTierBadge } from '../pos/components/PriceTierBadge';

interface ConvertToPosModalProps {
  isOpen: boolean;
  onClose: () => void;
  cotizacion: B2BQuotation | null;
  onSuccess: (prefactura: Prefactura) => void;
}

export const ConvertToPosModal: React.FC<ConvertToPosModalProps> = ({
  isOpen,
  onClose,
  cotizacion,
  onSuccess,
}) => {
  const activeTenant = useAuthStore((s) => s.activeTenant);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [bodegaId, setBodegaId] = useState('bodega-principal');
  const [terminalId, setTerminalId] = useState('TERM-01');
  const [tipoPreventa, setTipoPreventa] = useState<QuotationToPosConversion['tipoPreventa']>('MOSTRADOR_B2B');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !cotizacion) return null;

  const tenantId = activeTenant?.id || cotizacion.tenantId;
  const vendedorId = currentUser?.id || cotizacion.asesorUsuarioId || 'usr-vendedor-b2b';
  const vendedorNombre = currentUser?.nombre || 'Asesor B2B';

  const handleConvertir = async () => {
    setIsSubmitting(true);
    try {
      const resultado = await b2bQuotationService.convertirAPreventaPOS({
        cotizacionId: cotizacion.id,
        tenantId,
        bodegaId,
        vendedorId,
        vendedorNombre,
        terminalId,
        tipoPreventa,
      });

      if (!resultado.ok || !resultado.prefactura) {
        await Swal.fire({
          icon: 'error',
          title: 'Error en Conversión',
          text: resultado.error || 'No fue posible convertir la cotización a preventa POS',
          background: '#0F172A',
          color: '#F8FAFC',
          confirmButtonColor: '#EF4444',
        });
        return;
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Preventa Generada en Caja Central!',
        html: `
          <div style="text-align: left; font-size: 0.95rem;">
            <p><strong>Código de Preventa:</strong> <span style="color: #10B981;">${resultado.prefactura.codigoPreventa}</span></p>
            <p><strong>Total Liquidado:</strong> $${resultado.prefactura.total.toLocaleString('es-CO')}</p>
            <p style="margin-top: 8px; color: #94A3B8; font-size: 0.85rem;">
              ✓ Stock reservado con <strong>Hard-Hold</strong> en bodega seleccionada.<br/>
              ✓ Disponible inmediatamente en el <strong>Kanban de Caja Central</strong> para cobro y despacho.
            </p>
          </div>
        `,
        background: '#0F172A',
        color: '#F8FAFC',
        confirmButtonColor: '#10B981',
      });

      onSuccess(resultado.prefactura);
      onClose();
    } catch (err: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Fallo Inesperado',
        text: err.message || 'Error en el motor de preventas',
        background: '#0F172A',
        color: '#F8FAFC',
        confirmButtonColor: '#EF4444',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white tracking-tight">
                Convertir Cotización a Preventa POS
              </h3>
              <p className="text-xs text-slate-400">
                Código: <span className="font-mono text-purple-300 font-bold">{cotizacion.codigoCotizacion}</span> • Cliente: {cotizacion.clienteId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Banner de Reserva de Inventario */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200">
            <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold text-blue-300">Reserva Inmediata (Hard-Hold):</span> Al convertir esta cotización, los ítems quedarán temporalmente bloqueados en la bodega seleccionada para evitar que otros vendedores vendan el mismo stock en mostrador.
            </div>
          </div>

          {/* Resumen de Ítems de la Cotización */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <span>Ítems a Liquidar ({cotizacion.items.length})</span>
              <span>Subtotal</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {cotizacion.items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/5 text-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200">{it.nombre}</span>
                      <PriceTierBadge tarifa={it.tarifaAplicada} />
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      SKU: {it.productoSku} • {it.cantidad} unds × ${it.precioUnitarioPactado.toLocaleString('es-CO')}
                      {it.descuentoPct > 0 && (
                        <span className="text-emerald-400 font-semibold ml-1.5">
                          (-{it.descuentoPct}%)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right font-mono font-semibold text-slate-100">
                    ${it.subtotalItem.toLocaleString('es-CO')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Liquidación */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">Total a Facturar en Caja:</span>
            </div>
            <span className="text-xl font-bold font-mono text-emerald-400">
              ${cotizacion.totalGeneral.toLocaleString('es-CO')}
            </span>
          </div>

          {/* Opciones de Despacho y POS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
                <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                Bodega de Despacho
              </label>
              <select
                value={bodegaId}
                onChange={(e) => setBodegaId(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="bodega-principal">Bodega Central Ferretería</option>
                <option value="bodega-patio">Patio de Materiales Pesados</option>
                <option value="bodega-almacen-2">Almacén Auxiliar de Tornillería</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                Terminal POS de Destino
              </label>
              <select
                value={terminalId}
                onChange={(e) => setTerminalId(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="TERM-01">Caja Mostrador 01 (Cajero Principal)</option>
                <option value="TERM-02">Caja Mostrador 02</option>
                <option value="TERM-B2B-01">Caja Especializada Clientes B2B</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                Modalidad de Preventa
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['MOSTRADOR_B2B', 'CONTRATISTA', 'DESPACHO_PROGRAMADO'] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoPreventa(tipo)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                      tipoPreventa === tipo
                        ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-sm'
                        : 'bg-slate-800/40 border-white/5 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    {tipo.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Acciones */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-slate-800/40">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConvertir}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Procesando...</span>
            ) : (
              <>
                <span>Confirmar y Enviar a Caja Central</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
