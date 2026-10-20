/**
 * Vista Táctil de Ejecución de Parada para Conductores
 * Especificación: SPEC-023 (TASK-023-04)
 * Principios: "Regla del Niño de 12 Años", botones >= 48px y >= 56px, WCAG AA+
 */

import React, { useState } from 'react';
import {
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Package,
  PenTool,
  Check,
  AlertCircle
} from 'lucide-react';
import { useDriverDeliveryPwaStore } from '../../../store/useDriverDeliveryPwaStore';
import { DriverSignaturePadCanvas } from './DriverSignaturePadCanvas';
import { DriverPartialReturnModal } from './DriverPartialReturnModal';
import { DriverStopHeaderCard } from './DriverStopHeaderCard';
import { evaluarSemaforoTermico } from '../../../../packages/validation-schemas/src/dockPurchasesReceiving.schema';
import type { DevolucionItemRuta, EstadoFinalParada } from '../../../../packages/validation-schemas/src/driverDeliveryPwa.schema';

export const DriverStopExecutionView: React.FC = () => {
  const { selectedStop, seleccionarParada, ejecutarParada, activeRoute, isLoading } =
    useDriverDeliveryPwaStore();

  // Estados de parada (Hooks al tope del componente)
  const [temperatura, setTemperatura] = useState<number>(3.2);
  const [estadoFinal, setEstadoFinal] = useState<EstadoFinalParada>('ENTREGADO_TOTAL');
  const [nombreReceptor, setNombreReceptor] = useState<string>('');
  const [cedulaReceptor, setCedulaReceptor] = useState<string>('');
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);
  const [mostrarModalFirma, setMostrarModalFirma] = useState<boolean>(false);
  const [mostrarModalDevolucion, setMostrarModalDevolucion] = useState<boolean>(false);

  // Devoluciones parciales
  const [devoluciones, setDevoluciones] = useState<DevolucionItemRuta[]>([]);

  // Forma de pago y recaudo
  const [formaPagoSeleccionada, setFormaPagoSeleccionada] = useState<'CREDITO_B2B' | 'EFECTIVO' | 'TRANSFERENCIA_DIGITAL' | 'MIXTO'>(
    selectedStop?.formaPago || 'EFECTIVO'
  );
  const [montoEfectivo, setMontoEfectivo] = useState<number>(
    selectedStop?.formaPago === 'EFECTIVO' ? (selectedStop.montoPedidoOriginal || 0) : 0
  );
  const [montoDigital, setMontoDigital] = useState<number>(
    selectedStop?.formaPago === 'TRANSFERENCIA_DIGITAL' ? (selectedStop.montoPedidoOriginal || 0) : 0
  );
  const [comprobanteTransferencia, setComprobanteTransferencia] = useState<string>('');

  const cambiarFormaPago = (nueva: 'CREDITO_B2B' | 'EFECTIVO' | 'TRANSFERENCIA_DIGITAL' | 'MIXTO') => {
    setFormaPagoSeleccionada(nueva);
    const total = selectedStop?.montoPedidoOriginal || 0;
    if (nueva === 'CREDITO_B2B') {
      setMontoEfectivo(0);
      setMontoDigital(0);
      setComprobanteTransferencia('');
    } else if (nueva === 'EFECTIVO') {
      setMontoEfectivo(total);
      setMontoDigital(0);
    } else if (nueva === 'TRANSFERENCIA_DIGITAL') {
      setMontoDigital(total);
      setMontoEfectivo(0);
    }
  };

  const [itemsChecklist, setItemsChecklist] = useState<Record<string, boolean>>({});
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  if (!selectedStop || !activeRoute) {
    return null;
  }

  const semaforo = evaluarSemaforoTermico(temperatura, 'FRESCO');

  const toggleCheckItem = (sku: string) => {
    setItemsChecklist((prev) => ({
      ...prev,
      [sku]: !prev[sku]
    }));
  };

  const handleAgregarDevolucion = (dev: DevolucionItemRuta) => {
    setDevoluciones((prev) => [...prev, dev]);
    setEstadoFinal('ENTREGADO_PARCIAL');
  };

  const handleRemoverDevolucion = (index: number) => {
    const actualizadas = devoluciones.filter((_, i) => i !== index);
    setDevoluciones(actualizadas);
    if (actualizadas.length === 0) {
      setEstadoFinal('ENTREGADO_TOTAL');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!nombreReceptor.trim() || nombreReceptor.trim().length < 3) {
      setErrorLocal('El nombre de quien recibe es obligatorio (mínimo 3 caracteres)');
      return;
    }

    if (!cedulaReceptor.trim() || cedulaReceptor.trim().length < 5) {
      setErrorLocal('La cédula de quien recibe es obligatoria (mínimo 5 caracteres)');
      return;
    }

    if (!firmaBase64) {
      setErrorLocal('Debe capturar la firma digital del cliente antes de confirmar');
      setMostrarModalFirma(true);
      return;
    }

    if (estadoFinal === 'ENTREGADO_PARCIAL' && devoluciones.length === 0) {
      setErrorLocal('Al marcar entrega parcial debe registrar al menos un producto devuelto');
      return;
    }

    const res = await ejecutarParada({
      paradaId: selectedStop.id,
      pedidoId: selectedStop.pedidoId,
      manifiestoId: activeRoute.manifiestoId,
      estadoFinal,
      evidencia: {
        nombreReceptor: nombreReceptor.trim(),
        cedulaReceptor: cedulaReceptor.trim(),
        firmaCanvasBase64: firmaBase64,
        temperaturaLlegada: temperatura
      },
      devoluciones,
      montoCobradoEfectivo: formaPagoSeleccionada === 'CREDITO_B2B' ? 0 : montoEfectivo,
      montoCobradoTransferencia: formaPagoSeleccionada === 'CREDITO_B2B' ? 0 : montoDigital,
      comprobanteTransferencia: formaPagoSeleccionada === 'CREDITO_B2B' ? undefined : (comprobanteTransferencia.trim() || undefined),
      formaPagoEfectuada: formaPagoSeleccionada
    });

    if (!res.exito) {
      setErrorLocal(res.mensaje);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 p-3 sm:p-5 pb-12">
      {/* Tarjeta de Cabecera y Acciones Rápidas (Llamar / Waze / Maps) */}
      <DriverStopHeaderCard
        stop={selectedStop}
        onVolver={() => seleccionarParada(null)}
      />

      {/* Semáforo Térmico HACCP de Llegada */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-blue-600" />
            Control Térmico HACCP (°C)
          </label>
          <span
            className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
              semaforo.color === 'emerald'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : semaforo.color === 'amber'
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-rose-100 text-rose-800 border-rose-300'
            }`}
          >
            {semaforo.mensaje}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="number"
            step="0.1"
            value={temperatura}
            onChange={(e) => setTemperatura(parseFloat(e.target.value) || 0)}
            className="w-32 min-h-[48px] bg-slate-50 border border-slate-300 rounded-2xl px-4 text-xl font-mono font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <span className="text-xs text-slate-500 font-medium">
            Temperatura registrada al abrir furgón en el destino.
          </span>
        </div>
      </div>

      {/* Checklist Táctil de Canastillas / Ítems */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <Package className="w-4 h-4 text-blue-600" />
            Verificación de Canastillas
          </label>
          <span className="text-[11px] text-slate-500 font-bold">
            {Object.values(itemsChecklist).filter(Boolean).length} de {selectedStop.items?.length || 0}{' '}
            verificados
          </span>
        </div>

        <div className="space-y-2">
          {selectedStop.items?.map((it) => {
            const isChecked = !!itemsChecklist[it.sku];
            return (
              <div
                key={it.sku}
                onClick={() => toggleCheckItem(it.sku)}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer min-h-[52px] transition-all ${
                  isChecked
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-400 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{it.nombre}</div>
                    <div className="text-[10px] text-slate-500">{it.sku}</div>
                  </div>
                </div>

                <div className="text-right font-mono font-bold text-xs text-slate-800">
                  {it.cantidad} Kg
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón para Devolución Parcial / Mermas */}
        <button
          type="button"
          onClick={() => setMostrarModalDevolucion(true)}
          className="w-full min-h-[48px] rounded-2xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4 text-amber-700" />
          <span>Registrar Devolución / Rechazo Parcial</span>
        </button>

        {/* Listado de Devoluciones Registradas */}
        {devoluciones.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-amber-900 block">
              Mermas y Rechazos Aplicados:
            </span>
            {devoluciones.map((dev, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-xs flex items-center justify-between text-amber-950 font-medium"
              >
                <div>
                  <span className="font-bold">{dev.nombre}: </span>
                  <span>
                    {dev.kilosDevueltos} Kg ({dev.motivoRechazo})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoverDevolucion(idx)}
                  className="text-rose-700 font-bold hover:underline ml-2"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selector de Estado Final */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-4 space-y-3">
        <label className="text-xs font-black text-slate-800 uppercase tracking-wide block">
          Estado Final de la Parada
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'ENTREGADO_TOTAL', label: 'Total', color: 'emerald' },
              { id: 'ENTREGADO_PARCIAL', label: 'Parcial', color: 'amber' },
              { id: 'NO_ENTREGADO_RECHAZADO', label: 'Rechazo', color: 'rose' }
            ] as const
          ).map((opt) => {
            const isSelected = estadoFinal === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setEstadoFinal(opt.id)}
                className={`min-h-[48px] rounded-2xl border text-xs font-black transition-all ${
                  isSelected
                    ? opt.color === 'emerald'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : opt.color === 'amber'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                      : 'bg-rose-600 text-white border-rose-600 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recaudo y Medio de Pago en Terreno */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Medio de Pago y Recaudo en Terreno
          </label>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
            Total: ${selectedStop.montoPedidoOriginal.toLocaleString('es-CO')}
          </span>
        </div>

        {/* Selector Táctil de 4 Formas de Pago */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { id: 'EFECTIVO', label: 'Efectivo', icon: '💵' },
              { id: 'TRANSFERENCIA_DIGITAL', label: 'Transferencia', icon: '📱' },
              { id: 'CREDITO_B2B', label: 'Crédito', icon: '💳' },
              { id: 'MIXTO', label: 'Mixto', icon: '🔀' }
            ] as const
          ).map((m) => {
            const isSelected = formaPagoSeleccionada === m.id;
            return (
              <button
                key={m.id}
                type="button"
                data-testid={`btn-pago-${m.id.toLowerCase()}`}
                onClick={() => cambiarFormaPago(m.id)}
                className={`min-h-[48px] rounded-2xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? m.id === 'CREDITO_B2B'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Panel condicional según la forma de pago */}
        {formaPagoSeleccionada === 'CREDITO_B2B' ? (
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-blue-950">Venta Entregada a Crédito B2B</div>
              <div className="text-[11px] text-blue-800 mt-0.5">
                El cliente recibe la mercancía a satisfacción. El monto se causará en su cuenta por cobrar (cartera) sin exigir recaudo de dinero en efectivo en ruta.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(formaPagoSeleccionada === 'EFECTIVO' || formaPagoSeleccionada === 'MIXTO') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600">
                      Efectivo Físico Recibido
                    </label>
                    <button
                      type="button"
                      onClick={() => setMontoEfectivo(selectedStop.montoPedidoOriginal)}
                      className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Exacto
                    </button>
                  </div>
                  <input
                    type="number"
                    value={montoEfectivo}
                    onChange={(e) => setMontoEfectivo(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[48px] bg-slate-50 border border-slate-300 rounded-2xl px-4 text-base font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              {(formaPagoSeleccionada === 'TRANSFERENCIA_DIGITAL' || formaPagoSeleccionada === 'MIXTO') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600">
                      Monto Transferencia (Nequi / Bancolombia)
                    </label>
                    <button
                      type="button"
                      onClick={() => setMontoDigital(selectedStop.montoPedidoOriginal)}
                      className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Exacto
                    </button>
                  </div>
                  <input
                    type="number"
                    value={montoDigital}
                    onChange={(e) => setMontoDigital(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[48px] bg-slate-50 border border-slate-300 rounded-2xl px-4 text-base font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            {(formaPagoSeleccionada === 'TRANSFERENCIA_DIGITAL' || (formaPagoSeleccionada === 'MIXTO' && montoDigital > 0)) && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  # Comprobante / Referencia de Transferencia *
                </label>
                <input
                  type="text"
                  value={comprobanteTransferencia}
                  onChange={(e) => setComprobanteTransferencia(e.target.value)}
                  placeholder="Ej: NEQUI-78219 o BANCOLOMBIA-4512"
                  className="w-full min-h-[48px] bg-slate-50 border border-slate-300 rounded-2xl px-4 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Datos del Receptor y Firma */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-4 space-y-3">
        <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Datos de Quien Recibe y Firma
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={nombreReceptor}
              onChange={(e) => setNombreReceptor(e.target.value)}
              placeholder="Ej: Carlos Mendoza"
              className="w-full min-h-[48px] bg-slate-50 border border-slate-300 rounded-2xl px-4 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Cédula / Documento *
            </label>
            <input
              type="text"
              value={cedulaReceptor}
              onChange={(e) => setCedulaReceptor(e.target.value)}
              placeholder="Ej: 1098765432"
              className="w-full min-h-[48px] bg-slate-50 border border-slate-300 rounded-2xl px-4 text-xs font-bold text-slate-900 font-mono focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Sección de Firma */}
        <div className="pt-2">
          {firmaBase64 ? (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-black">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Firma Digital Trazada y Capturada</span>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalFirma(true)}
                className="text-xs font-bold text-blue-700 underline cursor-pointer"
              >
                Repetir Firma
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMostrarModalFirma(true)}
              className="w-full min-h-[52px] rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/70 hover:bg-blue-100/70 text-blue-900 font-black text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <PenTool className="w-4 h-4 text-blue-600" />
              <span>TOCAR PARA CAPTURAR FIRMA DIGITAL</span>
            </button>
          )}
        </div>
      </div>

      {errorLocal && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-xs font-black">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorLocal}</span>
        </div>
      )}

      {/* Botón Principal de Confirmación (>= 56px) */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full h-14 min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm tracking-wide shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <CheckCircle2 className="w-5 h-5" />
        <span>CONFIRMAR ENTREGA Y CONTINUAR RUTA →</span>
      </button>

      {/* Modal de Firma Digital Táctil Canvas */}
      {mostrarModalFirma && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-lg">
            <DriverSignaturePadCanvas
              titulo={`Firma: ${selectedStop.clienteNombre}`}
              onFirmaConfirmada={(base64) => {
                setFirmaBase64(base64);
                setMostrarModalFirma(false);
              }}
              onCancelar={() => setMostrarModalFirma(false)}
            />
          </div>
        </div>
      )}

      {/* Modal de Devolución Parcial */}
      {mostrarModalDevolucion && (
        <DriverPartialReturnModal
          items={selectedStop.items || []}
          onAgregarDevolucion={handleAgregarDevolucion}
          onCerrar={() => setMostrarModalDevolucion(false)}
        />
      )}
    </div>
  );
};
