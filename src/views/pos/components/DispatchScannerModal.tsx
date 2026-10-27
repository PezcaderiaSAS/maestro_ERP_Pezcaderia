// src/views/pos/components/DispatchScannerModal.tsx
// Modal de Despacho Físico Verificado y Bandeja Reactiva para Asesores Comerciales (SPEC-037)

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  QrCode,
  CheckCircle2,
  PackageCheck,
  AlertCircle,
  X,
  Search,
  Receipt,
  User,
  ShoppingBag,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { Prefactura } from '../../../types/prefactura.types';
import { prefacturaService } from '../../../services/prefacturaService';
import { useAuthStore } from '../../../store/useAuthStore';

interface DispatchScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId?: string;
  asesorId?: string;
}

export const DispatchScannerModal: React.FC<DispatchScannerModalProps> = ({
  isOpen,
  onClose,
  tenantId: propTenantId,
  asesorId: propAsesorId,
}) => {
  const activeTenant = useAuthStore((s) => s.activeTenant);
  const currentUser = useAuthStore((s) => s.currentUser);

  const tenantId = propTenantId || activeTenant?.id || 'ten-default';
  const asesorId = propAsesorId || currentUser?.id || 'usr-asesor-default';

  const [ordenesPagadas, setOrdenesPagadas] = useState<Prefactura[]>([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Prefactura | null>(null);
  const [codigoInput, setCodigoInput] = useState<string>('');
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const inputScannerRef = useRef<HTMLInputElement>(null);

  // Carga reactiva de órdenes pagadas listas para despacho
  const refrescarOrdenes = () => {
    const list = prefacturaService.obtenerPrefacturasPorTenant(tenantId, 'PAGADA');
    setOrdenesPagadas(list);
  };

  useEffect(() => {
    if (!isOpen) return;

    refrescarOrdenes();
    setCodigoInput('');
    setMensajeError(null);
    setMensajeExito(null);

    const interval = setInterval(refrescarOrdenes, 3000);
    return () => clearInterval(interval);
  }, [isOpen, tenantId]);

  // Autofocus en el input del escáner al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputScannerRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Manejo de búsqueda por escáner de código QR o ID
  const handleProcesarEscaneo = () => {
    const query = codigoInput.trim();
    if (!query) return;

    setMensajeError(null);
    setMensajeExito(null);

    const encontrada = prefacturaService.buscarPorCodigo(tenantId, query);

    if (!encontrada) {
      setMensajeError(`No se encontró ninguna orden con código o ticket: "${query}"`);
      return;
    }

    if (encontrada.estado !== 'PAGADA') {
      if (encontrada.estado === 'PENDIENTE_COBRO' || encontrada.estado === 'EN_COBRO') {
        setMensajeError(
          `La orden ${encontrada.codigoPreventa} está Pendiente de Pago en Caja. El cliente debe pagar primero en ventanilla.`
        );
      } else if (encontrada.estado === 'DESPACHADA') {
        setMensajeError(`La orden ${encontrada.codigoPreventa} ya fue despachada con anterioridad.`);
      } else {
        setMensajeError(`La orden está en estado ${encontrada.estado}. No se puede despachar.`);
      }
      setOrdenSeleccionada(null);
      return;
    }

    setOrdenSeleccionada(encontrada);
    setMensajeExito(`Orden verificada exitosamente. Factura: ${encontrada.facturaId || 'OK'}`);
  };

  // Manejo del evento teclado en input de escáner
  const handleKeyDownScanner = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleProcesarEscaneo();
    }
  };

  // Confirmar despacho físico (1-clic)
  const handleConfirmarDespacho = async () => {
    if (!ordenSeleccionada) return;

    setIsLoading(true);
    setMensajeError(null);

    const res = await prefacturaService.registrarDespacho({
      tenantId,
      prefacturaId: ordenSeleccionada.id,
      asesorId,
      metodoVerificacion: codigoInput ? 'QR_SCAN' : 'BANDEJA_TACTIL',
      codigoEscaneado: codigoInput || undefined,
    });

    setIsLoading(false);

    if (res.ok) {
      setMensajeExito(`¡Mercancía despachada correctamente! Orden: ${ordenSeleccionada.codigoPreventa}`);
      setOrdenSeleccionada(null);
      setCodigoInput('');
      refrescarOrdenes();
      setTimeout(() => {
        setMensajeExito(null);
      }, 3500);
    } else {
      setMensajeError(res.error || 'Error al registrar el despacho');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 select-none">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-white/15 rounded-3xl shadow-2xl shadow-black flex flex-col overflow-hidden">
        {/* 1. Header del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
              <PackageCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Despacho Físico Verificado
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Listo para Entrega ({ordenesPagadas.length})
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Verificación de factura de caja y entrega de mercancía al cliente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Barra de Escaneo Rápido (Lector QR / Código Barras) */}
        <div className="p-4 bg-white/5 border-b border-white/10 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <QrCode size={18} className="text-emerald-400" />
              </div>
              <input
                ref={inputScannerRef}
                data-testid="input-qr-scanner"
                type="text"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value)}
                onKeyDown={handleKeyDownScanner}
                placeholder="Escanear QR de factura o ingresar código (ej. PRE-2026-XXXX o FAC-...)"
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-800 border border-white/15 text-white placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <button
              onClick={handleProcesarEscaneo}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Search size={14} />
              <span>Verificar</span>
            </button>
          </div>

          {/* Feedback de error o éxito */}
          {mensajeError && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{mensajeError}</span>
            </div>
          )}

          {mensajeExito && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
              <span>{mensajeExito}</span>
            </div>
          )}
        </div>

        {/* 3. Cuerpo Dividido: Bandeja Táctil (Izquierda) vs Resumen de Entrega (Derecha) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 min-h-0 overflow-y-auto custom-scrollbar">
          {/* Columna Izquierda: Bandeja de Órdenes Pagadas */}
          <div className="flex flex-col min-h-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Clock size={13} className="text-emerald-400" /> Compras Pagadas Pendientes de Entrega
            </span>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {ordenesPagadas.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-white/10 rounded-2xl p-4 text-center">
                  <CheckCircle2 size={24} className="text-slate-600 mb-1" />
                  <span>No hay compras pendientes por entregar.</span>
                  <span className="text-[11px] text-slate-600 mt-0.5">
                    Las compras pagadas en caja aparecerán automáticamente aquí.
                  </span>
                </div>
              ) : (
                ordenesPagadas.map((pref) => {
                  const isSelected = ordenSeleccionada?.id === pref.id;
                  return (
                    <div
                      key={pref.id}
                      data-testid={`card-despacho-${pref.id}`}
                      onClick={() => {
                        setOrdenSeleccionada(pref);
                        setMensajeError(null);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600/20 border-emerald-500 shadow-lg shadow-emerald-500/10'
                          : 'bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Listo para Entrega
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-400">
                          {pref.facturaId || 'FAC-OK'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white truncate">
                        {pref.clienteNombre || 'Consumidor Final'}
                      </h4>

                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="font-mono text-slate-400 text-[11px]">
                          {pref.codigoPreventa}
                        </span>
                        <span className="font-black text-white">
                          ${pref.total.toLocaleString('es-CO')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <ShoppingBag size={11} /> {pref.items.length} artículos
                        </span>
                        <span>Asesor: {pref.vendedorNombre}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Columna Derecha: Detalle de la Orden Seleccionada y Confirmación */}
          <div className="flex flex-col bg-white/5 border border-white/10 rounded-2xl p-4 min-h-0">
            {ordenSeleccionada ? (
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                        Detalle de Mercancía
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        {ordenSeleccionada.clienteNombre || 'Consumidor Final'}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {ordenSeleccionada.codigoPreventa}
                    </span>
                  </div>

                  {/* Factura emitida */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-3 text-xs text-emerald-300">
                    <Receipt size={14} className="shrink-0" />
                    <span>Factura Oficial: <strong>{ordenSeleccionada.facturaId}</strong></span>
                  </div>

                  {/* Lista de Artículos a Despachar */}
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Artículos para Entrega Física:
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar mb-3">
                    {ordenSeleccionada.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-white/5 text-xs"
                      >
                        <div className="truncate pr-2">
                          <span className="font-bold text-white block truncate">{item.nombre}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Cant: {item.cantidad} · ${item.precioFinal.toLocaleString('es-CO')} c/u
                          </span>
                        </div>
                        <span className="font-bold text-slate-200 shrink-0">
                          ${item.subtotal.toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botón de Confirmación de Despacho */}
                <div className="pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-slate-400">Total Liquidado en Caja:</span>
                    <span className="text-lg font-black text-emerald-400">
                      ${ordenSeleccionada.total.toLocaleString('es-CO')}
                    </span>
                  </div>

                  <button
                    data-testid="btn-confirmar-despacho"
                    disabled={isLoading}
                    onClick={handleConfirmarDespacho}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <PackageCheck size={16} />
                    <span>Confirmar Entrega Física de Mercancía</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-6 border border-dashed border-white/10 rounded-xl">
                <PackageCheck size={32} className="text-slate-600 mb-2" />
                <span className="font-bold text-slate-400 mb-1">
                  Ninguna orden seleccionada
                </span>
                <p className="text-slate-500 text-[11px] max-w-xs">
                  Selecciona una compra de la bandeja izquierda o escanea el código QR de la factura del cliente para proceder con la entrega.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
