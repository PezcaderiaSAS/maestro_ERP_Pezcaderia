import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  CreditCard,
  Banknote,
  Landmark,
  Calculator,
  AlertCircle,
  Phone,
  QrCode,
  CheckCircle,
  Coins,
  Zap,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { Button } from '../../../components/ui/Button';
import Swal from 'sweetalert2';
import { usePOSPrinter } from '../../../hooks/usePOSPrinter';
import type { LineaVenta } from '../../../types/pos.types';
import type { ClientePOS } from '../../../hooks/usePOSCart';
import {
  calcularCambioEfectivo,
  BILLETES_RAPIDOS_SUGERIDOS,
} from '../../../../packages/validation-schemas/src/posCashEngine.schema';

import { PosElectronicInvoiceToggle } from './PosElectronicInvoiceToggle';

export type MetodoCobroPos = 'EFECTIVO' | 'NEQUI' | 'DAVIPLATA' | 'QR_BANCOLOMBIA' | 'DATAFONO' | 'CREDITO';

export interface PaymentPanelProps {
  totalFinal: number;
  lineas: LineaVenta[];
  cliente: ClientePOS | null;
  stock: Record<string, Record<string, number>>;
  bodegaActivaId: string;
  bodegaActivaNombre: string;
  onGuardarBorrador: () => void;
  onPagar: (pagos: { metodo: MetodoCobroPos; monto: number }[], options?: { requiereFacturaElectronica?: boolean }) => Promise<any> | void;
  onLimpiarCarrito: () => void;
  isDisabled: boolean;
  isTurnoAbierto: boolean;
  onAbrirTurnoRequest?: () => void;
  onRetiroParcialRequest?: () => void;
  saldoEfectivoGaveta?: number;
  topeMaximoGaveta?: number;
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({
  totalFinal,
  lineas,
  cliente,
  stock,
  bodegaActivaId,
  bodegaActivaNombre,
  onGuardarBorrador,
  onPagar,
  onLimpiarCarrito,
  isDisabled,
  isTurnoAbierto,
  onAbrirTurnoRequest,
  onRetiroParcialRequest,
  saldoEfectivoGaveta = 0,
  topeMaximoGaveta = 1500000,
}) => {
  const { imprimirTicket } = usePOSPrinter();
  const [categoriaActiva, setCategoriaActiva] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'DATAFONO' | 'CREDITO'>('EFECTIVO');
  const [subTransferencia, setSubTransferencia] = useState<'NEQUI' | 'DAVIPLATA' | 'QR_BANCOLOMBIA'>('NEQUI');
  const [metodoPago, setMetodoPago] = useState<MetodoCobroPos>('EFECTIVO');
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(0);

  const [isModoMixto, setIsModoMixto] = useState(false);
  const [requiereFacturaElectronica, setRequiereFacturaElectronica] = useState<boolean>(() => {
    return cliente?.exigeFacturaElectronica || false;
  });

  useEffect(() => {
    if (cliente?.exigeFacturaElectronica) {
      setRequiereFacturaElectronica(true);
    }
  }, [cliente]);

  const [pagosMixtos, setPagosMixtos] = useState<Record<MetodoCobroPos, number>>({
    EFECTIVO: 0,
    NEQUI: 0,
    DAVIPLATA: 0,
    QR_BANCOLOMBIA: 0,
    DATAFONO: 0,
    CREDITO: 0,
  });

  const efectivoInputRef = useRef<HTMLInputElement>(null);

  const handleSelectCategoria = (cat: 'EFECTIVO' | 'TRANSFERENCIA' | 'DATAFONO' | 'CREDITO') => {
    setCategoriaActiva(cat);
    if (cat === 'TRANSFERENCIA') {
      setMetodoPago(subTransferencia);
    } else {
      setMetodoPago(cat);
    }
  };

  const handleSelectSubTransferencia = (sub: 'NEQUI' | 'DAVIPLATA' | 'QR_BANCOLOMBIA') => {
    setSubTransferencia(sub);
    setCategoriaActiva('TRANSFERENCIA');
    setMetodoPago(sub);
  };

  // Al cambiar totalFinal o método a EFECTIVO, sugerir monto exacto si está en cero
  useEffect(() => {
    if (metodoPago === 'EFECTIVO' && efectivoRecibido === 0 && totalFinal > 0) {
      setEfectivoRecibido(totalFinal);
    }
  }, [totalFinal, metodoPago]);

  const calculoCambio = calcularCambioEfectivo(totalFinal, efectivoRecibido);

  const totalPagosMixtos = Object.values(pagosMixtos).reduce((acc, v) => acc + (v || 0), 0);
  const faltantePagoMixto = Math.round((totalFinal - totalPagosMixtos) * 100) / 100;

  const handleUpdatePagoMixto = (metodo: MetodoCobroPos, value: number) => {
    setPagosMixtos((prev) => ({ ...prev, [metodo]: value }));
  };

  // Atajos de teclado físico
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);

      if ((e.key === 'Enter') && !e.shiftKey && !e.ctrlKey) {
        if (!isDisabled && isTurnoAbierto && totalFinal > 0) {
          e.preventDefault();
          handleCobrarClick();
        }
      } else if (e.code === 'Space' && !isInput) {
        e.preventDefault();
        setEfectivoRecibido(totalFinal);
      } else if (e.key === 'F1') {
        e.preventDefault();
        handleSelectCategoria('EFECTIVO');
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (categoriaActiva === 'TRANSFERENCIA') {
          const cycle: Record<'NEQUI' | 'DAVIPLATA' | 'QR_BANCOLOMBIA', 'NEQUI' | 'DAVIPLATA' | 'QR_BANCOLOMBIA'> = {
            NEQUI: 'DAVIPLATA',
            DAVIPLATA: 'QR_BANCOLOMBIA',
            QR_BANCOLOMBIA: 'NEQUI',
          };
          handleSelectSubTransferencia(cycle[subTransferencia]);
        } else {
          handleSelectCategoria('TRANSFERENCIA');
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleSelectCategoria('DATAFONO');
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleSelectCategoria('CREDITO');
      } else if (!isInput && categoriaActiva === 'TRANSFERENCIA' && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const subMap: Record<string, 'NEQUI' | 'DAVIPLATA' | 'QR_BANCOLOMBIA'> = {
          '1': 'NEQUI',
          '2': 'DAVIPLATA',
          '3': 'QR_BANCOLOMBIA',
        };
        if (subMap[e.key]) handleSelectSubTransferencia(subMap[e.key]);
      } else if (e.altKey && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const map: Record<string, MetodoCobroPos> = {
          '1': 'EFECTIVO',
          '2': 'NEQUI',
          '3': 'DAVIPLATA',
          '4': 'QR_BANCOLOMBIA',
          '5': 'DATAFONO',
          '6': 'CREDITO',
        };
        const target = map[e.key];
        if (target) {
          if (target === 'EFECTIVO' || target === 'DATAFONO' || target === 'CREDITO') {
            handleSelectCategoria(target);
          } else {
            handleSelectSubTransferencia(target);
          }
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleCobroEfectivoExactoDirecto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalFinal, efectivoRecibido, isTurnoAbierto, isDisabled, isModoMixto, pagosMixtos, metodoPago, categoriaActiva, subTransferencia]);

  const handleCobroEfectivoExactoDirecto = () => {
    if (!isTurnoAbierto) {
      if (onAbrirTurnoRequest) onAbrirTurnoRequest();
      return;
    }
    if (isDisabled || totalFinal <= 0) return;
    if (requiereFacturaElectronica) {
      onPagar([{ metodo: 'EFECTIVO', monto: totalFinal }], { requiereFacturaElectronica: true });
    } else {
      onPagar([{ metodo: 'EFECTIVO', monto: totalFinal }]);
    }
  };

  const handleCobrarClick = async () => {
    if (!isTurnoAbierto) {
      if (onAbrirTurnoRequest) onAbrirTurnoRequest();
      return;
    }

    if (totalFinal <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Cobro',
        text: 'El total final debe ser mayor a $0 para procesar el pago.',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    // RN-01: Validar stock suficiente
    let stockSuficiente = true;
    const itemsFaltantes: string[] = [];
    const targetWarehouseKey = stock[bodegaActivaId] ? bodegaActivaId : bodegaActivaNombre;

    lineas.forEach((item) => {
      const stockDisponible = stock[targetWarehouseKey]?.[item.sku] || 0;
      if (stockDisponible < item.cantidad) {
        stockSuficiente = false;
        itemsFaltantes.push(`• ${item.nombre} (Solicitado: ${item.cantidad}, Disp: ${stockDisponible})`);
      }
    });

    if (!stockSuficiente) {
      Swal.fire({
        icon: 'error',
        title: 'Venta Bloqueada: Stock Insuficiente',
        html: `
          <div style="text-align: left; font-size: 14px;">
            <p>No se puede liquidar la venta porque el stock en <strong>${bodegaActivaNombre}</strong> es insuficiente:</p>
            <ul style="color: #EF4444; font-weight: 600; list-style-type: none; padding-left: 0;">
              ${itemsFaltantes.map((msg) => `<li style="margin-bottom: 6px;">${msg}</li>`).join('')}
            </ul>
          </div>
        `,
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    let pagosFinales: { metodo: MetodoCobroPos; monto: number }[] = [];

    if (isModoMixto) {
      if (faltantePagoMixto !== 0) {
        Swal.fire({
          icon: 'error',
          title: 'Error de Cuadre Mixto',
          text: `La suma de pagos debe coincidir exactamente con el total ($${totalFinal.toLocaleString('es-CO')}). ${
            faltantePagoMixto > 0
              ? `Faltan $${faltantePagoMixto.toLocaleString('es-CO')}`
              : `Sobran $${Math.abs(faltantePagoMixto).toLocaleString('es-CO')}`
          }`,
          background: '#0f172a',
          color: '#f8fafc',
        });
        return;
      }

      if (pagosMixtos.CREDITO > 0 && !cliente) {
        Swal.fire({
          icon: 'warning',
          title: 'Cliente Requerido',
          text: 'Debe vincular un cliente registrado para procesar la venta a crédito.',
          background: '#0f172a',
          color: '#f8fafc',
        });
        return;
      }

      pagosFinales = (Object.entries(pagosMixtos) as [MetodoCobroPos, number][])
        .filter(([, monto]) => monto > 0)
        .map(([metodo, monto]) => ({ metodo, monto }));
    } else {
      if (metodoPago === 'CREDITO' && !cliente) {
        Swal.fire({
          icon: 'warning',
          title: 'Cliente Requerido',
          text: 'Debe vincular un cliente registrado para procesar una venta a crédito.',
          background: '#0f172a',
          color: '#f8fafc',
        });
        return;
      }

      if (metodoPago === 'EFECTIVO' && !calculoCambio.valido) {
        Swal.fire({
          icon: 'warning',
          title: 'Efectivo Insuficiente',
          text: `El efectivo recibido ($${efectivoRecibido.toLocaleString('es-CO')}) es menor al total a cobrar ($${totalFinal.toLocaleString('es-CO')}). Faltan $${calculoCambio.faltante.toLocaleString('es-CO')}.`,
          background: '#0f172a',
          color: '#f8fafc',
        });
        return;
      }

      pagosFinales = [{ metodo: metodoPago, monto: totalFinal }];
    }

    try {
      const ventaProcesada = requiereFacturaElectronica
        ? await onPagar(pagosFinales, { requiereFacturaElectronica: true })
        : await onPagar(pagosFinales);
      if (ventaProcesada) {
        await imprimirTicket(ventaProcesada, cliente);
        onLimpiarCarrito();
        setEfectivoRecibido(0);
        // Regla del Niño de 12 Años: Retorno inmediato de foco al buscador para la siguiente venta
        const searchInput = document.getElementById('pos-product-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    } catch (err) {
      console.error('Error durante el cobro:', err);
    }
  };

  const superaTopeGaveta = saldoEfectivoGaveta >= topeMaximoGaveta;

  return (
    <div className="flex flex-col gap-3 mt-3">
      {/* Alerta Preventiva de Tope de Gaveta */}
      {superaTopeGaveta && onRetiroParcialRequest && (
        <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-pulse">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-xs font-semibold text-amber-300">
              Efectivo en gaveta: <b>${saldoEfectivoGaveta.toLocaleString('es-CO')}</b> (Tope: ${topeMaximoGaveta.toLocaleString('es-CO')})
            </span>
          </div>
          <button
            onClick={onRetiroParcialRequest}
            className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-colors"
          >
            Alivio de Caja
          </button>
        </div>
      )}

      {/* Selector de Modo: Único vs Mixto */}
      <div className="flex justify-between items-center px-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <span>Medio de Pago</span>
          <kbd className="hidden sm:inline-block px-1 py-0.2 bg-slate-100 border border-slate-300 text-[9px] rounded text-slate-600 font-mono font-bold">F1-F4</kbd>
        </label>
        <button
          onClick={() => {
            setIsModoMixto(!isModoMixto);
            if (!isModoMixto) {
              setPagosMixtos({
                EFECTIVO: 0,
                NEQUI: 0,
                DAVIPLATA: 0,
                QR_BANCOLOMBIA: 0,
                DATAFONO: 0,
                CREDITO: 0,
              });
            }
          }}
          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
            isModoMixto
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-300 shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 shadow-sm'
          }`}
          disabled={isDisabled}
        >
          <Calculator size={13} />
          {isModoMixto ? 'Cobro Único' : '+ Split'}
        </button>
      </div>

      {!isModoMixto ? (
        <>
          {/* Grilla Ergonómica 2x2 para Macro-Medios de Pago */}
          <div className="grid grid-cols-2 gap-2">
            {/* 1. Efectivo [F1] */}
            <button
              type="button"
              data-testid="btn-metodo-efectivo"
              onClick={() => handleSelectCategoria('EFECTIVO')}
              title="Seleccionar Efectivo (F1)"
              className={`flex items-center justify-between min-h-[50px] h-auto py-2 px-3 rounded-xl border transition-all cursor-pointer select-none active:scale-95 ${
                categoriaActiva === 'EFECTIVO'
                  ? 'border-emerald-500 bg-emerald-50/90 text-emerald-800 shadow-sm ring-2 ring-emerald-400 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm font-semibold'
              }`}
            >
              <div className="flex items-center gap-2">
                <Banknote size={18} className={categoriaActiva === 'EFECTIVO' ? 'text-emerald-600 shrink-0' : 'text-slate-500 shrink-0'} />
                <span className="text-xs font-bold leading-tight">Efectivo</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 border border-slate-200 text-slate-600">F1</kbd>
            </button>

            {/* 2. Transferencia [F2] */}
            <button
              type="button"
              data-testid="btn-metodo-transferencia"
              onClick={() => handleSelectCategoria('TRANSFERENCIA')}
              title="Seleccionar Transferencia (F2: Nequi / Daviplata / QR)"
              className={`flex items-center justify-between min-h-[50px] h-auto py-2 px-3 rounded-xl border transition-all cursor-pointer select-none active:scale-95 ${
                categoriaActiva === 'TRANSFERENCIA'
                  ? 'border-indigo-500 bg-indigo-50/90 text-indigo-800 shadow-sm ring-2 ring-indigo-400 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm font-semibold'
              }`}
            >
              <div className="flex items-center gap-2">
                <Smartphone size={18} className={categoriaActiva === 'TRANSFERENCIA' ? 'text-indigo-600 shrink-0' : 'text-slate-500 shrink-0'} />
                <span className="text-xs font-bold leading-tight">Transferencia</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 border border-slate-200 text-slate-600">F2</kbd>
            </button>

            {/* 3. Datáfono [F3] */}
            <button
              type="button"
              data-testid="btn-metodo-datafono"
              onClick={() => handleSelectCategoria('DATAFONO')}
              title="Seleccionar Datáfono (F3)"
              className={`flex items-center justify-between min-h-[50px] h-auto py-2 px-3 rounded-xl border transition-all cursor-pointer select-none active:scale-95 ${
                categoriaActiva === 'DATAFONO'
                  ? 'border-sky-500 bg-sky-50/90 text-sky-800 shadow-sm ring-2 ring-sky-400 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm font-semibold'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard size={18} className={categoriaActiva === 'DATAFONO' ? 'text-sky-600 shrink-0' : 'text-slate-500 shrink-0'} />
                <span className="text-xs font-bold leading-tight">Datáfono</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 border border-slate-200 text-slate-600">F3</kbd>
            </button>

            {/* 4. Crédito [F4] */}
            <button
              type="button"
              data-testid="btn-metodo-credito"
              onClick={() => handleSelectCategoria('CREDITO')}
              title="Seleccionar Crédito (F4)"
              className={`flex items-center justify-between min-h-[50px] h-auto py-2 px-3 rounded-xl border transition-all cursor-pointer select-none active:scale-95 ${
                categoriaActiva === 'CREDITO'
                  ? 'border-slate-500 bg-slate-100 text-slate-900 shadow-sm ring-2 ring-slate-400 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm font-semibold'
              }`}
            >
              <div className="flex items-center gap-2">
                <Landmark size={18} className={categoriaActiva === 'CREDITO' ? 'text-slate-700 shrink-0' : 'text-slate-500 shrink-0'} />
                <span className="text-xs font-bold leading-tight">Crédito</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 border border-slate-200 text-slate-600">F4</kbd>
            </button>
          </div>

          {/* Sub-Barra de Transferencias (Nequi, Daviplata, QR Bancolombia) */}
          {categoriaActiva === 'TRANSFERENCIA' && (
            <div
              data-testid="sub-pills-transferencias"
              className="p-2.5 bg-slate-50 border border-indigo-200 rounded-xl flex flex-col gap-2 shadow-sm animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Destino de Transferencia:
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-medium">Teclas 1 - 3</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {/* Nequi */}
                <button
                  type="button"
                  data-testid="pill-transferencia-nequi"
                  onClick={() => handleSelectSubTransferencia('NEQUI')}
                  className={`flex items-center justify-center gap-1.5 min-h-[44px] h-11 py-1 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    subTransferencia === 'NEQUI'
                      ? 'bg-fuchsia-50 border-fuchsia-500 text-fuchsia-700 shadow-sm ring-2 ring-fuchsia-300'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone size={15} className={subTransferencia === 'NEQUI' ? 'text-fuchsia-600 shrink-0' : 'text-slate-400 shrink-0'} />
                  <span>Nequi</span>
                  <kbd className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 rounded text-slate-500">1</kbd>
                </button>

                {/* Daviplata */}
                <button
                  type="button"
                  data-testid="pill-transferencia-daviplata"
                  onClick={() => handleSelectSubTransferencia('DAVIPLATA')}
                  className={`flex items-center justify-center gap-1.5 min-h-[44px] h-11 py-1 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    subTransferencia === 'DAVIPLATA'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm ring-2 ring-rose-300'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Wallet size={15} className={subTransferencia === 'DAVIPLATA' ? 'text-rose-600 shrink-0' : 'text-slate-400 shrink-0'} />
                  <span>Daviplata</span>
                  <kbd className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 rounded text-slate-500">2</kbd>
                </button>

                {/* QR Bancolombia */}
                <button
                  type="button"
                  data-testid="pill-transferencia-qr_bancolombia"
                  onClick={() => handleSelectSubTransferencia('QR_BANCOLOMBIA')}
                  className={`flex items-center justify-center gap-1.5 min-h-[44px] h-11 py-1 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    subTransferencia === 'QR_BANCOLOMBIA'
                      ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm ring-2 ring-amber-300'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <QrCode size={15} className={subTransferencia === 'QR_BANCOLOMBIA' ? 'text-amber-600 shrink-0' : 'text-slate-400 shrink-0'} />
                  <span className="leading-tight">QR Bancolombia</span>
                  <kbd className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 rounded text-slate-500">3</kbd>
                </button>
              </div>
            </div>
          )}

          {/* Panel de Efectivo y Cambio Compacto para Laptops */}
          {metodoPago === 'EFECTIVO' && (
            <div className="flex flex-col gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Efectivo Recibido
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  Cobro: <b className="text-slate-900 font-black">${totalFinal.toLocaleString('es-CO')}</b>
                </span>
              </div>

              {/* Input de Efectivo + Botón Exacto en Línea (Targets >= 48px) */}
              <div className="flex gap-2 items-stretch">
                <div className="relative flex-1">
                  <NumericFormat
                    getInputRef={efectivoInputRef}
                    value={efectivoRecibido || ''}
                    onValueChange={(values) => setEfectivoRecibido(values.floatValue || 0)}
                    onFocus={(e) => (e.target as HTMLInputElement).select()}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    allowNegative={false}
                    prefix="$ "
                    placeholder="$ 0"
                    className="w-full min-h-[48px] h-12 px-3 rounded-xl border-2 border-slate-300 bg-white text-xl font-black text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all tabular-nums shadow-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setEfectivoRecibido(totalFinal)}
                  className="px-4 min-h-[48px] h-12 text-sm font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                  title="Pagar con monto exacto (Espacio)"
                >
                  <span>Exacto</span>
                  <kbd className="px-1.5 py-0.5 bg-white border border-indigo-200 rounded text-[10px] font-mono text-indigo-700 font-bold">Space</kbd>
                </button>
              </div>

              {/* Botones de Denominación Rápida Táctiles (Targets >= 48px) */}
              <div className="grid grid-cols-4 gap-1.5">
                {BILLETES_RAPIDOS_SUGERIDOS.map((denom) => (
                  <button
                    key={denom}
                    type="button"
                    onClick={() => setEfectivoRecibido(denom)}
                    className="min-h-[48px] h-12 px-1 text-sm font-black rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 transition-all tabular-nums text-center shadow-sm cursor-pointer active:scale-95"
                  >
                    ${(denom / 1000).toLocaleString('es-CO')}k
                  </button>
                ))}
              </div>

              {/* Visor de Cambio (Vuelto) con altura cómoda */}
              <div
                className={`min-h-[48px] py-2 px-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  calculoCambio.valido && calculoCambio.cambio > 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-sm'
                    : calculoCambio.valido && calculoCambio.cambio === 0
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-bold shadow-sm'
                    : 'bg-rose-50 border-rose-300 text-rose-800 font-bold shadow-sm'
                }`}
              >
                <span className="text-xs font-black uppercase tracking-wider">
                  {calculoCambio.valido
                    ? calculoCambio.cambio === 0
                      ? '✓ Pago Exacto'
                      : 'Cambio / Vuelto:'
                    : '⚠ Faltante:'}
                </span>
                <span
                  className="text-xl font-black tracking-tight tabular-nums font-mono"
                >
                  ${(calculoCambio.valido ? calculoCambio.cambio : calculoCambio.faltante).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Modo Mixto / Split Payment */
        <div className="flex flex-col gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-600">
              Total venta: <b className="text-slate-900 font-extrabold">${totalFinal.toLocaleString('es-CO')}</b>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                faltantePagoMixto === 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : faltantePagoMixto > 0
                  ? 'bg-amber-50 text-amber-700 border border-amber-300'
                  : 'bg-rose-50 text-rose-700 border border-rose-300'
              }`}
            >
              {faltantePagoMixto === 0
                ? '✓ Cuadrado Exacto'
                : faltantePagoMixto > 0
                ? `Faltan: $${faltantePagoMixto.toLocaleString('es-CO')}`
                : `Sobran: $${Math.abs(faltantePagoMixto).toLocaleString('es-CO')}`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'EFECTIVO' as const, label: 'Efectivo', icon: Banknote, color: 'text-emerald-600' },
              { id: 'NEQUI' as const, label: 'Nequi', icon: Smartphone, color: 'text-fuchsia-600' },
              { id: 'DAVIPLATA' as const, label: 'Daviplata', icon: Wallet, color: 'text-rose-600' },
              { id: 'QR_BANCOLOMBIA' as const, label: 'QR Bancolombia', icon: QrCode, color: 'text-amber-600' },
              { id: 'DATAFONO' as const, label: 'Datáfono', icon: CreditCard, color: 'text-sky-600' },
              { id: 'CREDITO' as const, label: 'Crédito', icon: Landmark, color: 'text-slate-700' },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.id} className="flex flex-col gap-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase">
                    <Icon size={13} className={m.color} /> {m.label}
                  </label>
                  <NumericFormat
                    value={pagosMixtos[m.id] || ''}
                    onValueChange={(values) => handleUpdatePagoMixto(m.id, values.floatValue || 0)}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    allowNegative={false}
                    prefix="$ "
                    placeholder="$ 0"
                    className="w-full min-h-[44px] h-11 px-3 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none tabular-nums shadow-xs"
                    disabled={isDisabled}
                  />
                </div>
              );
            })}
          </div>

          {pagosMixtos.CREDITO > 0 && !cliente && (
            <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
              <AlertCircle size={14} className="shrink-0" />
              <span>Debe asignar un cliente para procesar la porción a crédito.</span>
            </div>
          )}
        </div>
      )}

      {/* Selector Dual: Control Interno vs Facturación Electrónica DIAN */}
      <PosElectronicInvoiceToggle
        checked={requiereFacturaElectronica}
        onChange={setRequiereFacturaElectronica}
        cliente={cliente}
      />

      {/* Botón de Cobro Fricción Cero en 1 Clic (Regla del Niño de 12 Años: 1-Tap Checkout) */}
      <button
        type="button"
        onClick={handleCobroEfectivoExactoDirecto}
        disabled={isDisabled || !isTurnoAbierto || totalFinal <= 0}
        data-testid="btn-efectivo-exacto-directo"
        className={`w-full min-h-[48px] h-12 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
          !isTurnoAbierto || isDisabled || totalFinal <= 0
            ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border border-emerald-500 shadow-emerald-600/20 ring-2 ring-emerald-500/20'
        }`}
        title="Cobrar en 1 solo clic con total contado (Atajo: F8)"
        aria-label={`Cobro directo en un toque por ${totalFinal.toLocaleString('es-CO')} pesos (Atajo F8)`}
      >
        <Zap size={18} className={isTurnoAbierto && totalFinal > 0 ? 'text-amber-300 animate-pulse shrink-0' : 'text-slate-400 shrink-0'} />
        <span>⚡ Cobro Rápido 1-Tap</span>
        <span className="font-mono text-base font-extrabold ml-1">(${totalFinal.toLocaleString('es-CO')})</span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-black/25 rounded text-white font-bold ml-1.5">F8</kbd>
      </button>

      {/* Botones de Acción Táctiles Gigantes (Regla del Niño de 12 Años: Cobrar >= 56px, Borrador >= 48px) */}
      <div className="flex gap-2.5 items-stretch mt-1">
        <Button
          variant="outline"
          onClick={onGuardarBorrador}
          disabled={isDisabled}
          leftIcon={<Save size={18} />}
          className="flex-1 min-h-[48px] h-12 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          title="Guardar pedido como borrador / en espera (Atajo: F6)"
          aria-label="Poner pedido actual en espera (Atajo F6)"
        >
          <span>Borrador</span>
          <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-600 font-bold">F6</kbd>
        </Button>

        {!isTurnoAbierto ? (
          <Button
            variant="primary"
            onClick={handleCobrarClick}
            className="flex-[2] min-h-[56px] h-14 text-base font-black bg-amber-500 hover:bg-amber-600 text-slate-950 border-0 flex items-center justify-center gap-2 shadow-md active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            title="Abrir turno de caja (Atajo: Enter)"
            aria-label="Abrir turno de caja (Atajo Enter)"
          >
            <span>Abrir Turno Caja</span>
            <kbd className="px-2 py-0.5 text-xs font-mono bg-black/20 rounded text-slate-950 font-bold">Enter</kbd>
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleCobrarClick}
            disabled={isDisabled || (metodoPago === 'EFECTIVO' && !isModoMixto && !calculoCambio.valido)}
            className="flex-[2] min-h-[56px] h-14 text-base font-black bg-emerald-600 hover:bg-emerald-700 shadow-lg text-white flex items-center justify-center gap-2 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-400"
            data-testid="btn-cobrar"
            title="Procesar cobro del pedido (Atajo: F2 o Enter)"
            aria-label={`Cobrar pedido por valor de ${totalFinal.toLocaleString('es-CO')} pesos (Atajo F2 o Enter)`}
          >
            <span className="tracking-tight">Cobrar:</span>
            <span className="font-mono text-lg font-black tracking-normal">${totalFinal.toLocaleString('es-CO')}</span>
            <kbd className="px-2 py-0.5 text-xs font-mono bg-black/25 rounded text-white font-bold ml-1">F2 / ↵</kbd>
          </Button>
        )}
      </div>
    </div>
  );
};

