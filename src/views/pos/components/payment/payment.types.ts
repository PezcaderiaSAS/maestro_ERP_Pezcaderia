import type { ClientePOS } from '../../../../hooks/usePOSCart';

export type MetodoCobroPos =
  | 'EFECTIVO'
  | 'DATAFONO'
  | 'NEQUI'
  | 'DAVIPLATA'
  | 'QR_BANCOLOMBIA'
  | 'TRANSFERENCIA'
  | 'CREDITO'
  | 'MIXTO';

export interface SplitPaymentLineItem {
  id: string;
  metodo: MetodoCobroPos;
  monto: number;
  referencia?: string;
  autorizacion?: string;
  plazoDias?: number;
  fechaVencimiento?: string;
}

export interface PagoDetallePayload {
  metodo: MetodoCobroPos;
  monto: number;
  recibido?: number;
  vuelto?: number;
  referencia?: string;
  autorizacion?: string;
  plazoDias?: number;
  fechaVencimiento?: string;
}

export interface UnifiedPaymentPayload {
  montoTotal: number;
  totalRecibido: number;
  vueltoTotal: number;
  pagos: PagoDetallePayload[];
  requiereFacturaElectronica: boolean;
}

export interface UnifiedPaymentModalProps {
  isOpen: boolean;
  totalPagar: number;
  cliente?: ClientePOS | null;
  onClose: () => void;
  onConfirmPayment: (payload: UnifiedPaymentPayload) => Promise<void> | void;
  initialMethod?: MetodoCobroPos;
  saldoEfectivoGaveta?: number;
}

