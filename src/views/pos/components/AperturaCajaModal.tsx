import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NumericFormat } from 'react-number-format';
import { cashService } from '../../../services/cashService';
import { Wallet, Check, AlertCircle, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { Caja, DetalleArqueo } from '../../../types/cash.types';
import { CalculadorDenominaciones } from '../../cash/components/CalculadorDenominaciones';
import { useWarehouseStore } from '../../../store/useWarehouseStore';
import { useActionLogger } from '../../../hooks/useActionLogger';

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
  const [selectedBodegaId, setSelectedBodegaId] = useState<string>(bodegaActiva);

  const [denominacionesApertura, setDenominacionesApertura] = useState<DetalleArqueo>({
    billetes100k: 0, billetes50k: 0, billetes20k: 0, billetes10k: 0, billetes5k: 0, billetes2k: 0,
    monedas1k: 0, monedas500: 0, monedas200: 0, monedas100: 0, monedas50: 0
  });
  const [cajaSeleccionada, setCajaSeleccionada] = useState<string>('');
  const [cajasDisponibles, setCajasDisponibles] = useState<Caja[]>([]);

  // States para Fase 4
  const [saldoRecomendado, setSaldoRecomendado] = useState<number>(0);
  const [modoDeclaracion, setModoDeclaracion] = useState<'calculadora' | 'directo'>('calculadora');
  const [baseDirecta, setBaseDirecta] = useState<number>(0);
  const [notasApertura, setNotasApertura] = useState<string>('');

  const baseInicial = modoDeclaracion === 'calculadora' ? (
    denominacionesApertura.billetes100k * 100000 +
    denominacionesApertura.billetes50k * 50000 +
    denominacionesApertura.billetes20k * 20000 +
    denominacionesApertura.billetes10k * 10000 +
    denominacionesApertura.billetes5k * 5000 +
    denominacionesApertura.billetes2k * 2000 +
    denominacionesApertura.monedas1k * 1000 +
    denominacionesApertura.monedas500 * 500 +
    denominacionesApertura.monedas200 * 200 +
    denominacionesApertura.monedas100 * 100 +
    denominacionesApertura.monedas50 * 50
  ) : baseDirecta;

  // Cargar saldo de arrastre (Fase 4.1)
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

  useEffect(() => {
    loadBodegas();
  }, [loadBodegas]);

  useEffect(() => {
    if (userRole !== 'admin') {
      setSelectedBodegaId(bodegaActiva);
    }
  }, [userRole, bodegaActiva]);

  const [totalCajasEnBodega, setTotalCajasEnBodega] = useState<number>(0);

  useEffect(() => {
    cashService.seedCajasParaBodegas();
    let cajas = cashService.getCajas().filter(c => c.bodegaId === selectedBodegaId && c.activa);
    
    if (userRole !== 'admin') {
      cajas = cajas.filter(c => !c.nombre.includes('Caja Mayor'));
    }
    
    setTotalCajasEnBodega(cajas.length);

    const turnos = cashService.getTurnos();
    cajas = cajas.filter(c => !turnos.some(t => t.cajaId === c.id && t.estado === 'ABIERTO'));
    
    setCajasDisponibles(cajas);
    if (cajas.length === 1) {
      setCajaSeleccionada(cajas[0].id);
    } else {
      setCajaSeleccionada('');
    }
  }, [selectedBodegaId, userRole]);



  const handleSubmit = useActionLogger('CashFlow', 'AbrirTurno', (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cajaSeleccionada) {
      Swal.fire({ icon: 'warning', title: 'Seleccione una caja' });
      return;
    }
    if (baseInicial < 0 || Number.isNaN(baseInicial)) {
      Swal.fire({ icon: 'warning', title: 'Base inválida', text: 'El cálculo de la base inicial es inválido.' });
      return;
    }

    try {
      const result = cashService.abrirTurno(cajaSeleccionada, userRole, baseInicial, modoDeclaracion === 'calculadora' ? denominacionesApertura : undefined, notasApertura);

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
    setDenominacionesApertura({
      billetes100k: 0, billetes50k: 0, billetes20k: 0, billetes10k: 0, billetes5k: 0, billetes2k: 0,
      monedas1k: 0, monedas500: 0, monedas200: 0, monedas100: 0, monedas50: 0
    });
    setCajaSeleccionada('');
    setBaseDirecta(0);
    setNotasApertura('');
    if (onCancel) onCancel();
  };

  return createPortal(
    <Modal
      isOpen={true}
      onClose={handleCancel}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 rounded-full p-3 flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-slate-800 m-0 leading-tight">Apertura de Turno</h3>
            <p className="text-sm text-slate-500 font-medium m-0">
              Declaración de Base
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
            disabled={!cajaSeleccionada}
            onClick={handleSubmit}
            icon={<Check size={18} />}
            data-testid="btn-abrir-caja"
          >
            Confirmar Apertura
          </Button>
        </div>
      }
    >
      {/* PROGRESS BAR */}
      <div className="w-full bg-slate-100 h-1 absolute top-[76px] left-0 right-0 z-10">
        <div 
          className="bg-[var(--primary-color)] h-1 transition-all duration-300" 
          style={{ width: '100%' }}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6 mt-4">
        {/* LEFT COLUMN: WAREHOUSE & REGISTER */}
        <div className="flex flex-col gap-6 w-full md:w-1/3">
          {userRole === 'admin' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                Bodega
              </label>
              <select
                data-testid="select-bodega"
                value={selectedBodegaId}
                onChange={(e) => setSelectedBodegaId(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-[var(--primary-color)] focus:bg-white text-base text-slate-800 outline-none transition-colors appearance-none cursor-pointer"
              >
                {bodegas.map(b => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex-1 transition-all hover:border-slate-300">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Caja a Abrir
            </label>
            {cajasDisponibles.length > 0 ? (
              <select
                data-testid="select-caja"
                autoFocus={cajasDisponibles.length > 1 && !cajaSeleccionada}
                value={cajaSeleccionada}
                onChange={(e) => setCajaSeleccionada(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-[var(--primary-color)] focus:bg-white text-base text-slate-800 outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="">-- Seleccione una caja --</option>
                {cajasDisponibles.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            ) : (
              <div className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 text-center font-medium ${totalCajasEnBodega > 0 ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-red-100 bg-red-50 text-red-600'}`}>
                <AlertCircle size={24} />
                <p className="text-sm">
                  {totalCajasEnBodega > 0 
                    ? 'Todas las cajas de esta bodega ya tienen un turno abierto.' 
                    : 'No hay cajas configuradas o activas para esta bodega.'}
                </p>
              </div>
            )}

            {/* INFO PANEL */}
            {cajaSeleccionada && (
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl transition-all">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Base Total</span>
                </div>
                <div className="text-3xl font-black text-[var(--primary-color)] tracking-tight">
                  ${baseInicial.toLocaleString('es-CO')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CASH DECLARATION */}
        <div className="flex flex-col gap-6 w-full md:w-2/3">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full transition-all hover:border-slate-300">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                Declare la Base
              </label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${modoDeclaracion === 'calculadora' ? 'bg-white text-[var(--primary-color)] shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setModoDeclaracion('calculadora')}
                >
                  Calculadora
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${modoDeclaracion === 'directo' ? 'bg-white text-[var(--primary-color)] shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setModoDeclaracion('directo')}
                >
                  Ingreso Directo
                </button>
              </div>
            </div>

            {modoDeclaracion === 'calculadora' ? (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
                <CalculadorDenominaciones
                  valores={denominacionesApertura}
                  onChange={(key, valor) => setDenominacionesApertura(prev => ({ ...prev, [key]: valor }))}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4 py-4 min-h-[300px]">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Total Efectivo en Caja</label>
                  <NumericFormat
                    data-testid="input-base-directa"
                    autoFocus={cajasDisponibles.length <= 1 || !!cajaSeleccionada}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    allowNegative={false}
                    prefix="$ "
                    value={baseDirecta || ''}
                    onValueChange={(values) => setBaseDirecta(values.floatValue ?? 0)}
                    className="w-full h-16 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-[var(--primary-color)] focus:bg-white text-3xl text-slate-800 font-black outline-none transition-colors"
                    placeholder="$ 0"
                  />
                </div>
                
                {/* Botones de Suma Rápida (Quick Add) */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[10000, 20000, 50000, 100000].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setBaseDirecta(prev => prev + amount)}
                      className="px-3 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-[var(--primary-light)] hover:text-[var(--primary-color)] hover:border-[var(--primary-color)] transition-all shadow-sm active:scale-95 flex-1 min-w-[80px]"
                    >
                      +${amount.toLocaleString('es-CO')}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setBaseDirecta(0)}
                    className="px-3 py-2 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all shadow-sm active:scale-95 ml-auto"
                    title="Limpiar base"
                  >
                    <X size={20} />
                  </button>
                </div>

                {saldoRecomendado > 0 && (
                  <div className="mt-auto pt-4">
                    <button
                      type="button"
                      onClick={() => setBaseDirecta(saldoRecomendado)}
                      className="w-full text-sm font-bold text-[var(--primary-color)] bg-[var(--primary-light)] border border-[var(--primary-color)] px-4 py-3 rounded-xl hover:bg-opacity-80 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Wallet size={18} />
                      Usar saldo de arrastre: ${saldoRecomendado.toLocaleString('es-CO')}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Notas de Apertura (Opcional)</label>
              <textarea
                value={notasApertura}
                onChange={(e) => setNotasApertura(e.target.value)}
                className="w-full h-20 px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-[var(--primary-color)] focus:bg-white text-sm text-slate-800 outline-none transition-colors resize-none"
                placeholder="Observaciones sobre el estado de la caja al iniciar..."
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>,
    document.body
  );
};

