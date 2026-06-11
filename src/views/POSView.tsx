// src/views/POSView.tsx
import React, { useState } from 'react';
import { Search, Plus, Minus, X, Check, Barcode, Save, CreditCard, FileText, Truck, RefreshCw, AlertTriangle, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { Product, DynamicField, Cliente, generateId, Venta, MovimientoInventario, Conductor, DevolucionPedido } from '../App.tsx';
import { InvoiceAR } from './ARView.tsx';

interface CartItem {
  product: Product;
  cantidad: number;
  precioOverride?: number;
}

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
  setStock: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  lastClientPrices: Record<string, Record<string, number>>;
  updateLastClientPrice: (clientKey: string, sku: string, price: number) => void;
  cartera: any[];
  setCartera: React.Dispatch<React.SetStateAction<any[]>>;
  clientes: Cliente[];
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>;
  ventas: Venta[];
  setVentas: React.Dispatch<React.SetStateAction<Venta[]>>;
  movimientos: MovimientoInventario[];
  setMovimientos: React.Dispatch<React.SetStateAction<MovimientoInventario[]>>;
  conductores: Conductor[];
  devoluciones: DevolucionPedido[];
  setDevoluciones: React.Dispatch<React.SetStateAction<DevolucionPedido[]>>;
  quotations: any[];
  setQuotations: React.Dispatch<React.SetStateAction<any[]>>;
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
  parametros: _parametros = {}
}: Omit<POSViewProps, 'setCurrentView'>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [drafts, setDrafts] = useState<any[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  
  // B2B Consolidation State
  const [activeSubView, setActiveSubView] = useState<'venta_pos' | 'consolidacion_b2b' | 'canales_digitales'>('venta_pos');
  const [selectedB2BQuoteId, setSelectedB2BQuoteId] = useState<string | null>(null);
  const [selectedDevIds, setSelectedDevIds] = useState<string[]>([]);
  const [b2bPaymentMethod, setB2bPaymentMethod] = useState<'CREDITO' | 'CONTADO'>('CREDITO');

  // Filtrar productos activos
  const activeProducts = products.filter(p => p.activo);
  
  // Categorías calculadas dinámicamente
  const CATEGORIAS = ['TODOS', ...Array.from(new Set(activeProducts.map(p => p.categoria)))];

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [descuentoGlobal, setDescuentoGlobal] = useState(0); // Porcentaje

  const getClienteDeuda = (cId: string) => {
    return cartera
      .filter(inv => inv.clienteId === cId)
      .reduce((sum, inv) => sum + inv.saldo, 0);
  };

  const getProductPrice = (product: Product) => {
    if (cliente) {
      // CLAVE: usa identificacion (NIT/CC) — campo inmutable, no el nombre
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
    setCart(prevCart => {
      const exists = prevCart.find(item => item.product.id === product.id);
      if (exists) {
        return prevCart.map(item =>
          item.product.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prevCart, { product, cantidad: 1 }];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart(prevCart =>
      prevCart
        .map(item => {
          if (item.product.id === productId) {
            const nuevaCantidad = item.cantidad + delta;
            return { ...item, cantidad: nuevaCantidad };
          }
          return item;
        })
        .filter(item => item.cantidad > 0)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
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
            nombre: nombre.toUpperCase(),
            identificacion,
            tipoIdentificacion,
            tipoPersona,
            direccion,
            telefono,
            email,
            ciudad,
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
        setClientes(prev => [...prev, selectedCliente.client]);
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

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    const prod = activeProducts.find(p => p.sku.toLowerCase() === barcodeInput.toLowerCase());
    if (prod) {
      handleAddProduct(prod);
      setBarcodeInput('');
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Agregado: ${prod.nombre}`,
        showConfirmButton: false,
        timer: 1200
      });
    } else {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Código de barras no válido',
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  const simulateBarcodeScan = () => {
    const randomProduct = activeProducts[Math.floor(Math.random() * activeProducts.length)];
    if (randomProduct) {
      handleAddProduct(randomProduct);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Escaneado: ${randomProduct.nombre}`,
        showConfirmButton: false,
        timer: 1500
      });
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
    
    setCart([]);
    setCliente(null);
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

  const handlePagar = () => {
    if (cart.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Carrito vacío',
        text: 'Agrega productos al pedido antes de proceder al cobro.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    // ─ RN-07: Validación restrictiva de Stock en Bodega Principal antes de permitir el cobro ──────────────────
    let stockSuficiente = true;
    const itemsFaltantes: string[] = [];
    cart.forEach(item => {
      const stockDisponible = getProductStock(item.product.sku, 'Bodega Principal');
      if (stockDisponible < item.cantidad) {
        stockSuficiente = false;
        itemsFaltantes.push(`• ${item.product.nombre} (Solicitado: ${item.cantidad}, Disponible: ${stockDisponible})`);
      }
    });

    if (!stockSuficiente) {
      Swal.fire({
        icon: 'error',
        title: 'Venta Bloqueada: Stock Insuficiente',
        html: `
          <div style="text-align: left; font-size: 14px;">
            <p>No se puede liquidar la venta porque el stock en <strong>Bodega Principal</strong> es insuficiente:</p>
            <ul style="color: #EF4444; font-weight: 600; list-style-type: none; padding-left: 0;">
              ${itemsFaltantes.map(msg => `<li style="margin-bottom: 6px;">${msg}</li>`).join('')}
            </ul>
            <p style="margin-top: 12px; font-size: 13px; color: #64748B;">Ajuste las cantidades en el carrito antes de reintentar.</p>
          </div>
        `,
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    Swal.fire({
      title: 'Procesar Pago de Venta',
      html: `
        <div style="text-align: left; font-size: 14px; color: var(--text-primary);">
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 16px; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px;">
            <strong>Total a Pagar:</strong> <strong style="color: var(--primary-color);">$${totalFinal.toLocaleString('es-CO')}</strong>
          </div>

          <!-- Opción Facturación Electrónica (Fase 1) -->
          <div style="margin-bottom: 16px; padding: 12px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <label style="display: flex; align-items: center; gap: 8px; font-weight: 600; cursor: pointer; color: #0F172A;">
              <input type="checkbox" id="req-fe" style="width: 18px; height: 18px; accent-color: var(--primary-color);" />
              ¿Generar Factura Electrónica (Siigo)?
            </label>
            <p style="margin: 4px 0 0 26px; font-size: 11px; color: #64748B;">Si no se marca, se generará un ticket interno (Contingencia/Fase 1).</p>
          </div>

          <!-- Selector de Tipo de Pago -->
          <div style="margin-bottom: 16px; display: flex; gap: 8px; justify-content: center;">
            <button id="btn-sale-contado" type="button" style="flex: 1; padding: 10px; border: 2px solid var(--primary-color); background-color: var(--primary-light); color: var(--primary-color); font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s;">
              💰 Contado
            </button>
            <button id="btn-sale-credito" type="button" style="flex: 1; padding: 10px; border: 2px solid #E2E8F0; background-color: #F8FAFC; color: var(--text-secondary); font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s; ${!cliente ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
              💳 Crédito
            </button>
          </div>

          <!-- Alerta de Cliente Requerido para Crédito -->
          <div id="credit-client-warning" style="display: none; padding: 8px 12px; background-color: #FFF5F5; border: 1px solid #FEB2B2; color: #C53030; border-radius: var(--radius-sm); font-size: 12px; margin-bottom: 12px; text-align: center; font-weight: 600;">
            ⚠️ Debe vincular un Cliente en el POS para poder vender a Crédito.
          </div>

          <!-- Sección Contado -->
          <div id="section-contado">
            <div style="margin-bottom: 10px;">
              <label style="display: block; font-weight: 600; margin-bottom: 4px;">Transferencia Bancaria ($):</label>
              <input id="pay-transfer" type="number" class="swal2-input" style="margin: 0; width: 100%; box-sizing: border-box;" placeholder="Valor en transferencia..." value="0" />
            </div>

            <div style="margin-bottom: 10px;">
              <label style="display: block; font-weight: 600; margin-bottom: 4px;">Datáfono (Tarjeta Crédito/Débito) ($):</label>
              <input id="pay-card" type="number" class="swal2-input" style="margin: 0; width: 100%; box-sizing: border-box;" placeholder="Valor con tarjeta..." value="0" />
            </div>

            <div style="margin-bottom: 10px;">
              <label style="display: block; font-weight: 600; margin-bottom: 4px;">Efectivo Recibido ($):</label>
              <input id="pay-cash" type="number" class="swal2-input" style="margin: 0; width: 100%; box-sizing: border-box;" placeholder="Monto entregado en efectivo..." value="0" />
            </div>
          </div>

          <!-- Sección Crédito -->
          <div id="section-credito" style="display: none; padding: 16px; background-color: #EEF2F6; border-radius: 8px; border: 1px solid #CBD5E1; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; color: #334155; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
              <span>💳 Compra a Crédito Autorizada</span>
            </div>
            <p style="color: #64748B; font-size: 13px; margin: 0 0 12px 0;">
              El total de la factura por valor de <strong>$${totalFinal.toLocaleString('es-CO')}</strong> se cargará por completo a la cartera del cliente: <br/>
              <strong style="color: #1E293B;">${cliente ? cliente.nombre : ''}</strong> (${cliente ? cliente.identificacion : ''}).
            </p>
            <div style="margin-bottom: 4px;">
              <label style="display: block; font-weight: 600; margin-bottom: 4px; font-size: 13px;">Fecha Límite de Pago:</label>
              <input id="pay-credit-date" type="date" class="swal2-input" style="margin: 0; width: 100%; box-sizing: border-box; font-size: 14px; padding: 8px;" />
            </div>
          </div>

          <!-- Totales (sólo para Contado) -->
          <div id="section-totals" style="margin-top: 16px; padding: 12px; background-color: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Total Recibido:</span>
              <strong id="pay-total-paid" style="color: #1E293B;">$0</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span id="pay-change-label" style="font-weight: 600;">Faltante:</span>
              <strong id="pay-change" style="color: #EF4444;">$${totalFinal.toLocaleString('es-CO')}</strong>
            </div>
          </div>

          <!-- Entrada Crédito Oculta/Interna -->
          <input id="pay-credit" type="hidden" value="0" />
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Liquidar y Facturar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-color)',
      didOpen: () => {
        const btnContado = document.getElementById('btn-sale-contado') as HTMLButtonElement;
        const btnCredito = document.getElementById('btn-sale-credito') as HTMLButtonElement;
        const sectionContado = document.getElementById('section-contado') as HTMLDivElement;
        const sectionCredito = document.getElementById('section-credito') as HTMLDivElement;
        const sectionTotals = document.getElementById('section-totals') as HTMLDivElement;
        const creditClientWarning = document.getElementById('credit-client-warning') as HTMLDivElement;

        const inputTransfer = document.getElementById('pay-transfer') as HTMLInputElement;
        const inputCard = document.getElementById('pay-card') as HTMLInputElement;
        const inputCash = document.getElementById('pay-cash') as HTMLInputElement;
        const inputCredit = document.getElementById('pay-credit') as HTMLInputElement;

        let activeMode: 'contado' | 'credito' = 'contado';

        const setMode = (mode: 'contado' | 'credito') => {
          activeMode = mode;
          if (mode === 'contado') {
            // Activar botón Contado
            btnContado.style.borderColor = 'var(--primary-color)';
            btnContado.style.backgroundColor = 'var(--primary-light)';
            btnContado.style.color = 'var(--primary-color)';

            // Desactivar botón Crédito
            btnCredito.style.borderColor = '#E2E8F0';
            btnCredito.style.backgroundColor = '#F8FAFC';
            btnCredito.style.color = 'var(--text-secondary)';

            // Alternar secciones
            sectionContado.style.display = 'block';
            sectionCredito.style.display = 'none';
            sectionTotals.style.display = 'block';
            creditClientWarning.style.display = 'none';

            inputCredit.value = '0';
          } else {
            if (!cliente) {
              creditClientWarning.style.display = 'block';
              return;
            }

            // Activar botón Crédito
            btnCredito.style.borderColor = 'var(--primary-color)';
            btnCredito.style.backgroundColor = 'var(--primary-light)';
            btnCredito.style.color = 'var(--primary-color)';

            // Desactivar botón Contado
            btnContado.style.borderColor = '#E2E8F0';
            btnContado.style.backgroundColor = '#F8FAFC';
            btnContado.style.color = 'var(--text-secondary)';

            // Alternar secciones
            sectionContado.style.display = 'none';
            sectionCredito.style.display = 'block';
            sectionTotals.style.display = 'none';
            creditClientWarning.style.display = 'none';

            // Todo a crédito
            inputCredit.value = totalFinal.toString();
            inputTransfer.value = '0';
            inputCard.value = '0';
            inputCash.value = '0';
          }
          updateCalculations();
        };

        btnContado.addEventListener('click', () => setMode('contado'));
        btnCredito.addEventListener('click', () => {
          if (!cliente) {
            creditClientWarning.style.display = 'block';
            setTimeout(() => {
              if (creditClientWarning) creditClientWarning.style.display = 'none';
            }, 3000);
          } else {
            setMode('credito');
          }
        });

        const updateCalculations = () => {
          if (activeMode === 'credito') {
            return;
          }
          const total = totalFinal;
          const transfer = parseFloat(inputTransfer.value) || 0;
          const card = parseFloat(inputCard.value) || 0;
          const cash = parseFloat(inputCash.value) || 0;

          const totalPaid = transfer + card + cash;
          const diff = totalPaid - total;

          const totalPaidEl = document.getElementById('pay-total-paid');
          const changeEl = document.getElementById('pay-change');
          const changeLabelEl = document.getElementById('pay-change-label');

          if (totalPaidEl) totalPaidEl.innerText = '$' + totalPaid.toLocaleString('es-CO');

          if (changeEl && changeLabelEl) {
            if (diff >= 0) {
              changeLabelEl.innerText = 'Cambio a Devolver:';
              changeEl.innerText = '$' + diff.toLocaleString('es-CO');
              changeEl.style.color = '#10B981';
            } else {
              changeLabelEl.innerText = 'Faltante:';
              changeEl.innerText = '$' + Math.abs(diff).toLocaleString('es-CO');
              changeEl.style.color = '#EF4444';
            }
          }
        };

        [inputTransfer, inputCard, inputCash].forEach(input => {
          input.addEventListener('input', updateCalculations);
          input.addEventListener('focus', () => {
            if (input.value === '0') input.value = '';
          });
          input.addEventListener('blur', () => {
            if (input.value === '') input.value = '0';
          });
        });

        updateCalculations();
      },
      preConfirm: () => {
        const transfer = parseFloat((document.getElementById('pay-transfer') as HTMLInputElement).value) || 0;
        const card = parseFloat((document.getElementById('pay-card') as HTMLInputElement).value) || 0;
        const cash = parseFloat((document.getElementById('pay-cash') as HTMLInputElement).value) || 0;
        const credit = parseFloat((document.getElementById('pay-credit') as HTMLInputElement).value) || 0;
        const creditDate = (document.getElementById('pay-credit-date') as HTMLInputElement)?.value;
        const requiereFE = (document.getElementById('req-fe') as HTMLInputElement).checked;

        const totalPaid = transfer + card + cash + credit;

        if (credit > 0) {
          if (!cliente) {
            Swal.showValidationMessage('Debe vincular un Cliente registrado para poder procesar pagos a Crédito.');
            return false;
          }
          if (!creditDate) {
            Swal.showValidationMessage('Debe seleccionar una Fecha Límite de Pago para la venta a crédito.');
            return false;
          }
          const currentDebt = getClienteDeuda(cliente.id);
          const proposedDebt = currentDebt + credit;
          if (proposedDebt > cliente.cupoCredito) {
            Swal.showValidationMessage(`Límite de crédito excedido. Cupo total: $${cliente.cupoCredito.toLocaleString('es-CO')}. Deuda actual: $${currentDebt.toLocaleString('es-CO')}. Deuda propuesta: $${proposedDebt.toLocaleString('es-CO')}. Cupo disponible: $${Math.max(0, cliente.cupoCredito - currentDebt).toLocaleString('es-CO')}`);
            return false;
          }
        }

        if (totalPaid < totalFinal) {
          Swal.showValidationMessage(`El pago total ($${totalPaid.toLocaleString('es-CO')}) es menor al valor de la venta ($${totalFinal.toLocaleString('es-CO')}). Faltan $${(totalFinal - totalPaid).toLocaleString('es-CO')}`);
          return false;
        }

        return { transfer, card, cash, credit, creditDate, totalPaid, change: totalPaid - totalFinal, requiereFE };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { transfer, card, cash, credit, creditDate, change, requiereFE } = result.value;
        const orderNo = 'PED-' + Math.floor(100000 + Math.random() * 900000);
        const vtaId = generateId('vta');

        // Decrease stock in Bodega Principal
        setStock(prev => {
          const newStock = { ...prev };
          if (newStock['Bodega Principal']) {
            newStock['Bodega Principal'] = newStock['Bodega Principal'].map((stockItem: any) => {
              const cartItem = cart.find(i => i.product.sku === stockItem.sku);
              if (cartItem) {
                return { ...stockItem, stock: Math.max(0, stockItem.stock - cartItem.cantidad) };
              }
              return stockItem;
            });
          }
          return newStock;
        });

        // Registrar últimos precios por cliente usando identificacion como clave
        if (cliente) {
          cart.forEach(item => {
            const finalUnitPrice = item.precioOverride !== undefined ? item.precioOverride : getProductPrice(item.product);
            updateLastClientPrice(cliente.identificacion, item.product.sku, finalUnitPrice);
          });
        }

        // F2: Crear y registrar entidad Venta
        let paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CREDITO' | 'MIXTO' = 'EFECTIVO';
        if (credit > 0) {
          paymentMethod = (cash > 0 || transfer > 0 || card > 0) ? 'MIXTO' : 'CREDITO';
        } else {
          const activeMethods = [cash > 0, transfer > 0, card > 0].filter(Boolean).length;
          if (activeMethods > 1) {
            paymentMethod = 'MIXTO';
          } else if (transfer > 0) {
            paymentMethod = 'TRANSFERENCIA';
          } else if (card > 0) {
            paymentMethod = 'TARJETA';
          } else {
            paymentMethod = 'EFECTIVO';
          }
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
              cantidad: item.cantidad,
              precioUnitario: unitPrice,
              descuento: 0,
              subtotal: item.cantidad * unitPrice
            };
          }),
          subtotal: subtotal,
          descuento: totalDescuento,
          total: totalFinal,
          metodoPago: (paymentMethod === 'EFECTIVO' || paymentMethod === 'TRANSFERENCIA' || paymentMethod === 'TARJETA') ? 'CONTADO' : paymentMethod as 'CREDITO' | 'CONTADO' | 'MIXTO',
          montoPagadoEfectivo: cash,
          montoPagadoTransferencia: transfer,
          montoPagadoTarjeta: card,
          montoPagadoCredito: credit,
          cambioEntregado: change,
          actor: userRole
        };
        setVentas(prev => [newVenta, ...prev]);

        // F2: Registrar Movimiento de Inventario de tipo SALIDA_VENTA para cada item
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
            cantidad: item.cantidad,
            lote: lote,
            referenciaId: vtaId,
            referenciaTipo: 'VENTA',
            actor: userRole,
            notas: `Venta POS a ${cliente ? cliente.nombre : 'Consumidor Final'}`
          };
        });
        setMovimientos(prev => [...newMovements, ...prev]);

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
            pagado: totalFinal - credit,
            pagos: []
          };
          
          if (transfer > 0) {
            newAR.pagos.push({ id: generateId('pgo-t'), fecha: new Date().toISOString(), monto: transfer, metodo: 'Transferencia' });
          }
          if (card > 0) {
            newAR.pagos.push({ id: generateId('pgo-c'), fecha: new Date().toISOString(), monto: card, metodo: 'Datáfono' });
          }
          if (cash > 0) {
            const efectivoAbonado = Math.max(0, cash - change);
            if (efectivoAbonado > 0) {
              newAR.pagos.push({ id: generateId('pgo-cs'), fecha: new Date().toISOString(), monto: efectivoAbonado, metodo: 'Efectivo' });
            }
          }

          setCartera(prev => [newAR, ...prev]);
        }

        publishEvent(
          'SALE_COMPLETED',
          userRole,
          `Venta liquidada para ${cliente ? cliente.nombre : 'Consumidor Final'} por total de $${totalFinal.toLocaleString('es-CO')}. FE: ${requiereFE ? 'SÍ' : 'NO'}. (Transf: $${transfer.toLocaleString('es-CO')}, Tarjeta: $${card.toLocaleString('es-CO')}, Efectivo: $${cash.toLocaleString('es-CO')}, Crédito: $${credit.toLocaleString('es-CO')})`,
          { cliente, total: totalFinal, requiereFE, items: cart.map(i => ({ sku: i.product.sku, cantidad: i.cantidad })), transfer, card, cash, credit, change }
        );

        let desgloseHtml = `
          <div style="text-align: left; font-size: 14px; color: var(--text-primary); margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <strong>Total Factura:</strong> <span>$${totalFinal.toLocaleString('es-CO')}</span>
            </div>
        `;

        if (transfer > 0) {
          desgloseHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #475569;">
              <span>• Transferencia:</span> <span>$${transfer.toLocaleString('es-CO')}</span>
            </div>
          `;
        }
        if (card > 0) {
          desgloseHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #475569;">
              <span>• Tarjeta (Datáfono):</span> <span>$${card.toLocaleString('es-CO')}</span>
            </div>
          `;
        }
        if (cash > 0) {
          desgloseHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #475569;">
              <span>• Efectivo Recibido:</span> <span>$${cash.toLocaleString('es-CO')}</span>
            </div>
          `;
        }
        if (credit > 0) {
          desgloseHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #EF4444; font-weight: 600;">
              <span>• Crédito Otorgado:</span> <span>$${credit.toLocaleString('es-CO')}</span>
            </div>
          `;
        }

        desgloseHtml += `
            <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 8px; border-top: 1px solid #E2E8F0; font-size: 16px; font-weight: 800; color: #10B981;">
              <span>Cambio a Devolver:</span> <span>$${change.toLocaleString('es-CO')}</span>
            </div>
          </div>
        `;

        Swal.fire({
          icon: 'success',
          title: 'Venta Realizada con Éxito',
          html: desgloseHtml,
          confirmButtonColor: 'var(--primary-color)'
        });

        if (activeDraftId) {
          setDrafts(prev => prev.filter(x => x.id !== activeDraftId));
          setActiveDraftId(null);
        }

        setCart([]);
        setCliente(null);
        setDescuentoGlobal(0);
      }
    });
  };

  const getReturnAmount = (dev: DevolucionPedido) => {
    return (dev.items || []).reduce((sum, item) => {
      const qty = item.cantidadRecibida || 0;
      return sum + qty * (item.precioUnitarioVenta || 0);
    }, 0);
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
    setStock(prev => {
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
    setMovimientos(prev => [...newMovements, ...prev]);

    // Actualizar estado cotización
    if (setQuotations) {
      setQuotations(prev => prev.map(q => {
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
        setDevoluciones(prev => prev.map(d => {
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
        total: b2bTotalFinal,
        saldo: b2bTotalFinal,
        pagado: 0,
        pagos: []
      };
      setCartera(prev => [newAR, ...prev]);
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
    setVentas(prev => [newVenta, ...prev]);

    publishEvent(
      'SALE_COMPLETED',
      userRole,
      `Factura B2B generada para ${client.nombre} por total de $${b2bTotalFinal.toLocaleString('es-CO')} (${b2bPaymentMethod}). Devoluciones cruzadas: ${appliedDevs.length}`,
      { quoteId, client: client.nombre, total: b2bTotalFinal }
    );

    Swal.fire({
      icon: 'success',
      title: 'Factura Electrónica Generada',
      text: `La factura fue emitida exitosamente en Siigo y el inventario físico ha sido descontado.`,
      confirmButtonColor: '#10B981'
    });

    setSelectedB2BQuoteId(null);
    setSelectedDevIds([]);
  };

  // Filtrado de productos
  let filteredProducts = activeProducts.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'TODOS' || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Productos más vendidos por defecto
  if (searchTerm === '' && selectedCategory === 'TODOS') {
    const topKeywords = ['salmon', 'salmón', 'camaron', 'camarón', 'trucha', 'robalo', 'róbalo', 'langostino'];
    filteredProducts = [...filteredProducts].sort((a, b) => {
       const aTop = topKeywords.some(k => a.nombre.toLowerCase().includes(k)) ? 1 : 0;
       const bTop = topKeywords.some(k => b.nombre.toLowerCase().includes(k)) ? 1 : 0;
       return bTop - aTop;
    });
  }

  // Cálculos financieros
  const subtotal = cart.reduce((acc, item) => {
    const unitPrice = item.precioOverride !== undefined ? item.precioOverride : getProductPrice(item.product);
    return acc + unitPrice * item.cantidad;
  }, 0);
  const totalDescuento = subtotal * (descuentoGlobal / 100);
  const totalFinal = subtotal - totalDescuento;

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
        </div>
        
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 500 }}>
          Rol: <span style={{ color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>{userRole}</span>
        </div>
      </div>

      {activeSubView === 'venta_pos' ? (
        <div className="pos-layout animate-fade-in" style={{ padding: 0, border: 'none', boxShadow: 'none', background: 'transparent', margin: 0, width: '100%', display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '20px' }}>
          {/* Catálogo de Productos */}
          <div className="pos-catalog">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          {/* Búsqueda por Texto */}
          <div className="pos-search-bar" style={{ flex: 1, marginBottom: 0 }}>
            <Search size={18} color="#64748B" />
            <input
              type="text"
              className="pos-search-input"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Búsqueda por Código de Barras */}
          <form onSubmit={handleBarcodeSubmit} style={{ display: 'flex', gap: '8px' }}>
            <div className="pos-search-bar" style={{ width: '220px', marginBottom: 0 }}>
              <Barcode size={18} color="#64748B" />
              <input
                type="text"
                className="pos-search-input"
                placeholder="Código de Barras..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              onClick={simulateBarcodeScan}
            >
              <Barcode size={16} />
              Simular Scan
            </button>
          </form>
        </div>

        <div className="pos-categories">
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              className={`pos-category-tab ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="pos-products-grid">
          {filteredProducts.map(prod => {
            const stockPrincipal = getProductStock(prod.sku, 'Bodega Principal');
            const stockSecundaria = getProductStock(prod.sku, 'Bodega Secundaria');
            const stockAverias = getProductStock(prod.sku, 'Bodega Averías');
            return (
              <div key={prod.id} className="product-card" onClick={() => handleAddProduct(prod)}>
                <div className="product-image-container">
                  <img
                    src={prod.imagen || 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}
                    alt={prod.nombre}
                    className="product-image"
                  />
                </div>
                <div className="product-info-panel">
                  <span className="product-card-name">{prod.nombre}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '4px' }}>
                    <span className="product-card-price-tag">${getProductPrice(prod).toLocaleString('es-CO')}</span>
                    {cliente && (cliente.tipoPrecio === 'RESTAURANTE' || cliente.tipoPrecio === 'MAYORISTA') && (
                      <span style={{ fontSize: '9px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {cliente.tipoPrecio}
                      </span>
                    )}
                  </div>
                  {dynamicFields.map(field => {
                    const val = prod.metadata?.[field.key] || field.defaultValue;
                    return (
                      <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', width: '100%', marginTop: '2px' }}>
                        <span style={{ fontWeight: 600 }}>{field.label}:</span>
                        <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold' }}>{val}</span>
                      </div>
                    );
                  })}
                  
                  {/* Stock por Bodega */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', marginTop: '6px', borderTop: '1px dashed #E2E8F0', paddingTop: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span style={{ color: '#64748B', fontWeight: 500 }}>Bod. Principal:</span>
                      <span style={{
                        fontWeight: 700,
                        color: stockPrincipal === 0 ? '#EF4444' : stockPrincipal <= prod.buffer_seguridad ? '#F59E0B' : '#10B981'
                      }}>
                        {stockPrincipal} uds
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span style={{ color: '#64748B', fontWeight: 500 }}>Bod. Secundaria:</span>
                      <span style={{ color: '#475569', fontWeight: 600 }}>
                        {stockSecundaria} uds
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span style={{ color: '#64748B', fontWeight: 500 }}>Bod. Averías:</span>
                      <span style={{ color: '#E11D48', fontWeight: 600 }}>
                        {stockAverias} uds
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carrito de Compras / Factura */}
      <div className="pos-sidebar-cart">
        <div className="pos-cart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {cliente ? (
            <div className="add-client-btn" onClick={handleAgregarCliente}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} />
                <span style={{ fontSize: '12px' }}>{cliente.nombre.slice(0, 18)} ({cliente.identificacion})</span>
              </div>
              <X size={14} onClick={(e) => { e.stopPropagation(); setCliente(null); }} />
            </div>
          ) : (
            <button className="add-client-btn" onClick={handleAgregarCliente}>
              <span>Agregar Cliente</span>
              <Plus size={16} />
            </button>
          )}

          <button 
            onClick={() => {
              if (drafts.length === 0) {
                Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'No hay borradores', showConfirmButton: false, timer: 1500 });
                return;
              }
              let html = '<div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;">';
              drafts.forEach(d => {
                 const isSelected = activeDraftId === d.id;
                 html += `<div style="display:flex; align-items:stretch; background-color: white; border: 1px solid ${isSelected ? 'var(--primary-color)' : '#CBD5E1'}; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <div id="draft-select-${d.id}" style="flex: 1; padding: 10px; cursor: pointer; text-align: left; background-color: ${isSelected ? 'var(--primary-light)' : 'transparent'};">
                      <div style="font-weight:bold;color:#0F172A; display:flex; justify-content:space-between;">
                        <span>${d.cliente ? d.cliente.nombre : 'Consumidor Final'}</span>
                        ${isSelected ? '<span style="font-size:10px; background:var(--primary-color); color:white; padding:2px 6px; border-radius:4px; font-weight:bold;">ACTIVO</span>' : ''}
                      </div>
                      <div style="font-size:11px;color:#64748B;">${new Date(d.fecha).toLocaleTimeString()} - $${d.totalFinal.toLocaleString('es-CO')} (${d.cart.length} ítems)</div>
                    </div>
                    <button id="draft-delete-${d.id}" title="Eliminar Borrador" style="width: 44px; display: flex; align-items: center; justify-content: center; background: #FEF2F2; border: none; border-left: 1px solid #FEE2E2; cursor: pointer; color: #EF4444; transition: background 0.2s;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                 </div>`;
              });
              html += '</div>';
              
              Swal.fire({
                title: 'Facturas en Borrador',
                html,
                showConfirmButton: false,
                showCloseButton: true,
                didOpen: () => {
                  drafts.forEach(d => {
                     const selectBtn = document.getElementById(`draft-select-${d.id}`);
                     if (selectBtn) {
                       selectBtn.onclick = () => {
                         setCart(d.cart);
                         setCliente(d.cliente);
                         setDescuentoGlobal(d.descuentoGlobal);
                         setActiveDraftId(d.id);
                         Swal.close();
                       };
                     }
                     const deleteBtn = document.getElementById(`draft-delete-${d.id}`);
                     if (deleteBtn) {
                       deleteBtn.onclick = () => {
                         setDrafts(prev => prev.filter(x => x.id !== d.id));
                         if (activeDraftId === d.id) setActiveDraftId(null);
                         Swal.close();
                       };
                     }
                  });
                }
              });
            }}
            style={{ position: 'relative', background: 'none', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#475569', backgroundColor: '#F8FAFC' }}
          >
            Borradores
            {drafts.length > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#EF4444', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {drafts.length}
              </span>
            )}
          </button>
        </div>

        <div className="pos-cart-items-list">
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748B', gap: '8px' }}>
              <span style={{ fontSize: '32px' }}>🛒</span>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>El carrito está vacío</span>
            </div>
          ) : (
            cart.map(item => {
              const stockPrincipal = getProductStock(item.product.sku, 'Bodega Principal');
              const finalUnitPrice = item.precioOverride !== undefined ? item.precioOverride : getProductPrice(item.product);
              const isInsufficient = stockPrincipal < item.cantidad;
              const clientKey = cliente ? (cliente.identificacion || cliente.nombre).trim().toLowerCase() : '';
              const historicalPrice = (cliente && clientKey) ? lastClientPrices[clientKey]?.[item.product.sku] : undefined;

              return (
                <div key={item.product.id} className="cart-item-row" style={{ height: 'auto', minHeight: '64px', padding: '10px 12px' }}>
                  <div className="cart-item-left" style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <span className="cart-item-name" style={{ fontWeight: 700 }}>{item.product.nombre}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <span className="cart-item-price" style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                        ${(finalUnitPrice * item.cantidad).toLocaleString('es-CO')}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        (${finalUnitPrice.toLocaleString('es-CO')} c/u)
                      </span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: isInsufficient ? '#FEE2E2' : '#F1F5F9',
                        color: isInsufficient ? '#EF4444' : '#64748B',
                        fontWeight: 600
                      }}>
                        Stock: {stockPrincipal} {isInsufficient && '⚠️ Insuficiente'}
                      </span>
                    </div>

                    {historicalPrice !== undefined && (
                      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {historicalPrice === finalUnitPrice ? (
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#D1FAE5',
                            color: '#065F46',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            ✓ Tarifa histórica aplicada
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setCart(prev => prev.map(i => i.product.id === item.product.id ? { ...i, precioOverride: historicalPrice } : i));
                              Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'success',
                                title: `Tarifa histórica aplicada: $${historicalPrice.toLocaleString('es-CO')}`,
                                showConfirmButton: false,
                                timer: 1500
                              });
                            }}
                            className="btn-warning"
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #F59E0B',
                              backgroundColor: '#FEF3C7',
                              color: '#D97706',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            💡 Último precio: ${historicalPrice.toLocaleString('es-CO')} (Aplicar)
                          </button>
                        )}
                        
                        {item.precioOverride !== undefined && (
                          <button
                            onClick={() => {
                              setCart(prev => prev.map(i => i.product.id === item.product.id ? { ...i, precioOverride: undefined } : i));
                            }}
                            style={{
                              fontSize: '10px',
                              padding: '2px 4px',
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              textDecoration: 'underline',
                              cursor: 'pointer'
                            }}
                          >
                            Restablecer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="cart-item-controls" style={{ alignSelf: 'center' }}>
                    <button className="qty-btn" onClick={() => handleUpdateQty(item.product.id, -1)}>
                      <Minus size={14} />
                    </button>
                    <input 
                      type="number" 
                      value={item.cantidad} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          setCart(prev => prev.map(i => i.product.id === item.product.id ? { ...i, cantidad: val } : i));
                        }
                      }}
                      onBlur={(e) => {
                         const val = parseFloat(e.target.value);
                         if (isNaN(val) || val <= 0) {
                           handleRemoveItem(item.product.id);
                         }
                      }}
                      style={{ width: '50px', textAlign: 'center', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}
                      step="0.01"
                      min="0"
                    />
                    <button className="qty-btn" onClick={() => handleUpdateQty(item.product.id, 1)}>
                      <Plus size={14} />
                    </button>
                    <button className="delete-cart-item-btn" onClick={() => handleRemoveItem(item.product.id)}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pos-cart-footer">
          <div className="summary-row">
            <span>Subtotal ({cart.reduce((sum, item) => sum + item.cantidad, 0)} ítems)</span>
            <span>${subtotal.toLocaleString('es-CO')}</span>
          </div>
          <div className="summary-row">
            <span>Impuestos (0%)</span>
            <span>$0</span>
          </div>
          <div className="summary-row" style={{ cursor: 'pointer' }} onClick={handleDescuentoGlobal}>
            <span style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Descuento {descuentoGlobal > 0 && `(${descuentoGlobal}%)`} <Plus size={12} />
            </span>
            <span style={{ color: descuentoGlobal > 0 ? 'var(--primary-color)' : 'inherit' }}>
              -${totalDescuento.toLocaleString('es-CO')}
            </span>
          </div>
          
          {/* Dual Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button 
              className="btn-secondary" 
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px 8px' }}
              onClick={handleGuardarBorrador}
            >
              <Save size={16} />
              <span>Guardar</span>
            </button>
            <button 
              className="btn-primary" 
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 8px', backgroundColor: 'var(--primary-color)' }}
              onClick={handlePagar}
            >
              <CreditCard size={16} />
              <span>Cobrar: ${totalFinal.toLocaleString('es-CO')}</span>
            </button>
          </div>
        </div>
        </div>
        </div>
      ) : (
        activeSubView === 'consolidacion_b2b' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', width: '100%', boxSizing: 'border-box' }} className="animate-fade-in">
          {/* COLUMNA IZQUIERDA: LISTADO DE PEDIDOS LISTOS */}
          <div className="hr-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600, textTransform: 'uppercase' }}>Consolidación</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>Pedidos Listos</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '550px' }}>
              {(quotations || []).filter((q: any) => q.estado === 'Listo').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748B' }}>
                  <FileText size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5, color: '#3B82F6' }} />
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>No hay pedidos B2B listos.</p>
                  <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Los pedidos deben completarse en Cuarto Frío.</p>
                </div>
              ) : (
                (quotations || [])
                  .filter((q: any) => q.estado === 'Listo')
                  .map((q: any) => {
                    const isSelected = selectedB2BQuoteId === q.id;
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          setSelectedB2BQuoteId(q.id);
                          setSelectedDevIds([]);
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
                            backgroundColor: '#F0FDF4',
                            color: '#10B981'
                          }}>
                            LISTO
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#475569' }}>
                          <div><strong>Cliente:</strong> {q.clienteNombre}</div>
                          <div><strong>Fecha Entrega:</strong> {q.logistica?.fechaEntrega ? new Date(q.logistica.fechaEntrega).toLocaleDateString() : 'No definida'}</div>
                          <div><strong>Conductor:</strong> {q.logistica?.conductor?.nombre || 'No asignado'}</div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: PANELES DE LIQUIDACION */}
          <div className="hr-table-card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
            {selectedB2BQuoteId ? (
              (() => {
                const quote = quotations.find((q: any) => q.id === selectedB2BQuoteId);
                if (!quote) return null;

                const client = clientes.find(c => c.id === quote.clienteId);
                const currentDebt = client ? getClienteDeuda(client.id) : 0;
                const cupoDisponible = client ? Math.max(0, client.cupoCredito - currentDebt) : 0;

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
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>1. Pesos Reales del Cuarto Frío</h4>
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
                            const realQty = item.cantidad_real !== undefined ? item.cantidad_real : item.cantidad;
                            const price = item.precioFinal || item.precio || item.precioUnitario || 0;
                            return (
                              <tr key={item.sku}>
                                <td style={{ fontWeight: 600 }}>{item.nombre}</td>
                                <td style={{ textAlign: 'right' }}>{reqQty} kg</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-color)' }}>{realQty} kg</td>
                                <td style={{ textAlign: 'right' }}>${price.toLocaleString('es-CO')}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }}>${(realQty * price).toLocaleString('es-CO')}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

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

                      <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

                  </div>
                );
              })()
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#64748B', padding: '48px 0', flex: 1 }}>
                <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px', color: '#94A3B8' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Seleccione un pedido</h3>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>El sistema cargará los pesos reales del cuarto frío y permitirá aplicar saldos de devolución.</p>
              </div>
            )}
          </div>
        </div>
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
      )
      )}
    </div>
  );
}
