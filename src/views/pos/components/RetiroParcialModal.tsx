import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { NumericFormat } from 'react-number-format';
import {
  ShieldAlert,
  ArrowDownCircle,
  X,
  CheckCircle,
  FileText,
  DollarSign,
  UserCheck,
  Building2,
  Printer
} from 'lucide-react';
import Swal from 'sweetalert2';
import { posCashEngineService } from '../../../services/posCashEngineService';
import { useCashStore } from '../../../store/useCashStore';

export interface RetiroParcialModalProps {
  turnoId: string;
  cajeroNombre: string;
  saldoEfectivoGaveta: number;
  topeMaximoGaveta?: number;
  onClose: () => void;
  onSuccess: (resultado: {
    comprobante_retiro: string;
    monto_retirado: number;
    nuevo_saldo_gaveta: number;
  }) => void;
}

const MOTIVOS_RETIRO = [
  { id: 'TRASLADO_CAJA_PRINCIPAL', label: 'Alivio por Tope de Gaveta (Caja Mayor / Bóveda)' },
  { id: 'PAGO_PROVEEDOR_URGENTE', label: 'Pago a Proveedor en Mostrador' },
  { id: 'GASTO_MENOR', label: 'Gasto Menor / Suministros' },
  { id: 'OTRO', label: 'Otro Concepto Justificado' },
];

export const RetiroParcialModal: React.FC<RetiroParcialModalProps> = ({
  turnoId,
  cajeroNombre,
  saldoEfectivoGaveta,
  topeMaximoGaveta = 1500000,
  onClose,
  onSuccess,
}) => {
  const [monto, setMonto] = useState<number>(0);
  const [motivo, setMotivo] = useState<string>('TRASLADO_CAJA_PRINCIPAL');
  const [supervisorNombre, setSupervisorNombre] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [comprobanteGenerado, setComprobanteGenerado] = useState<any | null>(null);

  // Excedente calculado para dejar base prudencial de $300.000 COP
  const baseSugerida = 300000;
  const excedenteSugerido = Math.max(0, saldoEfectivoGaveta - baseSugerida);

  const saldoRestante = Math.max(0, saldoEfectivoGaveta - monto);
  const excedeSaldo = monto > saldoEfectivoGaveta;
  const dejaSinBase = monto > 0 && saldoRestante < 50000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (monto <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto inválido',
        text: 'Ingrese un monto mayor a cero para efectuar el retiro.',
      });
      return;
    }

    if (excedeSaldo) {
      Swal.fire({
        icon: 'error',
        title: 'Fondos insuficientes en gaveta',
        text: `El monto a retirar ($${monto.toLocaleString('es-CO')}) supera el efectivo físico registrado ($${saldoEfectivoGaveta.toLocaleString('es-CO')}).`,
      });
      return;
    }

    if (!supervisorNombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta Supervisor',
        text: 'Debe ingresar el nombre del supervisor o administrador que autoriza y recibe el dinero.',
      });
      return;
    }

    const confirmar = await Swal.fire({
      title: '¿Confirmar Alivio de Caja?',
      html: `
        <div class="text-left text-sm space-y-2">
          <p><strong>Monto a Retirar:</strong> <span class="text-amber-500 font-bold">$${monto.toLocaleString('es-CO')}</span></p>
          <p><strong>Nuevo Saldo en Gaveta:</strong> <span class="text-emerald-400 font-bold">$${saldoRestante.toLocaleString('es-CO')}</span></p>
          <p><strong>Motivo:</strong> ${motivo}</p>
          <p><strong>Recibe / Autoriza:</strong> ${supervisorNombre}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar retiro',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d97706',
    });

    if (!confirmar.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const descripcionFinal = observaciones.trim()
        ? `[${motivo}] ${observaciones.trim()}`
        : `[${motivo}] Alivio de caja autorizado por ${supervisorNombre}`;

      const res = await posCashEngineService.registrarRetiroParcial({
        turno_id: turnoId,
        monto_retiro: monto,
        motivo: descripcionFinal,
        cajero_nombre: cajeroNombre || 'Cajero de Turno',
        supervisor_nombre: supervisorNombre.trim(),
      });

      setComprobanteGenerado({
        ...res,
        fecha: new Date().toLocaleString('es-CO'),
        motivo,
        cajero_nombre: cajeroNombre,
        supervisor_nombre: supervisorNombre,
      });

      Swal.fire({
        icon: 'success',
        title: '¡Retiro Registrado!',
        text: `Comprobante ${res.comprobante_retiro} generado con éxito.`,
        timer: 2500,
        showConfirmButton: false,
      });

      onSuccess(res);
    } catch (err: any) {
      console.error('Error registrando retiro parcial:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error al registrar retiro',
        text: err?.message || 'Ocurrió un error inesperado al conectar con el servidor.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 isolate flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-slate-900 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ArrowDownCircle size={26} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Alivio de Caja (Drop)
                <span className="text-xs uppercase px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Retiro Parcial
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Evacúe el exceso de efectivo hacia la caja de seguridad o bóveda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-card border-white/5/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {comprobanteGenerado ? (
            /* Vista de Comprobante Exitoso */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle size={36} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Comprobante Generado</h3>
                <p className="text-amber-400 font-mono font-bold text-lg">
                  {comprobanteGenerado.comprobante_retiro}
                </p>
                <p className="text-xs text-slate-400 mt-1">{comprobanteGenerado.fecha}</p>
              </div>

              <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Monto Retirado:</span>
                  <span className="text-amber-400 font-bold font-mono">
                    ${comprobanteGenerado.monto_retirado?.toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nuevo Saldo en Gaveta:</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    ${comprobanteGenerado.nuevo_saldo_gaveta?.toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2">
                  <span className="text-slate-400">Entregó (Cajero):</span>
                  <span className="text-white font-medium">{comprobanteGenerado.cajero_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recibió (Supervisor):</span>
                  <span className="text-white font-medium">{comprobanteGenerado.supervisor_nombre}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrintVoucher}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2 border border-white/10 transition-all"
                >
                  <Printer size={18} />
                  Imprimir Comprobante
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-900/30"
                >
                  Continuar Vendiendo
                </button>
              </div>
            </div>
          ) : (
            /* Formulario de Retiro */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Resumen de Gaveta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10">
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
                    Efectivo Actual en Gaveta
                  </span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    ${saldoEfectivoGaveta.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Tope máx sugerido: ${topeMaximoGaveta.toLocaleString('es-CO')}
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border transition-all ${
                  excedeSaldo
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-slate-950/60 border-white/10 text-slate-300'
                }`}>
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
                    Saldo Restante Estimado
                  </span>
                  <span className="text-2xl font-black font-mono">
                    ${saldoRestante.toLocaleString('es-CO')}
                  </span>
                  {dejaSinBase && !excedeSaldo && (
                    <span className="text-[10px] text-amber-400 block mt-0.5 font-medium">
                      ⚠️ Atención: Dejará muy poca base para dar vueltos.
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de Montos Rápidos */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Montos Rápidos Sugeridos
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {excedenteSugerido > 0 && (
                    <button
                      type="button"
                      onClick={() => setMonto(excedenteSugerido)}
                      className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all text-left"
                    >
                      <span className="block text-[10px] opacity-75">Evacuar Excedente</span>
                      ${excedenteSugerido.toLocaleString('es-CO')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMonto(200000)}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-white/10 hover:bg-card border-white/5/10 text-white text-xs font-bold transition-all"
                  >
                    $200.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonto(500000)}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-white/10 hover:bg-card border-white/5/10 text-white text-xs font-bold transition-all"
                  >
                    $500.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonto(1000000)}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-white/10 hover:bg-card border-white/5/10 text-white text-xs font-bold transition-all"
                  >
                    $1.000.000
                  </button>
                </div>
              </div>

              {/* Input Monto Personalizado */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Monto a Retirar (COP) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">
                    $
                  </span>
                  <NumericFormat
                    value={monto === 0 ? '' : monto}
                    onValueChange={(values) => setMonto(values.floatValue || 0)}
                    thousandSeparator="."
                    decimalSeparator=","
                    placeholder="0"
                    className="w-full h-14 pl-10 pr-4 rounded-2xl bg-slate-950/80 border-2 border-white/10 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 text-2xl font-black text-white outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Selector de Motivo */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Motivo del Retiro *
                </label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-950/80 border border-white/10 text-white text-sm font-medium outline-none focus:border-amber-400 transition-all"
                >
                  {MOTIVOS_RETIRO.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre de Supervisor que autoriza */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-amber-400" />
                  Supervisor / Quien Recibe el Dinero *
                </label>
                <input
                  type="text"
                  required
                  value={supervisorNombre}
                  onChange={(e) => setSupervisorNombre(e.target.value)}
                  placeholder="Ej: Laura Gómez (Administradora)"
                  className="w-full h-12 px-4 rounded-xl bg-slate-950/80 border border-white/10 text-white text-sm font-medium outline-none focus:border-amber-400 transition-all"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Notas u Observaciones Adicionales
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles sobre el traslado o comprobante de caja mayor..."
                  className="w-full p-3 rounded-xl bg-slate-950/80 border border-white/10 text-white text-sm outline-none focus:border-amber-400 resize-none transition-all"
                />
              </div>

              {/* Footer Acciones */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || monto <= 0 || excedeSaldo || !supervisorNombre.trim()}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black tracking-wide shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ArrowDownCircle size={18} />
                  {isSubmitting ? 'Registrando...' : 'Confirmar Retiro'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
