import React, { useState } from 'react';
import { X, Truck, QrCode, Thermometer, FileText, Download, CheckCircle2 } from 'lucide-react';
import { b2bDispatchService } from '../../../services/b2bDispatchService';
import { wmsRemisionPdfService } from '../../../services/wmsRemisionPdfService';
import { WmsDispatchRemision, WmsDispatchItem } from '../../../../packages/validation-schemas/src/b2bDispatch.schema';

interface WmsRemisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: any;
  onDispatchConfirmed: (remision: WmsDispatchRemision) => void;
}

export const WmsRemisionModal: React.FC<WmsRemisionModalProps> = ({
  isOpen,
  onClose,
  pedido,
  onDispatchConfirmed,
}) => {
  const [conductor, setConductor] = useState<string>('Carlos Mario Restrepo');
  const [placa, setPlaca] = useState<string>('WMA-842');
  const [temperaturaSalida, setTemperaturaSalida] = useState<string>('2.2');
  const [notas, setNotas] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [remisionGenerada, setRemisionGenerada] = useState<WmsDispatchRemision | null>(null);

  if (!isOpen || !pedido) return null;

  const lines: any[] = pedido.lineas || pedido.items || [];
  
  // Transform lines to WmsDispatchItem
  const itemsDispatched: WmsDispatchItem[] = lines.map((l: any, idx: number) => {
    const peso = Number(l.pesoReal || l.cantidadAlistada || l.cantidadSolicitada || l.cantidad || 1);
    const piezas = l.piezasAlistadas || l.piezasSolicitadas || undefined;
    const precio = Number(l.precioPactado || l.precio || l.precioUnitario || 0);
    return {
      lineaPedidoId: l.id || `line-${idx}`,
      productoId: l.productoId || l.id || `prod-${idx}`,
      nombreProducto: l.nombre || l.nombreProducto || l.productoNombre || `Producto #${idx + 1}`,
      pesoDespachadoKg: peso,
      piezasDespachadas: piezas,
      precioUnitario: precio,
      subtotal: Math.round(peso * precio),
      loteFefo: l.loteSeleccionado || l.loteFefo || 'LOTE-FEFO-DEFAULT',
      temperaturaSalidaC: parseFloat(temperaturaSalida) || 2.0,
      corte: l.especificaciones?.corte || l.corte,
      empaque: l.especificaciones?.empaque || l.empaque,
    };
  });

  const pesoTotalNeto = itemsDispatched.reduce((acc, it) => acc + it.pesoDespachadoKg, 0);
  const piezasTotales = itemsDispatched.reduce((acc, it) => acc + (it.piezasDespachadas || 0), 0);
  const valorTotal = itemsDispatched.reduce((acc, it) => acc + it.subtotal, 0);

  const handleConfirmarDespacho = async () => {
    setIsProcessing(true);
    try {
      const year = new Date().getFullYear();
      const randomConsecutivo = Math.floor(1000 + Math.random() * 9000);
      const numeroRemision = `REM-${year}-${randomConsecutivo}`;
      const tokenQr = crypto.randomUUID().replace(/-/g, '');

      const remisionData: WmsDispatchRemision = {
        numeroRemision,
        pedidoId: pedido.id,
        clienteId: pedido.clienteId || 'cli-generic',
        clienteNombre: pedido.clienteNombre || pedido.cliente?.nombre || 'Cliente B2B',
        direccionEntrega: pedido.direccionEntrega || pedido.cliente?.direccion || 'Sede Principal Restaurante',
        transportistaNombre: conductor.trim(),
        placaVehiculo: placa.trim().toUpperCase(),
        temperaturaSalidaC: parseFloat(temperaturaSalida) || 2.0,
        tokenQr,
        pesoTotalNetoKg: Number(pesoTotalNeto.toFixed(3)),
        piezasTotales,
        items: itemsDispatched,
        estado: 'EN_RUTA',
        fechaDespacho: new Date().toISOString(),
        notas: notas.trim() || undefined,
      };

      // Guardar en Supabase / Backend
      await b2bDispatchService.crearRemisionDespachoWMS(remisionData);

      // Generar y descargar el PDF en cliente
      wmsRemisionPdfService.descargarRemisionPDF(remisionData);

      setRemisionGenerada(remisionData);
      onDispatchConfirmed(remisionData);
    } catch (err) {
      console.error('Error al generar remisión:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-white overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Despacho & Emisión de Remisión WMS con QR</h3>
              <p className="text-xs text-slate-400">
                Pedido: <strong className="text-white">{pedido.numeroPedido || pedido.numeroCotizacion || pedido.id}</strong> | Cliente: <strong className="text-slate-200">{pedido.clienteNombre || pedido.cliente?.nombre || 'B2B'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {remisionGenerada ? (
          /* Vista de Confirmación Exitosa con QR */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-white">¡Despacho Registrado Exitosamente!</h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Se ha generado la remisión <strong className="text-emerald-400">{remisionGenerada.numeroRemision}</strong> y el PDF se ha descargado automáticamente.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-w-sm mx-auto flex items-center justify-center gap-4">
              <QrCode className="w-16 h-16 text-cyan-400" />
              <div className="text-left text-xs">
                <div className="font-mono font-bold text-white">{remisionGenerada.numeroRemision}</div>
                <div className="text-slate-400 mt-1">Conductor: {remisionGenerada.transportistaNombre}</div>
                <div className="text-slate-400">Placas: {remisionGenerada.placaVehiculo}</div>
                <div className="text-cyan-400 font-semibold mt-1">Temperatura: {remisionGenerada.temperaturaSalidaC}°C</div>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => wmsRemisionPdfService.descargarRemisionPDF(remisionGenerada)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-2 border border-slate-700"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                Descargar PDF Nuevamente
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500"
              >
                Cerrar y Continuar
              </button>
            </div>
          </div>
        ) : (
          /* Formulario de Emisión */
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Conductor / Transportador</label>
                <input
                  type="text"
                  value={conductor}
                  onChange={(e) => setConductor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Placa Vehículo Refrigerado</label>
                <input
                  type="text"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase text-xs font-bold focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                  Temp. Salida (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temperaturaSalida}
                  onChange={(e) => setTemperaturaSalida(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-xs focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Tabla resumida de productos alistados */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
                <span>Productos Alistados para Despacho ({itemsDispatched.length})</span>
                <span className="text-emerald-400 font-mono">
                  Total Peso: {pesoTotalNeto.toFixed(3)} KG {piezasTotales > 0 ? `(${piezasTotales} und)` : ''}
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/80">
                {itemsDispatched.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{it.nombreProducto}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Lote: {it.loteFefo} | {it.corte || 'Estándar'} ({it.empaque || 'Hielo'})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white">{it.pesoDespachadoKg.toFixed(3)} KG</div>
                      <div className="text-[11px] font-mono text-emerald-400">
                        ${it.subtotal.toLocaleString('es-CO')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Notas / Novedades de Salida</label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. 'Caja de poliestireno sellada con precinto azul #0421'"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            {/* Acciones */}
            <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessing || !conductor.trim() || !placa.trim()}
                onClick={handleConfirmarDespacho}
                className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/20 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {isProcessing ? 'Generando...' : 'Confirmar Despacho & Emitir Remisión QR'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
