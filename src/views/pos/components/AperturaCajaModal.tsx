import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NumericFormat } from 'react-number-format';
import { cashService } from '../../../services/cashService';
import { Wallet, Check, AlertCircle, X, DollarSign, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { Caja } from '../../../types/cash.types';
import { useWarehouseStore } from '../../../store/useWarehouseStore';
import { useCashStore } from '../../../store/useCashStore';
import { useActionLogger } from '../../../hooks/useActionLogger';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

interface AperturaCajaModalProps {
  userRole: string;
  bodegaActiva: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const AperturaCajaModal: React.FC<AperturaCajaModalProps> = ({
  userRole,
  bodegaActiva,
  onSuccess,
  onCancel
}) => {
  const { bodegas, loadBodegas } = useWarehouseStore();
  const { isLoading } = useCashStore();
  const [selectedBodegaId, setSelectedBodegaId] = useState<string>(bodegaActiva);

  const [cajaSeleccionada, setCajaSeleccionada] = useState<string>('');
  const [cajasDisponibles, setCajasDisponibles] = useState<Caja[]>([]);
  const [totalCajasEnBodega, setTotalCajasEnBodega] = useState<number>(0);

  const [saldoRecomendado, setSaldoRecomendado] = useState<number>(0);
  const [baseDirecta, setBaseDirecta] = useState<number>(0);
  const [notasApertura, setNotasApertura] = useState<string>('');

  useEffect(() => {
    loadBodegas();
  }, [loadBodegas]);

  useEffect(() => {
    if (userRole !== 'admin' && bodegaActiva) {
      setSelectedBodegaId(bodegaActiva);
    }
  }, [userRole, bodegaActiva]);

  // Cargar cajas disponibles sincronizando coincidencia de ID y Nombre de Bodega
  useEffect(() => {
    cashService.seedCajasParaBodegas();
    const currentBodegas = bodegas.length > 0 ? bodegas : useWarehouseStore.getState().bodegas;
    
    const matchedBodega = currentBodegas.find(
      b => b.id === selectedBodegaId || b.nombre.toLowerCase() === selectedBodegaId.toLowerCase()
    );
    
    const targetBodegaId = matchedBodega ? matchedBodega.id : selectedBodegaId;

    let cajas = cashService.getCajas().filter(
      c => (c.bodegaId === targetBodegaId || c.bodegaId === selectedBodegaId) && c.activa
    );
    
    if (userRole !== 'admin') {
      cajas = cajas.filter(c => !c.nombre.includes('Caja Mayor'));
    }
    
    setTotalCajasEnBodega(cajas.length);

    const turnos = cashService.getTurnos();
    cajas = cajas.filter(c => !turnos.some(t => t.cajaId === c.id && t.estado === 'ABIERTO'));
    
    setCajasDisponibles(cajas);
    if (cajas.length >= 1) {
      setCajaSeleccionada(cajas[0].id);
    } else {
      setCajaSeleccionada('');
    }
  }, [selectedBodegaId, userRole, bodegas]);

  // Cargar saldo recomendado de arrastre del último turno cerrado
  useEffect(() => {
    if (!cajaSeleccionada) {
      setSaldoRecomendado(0);
      return;
    }
    const turnos = cashService.getTurnos();
    const ultimoCierre = turnos
      .filter(t => t.cajaId === cajaSeleccionada && t.estado === 'CERRADO')
      .sort((a, b) => new Date(b.fechaCierre!).getTime() - new Date(a.fechaCierre!).getTime())[0];
    
    const saldo = ultimoCierre?.saldoFisicoEfectivo ?? 0;
    setSaldoRecomendado(saldo);
  }, [cajaSeleccionada]);

  const handleSubmit = useActionLogger('CashFlow', 'AbrirTurno', (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cajaSeleccionada) {
      Swal.fire({ icon: 'warning', title: 'Seleccione una caja' });
      return;
    }
    if (baseDirecta < 0 || Number.isNaN(baseDirecta)) {
      Swal.fire({ icon: 'warning', title: 'Base inválida', text: 'El valor de la base inicial es inválido.' });
      return;
    }

    try {
      const result = cashService.abrirTurno(
        cajaSeleccionada,
        userRole,
        baseDirecta,
        undefined,
        notasApertura
      );

      if (result.error) {
        Swal.fire({ icon: 'error', title: 'Error', text: result.error });
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Caja Abierta',
        text: 'El turno ha iniciado exitosamente.',
        timer: 1500,
        showConfirmButton: false
      });
      onSuccess();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'No se pudo abrir la caja' });
    }
  });

  const handleCancel = () => {
    setCajaSeleccionada('');
    setBaseDirecta(0);
    setNotasApertura('');
    if (onCancel) onCancel();
  };

  const PRESETS_BASE = [0, 50000, 100000, 150000, 200000, 300000];

  return createPortal(
    <Modal
      isOpen={true}
      onClose={handleCancel}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 text-blue-600 rounded-full p-2.5 flex items-center justify-center">
            <Wallet size={22} />
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-slate-800 m-0 leading-tight">Apertura de Turno</h3>
            <p className="text-sm text-slate-500 font-medium m-0">
              Ingreso Directo de Base Inicial
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-between w-full">
          <Button variant="ghost" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={!cajaSeleccionada || isLoading}
            onClick={handleSubmit}
            icon={isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            data-testid="btn-abrir-caja"
          >
            {isLoading ? 'Abriendo...' : 'Confirmar Apertura'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 my-2">
        {/* SECCIÓN 1: SELECCIÓN DE BODEGA Y CAJA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bodega */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Bodega
            </label>
            {userRole === 'admin' && bodegas.length > 0 ? (
              <select
                data-testid="select-bodega"
                value={selectedBodegaId}
                onChange={(e) => setSelectedBodegaId(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border-2 border-slate-200 bg-white focus:border-[var(--primary-color)] text-base font-semibold text-slate-800 outline-none transition-colors cursor-pointer"
              >
                {bodegas.map(b => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            ) : (
              <div className="h-11 px-3 flex items-center bg-white rounded-lg border border-slate-200 font-bold text-slate-700">
                {bodegas.find(b => b.id === selectedBodegaId || b.nombre === selectedBodegaId)?.nombre || selectedBodegaId || 'Bodega Principal'}
              </div>
            )}
          </div>

          {/* Caja a Abrir */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Caja a Abrir
            </label>
            {cajasDisponibles.length > 0 ? (
              <select
                data-testid="select-caja"
                autoFocus={cajasDisponibles.length > 1 && !cajaSeleccionada}
                value={cajaSeleccionada}
                onChange={(e) => setCajaSeleccionada(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border-2 border-slate-200 bg-white focus:border-[var(--primary-color)] text-base font-semibold text-slate-800 outline-none transition-colors cursor-pointer"
              >
                {cajasDisponibles.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            ) : (
              <div className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium ${totalCajasEnBodega > 0 ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
                <AlertCircle size={18} className="shrink-0" />
                <span>
                  {totalCajasEnBodega > 0 
                    ? 'Todas las cajas tienen un turno abierto.' 
                    : 'No hay cajas activas para esta bodega.'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 2: INGRESO DE MONTO BASE Y BOTONES DE SUMA ACUMULATIVA */}
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col gap-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 m-0">
                <DollarSign size={18} className="text-emerald-600" />
                Monto Base Inicial
              </label>
              {baseDirecta > 0 && (
                <button
                  type="button"
                  onClick={() => setBaseDirecta(0)}
                  className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md border border-red-200 transition-all flex items-center gap-1 active:scale-95"
                >
                  <X size={14} />
                  Limpiar a $0
                </button>
              )}
            </div>
            <NumericFormat
              data-testid="input-base-directa"
              autoFocus={cajasDisponibles.length > 0}
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={0}
              allowNegative={false}
              prefix="$ "
              value={baseDirecta || ''}
              onValueChange={(values) => setBaseDirecta(values.floatValue ?? 0)}
              className="w-full h-16 px-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/40 focus:border-emerald-500 focus:bg-white text-3xl text-slate-900 font-black outline-none transition-all shadow-inner"
              placeholder="$ 0"
            />
          </div>

          {/* BOTONES AUTOINCREMENTALES (SUMA RÁPIDA ACUMULATIVA) */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <span>Aumento Autoincremental Acumulativo</span>
              <span className="text-[10px] text-emerald-600 font-normal">(Suma al valor actual)</span>
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {[1000, 2000, 5000, 10000, 20000, 50000, 100000].map(inc => (
                <button
                  key={`inc-${inc}`}
                  type="button"
                  onClick={() => setBaseDirecta(prev => (prev || 0) + inc)}
                  className="py-2 px-1 text-xs font-black rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all active:scale-95 shadow-sm text-center"
                  title={`Sumar +$${inc.toLocaleString('es-CO')}`}
                >
                  +${inc >= 100000 ? '100k' : inc >= 10000 ? `${inc/1000}k` : inc.toLocaleString('es-CO')}
                </button>
              ))}
            </div>
          </div>

          {/* VALORES FIJOS FRECUENTES */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Fijar Valor Directo
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESETS_BASE.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBaseDirecta(val)}
                  className={`py-2 px-1 text-xs font-black rounded-lg border transition-all active:scale-95 shadow-sm ${
                    baseDirecta === val
                      ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {val === 0 ? 'Sin Base' : `$${val.toLocaleString('es-CO')}`}
                </button>
              ))}
            </div>
          </div>

          {/* DESTACADO DE SALDO DE ARRASTRE DE TURNO ANTERIOR */}
          {saldoRecomendado > 0 ? (
            <div className="p-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-600 text-white p-2 rounded-lg shrink-0">
                  <Wallet size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                    Saldo Arrastre Turno Anterior
                  </span>
                  <span className="text-lg font-black text-blue-700">
                    ${saldoRecomendado.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBaseDirecta(saldoRecomendado)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm active:scale-95 shrink-0"
              >
                Cargar Saldo Anterior
              </button>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 font-medium">
              Sin saldo registrado del turno anterior para esta caja.
            </div>
          )}

          {/* Notas de Apertura */}
          <div className="mt-1 pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Observaciones (Opcional)
            </label>
            <textarea
              value={notasApertura}
              onChange={(e) => setNotasApertura(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-400 focus:bg-white text-sm text-slate-800 outline-none transition-colors resize-none"
              placeholder="Notas opcionales sobre el estado o billetes al abrir..."
            />
          </div>
        </div>
      </div>
    </Modal>,
    document.body
  );
};
