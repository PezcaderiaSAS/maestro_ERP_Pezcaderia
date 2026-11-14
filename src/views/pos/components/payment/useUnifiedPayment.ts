import { useState, useMemo, useEffect, useCallback } from 'react';
import type { ClientePOS } from '../../../../hooks/usePOSCart';
import type {
  MetodoCobroPos,
  SplitPaymentLineItem,
  UnifiedPaymentPayload,
  PagoDetallePayload,
} from './payment.types';

export interface UseUnifiedPaymentOptions {
  totalPagar: number;
  cliente?: ClientePOS | null;
  onConfirmPayment: (payload: UnifiedPaymentPayload) => Promise<void> | void;
  onClose: () => void;
  initialMethod?: MetodoCobroPos;
  isOpen: boolean;
}

export function useUnifiedPayment({
  totalPagar,
  cliente,
  onConfirmPayment,
  onClose,
  initialMethod = 'EFECTIVO',
  isOpen,
}: UseUnifiedPaymentOptions) {
  // 1. Estados principales (sin retornos tempranos condicionales)
  const [metodoActivo, setMetodoActivo] = useState<MetodoCobroPos>(initialMethod);
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(0);
  const [referenciaComprobante, setReferenciaComprobante] = useState<string>('');
  const [autorizacionTarjeta, setAutorizacionTarjeta] = useState<string>('');
  const [plazoDiasCredito, setPlazoDiasCredito] = useState<number>(30);
  const [requiereFacturaElectronica, setRequiereFacturaElectronica] = useState<boolean>(
    Boolean(cliente?.exigeFacturaElectronica)
  );

  // Líneas para modo fraccionado / mixto
  const [lineasMixtas, setLineasMixtas] = useState<SplitPaymentLineItem[]>(() => [
    {
      id: 'split-1',
      metodo: 'EFECTIVO',
      monto: totalPagar,
    },
  ]);

  // Reiniciar estado cada vez que se abra el modal
  useEffect(() => {
    if (isOpen) {
      setMetodoActivo(initialMethod);
      setEfectivoRecibido(0);
      setReferenciaComprobante('');
      setAutorizacionTarjeta('');
      setPlazoDiasCredito(30);
      setRequiereFacturaElectronica(Boolean(cliente?.exigeFacturaElectronica));
      setLineasMixtas([
        {
          id: `split-${Date.now()}-1`,
          metodo: 'EFECTIVO',
          monto: totalPagar,
        },
      ]);
    }
  }, [isOpen, totalPagar, initialMethod, cliente]);

  // 2. Billetes rápidos sugeridos en COP
  const billetesSugeridos = useMemo(() => {
    const sugeridos: number[] = [totalPagar]; // Botón Exacto
    const denominaciones = [10000, 20000, 50000, 100000];

    denominaciones.forEach((den) => {
      if (den > totalPagar && !sugeridos.includes(den)) {
        sugeridos.push(den);
      }
    });

    // Múltiplos superiores de 10k o 50k
    const siguienteRedondo = Math.ceil(totalPagar / 10000) * 10000;
    if (siguienteRedondo > totalPagar && !sugeridos.includes(siguienteRedondo)) {
      sugeridos.push(siguienteRedondo);
    }
    const siguienteCincuenta = Math.ceil(totalPagar / 50000) * 50000;
    if (siguienteCincuenta > totalPagar && !sugeridos.includes(siguienteCincuenta)) {
      sugeridos.push(siguienteCincuenta);
    }

    return Array.from(new Set(sugeridos)).sort((a, b) => a - b);
  }, [totalPagar]);

  // 3. Cálculos reactivos de Efectivo
  const vueltoEfectivo = useMemo(() => {
    return Math.max(0, efectivoRecibido - totalPagar);
  }, [efectivoRecibido, totalPagar]);

  const saldoFaltanteEfectivo = useMemo(() => {
    return Math.max(0, totalPagar - efectivoRecibido);
  }, [efectivoRecibido, totalPagar]);

  // 4. Cálculos reactivos de Pago Mixto
  const totalMixtoAsignado = useMemo(() => {
    return lineasMixtas.reduce((acc, l) => acc + (Number(l.monto) || 0), 0);
  }, [lineasMixtas]);

  const saldoRestanteMixto = useMemo(() => {
    return Math.max(0, totalPagar - totalMixtoAsignado);
  }, [totalPagar, totalMixtoAsignado]);

  // 5. Cálculos reactivos de Crédito
  const cupoDisponibleCliente = useMemo(() => {
    return Number(cliente?.cupoCredito || 0);
  }, [cliente]);

  const esCreditoExcedido = useMemo(() => {
    if (metodoActivo !== 'CREDITO') return false;
    return totalPagar > cupoDisponibleCliente;
  }, [metodoActivo, totalPagar, cupoDisponibleCliente]);

  const fechaVencimientoCredito = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + plazoDiasCredito);
    return d.toISOString().split('T')[0];
  }, [plazoDiasCredito]);

  // 6. Validación global de confirmación
  const puedeConfirmar = useMemo(() => {
    if (!isOpen || totalPagar <= 0) return false;

    switch (metodoActivo) {
      case 'EFECTIVO':
        return efectivoRecibido >= totalPagar;
      case 'DATAFONO':
      case 'NEQUI':
      case 'DAVIPLATA':
      case 'QR_BANCOLOMBIA':
      case 'TRANSFERENCIA':
        return true;
      case 'CREDITO':
        return !esCreditoExcedido && Boolean(cliente);
      case 'MIXTO':
        return Math.abs(totalMixtoAsignado - totalPagar) < 0.01 && lineasMixtas.length > 0;
      default:
        return false;
    }
  }, [
    isOpen,
    totalPagar,
    metodoActivo,
    efectivoRecibido,
    esCreditoExcedido,
    cliente,
    totalMixtoAsignado,
    lineasMixtas.length,
  ]);

  // 7. Acciones sobre líneas mixtas
  const handleAgregarLineaMixta = useCallback(() => {
    setLineasMixtas((prev) => [
      ...prev,
      {
        id: `split-${Date.now()}-${prev.length + 1}`,
        metodo: 'DATAFONO',
        monto: saldoRestanteMixto,
      },
    ]);
  }, [saldoRestanteMixto]);

  const handleActualizarLineaMixta = useCallback(
    (id: string, updates: Partial<SplitPaymentLineItem>) => {
      setLineasMixtas((prev) =>
        prev.map((line) => (line.id === id ? { ...line, ...updates } : line))
      );
    },
    []
  );

  const handleEliminarLineaMixta = useCallback((id: string) => {
    setLineasMixtas((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }, []);

  // 8. Confirmación y construcción del payload
  const handleConfirmarPago = useCallback(() => {
    if (!puedeConfirmar) return;

    let pagos: PagoDetallePayload[] = [];
    let totalRecibido = totalPagar;
    let vueltoTotal = 0;

    if (metodoActivo === 'EFECTIVO') {
      totalRecibido = efectivoRecibido;
      vueltoTotal = vueltoEfectivo;
      pagos = [
        {
          metodo: 'EFECTIVO',
          monto: totalPagar,
          recibido: efectivoRecibido,
          vuelto: vueltoEfectivo,
        },
      ];
    } else if (metodoActivo === 'CREDITO') {
      pagos = [
        {
          metodo: 'CREDITO',
          monto: totalPagar,
          plazoDias: plazoDiasCredito,
          fechaVencimiento: fechaVencimientoCredito,
        },
      ];
    } else if (metodoActivo === 'MIXTO') {
      pagos = lineasMixtas.map((l) => ({
        metodo: l.metodo,
        monto: l.monto,
        referencia: l.referencia,
        autorizacion: l.autorizacion,
      }));
    } else {
      // Datáfono, Transferencias y QRs
      pagos = [
        {
          metodo: metodoActivo,
          monto: totalPagar,
          referencia: referenciaComprobante || undefined,
          autorizacion: autorizacionTarjeta || undefined,
        },
      ];
    }

    const payload: UnifiedPaymentPayload = {
      montoTotal: totalPagar,
      totalRecibido,
      vueltoTotal,
      pagos,
      requiereFacturaElectronica,
    };

    onConfirmPayment(payload);
  }, [
    puedeConfirmar,
    metodoActivo,
    totalPagar,
    efectivoRecibido,
    vueltoEfectivo,
    plazoDiasCredito,
    fechaVencimientoCredito,
    lineasMixtas,
    referenciaComprobante,
    autorizacionTarjeta,
    requiereFacturaElectronica,
    onConfirmPayment,
  ]);

  // 8.1 Cobro Directo en Efectivo Exacto (Regla 12 Años / 1-Tap Checkout / F8)
  const handleCobroEfectivoExactoDirecto = useCallback(() => {
    if (totalPagar <= 0) return;
    onConfirmPayment({
      montoTotal: totalPagar,
      totalRecibido: totalPagar,
      vueltoTotal: 0,
      pagos: [
        {
          metodo: 'EFECTIVO',
          monto: totalPagar,
          recibido: totalPagar,
          vuelto: 0,
        },
      ],
      requiereFacturaElectronica,
    });
    onClose();
  }, [totalPagar, onConfirmPayment, requiereFacturaElectronica, onClose]);

  // 9. Manejador de atajos de teclado globales
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape siempre cierra el modal
      if (e.key === 'Escape' || e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      // F8 o 1-Tap: Cobro en Efectivo Exacto Directo
      if (e.key === 'F8') {
        e.preventDefault();
        e.stopPropagation();
        handleCobroEfectivoExactoDirecto();
        return;
      }

      // Enter o F9 confirma el pago si es válido y no está en un textarea
      if (e.key === 'Enter' || e.code === 'Enter' || e.key === 'F9') {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag !== 'textarea') {
          if (puedeConfirmar) {
            e.preventDefault();
            e.stopPropagation();
            handleConfirmarPago();
          }
        }
        return;
      }

      // Atajos numéricos 1..5 sólo cuando no se está digitando en un input o select
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';
      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '1') setMetodoActivo('EFECTIVO');
        else if (e.key === '2') setMetodoActivo('DATAFONO');
        else if (e.key === '3') setMetodoActivo('TRANSFERENCIA');
        else if (e.key === '4') setMetodoActivo('CREDITO');
        else if (e.key === '5') setMetodoActivo('MIXTO');
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, onClose, puedeConfirmar, handleConfirmarPago, handleCobroEfectivoExactoDirecto]);

  return {
    metodoActivo,
    setMetodoActivo,
    efectivoRecibido,
    setEfectivoRecibido,
    billetesSugeridos,
    vueltoEfectivo,
    saldoFaltanteEfectivo,
    lineasMixtas,
    totalMixtoAsignado,
    saldoRestanteMixto,
    handleAgregarLineaMixta,
    handleActualizarLineaMixta,
    handleEliminarLineaMixta,
    cupoDisponibleCliente,
    esCreditoExcedido,
    plazoDiasCredito,
    setPlazoDiasCredito,
    fechaVencimientoCredito,
    referenciaComprobante,
    setReferenciaComprobante,
    autorizacionTarjeta,
    setAutorizacionTarjeta,
    requiereFacturaElectronica,
    setRequiereFacturaElectronica,
    puedeConfirmar,
    handleConfirmarPago,
    handleCobroEfectivoExactoDirecto,
  };
}

