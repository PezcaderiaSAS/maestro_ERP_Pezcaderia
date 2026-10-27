import React, { useState } from 'react';
import {
  Users,
  ShoppingBag,
  CheckCircle2,
  Package,
  PlusCircle,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Cliente } from '../../types/erp.types';
import { Producto } from '../../store/useInventoryStore';
import { LineaVentaExternaInput } from '../../contracts/b2b.contracts';
import { Pedido } from '../../types/orders.types';
import { b2bIntegrationService } from '../../services/b2bIntegrationService';
import { B2BClientSelectorStep } from './components/B2BClientSelectorStep';
import { B2BProductCatalogStep } from './components/B2BProductCatalogStep';
import { B2BCartSummaryStep } from './components/B2BCartSummaryStep';

export interface B2BExternalSalesViewProps {
  initialClientes?: Cliente[];
  initialProducts?: Producto[];
  initialStock?: Record<string, Record<string, number>>;
  vendedorId?: string;
  vendedorNombre?: string;
  onNavigateToKanban?: () => void;
}

export const B2BExternalSalesView: React.FC<B2BExternalSalesViewProps> = ({
  initialClientes,
  initialProducts,
  initialStock,
  vendedorId = 'vend-01',
  vendedorNombre = 'Carlos Vendedor',
  onNavigateToKanban,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [formaPago, setFormaPago] = useState<'CONTADO' | 'CREDITO'>('CREDITO');
  const [cartItems, setCartItems] = useState<LineaVentaExternaInput[]>([]);

  // Fecha por defecto mañana
  const defaultFechaEntrega = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [fechaEntrega, setFechaEntrega] = useState<string>(defaultFechaEntrega);
  const [jornada, setJornada] = useState<'MANANA' | 'TARDE'>('MANANA');
  const [observaciones, setObservaciones] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<Pedido | null>(null);

  // Manejo de productos en carrito
  const handleAddItem = (item: LineaVentaExternaInput) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.sku === item.sku);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = item;
        return updated;
      }
      return [...prev, item];
    });
  };

  const handleRemoveItem = (sku: string) => {
    setCartItems((prev) => prev.filter((i) => i.sku !== sku));
  };

  // Confirmar y Transmitir Pedido
  const handleConfirmOrder = async () => {
    if (!selectedCliente) return;
    if (cartItems.length === 0) return;

    try {
      setIsSubmitting(true);
      const nuevoPedido = await b2bIntegrationService.crearPedidoVentaExternaB2B({
        vendedorId,
        vendedorNombre,
        clienteId: selectedCliente.id,
        clienteNombre: selectedCliente.nombre,
        cliente: selectedCliente,
        bodegaId: '1', // Bodega Principal mandatoria
        formaPago,
        fechaEntrega,
        jornada,
        observaciones,
        lineas: cartItems,
      });

      setCreatedOrder(nuevoPedido);
    } catch (err) {
      console.error('Error al crear pedido de venta externa B2B:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reiniciar flujo para nuevo pedido
  const handleResetForNewOrder = () => {
    setCreatedOrder(null);
    setCurrentStep(1);
    setSelectedCliente(null);
    setCartItems([]);
    setObservaciones('');
    setFormaPago('CREDITO');
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="w-full min-h-screen bg-[#070A10] text-slate-100 p-3 md:p-6 flex flex-col gap-5 select-none">
      {/* Barra Superior de la Terminal Móvil */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between p-4 bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-600/90 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-600/30 border border-cyan-400/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black text-white leading-tight">
              Terminal Venta Externa B2B
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Vendedor: <strong className="text-slate-200">{vendedorNombre}</strong> • Bodega Principal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {createdOrder ? (
            <button
              type="button"
              onClick={handleResetForNewOrder}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5 hover:bg-cyan-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Nuevo Pedido</span>
            </button>
          ) : (
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>En Línea</span>
            </span>
          )}
        </div>
      </div>

      {/* Pantalla de Confirmación Exitosa (Post-Envío) */}
      {createdOrder ? (
        <div className="w-full max-w-2xl mx-auto p-6 md:p-8 bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-500/30 flex flex-col items-center text-center gap-5 animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              {createdOrder.estado === 'PAUSADO_POR_CREDITO'
                ? 'Pendiente de Aprobación de Cartera'
                : 'Enviado a Bodega Principal'}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white mt-2">
              Pedido Creado con Éxito
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Consecutivo oficial generado e inmutablemente registrado.
            </p>
          </div>

          <div className="w-full bg-slate-950/60 p-5 rounded-2xl border border-white/10 flex flex-col gap-2.5 text-left text-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-slate-400 font-medium">Número de Pedido:</span>
              <strong className="text-base font-black text-cyan-400">{createdOrder.numeroPedido}</strong>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-slate-400 font-medium">Cliente:</span>
              <strong className="text-slate-200">{selectedCliente?.nombre}</strong>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-slate-400 font-medium">Total Factura Estimado:</span>
              <strong className="text-base font-black font-mono text-emerald-400">
                {formatCOP(createdOrder.totalFinal)}
              </strong>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-slate-400 font-medium">Fecha de Entrega:</span>
              <strong className="text-slate-200">
                {createdOrder.fechaEntrega} ({createdOrder.jornada})
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Estado Inicial:</span>
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  createdOrder.estado === 'PAUSADO_POR_CREDITO'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {createdOrder.estado}
              </span>
            </div>
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetForNewOrder}
              className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>REGISTRAR OTRO PEDIDO</span>
            </button>

            {onNavigateToKanban && (
              <button
                type="button"
                onClick={onNavigateToKanban}
                className="h-14 px-6 rounded-2xl border border-white/10 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <span>VER TABLERO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Stepper Táctil Superior (3 Pasos) */}
          <div className="w-full max-w-4xl mx-auto grid grid-cols-3 gap-2">
            {[
              { step: 1, label: '1. Cliente', testId: 'b2b-stepper-step-1', icon: Users },
              { step: 2, label: '2. Catálogo', testId: 'b2b-stepper-step-2', icon: Package },
              { step: 3, label: '3. Resumen', testId: 'b2b-stepper-step-3', icon: FileCheck },
            ].map((s) => {
              const Icon = s.icon;
              const isCurrent = currentStep === s.step;
              const isDone = currentStep > s.step;

              return (
                <button
                  key={s.step}
                  data-testid={s.testId}
                  type="button"
                  disabled={s.step === 2 && !selectedCliente}
                  onClick={() => {
                    if (s.step === 1) setCurrentStep(1);
                    if (s.step === 2 && selectedCliente) setCurrentStep(2);
                    if (s.step === 3 && selectedCliente && cartItems.length > 0) setCurrentStep(3);
                  }}
                  className={`min-h-[48px] p-2.5 md:p-3 rounded-xl border font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-cyan-500/80 bg-cyan-950/40 text-cyan-200 shadow-md shadow-cyan-900/20'
                      : isDone
                      ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                      : 'border-white/10 bg-slate-900/40 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{s.label}</span>
                  {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Renderizado del Paso Activo */}
          {currentStep === 1 && (
            <B2BClientSelectorStep
              selectedCliente={selectedCliente}
              onSelectCliente={(c) => setSelectedCliente(c)}
              formaPago={formaPago}
              onChangeFormaPago={setFormaPago}
              onNext={() => setCurrentStep(2)}
              clientesList={initialClientes}
            />
          )}

          {currentStep === 2 && (
            <B2BProductCatalogStep
              selectedCliente={selectedCliente}
              cartItems={cartItems}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
              productsList={initialProducts}
              stockMap={initialStock}
            />
          )}

          {currentStep === 3 && selectedCliente && (
            <B2BCartSummaryStep
              selectedCliente={selectedCliente}
              cartItems={cartItems}
              formaPago={formaPago}
              fechaEntrega={fechaEntrega}
              onChangeFechaEntrega={setFechaEntrega}
              jornada={jornada}
              onChangeJornada={setJornada}
              observaciones={observaciones}
              onChangeObservaciones={setObservaciones}
              onRemoveItem={handleRemoveItem}
              onBack={() => setCurrentStep(2)}
              onConfirmOrder={handleConfirmOrder}
              isSubmitting={isSubmitting}
            />
          )}
        </>
      )}
    </div>
  );
};
