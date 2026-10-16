// src/views/pos/components/QuickConvertToElectronicInvoiceModal.tsx
import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
  Receipt,
  User,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useResolucionStore } from '../../../store/useResolucionStore';
import { resolucionService } from '../../../services/resolucionService';
import { siigoPayloadMapper } from '../../../services/siigoPayloadMapper';
import type {
  FacturaElectronicaRegistro,
  ResolucionVenta,
} from '../../../types/resoluciones.types';
import { Button } from '../../../components/ui/Button';

interface QuickConvertToElectronicInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  venta: any | null;
  onSuccess?: (factura: FacturaElectronicaRegistro) => void;
}

export const QuickConvertToElectronicInvoiceModal: React.FC<
  QuickConvertToElectronicInvoiceModalProps
> = ({ isOpen, onClose, venta, onSuccess }) => {
  const {
    getResolucionPredeterminada,
    addFacturaElectronica,
    enqueueSiigoItem,
    facturasElectronicas,
  } = useResolucionStore();

  const [nit, setNit] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudadDane, setCiudadDane] = useState('11001');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resFiscal = getResolucionPredeterminada('FACTURA_ELECTRONICA_DIAN');
  const facturaExistente = venta
    ? facturasElectronicas.find((f) => f.ventaId === venta.id)
    : undefined;

  useEffect(() => {
    if (isOpen && venta) {
      setNit(
        venta.clienteIdentificacion ||
          venta.clienteNit ||
          (venta.cliente?.identificacion !== '222222222222'
            ? venta.cliente?.identificacion || ''
            : '')
      );
      setRazonSocial(
        venta.clienteNombre ||
          venta.cliente?.nombre ||
          ''
      );
      setEmail(venta.cliente?.email || '');
      setDireccion(venta.cliente?.direccion || 'Calle 72 # 15-23');
      setCiudadDane(venta.cliente?.ciudadDane || '11001');
      setIsSubmitting(false);
    }
  }, [isOpen, venta]);

  if (!isOpen || !venta) return null;

  const totalVenta = Number(venta.totalFinal || venta.total || 0);
  const consecutivoInterno =
    venta.consecutivoInterno ||
    venta.consecutivo ||
    venta.id ||
    'VTA-GEN';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nit.trim() || !razonSocial.trim() || !email.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos fiscales incompletos',
        text: 'El NIT o Cédula, Razón Social y Correo Electrónico son obligatorios para la DIAN.',
      });
      return;
    }

    if (!resFiscal) {
      Swal.fire({
        icon: 'error',
        title: 'Sin resolución DIAN activa',
        text: 'No hay una resolución de Facturación Electrónica DIAN configurada en el sistema.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Consumir atómicamente el consecutivo fiscal DIAN
      const fiscalConsumido = resolucionService.consumirConsecutivoFiscal(resFiscal.id);

      // 2. Registrar la factura electrónica inmutable
      const nuevaFactura: FacturaElectronicaRegistro = {
        id: `fe-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ventaId: venta.id,
        resolucionId: resFiscal.id,
        prefijo: fiscalConsumido.prefijo,
        numeroConsecutivo: fiscalConsumido.numero,
        consecutivoCompleto: fiscalConsumido.consecutivoCompleto,
        fechaEmision: new Date().toISOString(),
        clienteNit: nit.trim(),
        clienteNombre: razonSocial.trim(),
        clienteEmail: email.trim(),
        clienteDireccion: direccion.trim(),
        clienteCiudadDane: ciudadDane.trim(),
        subtotal: Number(venta.subtotal || totalVenta),
        totalIva: Number(venta.totalIva || 0),
        total: totalVenta,
        estadoSiigo: 'PENDIENTE',
      };

      addFacturaElectronica(nuevaFactura);

      // 3. Encolar en la cola Outbox para Siigo Nube API v2
      const payloadSiigo = siigoPayloadMapper.buildInvoicePayload({
        venta,
        cliente: {
          identificacion: nit.trim(),
          nombre: razonSocial.trim(),
          email: email.trim(),
          direccion: direccion.trim(),
          ciudadDane: ciudadDane.trim(),
        },
        resolucion: resFiscal,
        consecutivoInterno,
      });

      enqueueSiigoItem({
        facturaElectronicaId: nuevaFactura.id,
        ventaId: venta.id,
        consecutivoCompleto: nuevaFactura.consecutivoCompleto,
        estado: 'PENDIENTE',
        maxIntentos: 5,
        proximoIntento: new Date().toISOString(),
        payloadSiigo,
      });

      Swal.fire({
        icon: 'success',
        title: 'Factura Electrónica Emitida',
        html: `Se asignó el consecutivo fiscal <strong>${nuevaFactura.consecutivoCompleto}</strong>.<br/>El documento fue encolado para transmisión a SIIGO Nube.<br/><span style="font-size:11px;color:#64748b">Nota: No se modificó el inventario físico ni el arqueo de caja previo.</span>`,
        confirmButtonColor: '#0284c7',
      });

      if (onSuccess) {
        onSuccess(nuevaFactura);
      }
      onClose();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error al emitir factura electrónica',
        text: err.message || 'No se pudo completar la emisión.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-in text-slate-900">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 tracking-tight">
                Post-Facturación Electrónica DIAN
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Venta {consecutivoInterno} • Monto: ${totalVenta.toLocaleString('es-CO')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Factura ya existente */}
        {facturaExistente ? (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              Esta venta ya cuenta con Factura Electrónica
            </h3>
            <p className="text-xs text-slate-600">
              Consecutivo Fiscal:{' '}
              <strong className="font-mono text-blue-600 text-sm">
                {facturaExistente.consecutivoCompleto}
              </strong>
              <br />
              Emitida a:{' '}
              <strong>
                {facturaExistente.clienteNombre} ({facturaExistente.clienteNit})
              </strong>
              <br />
              Estado en Siigo:{' '}
              <span className="font-bold text-emerald-700">
                {facturaExistente.estadoSiigo}
              </span>
            </p>
            <Button
              variant="outline"
              onClick={onClose}
              className="mt-2 min-h-[44px] px-6 font-bold"
            >
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {/* Aviso informativo de no duplicación */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 leading-relaxed flex items-start gap-2">
              <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <span>
                Esta acción asignará el siguiente consecutivo correlativo DIAN de{' '}
                <strong>{resFiscal?.prefijo || 'FEVP'}</strong> para SIIGO Nube.
                <strong> No descontará doble stock ni alterará la caja.</strong>
              </span>
            </div>

            {/* Inputs de datos del cliente */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIT o Cédula del Cliente *
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 px-3 py-2 focus-within:border-blue-500">
                  <User size={15} className="text-slate-400 mr-2" />
                  <input
                    type="text"
                    required
                    placeholder="Ej: 900123456"
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    className="w-full text-xs font-semibold outline-none bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razón Social o Nombre *
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 px-3 py-2 focus-within:border-blue-500">
                  <Building2 size={15} className="text-slate-400 mr-2" />
                  <input
                    type="text"
                    required
                    placeholder="Ej: Restaurante El Marino"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="w-full text-xs font-semibold outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico (Recepción DIAN) *
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 px-3 py-2 focus-within:border-blue-500">
                <Mail size={15} className="text-slate-400 mr-2" />
                <input
                  type="email"
                  required
                  placeholder="Ej: contabilidad@cliente.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-semibold outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección Física
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 px-3 py-2 focus-within:border-blue-500">
                  <MapPin size={15} className="text-slate-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Ej: Calle 72 # 15-23"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full text-xs outline-none bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cód. DANE
                </label>
                <input
                  type="text"
                  placeholder="11001"
                  value={ciudadDane}
                  onChange={(e) => setCiudadDane(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-blue-500 outline-none font-mono"
                />
              </div>
            </div>

            {/* Footer con botón gigante >= 56px */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
                className="min-h-[48px] h-12 px-4 font-semibold"
              >
                Cancelar
              </Button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[56px] h-14 px-6 font-extrabold text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Send size={18} />
                <span>{isSubmitting ? 'Emitiendo...' : 'Emitir Factura Electrónica'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
