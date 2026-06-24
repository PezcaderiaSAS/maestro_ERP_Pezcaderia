// src/views/POSView.tsx
import React, { useState, useEffect } from 'react';
import * as localDb from '../services/localDb.ts';
import { Plus, X, Check, CreditCard, FileText, Truck, RefreshCw, AlertTriangle, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { Product, DynamicField, Cliente, generateId, Venta, MovimientoInventario, Conductor, DevolucionPedido, toTitleCase } from '../App.tsx';
import { InvoiceAR } from './ARView.tsx';
import OrderKanbanView from './OrderKanbanView.tsx';
import { usePOSCart } from '../hooks/usePOSCart.ts';
import { TicketBuilder } from './pos/components/TicketBuilder.tsx';
import { CartPanel } from './pos/components/CartPanel.tsx';
import { ProductSearchPanel } from './pos/components/ProductSearchPanel.tsx';
import { AperturaCajaModal } from './pos/components/AperturaCajaModal.tsx';
import ArqueoCajaModal from './cash/components/ArqueoCajaModal.tsx';
import { cashService } from '../services/cashService.ts';
import { useWarehouseStore } from '../store/useWarehouseStore.ts';
interface POSViewProps {
  products: Product[];
  dynamicFields: DynamicField[];
  publishEvent: (
    tipo: 'SALE_COMPLETED' | 'PRICE_CHANGED' | 'MERMA_ALERT' | 'QUOTE_STATUS_CHANGED' | 'METADATA_CONFIGURED',
    actor: string,
    descripcion: string,
    metadata?: any,
    enqueueSync?: boolean
  ) => void;
  userRole: string;
  setCurrentView: (view: string) => void;
  stock: Record<string, any[]>;
  setStock: (val: any) => void;
  lastClientPrices: Record<string, Record<string, number>>;
  updateLastClientPrice: (clientKey: string, sku: string, price: number) => void;
  cartera: any[];
  setCartera: (val: any) => void;
  clientes: Cliente[];
  setClientes: (val: any) => void;
  ventas: Venta[];
  setVentas: (val: any) => void;
  movimientos: MovimientoInventario[];
  setMovimientos: (val: any) => void;
  conductores: Conductor[];
  devoluciones: DevolucionPedido[];
  setDevoluciones: (val: any) => void;
  quotations: any[];
  setQuotations: (val: any) => void;
  logIntegracion?: any[];
  setLogIntegracion?: React.Dispatch<React.SetStateAction<any[]>>;
  handleCancelarPedidoDigital?: (logId: string) => void;
  handleAprobarPedidoManual?: (logId: string, modo: 'parcial' | 'forzar') => void;
  parametros?: Record<string, any>;
}

export default function POSView({
  products,
  dynamicFields,
  publishEvent,
  userRole,
  stock,
  setStock,
  lastClientPrices,
  updateLastClientPrice,
  cartera,
  setCartera,
  clientes,
  setClientes,
  ventas: _ventas,
  setVentas,
  movimientos: _movimientos,
  setMovimientos,
  conductores: _conductores,
  devoluciones,
  setDevoluciones,
  quotations,
  setQuotations,
  logIntegracion = [],
  setLogIntegracion = () => {},
  handleCancelarPedidoDigital = () => {},
  handleAprobarPedidoManual = () => {},
  parametros: _parametros = {},
  setCurrentView
}: POSViewProps) {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [ultimoTicket, setUltimoTicket] = useState<{ venta: any; cliente: any } | null>(null);
  
  // B2B Consolidation State
  const [activeSubView, setActiveSubView] = useState<'venta_pos' | 'consolidacion_b2b' | 'canales_digitales' | 'gestion_kanban'>('venta_pos');
  const [selectedB2BQuoteId, setSelectedB2BQuoteId] = useState<string | null>(null);
  const [selectedDevIds, setSelectedDevIds] = useState<string[]>([]);
  const [b2bPaymentMethod, setB2bPaymentMethod] = useState<'CREDITO' | 'CONTADO'>('CREDITO');
  const [fechaVencimientoB2B, setFechaVencimientoB2B] = useState<string>('');
  const [observacionesB2B, setObservacionesB2B] = useState<string>('');
  const [b2bFilter, setB2bFilter] = useState<'Listo' | 'Todos'>('Listo');
  const [tempRealQuantities, setTempRealQuantities] = useState<Record<string, number | string>>({});

  // Turno Management State
  const [isTurnoAbierto, setIsTurnoAbierto] = useState<boolean>(false);
  const [showAperturaModal, setShowAperturaModal] = useState<boolean>(false);
  const [showArqueoModal, setShowArqueoModal] = useState<boolean>(false);

  useEffect(() => {
    const turnos = cashService.getTurnos();
    setIsTurnoAbierto(turnos.some(t => t.cajeroId === userRole && t.estado === 'ABIERTO'));
  }, [userRole, showAperturaModal]);

  // Filtrar productos activos
  const activeProducts = products.filter(p => p.activo);


  const defaultClient = clientes?.find(c => c.nombre.toUpperCase().includes('CONSUMIDOR FINAL')) || null;
  
  const {
    lineas: cartLineas,
    cliente,
    descuentoGlobalPct: descuentoGlobal,
    descuentoGlobalValor,
    totales: cartTotales,
    agregarProducto,
    actualizarCantidad,
    actualizarDescuentoLinea,
    removerProducto,
    setCliente,
    setDescuentoGlobalPct: setDescuentoGlobal,
    limpiarCarrito,
    setLineas: setCartLineas
  } = usePOSCart(defaultClient as any);

  useEffect(() => {
    if (!cliente && defaultClient) {
      setCliente(defaultClient as any);
    }
  }, [cliente, defaultClient, setCliente]);


  const subtotal = cartTotales.subtotal;
  const totalDescuento = cartTotales.descuento;
  const totalFinal = cartTotales.totalFinal;


  // Mapeo de compatibilidad para el carrito legado
  const cart = cartLineas.map(linea => {
    const product = activeProducts.find(p => p.id === linea.productoId) || {
      id: linea.productoId,
      sku: linea.sku,
      nombre: linea.nombre,
      precio_venta_pos: linea.precioLista,
      precio_venta_restaurante: linea.precioLista,
      precio_venta_mayorista: linea.precioLista,
      unidadMedida: linea.unidad,
      activo: true,
      categoria: 'Otros'
    } as any;
    return {
      product,
      cantidad: linea.cantidad,
      precioOverride: linea.precioFinal !== linea.precioLista ? linea.precioFinal : undefined
    };
  });

  const getClienteDeuda = (cId: string) => {
    return cartera
      .filter(inv => inv.clienteId === cId)
      .reduce((sum, inv) => sum + inv.saldo, 0);
  };

  const getProductPrice = (product: Product) => {
    if (cliente) {
      const clientKey = (cliente.identificacion || '').trim().toLowerCase();
      if (lastClientPrices[clientKey] && lastClientPrices[clientKey][product.sku] !== undefined) {
        return lastClientPrices[clientKey][product.sku];
      }

      if (cliente.tipoPrecio === 'RESTAURANTE') {
        return product.precio_venta_restaurante;
      } else if (cliente.tipoPrecio === 'MAYORISTA') {
        return product.precio_venta_mayorista;
      }
    }
    return product.precio_venta_pos;
  };

  const handleAddProduct = (product: Product) => {
    agregarProducto(product as any, 1);
  };

  const handleAgregarCliente = async () => {
    const { value: selectedCliente } = await Swal.fire({
      title: 'Vincular Cliente al Pedido',
      width: '550px',
      html: `
        <div style="font-family: var(--font-family); text-align: left;">
          <!-- Tabs / Acciones -->
          <div style="display: flex; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
            <button type="button" id="tab-search-client" class="pos-category-tab active" style="flex: 1; padding: 8px; margin: 0; background-color: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer;">Buscar Cliente</button>
            <button type="button" id="tab-new-client" class="pos-category-tab" style="flex: 1; padding: 8px; margin: 0; background-color: #f1f5f9; color: #475569; border: none; border-radius: 6px; cursor: pointer;">Crear Nuevo Cliente</button>
          </div>

          <!-- Pestaña Buscar -->
          <div id="panel-search-client">
            <input type="text" id="swal-client-search" class="swal2-input" placeholder="Buscar por Nombre o NIT..." style="margin: 0 0 10px 0; width: 100%; box-sizing: border-box;" />
            <div id="swal-client-results" style="max-height: 220px; overflow-y: auto; border: 1px solid #cbd5e1; border-radius: 8px; margin-top: 10px; background: white;">
              <!-- Se cargan dinámicamente -->
            </div>
            <input type="hidden" id="selected-client-id" value="" />
          </div>

          <!-- Pestaña Crear -->
          <div id="panel-new-client" style="display: none; flex-direction: column; gap: 10px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>
                <label style="font-size: 11px; font-weight: bold; color: #475569;">Tipo Persona</label>
                <select id="new-client-persona" class="swal2-select" style="margin: 4px 0 0 0; width: 100%; height: 38px; padding: 4px; font-size: 13px;">
                  <option value="JURIDICA">Jurídica</option>
                  <option value="NATURAL">Natural</option>
                </select>
              </div>
              <div>
                <label style="font-size: 11px; font-weight: bold; color: #475569;">Tipo Identificación</label>
                <select id="new-client-ident-tipo" class="swal2-select" style="margin: 4px 0 0 0; width: 100%; height: 38px; padding: 4px; font-size: 13px;">
                  <option value="NIT">NIT</option>
                  <option value="CC">Cédula (CC)</option>
                  <option value="CE">Cédula Ext. (CE)</option>
                </select>
              </div>
            </div>
            <div>
              <label style="font-size: 11px; font-weight: bold; color: #475569;">Número Identificación / NIT *</label>
              <input type="text" id="new-client-ident" class="swal2-input" placeholder="Ej: 900.123.456-1" style="margin: 4px 0 0 0; width: 100%; height: 38px; box-sizing: border-box;" />
            </div>
            <div>
              <label style="font-size: 11px; font-weight: bold; color: #475569;">Nombre o Razón Social *</label>
              <input type="text" id="new-client-nombre" class="swal2-input" placeholder="Nombre completo o razón social" style="margin: 4px 0 0 0; width: 100%; height: 38px; box-sizing: border-box;" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>
                <label style="font-size: 11px; font-weight: bold; color: #475569;">Tipo Tarifa *</label>
                <select id="new-client-tarifa" class="swal2-select" style="margin: 4px 0 0 0; width: 100%; height: 38px; padding: 4px; font-size: 13px;">
                  <option value="POS">POS (Público)</option>
                  <option value="RESTAURANTE">Restaurante</option>
                  <option value="MAYORISTA">Mayorista</option>
                </select>
              </div>
              <div>
                <label style="font-size: 11px; font-weight: bold; color: #475569;">Cupo Crédito ($)</label>
                <input type="number" id="new-client-cupo" class="swal2-input" placeholder="0" style="margin: 4px 0 0 0; width: 100%; height: 38px; box-sizing: border-box;" />
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>
                <label style="font-size: 11px; font-weight: bold; color: #475569;">Celular</label>
                <input type="text" id="new-client-telefono" class="swal2-input" style="margin: 4px 0 0 0; width: 100%; height: 38px; box-sizing: border-box;" />
              </div>
              <div>
                <label style="font-size: 11px; font-weight: bold; color: #475569;">Ciudad</label>
                <input type="text" id="new-client-ciudad" class="swal2-input" value="Bogotá" style="margin: 4px 0 0 0; width: 100%; height: 38px; box-sizing: border-box;" />
              </div>
            </div>
            <div>
              <label style="font-size: 11px; font-weight: bold; color: #475569;">Dirección</label>
              <input type="text" id="new-client-direccion" class="swal2-input" style="margin: 4px 0 0 0; width: 100%; height: 38px; box-sizing: border-box;" />
            </div>
            <div>
              <label style="font-size: 11px; font-weight: bold; color: #475569;">Correo Electrónico</label>
              <input type="email" id="new-client-email" class="swal2-input" style="margin: 4px 0 0 0; width: 100%; height: 38px; box-sizing: border-box;" />
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Vincular Cliente',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-color)',
      didOpen: () => {
        const tabSearch = document.getElementById('tab-search-client')!;
        const tabNew = document.getElementById('tab-new-client')!;
        const panelSearch = document.getElementById('panel-search-client')!;
        const panelNew = document.getElementById('panel-new-client')!;
        const searchInput = document.getElementById('swal-client-search') as HTMLInputElement;
        const resultsDiv = document.getElementById('swal-client-results')!;
        const hiddenId = document.getElementById('selected-client-id') as HTMLInputElement;

        const toggleTabs = (target: 'search' | 'new') => {
          if (target === 'search') {
            tabSearch.style.backgroundColor = 'var(--primary-color)';
            tabSearch.style.color = 'white';
            tabNew.style.backgroundColor = '#f1f5f9';
            tabNew.style.color = '#475569';
            panelSearch.style.display = 'block';
            panelNew.style.display = 'none';
          } else {
            tabNew.style.backgroundColor = 'var(--primary-color)';
            tabNew.style.color = 'white';
            tabSearch.style.backgroundColor = '#f1f5f9';
            tabSearch.style.color = '#475569';
            panelNew.style.display = 'flex';
            panelSearch.style.display = 'none';
          }
        };

        tabSearch.addEventListener('click', () => toggleTabs('search'));
        tabNew.addEventListener('click', () => toggleTabs('new'));

        const renderResults = (query: string) => {
          resultsDiv.innerHTML = '';
          const filtered = clientes.filter(c => 
            c.activo && (
              c.nombre.toLowerCase().includes(query.toLowerCase()) || 
              c.identificacion.includes(query)
            )
          );

          if (filtered.length === 0) {
            resultsDiv.innerHTML = '<div style="padding: 12px; color: #64748B; text-align: center; font-size: 13px;">No se encontraron clientes activos.</div>';
            return;
          }

          filtered.forEach(c => {
            const row = document.createElement('div');
            row.style.padding = '8px 12px';
            row.style.borderBottom = '1px solid #f1f5f9';
            row.style.cursor = 'pointer';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.fontSize = '13px';
            row.className = 'swal-client-row';
            if (hiddenId.value === c.id) {
              row.style.backgroundColor = 'rgba(2, 132, 199, 0.1)';
              row.style.fontWeight = 'bold';
            }

            row.innerHTML = `
              <div>
                <strong style="display:block; text-transform: uppercase;">${c.nombre}</strong>
                <span style="font-size: 11px; color:#64748B;">NIT/CC: ${c.identificacion} | Tarifa: ${c.tipoPrecio}</span>
              </div>
              <span style="font-size: 10px; padding: 2px 6px; border-radius: 10px; background:#F1F5F9; color:#475569;">Seleccionar</span>
            `;

            row.addEventListener('click', () => {
              document.querySelectorAll('.swal-client-row').forEach((el: any) => {
                el.style.backgroundColor = 'white';
                el.style.fontWeight = 'normal';
              });
              row.style.backgroundColor = 'rgba(2, 132, 199, 0.1)';
              row.style.fontWeight = 'bold';
              hiddenId.value = c.id;
            });

            resultsDiv.appendChild(row);
          });
        };

        renderResults('');

        searchInput.addEventListener('input', (e) => {
          renderResults((e.target as HTMLInputElement).value);
        });
      },
      preConfirm: () => {
        const isSearch = document.getElementById('panel-search-client')!.style.display !== 'none';
        if (isSearch) {
          const selectedId = (document.getElementById('selected-client-id') as HTMLInputElement).value;
          if (!selectedId) {
            Swal.showValidationMessage('Debe seleccionar un cliente de la lista.');
            return false;
          }
          const client = clientes.find(c => c.id === selectedId);
          return { action: 'select', client };
        } else {
          const nombre = (document.getElementById('new-client-nombre') as HTMLInputElement).value;
          const identificacion = (document.getElementById('new-client-ident') as HTMLInputElement).value;
          const tipoIdentificacion = (document.getElementById('new-client-ident-tipo') as HTMLInputElement).value as any;
          const tipoPersona = (document.getElementById('new-client-persona') as HTMLInputElement).value as any;
          const tipoPrecio = (document.getElementById('new-client-tarifa') as HTMLInputElement).value as any;
          const cupoCredito = parseInt((document.getElementById('new-client-cupo') as HTMLInputElement).value) || 0;
          const telefono = (document.getElementById('new-client-telefono') as HTMLInputElement).value;
          const ciudad = (document.getElementById('new-client-ciudad') as HTMLInputElement).value;
          const direccion = (document.getElementById('new-client-direccion') as HTMLInputElement).value;
          const email = (document.getElementById('new-client-email') as HTMLInputElement).value;

          if (!nombre || !identificacion) {
            Swal.showValidationMessage('El nombre y número de identificación son obligatorios.');
            return false;
          }

          if (clientes.some(c => c.identificacion === identificacion)) {
            Swal.showValidationMessage('Ya existe un cliente con esta identificación.');
            return false;
          }

          const newClient: Cliente = {
            id: `c-${Date.now()}`,
            nombre: toTitleCase(nombre),
            identificacion,
            tipoIdentificacion,
            tipoPersona,
            direccion: toTitleCase(direccion),
            telefono,
            email,
            ciudad: toTitleCase(ciudad),
            cupoCredito,
            tipoPrecio,
            activo: true
          };

          return { action: 'create', client: newClient };
        }
      }
    });

    if (selectedCliente) {
      if (selectedCliente.action === 'create') {
        setClientes((prev: Cliente[]) => [...prev, selectedCliente.client]);
        setCliente(selectedCliente.client);
        Swal.fire({
          icon: 'success',
          title: 'Cliente Creado y Vinculado',
          text: `${selectedCliente.client.nombre} agregado al pedido.`,
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        setCliente(selectedCliente.client);
        Swal.fire({
          icon: 'success',
          title: 'Cliente Vinculado',
          text: `${selectedCliente.client.nombre} agregado al pedido.`,
          timer: 1500,
          showConfirmButton: false
        });
      }
    }
  };

  const handleDescuentoGlobal = async () => {
    const { value: desc } = await Swal.fire({
      title: 'Aplicar Descuento Global',
      input: 'number',
      inputLabel: 'Porcentaje de descuento (0% - 100%)',
      inputPlaceholder: 'Ingresa porcentaje',
      inputValue: descuentoGlobal,
      showCancelButton: true,
      confirmButtonText: 'Aplicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-color)',
      inputAttributes: {
        min: '0',
        max: '100',
        step: '1'
      }
    });

    if (desc !== undefined) {
      const val = parseInt(desc);
      if (val >= 0 && val <= 100) {
        setDescuentoGlobal(val);
      }
    }
  };

  const handleGuardarBorrador = () => {
    if (cart.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Carrito vacío',
        text: 'Agrega productos al pedido antes de guardarlo.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }
    
    if (activeDraftId) {
      setDrafts(prev => prev.map(d => d.id === activeDraftId ? {
        ...d,
        cart: [...cart],
        cliente,
        descuentoGlobal,
        totalFinal,
        fecha: new Date().toISOString()
      } : d));
      setActiveDraftId(null);
    } else {
      const newDraft = {
        id: `BOR-${Date.now()}`,
        fecha: new Date().toISOString(),
        cart: [...cart],
        cliente,
        descuentoGlobal,
        totalFinal
      };
      setDrafts(prev => [newDraft, ...prev]);
    }
    
    publishEvent(
      'SALE_COMPLETED',
      userRole,
      `Pedido guardado en borrador por valor de $${totalFinal.toLocaleString('es-CO')}`,
      { itemsCount: cart.length, total: totalFinal, draft: true },
      false
    );
    
    limpiarCarrito();
    setCliente(defaultClient);
    setDescuentoGlobal(0);
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Borrador Guardado',
      showConfirmButton: false,
      timer: 2000
    });
  };

  // Helper to query stock for a given product and warehouse
  const getProductStock = (sku: string, bodega: string) => {
    const list = stock[bodega] || [];
    const matched = list.find((item: any) => item.sku === sku);
    return matched ? matched.stock : 0;
  };

  const handlePagar = async (metodo: 'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO'): Promise<Venta | void> => {
    // RN-57: Validacion estricta de Turno de Caja Abierto
    const turnosAbiertos = cashService.getTurnos().filter(t => t.cajeroId === userRole && t.estado === 'ABIERTO');
    
    if (turnosAbiertos.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Operación Bloqueada',
        text: 'Debe abrir un Turno de Caja antes de poder registrar pagos o facturar.',
        confirmButtonColor: 'var(--primary-color)'
      }).then(() => {
        setCurrentView('caja');
      });
      return;
    }

    // RN-07 y RN-01 se validan en PaymentPanel, pero si llegamos aquí, el carrito tiene items.
    let transfer = 0;
    let card = 0;
    let cash = 0;
    let credit = 0;
    let creditDate = '';
    const turnoSeleccionadoId = turnosAbiertos[0].id; // Asignamos el primer turno abierto por defecto
    const requiereFE = false; // Por defecto Fase 1

    if (metodo === 'EFECTIVO') {
      cash = totalFinal;
    } else if (metodo === 'TRANSFERENCIA') {
      transfer = totalFinal;
    } else if (metodo === 'CREDITO') {
      credit = totalFinal;
      const { value: date } = await Swal.fire({
        title: 'Venta a Crédito',
        input: 'date',
        inputLabel: 'Fecha Límite de Pago',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: 'var(--primary-color)'
      });

      if (!date) return; // Cancelado por el usuario
      creditDate = date;

      const currentDebt = getClienteDeuda(cliente!.id);
      const proposedDebt = currentDebt + credit;
      if (proposedDebt > cliente!.cupoCredito) {
        Swal.fire({
          icon: 'error',
          title: 'Límite Excedido',
          text: `Cupo disponible: $${Math.max(0, cliente!.cupoCredito - currentDebt).toLocaleString('es-CO')}`
        });
        return;
      }
    }

    const orderNo = 'PED-' + Math.floor(100000 + Math.random() * 900000);
    const vtaId = generateId('vta');

    // RN-01: Disminuir stock en Bodega Principal
    setStock((prev: any) => {
      const newStock = { ...prev };
      if (newStock['Bodega Principal']) {
        newStock['Bodega Principal'] = newStock['Bodega Principal'].map((stockItem: any) => {
          const cartItem = cart.find(i => i.product.sku === stockItem.sku);
          if (cartItem) {
            return { ...stockItem, stock: Math.max(0, stockItem.stock - Number(cartItem.cantidad)) };
          }
          return stockItem;
        });
      }
      return newStock;
    });

    // Actualizar precios del cliente
    if (cliente) {
      cart.forEach(item => {
        const finalUnitPrice = item.precioOverride !== undefined ? item.precioOverride : getProductPrice(item.product);
        updateLastClientPrice(cliente.identificacion, item.product.sku, finalUnitPrice);
      });
    }

    const newVenta: Venta = {
      id: vtaId,
      clienteId: cliente ? cliente.id : null,
      clienteNombre: cliente ? cliente.nombre : 'Consumidor Final',
      clienteIdentificacion: cliente ? cliente.identificacion : '',
      fecha: new Date().toISOString(),
      items: cart.map(item => {
        const unitPrice = item.precioOverride !== undefined ? item.precioOverride : getProductPrice(item.product);
        return {
          sku: item.product.sku,
          nombre: item.product.nombre,
          cantidad: Number(item.cantidad),
          precioUnitario: unitPrice,
          descuento: 0,
          subtotal: Number(item.cantidad) * unitPrice
        };
      }),
      subtotal: subtotal,
      descuento: totalDescuento,
      total: totalFinal,
      metodoPago: metodo === 'EFECTIVO' || metodo === 'TRANSFERENCIA' ? 'CONTADO' : 'CREDITO',
      montoPagadoEfectivo: cash,
      montoPagadoTransferencia: transfer,
      montoPagadoTarjeta: card,
      montoPagadoCredito: credit,
      cambioEntregado: 0,
      actor: userRole
    };

    setVentas((prev: Venta[]) => [newVenta, ...prev]);
    setUltimoTicket({
      venta: { ...newVenta, items: cartLineas },
      cliente: cliente ? { nombre: cliente.nombre, identificacion: cliente.identificacion } : null
    });

    const newMovements: MovimientoInventario[] = cart.map(item => {
      const prodStock = stock['Bodega Principal']?.find((s: any) => s.sku === item.product.sku);
      const lote = prodStock ? prodStock.lote : 'VENTA';
      return {
        id: generateId('mov'),
        timestamp: new Date().toISOString(),
        tipo: 'VENTA',
        sku: item.product.sku,
        nombreProducto: item.product.nombre,
        bodegaOrigen: 'Bodega Principal',
        cantidad: Number(item.cantidad),
        lote: lote,
        referenciaId: vtaId,
        referenciaTipo: 'VENTA',
        actor: userRole,
        notas: `Venta POS a ${cliente ? cliente.nombre : 'Consumidor Final'}`
      };
    });
    setMovimientos((prev: MovimientoInventario[]) => [...newMovements, ...prev]);

    if (credit > 0 && cliente) {
      const newAR: InvoiceAR = {
        id: orderNo,
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        clienteIdentificacion: cliente.identificacion,
        fecha: new Date().toISOString(),
        fechaVencimiento: creditDate,
        total: totalFinal,
        saldo: credit,
        pagado: 0,
        pagos: []
      };
      setCartera((prev: InvoiceAR[]) => [newAR, ...prev]);
    }

    const turnoDestino = cashService.getTurnos().find(t => t.id === turnoSeleccionadoId);
    if (turnoDestino) {
      if (cash > 0) {
        cashService.registrarMovimiento(
          turnoDestino.id, turnoDestino.cajaId, 'INGRESO_VENTA', 'EFECTIVO', cash, `Cobro POS (Venta: ${orderNo})`, vtaId, userRole
        );
      }
      if (transfer > 0) {
        cashService.registrarMovimiento(
          turnoDestino.id, turnoDestino.cajaId, 'INGRESO_VENTA', 'TRANSFERENCIA', transfer, `Cobro POS (Venta: ${orderNo})`, vtaId, userRole
        );
      }
    }

    publishEvent(
      'SALE_COMPLETED',
      userRole,
      `Venta liquidada para ${cliente ? cliente.nombre : 'Consumidor Final'} por $${totalFinal.toLocaleString('es-CO')}. (${metodo})`,
      { cliente, total: totalFinal, requiereFE, items: cart.map(i => ({ sku: i.product.sku, cantidad: i.cantidad })) }
    );

    Swal.fire({
      icon: 'success',
      title: 'Venta Procesada',
      text: `Total: $${totalFinal.toLocaleString('es-CO')} (${metodo})`,
      confirmButtonColor: 'var(--primary-color)',
      timer: 1500,
      showConfirmButton: false
    });

    if (activeDraftId) {
      setDrafts(prev => prev.filter(x => x.id !== activeDraftId));
      setActiveDraftId(null);
    }

    // PaymentPanel handled ticket printing and cart clearing
    return newVenta;
  };

  const getReturnAmount = (dev: DevolucionPedido) => {
    return (dev.items || []).reduce((sum, item) => {
      const qty = item.cantidadRecibida || 0;
      return sum + qty * (item.precioUnitarioVenta || 0);
    }, 0);
  };

  const handleSaveAlistamiento = (quoteId: string) => {
    const normalizedRole = (userRole || '').trim().toLowerCase();
    if (normalizedRole !== 'admin' && normalizedRole !== 'bodega' && normalizedRole !== 'administrativo') {
      Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: 'Solo los roles de Super Administrador, Bodega o Administrativo pueden gestionar el alistamiento de pedidos.',
        confirmButtonColor: '#EF4444'
      });
      return;
    }

    const quoteIndex = quotations.findIndex((q: any) => q.id === quoteId);
    if (quoteIndex === -1) return;

    const quote = quotations[quoteIndex];
    
    const updatedItems = (quote.items || []).map((item: any) => {
      const realQty = tempRealQuantities[item.sku] !== undefined ? tempRealQuantities[item.sku] : item.cantidad;
      return {
        ...item,
        cantidad_real: Number(realQty)
      };
    });

    const updatedQuotations = [...quotations];
    updatedQuotations[quoteIndex] = {
      ...quote,
      items: updatedItems,
      estado: 'Listo',
      fechaActualizacion: new Date().toISOString()
    };

    setQuotations(updatedQuotations);
    localDb.save('quotations', updatedQuotations);

    publishEvent(
      'QUOTE_STATUS_CHANGED',
      userRole,
      `Alistamiento completado para el pedido #${quote.id.slice(-6).toUpperCase()}. Estado actualizado a Listo.`,
      { quoteId, estado: 'Listo', items: updatedItems }
    );

    Swal.fire({
      icon: 'success',
      title: 'Alistamiento Guardado',
      text: `El pedido #${quote.id.slice(-6).toUpperCase()} ha sido alistado con éxito y está listo para despacho.`,
      confirmButtonColor: '#10B981'
    });

    setB2bFilter('Listo');
  };

  const handlePauseAlistamiento = (quoteId: string) => {
    const normalizedRole = (userRole || '').trim().toLowerCase();
    if (normalizedRole !== 'admin' && normalizedRole !== 'bodega' && normalizedRole !== 'administrativo') {
      Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: 'Solo los roles de Super Administrador, Bodega o Administrativo pueden gestionar el alistamiento de pedidos.',
        confirmButtonColor: '#EF4444'
      });
      return;
    }

    const quoteIndex = quotations.findIndex((q: any) => q.id === quoteId);
    if (quoteIndex === -1) return;

    const quote = quotations[quoteIndex];
    const updatedQuotations = [...quotations];
    updatedQuotations[quoteIndex] = {
      ...quote,
      estado: 'Pausado',
      fechaActualizacion: new Date().toISOString()
    };

    setQuotations(updatedQuotations);
    localDb.save('quotations', updatedQuotations);

    publishEvent(
      'QUOTE_STATUS_CHANGED',
      userRole,
      `Alistamiento pausado para el pedido #${quote.id.slice(-6).toUpperCase()}.`,
      { quoteId, estado: 'Pausado' }
    );

    Swal.fire({
      icon: 'warning',
      title: 'Alistamiento Pausado',
      text: `El pedido #${quote.id.slice(-6).toUpperCase()} ha sido pausado.`,
      confirmButtonColor: '#F59E0B'
    });
  };

  const handleFacturarB2B = async (quoteId: string) => {
    const quote = quotations?.find(q => q.id === quoteId);
    if (!quote) return;

    const client = clientes.find(c => c.id === quote.clienteId);
    if (!client) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Cliente',
        text: 'No se pudo encontrar el cliente asociado al pedido.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    const b2bItems = quote.items || [];
    const b2bSubtotal = b2bItems.reduce((sum: number, item: any) => {
      const qty = item.cantidad_real !== undefined ? item.cantidad_real : item.cantidad;
      const price = item.precioFinal || item.precio || item.precioUnitario || 0;
      return sum + qty * price;
    }, 0);

    const appliedDevs = (devoluciones || []).filter(d => selectedDevIds.includes(d.id));
    const totalReturnsCredit = appliedDevs.reduce((sum, d) => sum + getReturnAmount(d), 0);

    const b2bTotalFinal = Math.max(0, b2bSubtotal - totalReturnsCredit);

    if (b2bPaymentMethod === 'CREDITO') {
      if (!fechaVencimientoB2B) {
        Swal.fire({
          icon: 'error',
          title: 'Fecha de Vencimiento Requerida',
          text: 'Debe especificar una fecha de vencimiento para la venta a crédito B2B.',
          confirmButtonColor: 'var(--primary-color)'
        });
        return;
      }
      const todayStr = new Date().toISOString().split('T')[0];
      if (fechaVencimientoB2B < todayStr) {
        Swal.fire({
          icon: 'error',
          title: 'Fecha de Vencimiento Inválida',
          text: 'La fecha de vencimiento no puede ser anterior a la fecha actual.',
          confirmButtonColor: 'var(--primary-color)'
        });
        return;
      }
      const currentDebt = getClienteDeuda(client.id);
      const proposedDebt = currentDebt + b2bTotalFinal;
      if (proposedDebt > client.cupoCredito) {
        Swal.fire({
          icon: 'error',
          title: 'Cupo de Crédito Excedido',
          text: `El cliente no tiene suficiente cupo de crédito. Cupo: $${client.cupoCredito.toLocaleString('es-CO')}. Deuda actual: $${currentDebt.toLocaleString('es-CO')}. Deuda propuesta: $${proposedDebt.toLocaleString('es-CO')}.`,
          confirmButtonColor: 'var(--primary-color)'
        });
        return;
      }
    }

    const confirmResult = await Swal.fire({
      title: '¿Generar Factura Electrónica B2B?',
      html: `
        <div style="text-align: left; font-size: 14px; color: var(--text-primary);">
          <p>Se generará la factura electrónica en Siigo para <strong>${client.nombre}</strong>.</p>
          <div style="margin-top: 12px; padding: 12px; background-color: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
              <span>Subtotal (Peso Real):</span> <strong>$${b2bSubtotal.toLocaleString('es-CO')}</strong>
            </div>
            ${totalReturnsCredit > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #3B82F6; font-size: 13px;">
              <span>(-) Crédito por Devolución:</span> <strong>-$${totalReturnsCredit.toLocaleString('es-CO')}</strong>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px dashed #CBD5E1; font-size: 16px; font-weight: bold; color: var(--primary-color);">
              <span>Total a Cobrar:</span> <span>$${b2bTotalFinal.toLocaleString('es-CO')}</span>
            </div>
          </div>
          <p style="margin-top: 12px; font-size: 12px; color: #64748B;">Esta acción descontará el stock real de la bodega principal y registrará la factura en cartera si es a crédito.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Facturar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-color)',
      cancelButtonColor: '#64748B'
    });

    if (!confirmResult.isConfirmed) return;

    Swal.fire({
      title: 'Facturando en Siigo...',
      text: 'Enviando comprobante fiscal y sincronizando inventarios.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Descontar stock real
    setStock((prev: any) => {
      const newStock = { ...prev };
      if (newStock['Bodega Principal']) {
        newStock['Bodega Principal'] = newStock['Bodega Principal'].map((stockItem: any) => {
          const orderItem = b2bItems.find((i: any) => i.sku === stockItem.sku);
          if (orderItem) {
            const qtyToDeduct = orderItem.cantidad_real !== undefined ? orderItem.cantidad_real : orderItem.cantidad;
            return { ...stockItem, stock: Math.max(0, stockItem.stock - qtyToDeduct) };
          }
          return stockItem;
        });
      }
      return newStock;
    });

    // Registrar Movimiento de Inventario
    const newMovements: MovimientoInventario[] = b2bItems.map((item: any) => {
      const prodStock = stock['Bodega Principal']?.find((s: any) => s.sku === item.sku);
      const lote = prodStock ? prodStock.lote : 'B2B-WMS';
      const qty = item.cantidad_real !== undefined ? item.cantidad_real : item.cantidad;
      return {
        id: generateId('mov'),
        timestamp: new Date().toISOString(),
        tipo: 'SALIDA_VENTA' as any,
        sku: item.sku,
        nombreProducto: item.nombre,
        bodegaOrigen: 'Bodega Principal',
        cantidad: qty,
        lote: lote,
        referenciaId: quoteId,
        referenciaTipo: 'VENTA',
        actor: userRole,
        notas: `Despacho B2B Facturado. Cliente: ${client.nombre}`
      };
    });
    setMovimientos((prev: MovimientoInventario[]) => [...newMovements, ...prev]);

    // Actualizar estado cotización
    if (setQuotations) {
      setQuotations((prev: any[]) => prev.map(q => {
        if (q.id === quoteId) {
          return {
            ...q,
            estado: 'Facturado',
            fechaFacturado: new Date().toISOString(),
            facturaNo: 'FAC-' + Math.floor(100000 + Math.random() * 900000),
            totalFinalFacturado: b2bTotalFinal
          };
        }
        return q;
      }));
    }

    // Actualizar estado devoluciones y emitir Notas de Crédito
    if (appliedDevs.length > 0) {
      if (setDevoluciones) {
        setDevoluciones((prev: any[]) => prev.map(d => {
          if (selectedDevIds.includes(d.id)) {
            return {
              ...d,
              estado: 'VALIDADA_FINANZAS',
              fechaValidacion: new Date().toISOString()
            };
          }
          return d;
        }));
      }

      // Emitir Notas de Crédito individuales en Siigo (Simulado con logs de auditoría)
      appliedDevs.forEach(dev => {
        const devAmount = getReturnAmount(dev);
        const ncId = 'NC-' + Math.floor(100000 + Math.random() * 900000);
        
        publishEvent(
          'METADATA_CONFIGURED',
          userRole,
          `Nota de Crédito ${ncId} emitida exitosamente en Siigo por valor de $${devAmount.toLocaleString('es-CO')} por devolución en pedido #${dev.pedidoNo} (Cliente: ${client.nombre}).`,
          { 
            devolucionId: dev.id, 
            notaCreditoId: ncId, 
            monto: devAmount, 
            clienteId: client.id, 
            facturaDestino: quoteId 
          }
        );
      });
    }


    // Registrar en Cartera (AR)
    if (b2bPaymentMethod === 'CREDITO') {
      const newAR: InvoiceAR = {
        id: 'FAC-' + Math.floor(100000 + Math.random() * 900000),
        clienteId: client.id,
        clienteNombre: client.nombre,
        clienteIdentificacion: client.identificacion,
        fecha: new Date().toISOString(),
        fechaVencimiento: fechaVencimientoB2B,
        observaciones: observacionesB2B,
        total: b2bTotalFinal,
        saldo: b2bTotalFinal,
        pagado: 0,
        pagos: []
      };
      setCartera((prev: InvoiceAR[]) => [newAR, ...prev]);
    }

    // Registrar Venta para histórico
    const newVenta: Venta = {
      id: generateId('vta'),
      clienteId: client.id,
      clienteNombre: client.nombre,
      fecha: new Date().toISOString(),
      items: b2bItems.map((item: any) => {
        const qty = item.cantidad_real !== undefined ? item.cantidad_real : item.cantidad;
        const price = item.precioFinal || item.precio || item.precioUnitario || 0;
        return {
          sku: item.sku,
          nombre: item.nombre,
          cantidad: qty,
          precioUnitario: price,
          descuento: 0
        };
      }),
      subtotal: b2bSubtotal,
      total: b2bTotalFinal,
      metodoPago: b2bPaymentMethod === 'CREDITO' ? 'CREDITO' : 'CONTADO',
      actor: userRole
    };
    setVentas((prev: Venta[]) => [newVenta, ...prev]);

    publishEvent(
      'SALE_COMPLETED',
      userRole,
      `Factura B2B generada para ${client.nombre} por total de $${b2bTotalFinal.toLocaleString('es-CO')} (${b2bPaymentMethod}). Devoluciones cruzadas: ${appliedDevs.length}`,
      { quoteId, client: client.nombre, total: b2bTotalFinal, observaciones: observacionesB2B }
    );

    Swal.fire({
      icon: 'success',
      title: 'Factura Electrónica Generada',
      text: `La factura fue emitida exitosamente en Siigo y el inventario físico ha sido descontado.`,
      confirmButtonColor: '#10B981'
    });

    setSelectedB2BQuoteId(null);
    setSelectedDevIds([]);
    setFechaVencimientoB2B('');
    setObservacionesB2B('');
  };

  // Cálculos financieros delegados al hook usePOSCart
  return (
    <div className="pos-layout animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Selector de Vistas / Pestañas de POS */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        border: '1px solid rgba(255,255,255,0.05)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setActiveSubView('venta_pos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeSubView === 'venta_pos' ? 'var(--primary-color)' : 'transparent',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeSubView === 'venta_pos' ? '0 4px 12px rgba(14, 116, 144, 0.3)' : 'none'
            }}
          >
            <CreditCard size={18} />
            <span>Venta Rápida (POS)</span>
          </button>
          
          <button
            onClick={() => setActiveSubView('consolidacion_b2b')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeSubView === 'consolidacion_b2b' ? '#3B82F6' : 'transparent',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeSubView === 'consolidacion_b2b' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          >
            <Truck size={18} />
            <span>Consolidación y Facturación B2B</span>
            {(quotations || []).filter((q: any) => q.estado === 'Listo').length > 0 && (
              <span style={{
                backgroundColor: '#EF4444',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '9999px',
                marginLeft: '4px'
              }}>
                {(quotations || []).filter((q: any) => q.estado === 'Listo').length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveSubView('canales_digitales')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeSubView === 'canales_digitales' ? '#8B5CF6' : 'transparent',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeSubView === 'canales_digitales' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
            }}
          >
            <RefreshCw size={18} />
            <span>Monitoreo Canales Digitales</span>
            {logIntegracion.filter(l => l.estado === 'PENDIENTE').length > 0 && (
              <span style={{
                backgroundColor: '#EF4444',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '9999px',
                marginLeft: '4px'
              }}>
                {logIntegracion.filter(l => l.estado === 'PENDIENTE').length}
              </span>
            )}
            {logIntegracion.filter(l => l.estado === 'REVISION_MANUAL').length > 0 && (
              <span style={{
                backgroundColor: '#F59E0B',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '9999px',
                marginLeft: '4px'
              }}>
                {logIntegracion.filter(l => l.estado === 'REVISION_MANUAL').length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveSubView('gestion_kanban')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeSubView === 'gestion_kanban' ? '#F59E0B' : 'transparent',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeSubView === 'gestion_kanban' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
            }}
          >
            <span style={{ fontSize: '18px' }}>KB</span>
            <span>Gestión Kanban</span>
          </button>
        </div>
        
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 500 }}>
          Rol: <span style={{ color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>{userRole}</span>
        </div>
      </div>

      {activeSubView === 'venta_pos' ? (
        <div className="pos-layout animate-fade-in" style={{ padding: 0, border: 'none', boxShadow: 'none', background: 'transparent', margin: 0, width: '100%', display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '20px' }}>
          {/* Catálogo de Productos */}
        <ProductSearchPanel 
          activeProducts={activeProducts} 
          dynamicFields={dynamicFields} 
          cliente={cliente} 
          getProductPrice={getProductPrice} 
          getProductStock={getProductStock} 
          onAddProduct={handleAddProduct} 
        />

      {/* Carrito de Compras / Factura — delegado a CartPanel */}
      <div className="pos-sidebar-cart">
        {ultimoTicket ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', height: '100%', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0, textAlign: 'center' }}>Venta Realizada con Éxito</h3>
            <TicketBuilder
              venta={ultimoTicket!.venta}
              cliente={ultimoTicket!.cliente}
            />
            <button
              className="btn-primary"
              onClick={() => setUltimoTicket(null)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 700,
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(14, 116, 144, 0.2)',
                marginTop: '8px'
              }}
            >
              Nueva Venta
            </button>
          </div>
        ) : (
          <CartPanel
            lineas={cartLineas}
            cliente={cliente}
            descuentoGlobalPct={descuentoGlobal}
            descuentoGlobalValor={descuentoGlobalValor}
            totales={{ subtotal, descuento: totalDescuento, totalFinal }}
            drafts={drafts}
            activeDraftId={activeDraftId}
            stock={stock}
            bodegaActiva="Bodega Principal"
            lastClientPrices={lastClientPrices}
            onUpdateCantidad={actualizarCantidad}
            onUpdateDescuentoLinea={actualizarDescuentoLinea}
            onRemoveLinea={removerProducto}
            onWeightRead={(pid, peso) => actualizarCantidad(pid, peso)}
            onLimpiarCarrito={limpiarCarrito}
            onSetLineas={setCartLineas}
            onSelectCliente={handleAgregarCliente}
            onClearCliente={() => setCliente(defaultClient)}
            onDescuentoClick={handleDescuentoGlobal}
            onPagar={handlePagar}
            onGuardarBorrador={handleGuardarBorrador}
            onSetActiveDraftId={setActiveDraftId}
            onSetDrafts={setDrafts}
            onSetDescuentoGlobal={setDescuentoGlobal}
            isTurnoAbierto={isTurnoAbierto}
            onAbrirTurnoClick={() => setShowAperturaModal(true)}
            onCerrarTurnoClick={() => setShowArqueoModal(true)}
          />
        )}
      </div>
      </div>
      ) : activeSubView === 'consolidacion_b2b' ? (

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', width: '100%', boxSizing: 'border-box' }} className="animate-fade-in">
           {/* COLUMNA IZQUIERDA: LISTADO DE PEDIDOS */}
           <div className="hr-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <span style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600, textTransform: 'uppercase' }}>Consolidación</span>
                 <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>Pedidos B2B</h3>
               </div>
               <button
                 onClick={() => setCurrentView('precios')}
                 className="btn-primary"
                 style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
               >
                 <Plus size={14} />
                 <span>Crear Pedido</span>
               </button>
             </div>

             {/* Filter Toggle */}
             <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
               <button
                 onClick={() => setB2bFilter('Listo')}
                 style={{
                   flex: 1,
                   padding: '6px',
                   borderRadius: '6px',
                   border: 'none',
                   fontSize: '12px',
                   fontWeight: 700,
                   backgroundColor: b2bFilter === 'Listo' ? 'white' : 'transparent',
                   color: b2bFilter === 'Listo' ? '#0F172A' : '#64748B',
                   cursor: 'pointer',
                   boxShadow: b2bFilter === 'Listo' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                 }}
               >
                 Listos ({ (quotations || []).filter((q: any) => q.estado === 'Listo').length })
               </button>
               <button
                 onClick={() => setB2bFilter('Todos')}
                 style={{
                   flex: 1,
                   padding: '6px',
                   borderRadius: '6px',
                   border: 'none',
                   fontSize: '12px',
                   fontWeight: 700,
                   backgroundColor: b2bFilter === 'Todos' ? 'white' : 'transparent',
                   color: b2bFilter === 'Todos' ? '#0F172A' : '#64748B',
                   cursor: 'pointer',
                   boxShadow: b2bFilter === 'Todos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                 }}
               >
                 Todos ({ (quotations || []).filter((q: any) => q.estado !== 'Sold' && q.estado !== 'Facturado' && q.estado !== 'Expired').length })
               </button>
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '550px' }}>
               {(() => {
                 const filteredList = (quotations || []).filter((q: any) => {
                   if (b2bFilter === 'Listo') {
                     return q.estado === 'Listo';
                   } else {
                     return q.estado !== 'Sold' && q.estado !== 'Facturado' && q.estado !== 'Expired';
                   }
                 });

                 if (filteredList.length === 0) {
                   return (
                     <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748B' }}>
                       <FileText size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5, color: '#3B82F6' }} />
                       <p style={{ fontSize: '14px', fontWeight: 600 }}>No hay pedidos B2B {b2bFilter === 'Listo' ? 'listos' : 'pendientes'}.</p>
                       <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                         {b2bFilter === 'Listo' ? 'Los pedidos deben completarse en Cuarto Frío.' : 'Use la opción "Crear Pedido" para ingresar uno nuevo.'}
                       </p>
                     </div>
                   );
                 }

                 return filteredList.map((q: any) => {
                   const isSelected = selectedB2BQuoteId === q.id;
                   let statusBg = '#F1F5F9';
                   let statusColor = '#64748B';
                   if (q.estado === 'Approved') { statusBg = '#D1FAE5'; statusColor = '#10B981'; }
                   else if (q.estado === 'Listo') { statusBg = '#F0FDF4'; statusColor = '#16A34A'; }
                   else if (q.estado === 'Pausado') { statusBg = '#FEF3C7'; statusColor = '#D97706'; }
                   else if (q.estado === 'Sent') { statusBg = 'var(--primary-light)'; statusColor = 'var(--primary-color)'; }

                   return (
                     <div
                       key={q.id}
                       onClick={() => {
                         setSelectedB2BQuoteId(q.id);
                         setSelectedDevIds([]);
                         const initialQtys: Record<string, number | string> = {};
                         (q.items || []).forEach((item: any) => {
                           initialQtys[item.sku] = item.cantidad_real !== undefined ? item.cantidad_real : item.cantidad;
                         });
                         setTempRealQuantities(initialQtys);
                       }}
                       style={{
                         padding: '16px',
                         borderRadius: '12px',
                         border: isSelected ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                         backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'white',
                         cursor: 'pointer',
                         transition: 'all 0.2s ease'
                       }}
                     >
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                         <span style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                           Pedido #{q.id.slice(-6).toUpperCase()}
                         </span>
                         <span style={{
                           fontSize: '11px',
                           fontWeight: 800,
                           padding: '2px 8px',
                           borderRadius: '12px',
                           backgroundColor: statusBg,
                           color: statusColor
                         }}>
                           {q.estado.toUpperCase()}
                         </span>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#475569' }}>
                         <div><strong>Cliente:</strong> {q.clienteNombre}</div>
                         <div><strong>Fecha Entrega:</strong> {q.logistica?.fechaEntrega ? new Date(q.logistica.fechaEntrega).toLocaleDateString() : 'No definida'}</div>
                         <div><strong>Conductor:</strong> {q.logistica?.conductor?.nombre || 'No asignado'}</div>
                       </div>
                     </div>
                   );
                 });
               })()}
             </div>
           </div>

          {/* COLUMNA DERECHA: PANELES DE LIQUIDACION */}
          <div className="hr-table-card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
            {selectedB2BQuoteId ? (() => {
                const quote = quotations.find((q: any) => q.id === selectedB2BQuoteId);
                if (!quote) return null;

                const client = clientes.find(c => c.id === quote.clienteId);
                const currentDebt = client ? getClienteDeuda(client!.id) : 0;
                const cupoDisponible = client ? Math.max(0, client!.cupoCredito - currentDebt) : 0;

                const b2bItems = quote.items || [];
                const b2bSubtotal = b2bItems.reduce((sum: number, item: any) => {
                  const qty = item.cantidad_real !== undefined ? item.cantidad_real : item.cantidad;
                  const price = item.precioFinal || item.precio || item.precioUnitario || 0;
                  return sum + qty * price;
                }, 0);

                const clientDevs = (devoluciones || []).filter((d: any) => d.clienteId === quote.clienteId && d.estado === 'RECIBIDA_BODEGA');
                const selectedReturnsCredit = clientDevs
                  .filter((d: any) => selectedDevIds.includes(d.id))
                  .reduce((sum, d) => sum + getReturnAmount(d), 0);

                const b2bTotalFinal = Math.max(0, b2bSubtotal - selectedReturnsCredit);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Detalles de Liquidación</span>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Pedido #{quote.id.slice(-6).toUpperCase()}</h3>
                      </div>
                      <button 
                        onClick={() => setSelectedB2BQuoteId(null)}
                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Items */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                        {quote.estado === 'Listo' ? '1. Pesos Reales del Cuarto Frío' : 'Ítems del Pedido para Alistamiento'}
                      </h4>
                      <table className="hr-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th style={{ textAlign: 'right' }}>Pedida</th>
                            <th style={{ textAlign: 'right' }}>Peso Real</th>
                            <th style={{ textAlign: 'right' }}>Precio Pactado</th>
                            <th style={{ textAlign: 'right' }}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {b2bItems.map((item: any) => {
                            const reqQty = item.cantidad;
                            const isEditable = quote.estado !== 'Listo';
                            const realQty = isEditable 
                              ? (tempRealQuantities[item.sku] !== undefined ? tempRealQuantities[item.sku] : item.cantidad)
                              : (item.cantidad_real !== undefined ? item.cantidad_real : item.cantidad);
                            const price = item.precioFinal || item.precio || item.precioUnitario || 0;
                            return (
                              <tr key={item.sku}>
                                <td style={{ fontWeight: 600 }}>{item.nombre}</td>
                                <td style={{ textAlign: 'right' }}>{reqQty} kg</td>
                                <td style={{ textAlign: 'right' }}>
                                  {isEditable ? (
                                    <input 
                                      type="number"
                                      step="any"
                                      value={realQty}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setTempRealQuantities(prev => ({
                                          ...prev,
                                          [item.sku]: val
                                        }));
                                      }}
                                      style={{
                                        width: '80px',
                                        padding: '4px 8px',
                                        border: '1px solid #CBD5E1',
                                        borderRadius: '6px',
                                        textAlign: 'right',
                                        fontWeight: 700,
                                        color: 'var(--primary-color)'
                                      }}
                                    />
                                  ) : (
                                    <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{realQty} kg</span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right' }}>${price.toLocaleString('es-CO')}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }}>${(Number(realQty) * price).toLocaleString('es-CO')}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {quote.estado === 'Listo' ? (
                      <>
                        {/* Devoluciones */}
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>2. Saldos a Favor de Devoluciones</h4>
                          {clientDevs.length === 0 ? (
                            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', color: '#64748B' }}>
                              ℹ️ No hay devoluciones físicas pendientes para este cliente.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {clientDevs.map((d: any) => {
                                const amt = getReturnAmount(d);
                                const isChecked = selectedDevIds.includes(d.id);
                                return (
                                  <div
                                    key={d.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '12px',
                                      backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.05)' : '#F8FAFC',
                                      borderRadius: '8px',
                                      border: isChecked ? '1px solid #3B82F6' : '1px solid #E2E8F0',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                      setSelectedDevIds(prev => 
                                        prev.includes(d.id) ? prev.filter(id => id !== d.id) : [...prev, d.id]
                                      );
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        readOnly
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                      />
                                      <div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                                          Devolución #{d.id.slice(-6).toUpperCase()} ({new Date(d.fechaProgramacion).toLocaleDateString()})
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                                          Conductor: {d.conductorNombre || 'N/A'}
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <strong style={{ fontSize: '14px', color: '#10B981' }}>${amt.toLocaleString('es-CO')}</strong>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Resumen */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
                          <div>
                            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>Forma de Pago</h4>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => setB2bPaymentMethod('CREDITO')}
                                style={{
                                  flex: 1,
                                  padding: '12px',
                                  borderRadius: '10px',
                                  border: b2bPaymentMethod === 'CREDITO' ? '2px solid #3B82F6' : '1px solid #CBD5E1',
                                  backgroundColor: b2bPaymentMethod === 'CREDITO' ? 'rgba(59, 130, 246, 0.05)' : 'white',
                                  fontWeight: 700,
                                  color: b2bPaymentMethod === 'CREDITO' ? '#3B82F6' : '#475569',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>💳 Crédito B2B</span>
                                {client && (
                                  <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748B' }}>
                                    Cupo Disp: ${cupoDisponible.toLocaleString('es-CO')}
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={() => setB2bPaymentMethod('CONTADO')}
                                style={{
                                  flex: 1,
                                  padding: '12px',
                                  borderRadius: '10px',
                                  border: b2bPaymentMethod === 'CONTADO' ? '2px solid #10B981' : '1px solid #CBD5E1',
                                  backgroundColor: b2bPaymentMethod === 'CONTADO' ? 'rgba(16, 185, 129, 0.05)' : 'white',
                                  fontWeight: 700,
                                  color: b2bPaymentMethod === 'CONTADO' ? '#10B981' : '#475569',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>💵 Pago Contado</span>
                                <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748B' }}>Inmediato</span>
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {b2bPaymentMethod === 'CREDITO' && (
                              <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Fecha de Vencimiento *</label>
                                <input 
                                  type="date" 
                                  value={fechaVencimientoB2B}
                                  onChange={e => setFechaVencimientoB2B(e.target.value)}
                                  className="swal2-input" 
                                  style={{ margin: '4px 0 0 0', width: '100%', height: '38px', fontSize: '13px', boxSizing: 'border-box' }} 
                                />
                              </div>
                            )}

                            <div>
                              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Observaciones de Facturación</label>
                              <textarea 
                                value={observacionesB2B}
                                onChange={e => setObservacionesB2B(e.target.value)}
                                placeholder="Anotaciones para la factura y cartera..."
                                style={{ margin: '4px 0 0 0', width: '100%', height: '60px', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }}
                              />
                            </div>
                            
                            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
                                <span>Subtotal Despachado:</span>
                                <span>${b2bSubtotal.toLocaleString('es-CO')}</span>
                              </div>
                              {selectedReturnsCredit > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#ef4444' }}>
                                  <span>(-) Cruce Devolución:</span>
                                  <span>-${selectedReturnsCredit.toLocaleString('es-CO')}</span>
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: '8px', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                                <span>Total Factura:</span>
                                <span style={{ color: 'var(--primary-color)' }}>${b2bTotalFinal.toLocaleString('es-CO')}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                          <button
                            onClick={() => setSelectedB2BQuoteId(null)}
                            className="btn-secondary"
                            style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700 }}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleFacturarB2B(quote.id)}
                            className="btn-primary"
                            style={{
                              padding: '12px 24px',
                              borderRadius: '12px',
                              fontWeight: 700,
                              backgroundColor: b2bPaymentMethod === 'CREDITO' ? '#3B82F6' : '#10B981',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <FileText size={18} />
                            <span>Emitir Factura Electrónica</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ padding: '16px', backgroundColor: quote.estado === 'Pausado' ? '#FEF3C7' : '#F0FDF4', borderRadius: '12px', border: quote.estado === 'Pausado' ? '1px solid #F59E0B' : '1px solid #10B981', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: quote.estado === 'Pausado' ? '#D97706' : '#16A34A', fontWeight: 700 }}>
                            <AlertTriangle size={18} />
                            <span>Alistamiento en Progreso ({quote.estado})</span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
                            Por favor ingrese los kilos/cantidades reales preparados en el Cuarto Frío para cada ítem. Al terminar, haga clic en "Completar Alistamiento".
                          </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                          <button
                            onClick={() => setSelectedB2BQuoteId(null)}
                            className="btn-secondary"
                            style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700 }}
                          >
                            Cerrar
                          </button>
                          {quote.estado !== 'Pausado' && (
                            <button
                              onClick={() => handlePauseAlistamiento(quote.id)}
                              className="btn-secondary"
                              style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, borderColor: '#F59E0B', color: '#D97706', cursor: 'pointer' }}
                            >
                              Pausar Alistamiento
                            </button>
                          )}
                          <button
                            onClick={() => handleSaveAlistamiento(quote.id)}
                            className="btn-primary"
                            style={{
                              padding: '12px 24px',
                              borderRadius: '12px',
                              fontWeight: 700,
                              backgroundColor: '#10B981',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <Check size={18} />
                            <span>Completar Alistamiento</span>
                          </button>
                        </div>
                      </>
                    )}

                  </div>
                );
              })() : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#64748B', padding: '48px 0', flex: 1 }}>
                <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px', color: '#94A3B8' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Seleccione un pedido</h3>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>El sistema cargará los pesos reales del cuarto frío y permitirá aplicar saldos de devolución.</p>
              </div>
            )}
          </div>
        </div>
        ) : activeSubView === 'gestion_kanban' ? (
          <OrderKanbanView
            quotations={quotations}
            setQuotations={setQuotations}
            publishEvent={publishEvent}
            userRole={userRole}
            onEditOrder={(quote) => {
              setSelectedB2BQuoteId(quote.id);
              setSelectedDevIds([]);
              const initialQtys: Record<string, number | string> = {};
              (quote.items || []).forEach((item: any) => {
                initialQtys[item.sku] = item.cantidad_real !== undefined ? item.cantidad_real : item.cantidad;
              });
              setTempRealQuantities(initialQtys);
              setActiveSubView('consolidacion_b2b');
            }}
          />
        ) : (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          
          {/* Encabezado y Simulaciones */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #E2E8F0'
          }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>Cola de Integraciones Digitales</h2>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                Monitoree en tiempo real los payloads entrantes de Rappi y Shopify. El worker procesa la cola de forma asíncrona.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  const extId = `SHO-${Math.floor(1000 + Math.random() * 9000)}`;
                  const mockPayload = {
                    signature: 'VALID_CRYPTO_SIGNATURE',
                    clienteId: null,
                    clienteNombre: 'Consumidor Shopify',
                    items: [
                      { sku: 'sku-1', nombre: 'Filete de Salmón Premium', cantidad: 2, precioUnitario: 35000 }
                    ],
                    subtotal: 70000,
                    total: 70000
                  };
                  const newLog = {
                    id: `log-${crypto.randomUUID().slice(0, 8)}`,
                    id_pedido_externo: extId,
                    canal: 'Shopify',
                    fecha_recepcion: new Date().toISOString(),
                    payload_json: JSON.stringify(mockPayload),
                    estado: 'PENDIENTE' as const
                  };
                  setLogIntegracion((prev: any) => [newLog, ...prev]);
                  Swal.fire({
                    icon: 'success',
                    title: 'Pedido Shopify Encolado',
                    text: `Pedido ${extId} agregado a la cola de procesamiento.`,
                    confirmButtonColor: 'var(--primary-color)'
                  });
                }}
                className="btn-primary"
                style={{ backgroundColor: '#10B981', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                <Plus size={16} /> Shopify Ok (RN-03)
              </button>

              <button
                onClick={() => {
                  const extId = `RAP-${Math.floor(1000 + Math.random() * 9000)}`;
                  const mockPayload = {
                    signature: 'INVALID_SIGNATURE',
                    clienteId: null,
                    clienteNombre: 'Infiltrado Rappi',
                    items: [
                      { sku: 'sku-2', nombre: 'Camarón Tigre U15', cantidad: 1, precioUnitario: 42000 }
                    ],
                    subtotal: 42000,
                    total: 42000
                  };
                  const newLog = {
                    id: `log-${crypto.randomUUID().slice(0, 8)}`,
                    id_pedido_externo: extId,
                    canal: 'Rappi',
                    fecha_recepcion: new Date().toISOString(),
                    payload_json: JSON.stringify(mockPayload),
                    estado: 'PENDIENTE' as const
                  };
                  setLogIntegracion((prev: any) => [newLog, ...prev]);
                  Swal.fire({
                    icon: 'warning',
                    title: 'Pedido Firma Inválida Encolado',
                    text: `Pedido ${extId} agregado. Debería ser rechazado por seguridad (RN-01).`,
                    confirmButtonColor: 'var(--primary-color)'
                  });
                }}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                <AlertCircle size={16} /> Firma Inválida (RN-01)
              </button>

              <button
                onClick={() => {
                  const extId = `SHO-${Math.floor(1000 + Math.random() * 9000)}`;
                  const mockPayload = {
                    signature: 'VALID_CRYPTO_SIGNATURE',
                    clienteId: null,
                    clienteNombre: 'Cliente Sin Stock',
                    items: [
                      { sku: 'sku-1', nombre: 'Filete de Salmón Premium', cantidad: 9999, precioUnitario: 35000 }
                    ],
                    subtotal: 349965000,
                    total: 349965000
                  };
                  const newLog = {
                    id: `log-${crypto.randomUUID().slice(0, 8)}`,
                    id_pedido_externo: extId,
                    canal: 'Shopify',
                    fecha_recepcion: new Date().toISOString(),
                    payload_json: JSON.stringify(mockPayload),
                    estado: 'PENDIENTE' as const
                  };
                  setLogIntegracion((prev: any) => [newLog, ...prev]);
                  Swal.fire({
                    icon: 'warning',
                    title: 'Pedido Agotado Encolado',
                    text: `Pedido ${extId} solicitando 9999 kg de Salmón. Debería ser retenido para revisión manual (RN-07).`,
                    confirmButtonColor: 'var(--primary-color)'
                  });
                }}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                <AlertTriangle size={16} /> Stock Out (RN-07)
              </button>
            </div>
          </div>

          {/* Tabla de payloads */}
          <div className="hr-table-card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: '#0F172A' }}>Cola de payloads JSON recibidos</h3>
            
            <table className="hr-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px' }}>Recepción</th>
                  <th style={{ padding: '12px 16px' }}>Canal</th>
                  <th style={{ padding: '12px 16px' }}>ID Externo</th>
                  <th style={{ padding: '12px 16px' }}>Estado</th>
                  <th style={{ padding: '12px 16px' }}>Factura POS</th>
                  <th style={{ padding: '12px 16px' }}>Detalles / Error</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {logIntegracion.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                      No se han recibido eventos de canales digitales. Use los simuladores de arriba.
                    </td>
                  </tr>
                ) : (
                  logIntegracion.map((log: any) => {
                    let itemsCount = 0;
                    let totalVal = 0;
                    try {
                      const data = JSON.parse(log.payload_json);
                      itemsCount = data.items?.length || 0;
                      totalVal = data.total || 0;
                    } catch(e) {}

                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B' }}>
                          {new Date(log.fecha_recepcion).toLocaleString('es-CO')}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: log.canal.toLowerCase() === 'shopify' ? '#EEF2F6' : '#FEF2F2',
                            color: log.canal.toLowerCase() === 'shopify' ? '#2563EB' : '#DC2626'
                          }}>
                            {log.canal.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{log.id_pedido_externo}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`badge-status ${
                            log.estado === 'PROCESADO' ? 'activo' :
                            log.estado === 'PENDIENTE' ? 'despachado' :
                            log.estado === 'REVISION_MANUAL' ? 'programado' : 'inactivo'
                          }`} style={{
                            backgroundColor: log.estado === 'REVISION_MANUAL' ? '#FEF3C7' : undefined,
                            color: log.estado === 'REVISION_MANUAL' ? '#D97706' : undefined,
                          }}>
                            {log.estado}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                          {log.id_factura_pos ? log.id_factura_pos.toUpperCase() : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', maxWidth: '250px', wordBreak: 'break-all' }}>
                          {log.mensaje_error ? (
                            <span style={{ color: '#EF4444', fontWeight: 500 }}>{log.mensaje_error}</span>
                          ) : (
                            <span style={{ color: '#64748B' }}>
                              {itemsCount} artículo(s) • Total: ${totalVal.toLocaleString('es-CO')}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {log.estado === 'REVISION_MANUAL' && (
                            <>
                              <button
                                onClick={() => handleAprobarPedidoManual(log.id, 'parcial')}
                                className="btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}
                              >
                                Stock Parcial
                              </button>
                              <button
                                onClick={() => handleAprobarPedidoManual(log.id, 'forzar')}
                                className="btn-primary"
                                style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#F59E0B', color: 'white', border: 'none', cursor: 'pointer' }}
                              >
                                Forzar Venta
                              </button>
                            </>
                          )}
                          {log.estado === 'PROCESADO' && (
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: '¿Confirmar cancelación?',
                                  text: `Esta acción emitirá una Nota de Crédito/Devolución y reintegrará el stock al inventario (RN-04).`,
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonColor: '#EF4444',
                                  confirmButtonText: 'Sí, cancelar y reversar stock',
                                  cancelButtonText: 'No, mantener activo'
                                }).then((res) => {
                                  if (res.isConfirmed) {
                                    handleCancelarPedidoDigital(log.id);
                                    Swal.fire('Pedido Reversado', 'Se generó la devolución y el stock regresó a bodega.', 'success');
                                  }
                                });
                              }}
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', color: '#EF4444', borderColor: '#FCA5A5', cursor: 'pointer' }}
                            >
                              Cancelar Pedido
                            </button>
                          )}
                          {log.estado === 'PENDIENTE' && (
                            <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                              Procesando...
                            </span>
                          )}
                          {log.estado === 'ERROR' && (
                            <button
                              onClick={() => {
                                setLogIntegracion((prev: any) =>
                                  prev.map((l: any) => l.id === log.id ? { ...l, estado: 'PENDIENTE', mensaje_error: undefined } : l)
                                );
                              }}
                              className="btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              Reprocesar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Apertura de Caja */}
      {showAperturaModal && (
        <AperturaCajaModal
          userRole={userRole}
          bodegaActiva={useWarehouseStore.getState().getPrimaryBodega()?.nombre || 'Bodega Principal'}
          onSuccess={() => setShowAperturaModal(false)}
          onCancel={() => setCurrentView('dashboard')}
        />
      )}

      {/* Modal de Arqueo de Caja */}
      {showArqueoModal && (
        <ArqueoCajaModal
          turnoActivo={cashService.getTurnos().find(t => t.cajeroId === userRole && t.estado === 'ABIERTO')!}
          usuarioId={userRole}
          onSuccess={() => {
            setShowArqueoModal(false);
            setIsTurnoAbierto(false);
            setCurrentView('dashboard');
          }}
          onClose={() => setShowArqueoModal(false)}
        />
      )}
    </div>
  );
}
