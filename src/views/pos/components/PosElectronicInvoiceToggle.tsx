// src/views/pos/components/PosElectronicInvoiceToggle.tsx
import React from 'react';
import { FileText, Receipt, ShieldCheck, AlertCircle } from 'lucide-react';
import { useResolucionStore } from '../../../store/useResolucionStore';

interface PosElectronicInvoiceToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  cliente?: {
    id?: string;
    nombre?: string;
    identificacion?: string;
    email?: string;
  } | null;
  disabled?: boolean;
}

export const PosElectronicInvoiceToggle: React.FC<PosElectronicInvoiceToggleProps> = ({
  checked,
  onChange,
  cliente,
  disabled = false,
}) => {
  const getResolucionPredeterminada = useResolucionStore(
    (s) => s.getResolucionPredeterminada
  );

  const resFiscal = getResolucionPredeterminada('FACTURA_ELECTRONICA_DIAN');
  const resInterna = getResolucionPredeterminada('CONTROL_INTERNO');

  const prefijoFiscal = resFiscal?.prefijo || 'FEVP';
  const proximoFiscal = resFiscal ? resFiscal.consecutivoActual + 1 : 1;
  const prefijoInterno = resInterna?.prefijo || 'VTA';
  const proximoInterno = resInterna ? resInterna.consecutivoActual + 1 : 1;

  const isClienteIncompleto =
    checked &&
    (!cliente?.identificacion ||
      cliente.identificacion === '222222222222' ||
      !cliente.email);

  return (
    <div className="pos-electronic-invoice-toggle flex flex-col gap-1.5 w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-full min-h-[48px] h-auto p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer select-none active:scale-98 ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
        } ${
          checked
            ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-2xs'
            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
        }`}
        title="Alternar entre Tirilla de Control Interno y Factura Electrónica Oficial DIAN"
        aria-label="Alternar facturación electrónica DIAN"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-2 rounded-lg shrink-0 transition-colors ${
              checked
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {checked ? <FileText size={18} /> : <Receipt size={18} />}
          </div>

          <div className="flex flex-col text-left min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-xs sm:text-sm tracking-tight truncate">
                {checked
                  ? 'Factura Electrónica DIAN'
                  : 'Tirilla Control Interno'}
              </span>
              <span
                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  checked
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                {checked
                  ? `${prefijoFiscal}-${proximoFiscal}`
                  : `${prefijoInterno}-${proximoInterno}`}
              </span>
            </div>

            <span className="text-[11px] text-slate-500 font-medium truncate">
              {checked
                ? 'Genera comprobante oficial para Siigo Nube API v2'
                : 'Control operativo de stock y caja sin timbrado DIAN'}
            </span>
          </div>
        </div>

        {/* Switch táctil ergonómico */}
        <div
          className={`w-11 h-6 shrink-0 rounded-full transition-colors relative flex items-center p-0.5 ${
            checked ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
      </button>

      {/* Advertencia si el cliente requiere datos para DIAN */}
      {isClienteIncompleto && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
          <AlertCircle size={13} className="shrink-0 text-amber-600" />
          <span className="truncate">
            Sugerencia: Selecciona un cliente con NIT y correo para envío automático por Siigo.
          </span>
        </div>
      )}
    </div>
  );
};
