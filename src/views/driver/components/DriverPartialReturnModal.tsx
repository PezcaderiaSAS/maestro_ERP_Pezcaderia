/**
 * Modal Táctil para Devoluciones Parciales y Mermas de Ruta
 * Destino Canónico: CUARENTENA_CALIDAD
 * Especificación: SPEC-023 (TASK-023-04)
 */

import React, { useState } from 'react';
import { ShieldAlert, X, Check, AlertCircle } from 'lucide-react';
import type { DriverItemCanastilla } from '../../../types/driverDeliveryPwa.types';
import type { DevolucionItemRuta } from '../../../../packages/validation-schemas/src/driverDeliveryPwa.schema';
import type { MotivoRechazoRuta } from '../../../../packages/validation-schemas/src/deliveryRoute.schema';

interface DriverPartialReturnModalProps {
  items: DriverItemCanastilla[];
  onAgregarDevolucion: (devolucion: DevolucionItemRuta) => void;
  onCerrar: () => void;
}

const MOTIVOS_RECHAZO: Array<{ id: MotivoRechazoRuta; label: string; desc: string }> = [
  { id: 'EMPAQUE_AVERIADO', label: 'Empaque Averiado', desc: 'Bolsa al vacío o sello roto' },
  { id: 'CADENA_FRIO', label: 'Cadena de Frío', desc: 'Temperatura inadecuada al arribo' },
  { id: 'CALIBRE_INCORRECTO', label: 'Calibre Incorrecto', desc: 'Talla no coincide con lo ordenado' },
  { id: 'PRODUCTO_EQUIVOCADO', label: 'Producto Equivocado', desc: 'No corresponde a la remisión' },
  { id: 'CLIENTE_CERRADO', label: 'Cliente Cerrado', desc: 'Horario comercial concluido' },
  { id: 'SIN_DINERO', label: 'Sin Dinero / Pago', desc: 'Cliente no cuenta con fondos' },
  { id: 'OTRO', label: 'Otro Motivo', desc: 'Especificar en observaciones' }
];

export const DriverPartialReturnModal: React.FC<DriverPartialReturnModalProps> = ({
  items,
  onAgregarDevolucion,
  onCerrar
}) => {
  const [skuSeleccionado, setSkuSeleccionado] = useState<string>(items[0]?.sku || '');
  const [kilosDevueltos, setKilosDevueltos] = useState<number>(1.0);
  const [motivoRechazo, setMotivoRechazo] = useState<MotivoRechazoRuta>('EMPAQUE_AVERIADO');
  const [observaciones, setObservaciones] = useState<string>('');
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const itemActual = items.find((it) => it.sku === skuSeleccionado) || items[0];

  const handleConfirmar = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!itemActual) {
      setErrorValidacion('Debe seleccionar un producto válido');
      return;
    }

    if (kilosDevueltos <= 0 || isNaN(kilosDevueltos)) {
      setErrorValidacion('Los kilos devueltos deben ser mayores a 0');
      return;
    }

    onAgregarDevolucion({
      sku: itemActual.sku,
      nombre: itemActual.nombre,
      kilosDevueltos: Number(kilosDevueltos.toFixed(2)),
      motivoRechazo,
      observaciones: observaciones.trim() || undefined
    });

    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Registrar Devolución / Rechazo
              </h3>
              <p className="text-[11px] text-amber-800 font-bold">
                Destino: CUARENTENA_CALIDAD
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center min-h-[44px] min-w-[44px]"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmar} className="space-y-4">
          {/* Selección de Producto */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Producto Rechazado
            </label>
            <select
              value={skuSeleccionado}
              onChange={(e) => setSkuSeleccionado(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 min-h-[48px] text-sm text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              {items.map((it) => (
                <option key={it.sku} value={it.sku}>
                  {it.nombre} ({it.cantidad} Kg facturados)
                </option>
              ))}
            </select>
          </div>

          {/* Kilos a devolver */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Kilos Devueltos / Rechazados *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={kilosDevueltos}
                onChange={(e) => setKilosDevueltos(parseFloat(e.target.value) || 0)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 min-h-[48px] text-lg font-black text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                Kg
              </span>
            </div>
          </div>

          {/* Motivo del Rechazo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Motivo del Rechazo Sanitario / Comercial
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MOTIVOS_RECHAZO.map((m) => {
                const isSelected = motivoRechazo === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMotivoRechazo(m.id)}
                    className={`p-2.5 rounded-2xl border text-left flex items-start gap-2 transition-all min-h-[48px] ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">{m.label}</div>
                      <div className="text-[10px] text-slate-500">{m.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observaciones opcionales */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Observaciones del Conductor (Opcional)
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalle el estado del producto o indicaciones del cliente..."
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {errorValidacion && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="min-h-[48px] rounded-2xl border border-slate-300 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-14 min-h-[56px] rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs tracking-wide shadow-lg shadow-amber-600/30 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>AGREGAR DEVOLUCIÓN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
