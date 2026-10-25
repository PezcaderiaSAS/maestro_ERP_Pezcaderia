/**
 * ============================================================================
 * LA PEZCADERIA ERP — VISTA PRINCIPAL: B2BCustomerPortalView
 * ============================================================================
 * Portal de Clientes B2B Auto-Servicio para Canal HORECA (Restaurantes y Hoteles).
 * Permite a los clientes o agentes comerciales:
 * 1. Consultar catálogo marítimo con tarifas preferenciales pactadas.
 * 2. Configurar cortes de precisión (filete, rodajas, entero) y empaque térmico con hielo.
 * 3. Monitorear cupo de crédito y estado de cartera en tiempo real.
 * 4. Repetir compras recurrentes con plantillas en 1 solo clic.
 * 5. Trazar en vivo la preparación, báscula, remisión y temperatura en ruta.
 */

import React, { useState } from 'react';
import {
  ShoppingBag,
  Clock,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Calendar,
  CreditCard,
  Truck,
  X,
  FileText,
  AlertCircle,
  ChevronRight,
  Eye,
} from 'lucide-react';
import Swal from 'sweetalert2';

import { useB2BCustomerPortal } from '../../../hooks/useB2BCustomerPortal';
import { useB2BCart } from '../../../hooks/useB2BCart';
import {
  B2BClientHeaderBar,
  B2BCreditCardSummary,
  B2BCatalogGrid,
  B2BItemConfiguratorModal,
  B2BRecurringTemplatesDrawer,
  B2BOrderTrackingTimeline,
} from './components';

import type {
  B2BCatalogProductItem,
  B2BDeliverySchedule,
  B2BPaymentMethod,
  B2BOrderRecord,
} from '../../../types/b2bCustomerPortal.types';

export const B2BCustomerPortalView: React.FC = () => {
  const portal = useB2BCustomerPortal();
  const cart = useB2BCart();

  // Modales y drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [productoAConfigurar, setProductoAConfigurar] = useState<B2BCatalogProductItem | null>(null);

  // Configuración de entrega en checkout
  const [fechaRequerida, setFechaRequerida] = useState(() => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const anio = manana.getFullYear();
    const mes = String(manana.getMonth() + 1).padStart(2, '0');
    const dia = String(manana.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  });

  const [jornada, setJornada] = useState<B2BDeliverySchedule>('MANANA');
  const [formaPago, setFormaPago] = useState<B2BPaymentMethod>('CREDITO_B2B');
  const [activeTab, setActiveTab] = useState<'catalogo' | 'historial'>('catalogo');

  // Manejo de Agregar Producto configurado
  const handleAddToCart = (
    producto: B2BCatalogProductItem,
    config: {
      corte: any;
      empaque: any;
      modalidadVenta: any;
      cantidad: number;
      piezas?: number;
      observaciones?: string;
    }
  ) => {
    cart.agregarItem(producto, config);
    setProductoAConfigurar(null);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `${producto.nombre} agregado al pedido`,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  };

  // Manejo de Envío de Pedido
  const handleEnviarPedido = () => {
    if (cart.items.length === 0) {
      Swal.fire({
        title: 'Carrito Vacío',
        text: 'Por favor agrega al menos un producto al pedido.',
        icon: 'warning',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    const resultado = portal.enviarPedidoDesdeCarrito(cart, {
      fechaRequeridaEntrega: fechaRequerida,
      jornadaRequerida: jornada,
      formaPago,
      instruccionesCocina: cart.instruccionesCocina,
    });

    if (resultado.success && resultado.data) {
      setIsCartOpen(false);
      const orden = resultado.data;

      if (orden.estado === 'PENDIENTE_APROBACION_CARTERA') {
        Swal.fire({
          title: 'Pedido Transmitido (En Revisión de Cartera)',
          html: `<p>El pedido <strong>#${orden.numeroPedido}</strong> supera el cupo de crédito disponible.</p><p class="text-sm text-slate-500 mt-2">Ha sido enviado a la gerencia financiera para autorización express.</p>`,
          icon: 'info',
          confirmButtonColor: '#2563eb',
        });
      } else {
        Swal.fire({
          title: '¡Pedido Confirmado en Bodega!',
          html: `<p>El pedido <strong>#${orden.numeroPedido}</strong> ha ingresado a la cola de alistamiento y despiece.</p>`,
          icon: 'success',
          confirmButtonColor: '#16a34a',
        });
      }
    } else {
      Swal.fire({
        title: 'Error al Procesar',
        text: resultado.error || 'No se pudo generar el pedido.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  // Reordenar instantáneo desde plantilla
  const handleReordenarPlantilla = (plantillaId: string) => {
    const res = portal.reordenarDesdePlantilla(plantillaId);
    if (res.success && res.data) {
      setIsTemplatesOpen(false);
      Swal.fire({
        title: '¡Re-Orden Generada!',
        text: `El pedido recurrente #${res.data.numeroPedido} fue programado exitosamente.`,
        icon: 'success',
        confirmButtonColor: '#16a34a',
      });
    } else {
      Swal.fire({
        title: 'Error al Re-Ordenar',
        text: res.error || 'No se pudo generar la orden desde la plantilla.',
        icon: 'error',
      });
    }
  };

  return (
    <div
      data-testid="b2b-customer-portal-view"
      className="min-h-screen bg-slate-50 text-slate-900 pb-16"
    >
      {/* 1. Barra de Encabezado Superior */}
      <B2BClientHeaderBar
        clientes={portal.clientes}
        clienteActivo={portal.clienteActivo}
        onSeleccionarCliente={portal.seleccionarCliente}
        sucursalSeleccionadaId={portal.sucursalSeleccionada?.id || ''}
        onSeleccionarSucursal={portal.setSucursalSeleccionadaId}
        itemCount={cart.itemCount}
        totalEstimadoCop={cart.totalEstimadoCop}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        modoAcceso={portal.modoAcceso}
        onToggleModoAcceso={() =>
          portal.setModoAcceso((prev) =>
            prev === 'ERP_COMERCIAL' ? 'PORTAL_CLIENTE' : 'ERP_COMERCIAL'
          )
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 2. Resumen de Crédito y Cartera */}
        <B2BCreditCardSummary
          cartera={portal.cartera}
          cliente={portal.clienteActivo}
        />

        {/* 3. Pestañas de Navegación del Portal: Catálogo vs Historial */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="tab-catalogo"
              onClick={() => setActiveTab('catalogo')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'catalogo'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Catálogo de Pescadería
            </button>
            <button
              type="button"
              data-testid="tab-historial"
              onClick={() => setActiveTab('historial')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'historial'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Historial & Trazabilidad</span>
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-slate-200 text-slate-800">
                {portal.historialPedidos.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            Precios pactados para canal: <strong>{portal.clienteActivo?.tipoPrecio || 'RESTAURANTE'}</strong>
          </div>
        </div>

        {/* 4. Contenido según pestaña */}
        {activeTab === 'catalogo' ? (
          <B2BCatalogGrid
            catalogo={portal.catalogo}
            categorias={portal.categorias}
            categoriaSeleccionada={portal.categoriaSeleccionada}
            onSelectCategoria={portal.setCategoriaSeleccionada}
            busqueda={portal.busqueda}
            onSearchChange={portal.setBusqueda}
            onSelectProduct={(producto) => setProductoAConfigurar(producto)}
          />
        ) : (
          <div
            data-testid="b2b-order-history-section"
            className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Historial de Pedidos HORECA</h3>
                <p className="text-xs text-slate-500">
                  Consulte estados de alistamiento, pesaje real y remisiones emitidas
                </p>
              </div>
            </div>

            {portal.historialPedidos.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Clock className="w-10 h-10 mx-auto text-slate-400" />
                <p className="font-medium text-sm">No registra pedidos recientes</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Consecutivo</th>
                      <th className="px-4 py-3">Fecha Entrega</th>
                      <th className="px-4 py-3">Sucursal</th>
                      <th className="px-4 py-3">Total Est.</th>
                      <th className="px-4 py-3">Estado WMS</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {portal.historialPedidos.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          #{pedido.numeroPedido}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {pedido.fechaRequeridaEntrega} ({pedido.jornadaRequerida})
                        </td>
                        <td className="px-4 py-3 text-slate-600">{pedido.sucursalEntrega}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          ${pedido.totalEstimadoCop.toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              pedido.estado === 'ENTREGADO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : pedido.estado === 'EN_RUTA_FRIO'
                                ? 'bg-blue-100 text-blue-800'
                                : pedido.estado === 'PENDIENTE_APROBACION_CARTERA'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {pedido.estado.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            data-testid={`btn-track-order-${pedido.id}`}
                            onClick={() => portal.setPedidoDetalleId(pedido.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Trazabilidad</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Modal de Configuración de Corte y Empaque */}
      {productoAConfigurar && (
        <B2BItemConfiguratorModal
          key={productoAConfigurar.sku}
          isOpen={Boolean(productoAConfigurar)}
          producto={productoAConfigurar}
          onClose={() => setProductoAConfigurar(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* 6. Cajón de Plantillas Recurrentes */}
      <B2BRecurringTemplatesDrawer
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        plantillas={portal.plantillas}
        onReordenarPlantilla={handleReordenarPlantilla}
        onCargarEnCarrito={(lineas) => {
          cart.cargarDesdePlantilla(lineas);
          setIsTemplatesOpen(false);
          setIsCartOpen(true);
        }}
      />

      {/* 7. Modal de Trazabilidad en Vivo de Pedido */}
      {portal.pedidoDetalle && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <B2BOrderTrackingTimeline
              pedido={portal.pedidoDetalle}
              onClose={() => portal.setPedidoDetalleId(null)}
            />
          </div>
        </div>
      )}

      {/* 8. Cajón Lateral del Carrito de Compras B2B */}
      {isCartOpen && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="b2b-cart-drawer"
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end"
        >
          <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl border-l border-slate-200">
            {/* Header Carrito */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Carrito de Compras HORECA</h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                  {cart.itemCount} items
                </span>
              </div>
              <button
                type="button"
                data-testid="btn-close-cart-drawer"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.items.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <ShoppingBag className="w-12 h-12 mx-auto stroke-1" />
                  <p className="font-medium text-slate-600">No hay productos en el pedido</p>
                  <p className="text-xs">Selecciona pescados o mariscos del catálogo para comenzar.</p>
                </div>
              ) : (
                cart.items.map((item, idx) => (
                  <div
                    key={`${item.productoId}-${item.corte}-${idx}`}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {item.nombre}
                        </h4>
                        <div className="flex flex-wrap gap-1 text-[11px] text-slate-600 mt-1">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            {item.corte.replace(/_/g, ' ')}
                          </span>
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                            {item.empaque.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => cart.eliminarItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      {/* Control de Cantidad */}
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => cart.actualizarCantidad(idx, item.cantidadSolicitada - 1)}
                          className="w-7 h-7 rounded bg-white flex items-center justify-center text-slate-700 hover:bg-slate-200 shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center font-bold text-slate-900">
                          {item.cantidadSolicitada}
                        </span>
                        <button
                          type="button"
                          onClick={() => cart.actualizarCantidad(idx, item.cantidadSolicitada + 1)}
                          className="w-7 h-7 rounded bg-white flex items-center justify-center text-slate-700 hover:bg-slate-200 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] text-slate-500 pl-1">
                          {item.modalidadVenta === 'KILOGRAMOS_ESTIMADOS' ? 'kg' : 'uds'}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-slate-900 text-sm">
                          ${item.subtotalCop.toLocaleString('es-CO')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          ${item.precioPactadoCop.toLocaleString('es-CO')}/
                          {item.modalidadVenta === 'KILOGRAMOS_ESTIMADOS' ? 'kg' : 'ud'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Instrucciones Especiales para Cocina / Fileteo */}
              {cart.items.length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instrucciones Especiales para Planta / Chef
                  </label>
                  <textarea
                    rows={2}
                    value={cart.instruccionesCocina}
                    onChange={(e) => cart.setInstruccionesCocina(e.target.value)}
                    placeholder="Ej. Porciones exactas de 200g, hielo seco separado..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Footer con Parámetros de Entrega y Botón Checkout */}
            {cart.items.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Fecha Entrega</label>
                    <input
                      type="date"
                      value={fechaRequerida}
                      onChange={(e) => setFechaRequerida(e.target.value)}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jornada</label>
                    <select
                      value={jornada}
                      onChange={(e) => setJornada(e.target.value as B2BDeliverySchedule)}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 font-medium"
                    >
                      <option value="MANANA">Mañana (6:00 - 11:00)</option>
                      <option value="TARDE">Tarde (1:00 - 5:00)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Forma de Pago</label>
                  <select
                    value={formaPago}
                    onChange={(e) => setFormaPago(e.target.value as B2BPaymentMethod)}
                    className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs font-medium"
                  >
                    <option value="CREDITO_B2B">Crédito B2B HORECA (Sujeto a Cupo)</option>
                    <option value="CONTADO_ANTICIPADO">Contado Anticipado</option>
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-500">Total Estimado ({cart.pesoTotalEstimadoKg} kg):</span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900">
                    ${cart.totalEstimadoCop.toLocaleString('es-CO')}
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="btn-checkout-order"
                  onClick={handleEnviarPedido}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Transmitir Pedido HORECA</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
