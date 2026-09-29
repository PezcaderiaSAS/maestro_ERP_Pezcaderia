import React, { useState, useMemo } from 'react';
import { 
  X, CheckCheck, DollarSign, Fuel, Receipt, AlertCircle, 
  HelpCircle, ArrowDownCircle, ArrowUpCircle, ShieldCheck, 
  Plus, Trash2, Smartphone, FileText, CheckCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  deliveryRouteService, 
  DeliveryRouteRecord 
} from '../../../services/deliveryRouteService';
import { 
  RouteExpense, 
  SettleRouteManifest 
} from '../../../../packages/validation-schemas/src/deliveryRoute.schema';

interface RouteSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifiesto: DeliveryRouteRecord;
  onSettlementCompleted: (updatedManifest: DeliveryRouteRecord) => void;
}

export const RouteSettlementModal: React.FC<RouteSettlementModalProps> = ({
  isOpen,
  onClose,
  manifiesto,
  onSettlementCompleted,
}) => {
  // Lista de gastos
  const [gastos, setGastos] = useState<RouteExpense[]>(manifiesto.gastos || []);
  const [conceptoGasto, setConceptoGasto] = useState<string>('COMBUSTIBLE');
  const [montoGasto, setMontoGasto] = useState<number>(0);
  const [comprobanteGasto, setComprobanteGasto] = useState<string>('');

  // Resumen calculado de la ruta
  const resumenFinanciero = useMemo(() => {
    let efectivo = 0;
    let digital = 0;
    let credito = 0;
    let devoluciones = 0;
    let entregados = 0;
    let pendientes = 0;
    let rechazados = 0;

    for (const p of manifiesto.pedidos) {
      if (p.estadoEntrega === 'PENDIENTE') {
        pendientes++;
      } else if (p.estadoEntrega === 'NO_ENTREGADO_RECHAZADO') {
        rechazados++;
      } else {
        entregados++;
        efectivo += p.montoEfectivo || 0;
        digital += p.montoDigital || 0;
        if (p.formaPago === 'CREDITO_B2B') credito += p.montoCobradoFinal || 0;
      }

      if (p.devoluciones && p.devoluciones.length > 0) {
        devoluciones += p.devoluciones.reduce((acc, d) => acc + d.montoDescontado, 0);
      }
    }

    const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);
    const efectivoEsperado = Math.max(0, efectivo - totalGastos);

    return {
      efectivo,
      digital,
      credito,
      devoluciones,
      totalGastos,
      efectivoEsperado,
      entregados,
      pendientes,
      rechazados,
    };
  }, [manifiesto, gastos]);

  // Input de dinero físico entregado por el conductor en mano
  const [efectivoEntregado, setEfectivoEntregado] = useState<number>(resumenFinanciero.efectivoEsperado);
  const [observacionesLiquidacion, setObservacionesLiquidacion] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const diferencia = efectivoEntregado - resumenFinanciero.efectivoEsperado;

  const agregarGasto = () => {
    if (montoGasto <= 0) {
      Swal.fire({
        title: 'Monto inválido',
        text: 'Ingresa un valor mayor a cero para el gasto.',
        icon: 'warning',
        confirmButtonColor: '#3B82F6',
      });
      return;
    }

    const nuevoGasto: RouteExpense = {
      id: crypto.randomUUID?.() || `gasto-${Date.now()}`,
      tipoGasto: conceptoGasto as any,
      monto: montoGasto,
      numeroComprobante: comprobanteGasto.trim() || undefined,
      descripcion: comprobanteGasto.trim() || undefined,
    };

    const nuevosGastos = [...gastos, nuevoGasto];
    setGastos(nuevosGastos);
    setMontoGasto(0);
    setComprobanteGasto('');

    // Ajustar el efectivo esperado por defecto
    const nuevoTotalGastos = nuevosGastos.reduce((acc, g) => acc + g.monto, 0);
    const nuevoEsperado = Math.max(0, resumenFinanciero.efectivo - nuevoTotalGastos);
    setEfectivoEntregado(nuevoEsperado);
  };

  const eliminarGasto = (id?: string) => {
    const nuevos = gastos.filter((g) => g.id !== id);
    setGastos(nuevos);
    const nuevoTotalGastos = nuevos.reduce((acc, g) => acc + g.monto, 0);
    const nuevoEsperado = Math.max(0, resumenFinanciero.efectivo - nuevoTotalGastos);
    setEfectivoEntregado(nuevoEsperado);
  };

  const handleConfirmarLiquidacion = async () => {
    if (resumenFinanciero.pendientes > 0) {
      const confirmacion = await Swal.fire({
        title: 'Pedidos Aún Pendientes',
        html: `Esta ruta aún tiene <b>${resumenFinanciero.pendientes} pedido(s)</b> sin registrar entrega.<br/><br/>¿Deseas cerrar la ruta de todos modos? Los pedidos no entregados quedarán registrados para reprogramación.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, Liquidar Ruta',
        cancelButtonText: 'Cancelar y Verificar',
        confirmButtonColor: '#F59E0B',
      });
      if (!confirmacion.isConfirmed) return;
    }

    if (diferencia !== 0) {
      const tipo = diferencia < 0 ? 'Faltante de Caja' : 'Sobrante';
      const alerta = await Swal.fire({
        title: `Atención: ${tipo}`,
        html: `Hay una diferencia de <b>$${Math.abs(diferencia).toLocaleString('es-CO')}</b> en el arqueo del conductor <b>${manifiesto.conductorNombre}</b>.<br/><br/>¿Confirmas que los datos son correctos?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Confirmar Diferencia y Cerrar',
        cancelButtonText: 'Revisar',
        confirmButtonColor: '#EF4444',
      });
      if (!alerta.isConfirmed) return;
    }

    setIsProcessing(true);
    const payload: SettleRouteManifest = {
      manifiestoId: manifiesto.id,
      liquidadoPor: 'Auditor de Despachos',
      efectivoFisicoEntregado: efectivoEntregado,
      gastos,
      observacionesLiquidacion: observacionesLiquidacion.trim() || undefined,
    };

    const res = await deliveryRouteService.liquidarRutaTransportador(payload);
    setIsProcessing(false);

    if (res.success && res.data) {
      Swal.fire({
        title: '¡Ruta Liquidada con Éxito!',
        html: `El manifiesto <b>${manifiesto.numeroManifiesto}</b> ha sido cerrado.<br/>Efectivo depositado en caja: <b>$${efectivoEntregado.toLocaleString('es-CO')}</b>.`,
        icon: 'success',
        confirmButtonColor: '#10B981',
      });
      onSettlementCompleted(res.data);
      onClose();
    } else {
      Swal.fire({
        title: 'Error al Liquidar',
        text: res.error || 'Ocurrió un error al procesar el cierre.',
        icon: 'error',
        confirmButtonColor: '#EF4444',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <CheckCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Auditoría & Tesorería
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Liquidación de Conductor & Cierre de Ruta
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manifiesto: <b className="text-slate-200">{manifiesto.numeroManifiesto}</b> • Conductor:{' '}
                <b className="text-slate-200">{manifiesto.conductorNombre}</b> ({manifiesto.vehiculoPlaca})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Matriz de Recaudo Multimedio */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Resumen de Recaudos por Medio de Pago
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs">Efectivo Cobrado</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  ${resumenFinanciero.efectivo.toLocaleString('es-CO')}
                </div>
                <span className="text-[10px] text-slate-500">En posesión del conductor</span>
              </div>

              <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs">Digital / Bancos</span>
                  <Smartphone className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-xl font-bold font-mono text-sky-400">
                  ${resumenFinanciero.digital.toLocaleString('es-CO')}
                </div>
                <span className="text-[10px] text-slate-500">Con soporte verificado</span>
              </div>

              <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs">Crédito B2B</span>
                  <FileText className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xl font-bold font-mono text-indigo-400">
                  ${resumenFinanciero.credito.toLocaleString('es-CO')}
                </div>
                <span className="text-[10px] text-slate-500">Remisiones firmadas</span>
              </div>

              <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs">Devoluciones</span>
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-bold font-mono text-amber-400">
                  ${resumenFinanciero.devoluciones.toLocaleString('es-CO')}
                </div>
                <span className="text-[10px] text-slate-500">A cuarentena de calidad</span>
              </div>
            </div>
          </div>

          {/* Sección de Gastos de Ruta Soportados */}
          <div className="bg-slate-800/30 border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Gastos Operativos de Ruta Soportados
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                Total Gastos: -${resumenFinanciero.totalGastos.toLocaleString('es-CO')}
              </span>
            </div>

            {/* Agregar gasto */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-xl border border-white/5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Concepto</label>
                <select
                  value={conceptoGasto}
                  onChange={(e) => setConceptoGasto(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                >
                  <option value="COMBUSTIBLE">Combustible / ACPM</option>
                  <option value="PEAJES">Peajes</option>
                  <option value="HIELO_REFRIGERACION">Hielo / Gel Refrigerante</option>
                  <option value="PARQUEADERO">Parqueadero</option>
                  <option value="VIATICOS">Viáticos Conductor</option>
                  <option value="OTRO">Otro Gasto Operativo</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Monto ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={montoGasto || ''}
                  onChange={(e) => setMontoGasto(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1"># Factura / Recibo</label>
                <input
                  type="text"
                  placeholder="Ej. Tkt-9382"
                  value={comprobanteGasto}
                  onChange={(e) => setComprobanteGasto(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={agregarGasto}
                  className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Deducir Gasto
                </button>
              </div>
            </div>

            {/* Lista de gastos */}
            {gastos.length > 0 ? (
              <div className="space-y-2">
                {gastos.map((g, idx) => (
                  <div
                    key={g.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-bold text-white">{g.tipoGasto}</span>
                      {g.numeroComprobante && (
                        <span className="text-slate-400">({g.numeroComprobante})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-amber-400 font-mono">
                        -${g.monto.toLocaleString('es-CO')}
                      </span>
                      <button
                        type="button"
                        onClick={() => eliminarGasto(g.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-2">
                No hay gastos registrados en esta ruta.
              </div>
            )}
          </div>

          {/* Arqueo de Dinero en Efectivo */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Arqueo de Efectivo a Entregar en Caja
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Fórmula de Arqueo:</span>
                <span className="text-xs font-mono text-slate-300">
                  Efectivo Recaudado (${resumenFinanciero.efectivo.toLocaleString('es-CO')}) - Gastos (${resumenFinanciero.totalGastos.toLocaleString('es-CO')})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-white/5">
                <span className="text-xs text-slate-400 block mb-1">Efectivo Neto Esperado</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  ${resumenFinanciero.efectivoEsperado.toLocaleString('es-CO')}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-indigo-500/40 shadow-inner">
                <label className="text-xs font-bold text-indigo-400 block mb-1">
                  Efectivo Físico Entregado ($)
                </label>
                <input
                  type="number"
                  value={efectivoEntregado}
                  onChange={(e) => setEfectivoEntregado(Number(e.target.value))}
                  className="w-full text-xl font-bold font-mono text-white bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div
                className={`p-4 rounded-xl border flex flex-col justify-center ${
                  diferencia === 0
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
                    : diferencia > 0
                    ? 'bg-sky-950/30 border-sky-500/40 text-sky-400'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-400'
                }`}
              >
                <span className="text-xs font-medium block">
                  {diferencia === 0
                    ? '✓ Arqueo Exacto'
                    : diferencia > 0
                    ? '▲ Sobrante de Caja'
                    : '▼ Faltante de Caja'}
                </span>
                <span className="text-2xl font-bold font-mono">
                  {diferencia > 0 ? `+$${diferencia.toLocaleString('es-CO')}` : `$${diferencia.toLocaleString('es-CO')}`}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Observaciones del Arqueo / Cierre
              </label>
              <input
                type="text"
                placeholder="Novedades de cierre de ruta (opcional)"
                value={observacionesLiquidacion}
                onChange={(e) => setObservacionesLiquidacion(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-950/80 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 font-semibold text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleConfirmarLiquidacion}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:from-blue-500 hover:to-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {isProcessing ? 'Procesando Cierre...' : 'Finalizar y Liquidar Ruta'}
          </button>
        </div>
      </div>
    </div>
  );
};
