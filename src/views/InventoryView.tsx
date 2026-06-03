// src/views/InventoryView.tsx
import React, { useState, useEffect } from 'react';
import { RefreshCw, Package, ArrowRight, ShieldAlert, CheckCircle, Truck, PlusCircle, Save, Edit2, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { Product, Proveedor, MovimientoInventario, OrdenCompra, generateId, CategoriaConfig } from '../App.tsx';

interface StockItem {
  sku: string;
  nombre: string;
  stock: number;
  lote: string;
}

interface InventoryViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  stock: Record<string, StockItem[]>;
  setStock: React.Dispatch<React.SetStateAction<Record<string, StockItem[]>>>;
  proveedores: Proveedor[];
  publishEvent: (
    tipo: 'SALE_COMPLETED' | 'PRICE_CHANGED' | 'MERMA_ALERT' | 'QUOTE_STATUS_CHANGED' | 'METADATA_CONFIGURED',
    actor: string,
    descripcion: string,
    metadata?: any,
    enqueueSync?: boolean
  ) => void;
  userRole: string;
  movimientos: MovimientoInventario[];
  setMovimientos: React.Dispatch<React.SetStateAction<MovimientoInventario[]>>;
  ordenesCompra: OrdenCompra[];
  setOrdenesCompra: React.Dispatch<React.SetStateAction<OrdenCompra[]>>;
  categorias: CategoriaConfig[];
  setCategorias: React.Dispatch<React.SetStateAction<CategoriaConfig[]>>;
}

export default function InventoryView({
  products,
  setProducts,
  stock,
  setStock,
  proveedores,
  publishEvent,
  userRole,
  movimientos,
  setMovimientos,
  ordenesCompra,
  setOrdenesCompra,
  categorias,
  setCategorias
}: InventoryViewProps) {
  const [activeBodega, setActiveBodega] = useState('Bodega Principal');
  const [historyTab, setHistoryTab] = useState<'movimientos' | 'compras'>('movimientos');
  const [viewMode, setViewMode] = useState<'operaciones' | 'catalogo' | 'categorias'>('operaciones');

  // State de Catalogo de Productos
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    sku: '', nombre: '', categoria: '', unidadMedida: 'kg' as 'kg' | 'und' | 'lb' | 'gr', precio_compra: 0, buffer_seguridad: 5,
    codigo_barras: '', iva: 0, ivaIncluido: true, control_inventario: true, produccion: false, tipoCategoria: '', lineaCategoria: '', claseCategoria: ''
  });

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.sku || !productForm.nombre || !productForm.unidadMedida) {
      Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'SKU, nombre y unidad son requeridos.', confirmButtonColor: 'var(--primary-color)' });
      return;
    }

    // Auto-crear categoría si no existe
    let finalCategoriaId = '';
    const existsCat = categorias.find(c => c.tipo === productForm.tipoCategoria && c.linea === productForm.lineaCategoria && c.clase === productForm.claseCategoria);
    if (!existsCat && productForm.tipoCategoria) {
      const newCatId = generateId('cat');
      setCategorias(prev => [...prev, { id: newCatId, tipo: productForm.tipoCategoria, linea: productForm.lineaCategoria, clase: productForm.claseCategoria }]);
      finalCategoriaId = newCatId;
    } else if (existsCat) {
      finalCategoriaId = existsCat.id;
    }

    if (editingProductId) {
      setProducts(prev => prev.map(p => p.sku === editingProductId ? {
        ...p,
        nombre: productForm.nombre.toUpperCase(),
        categoria: productForm.tipoCategoria + (productForm.lineaCategoria ? ` - ${productForm.lineaCategoria}` : ''),
        unidadMedida: productForm.unidadMedida,
        precio_compra: productForm.precio_compra,
        buffer_seguridad: productForm.buffer_seguridad,
        codigo_barras: productForm.codigo_barras,
        iva: productForm.iva,
        ivaIncluido: productForm.ivaIncluido,
        control_inventario: productForm.control_inventario,
        produccion: productForm.produccion,
        metadata: { ...p.metadata, categoria_id: finalCategoriaId, tipo: productForm.tipoCategoria, linea: productForm.lineaCategoria, clase: productForm.claseCategoria }
      } : p));
      setEditingProductId(null);
      Swal.fire({ icon: 'success', title: 'Producto actualizado', text: 'Los datos del producto han sido guardados.', timer: 1500, showConfirmButton: false });
    } else {
      if (products.some(p => p.sku === productForm.sku)) {
        Swal.fire({ icon: 'error', title: 'SKU Duplicado', text: 'Ya existe un producto con este código.', confirmButtonColor: 'var(--primary-color)' });
        return;
      }
      const nuevo: Product = {
        id: generateId('prd'),
        sku: productForm.sku.toUpperCase(),
        nombre: productForm.nombre.toUpperCase(),
        categoria: productForm.tipoCategoria + (productForm.lineaCategoria ? ` - ${productForm.lineaCategoria}` : ''),
        unidadMedida: productForm.unidadMedida,
        precio_compra: productForm.precio_compra,
        precio_venta_pos: productForm.precio_compra * 1.3,
        precio_venta_restaurante: productForm.precio_compra * 1.2,
        precio_venta_mayorista: productForm.precio_compra * 1.1,
        buffer_seguridad: productForm.buffer_seguridad,
        codigo_barras: productForm.codigo_barras,
        iva: productForm.iva,
        ivaIncluido: productForm.ivaIncluido,
        control_inventario: productForm.control_inventario,
        produccion: productForm.produccion,
        activo: true,
        metadata: { categoria_id: finalCategoriaId, tipo: productForm.tipoCategoria, linea: productForm.lineaCategoria, clase: productForm.claseCategoria }
      };
      setProducts(prev => [nuevo, ...prev]);
      Swal.fire({ icon: 'success', title: 'Producto creado', text: 'El nuevo producto ha sido registrado con éxito.', timer: 1500, showConfirmButton: false });
    }

    setProductForm({ sku: '', nombre: '', categoria: '', unidadMedida: 'kg', precio_compra: 0, buffer_seguridad: 5, codigo_barras: '', iva: 0, ivaIncluido: true, control_inventario: true, produccion: false, tipoCategoria: '', lineaCategoria: '', claseCategoria: '' });
  };

  const handleEditProduct = (p: Product) => {
    setEditingProductId(p.sku);
    setProductForm({
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoria,
      unidadMedida: p.unidadMedida as any,
      precio_compra: p.precio_compra || 0,
      buffer_seguridad: p.buffer_seguridad || 5,
      codigo_barras: p.codigo_barras || '',
      iva: p.iva || 0,
      ivaIncluido: p.ivaIncluido ?? true,
      control_inventario: p.control_inventario ?? true,
      produccion: p.produccion ?? false,
      tipoCategoria: p.metadata?.tipo || '',
      lineaCategoria: p.metadata?.linea || '',
      claseCategoria: p.metadata?.clase || ''
    });
  };

  const handleToggleProduct = (sku: string) => {
    setProducts(prev => prev.map(p => p.sku === sku ? { ...p, activo: !p.activo } : p));
  };

  // State de Entrada de Compra (Replenishment)
  const [compra, setCompra] = useState({
    proveedorId: '',
    sku: '',
    cantidad: 10,
    costoUnitario: 0,
    lote: '',
    bodega: 'Bodega Principal'
  });

  useEffect(() => {
    if (products.length > 0 && !compra.sku) {
      setCompra(prev => ({ ...prev, sku: products[0].sku }));
    }
  }, [products]);

  useEffect(() => {
    const activeProv = proveedores.filter(p => p.activo);
    if (activeProv.length > 0 && !compra.proveedorId) {
      setCompra(prev => ({ ...prev, proveedorId: activeProv[0].id }));
    }
  }, [proveedores]);

  // State de Traslados
  const [traslado, setTraslado] = useState({
    origen: 'Bodega Principal',
    destino: 'Bodega Secundaria',
    sku: 'PES-ENT-001',
    cantidad: 10
  });

  // State de Producción
  const [prodMateriaPrima, setProdMateriaPrima] = useState('PES-ENT-001');
  const [prodMateriaCant, setProdMateriaCant] = useState(100); // 100 kg
  const [prodTerminado, setProdTerminado] = useState('FIL-LIM-002');
  const [prodTerminadoCant, setProdTerminadoCant] = useState(60); // 60 kg (Merma 40%)
  const [mermaPct, setMermaPct] = useState(0);

  // Asegurar que los selectores de producción tengan valores iniciales válidos si cambia el catálogo
  useEffect(() => {
    const materias = products.filter(p => p.activo && p.categoria === 'MATERIA PRIMA');
    if (materias.length > 0 && !materias.some(m => m.sku === prodMateriaPrima)) {
      setProdMateriaPrima(materias[0].sku);
    }
    const terminados = products.filter(p => p.activo && p.categoria !== 'MATERIA PRIMA');
    if (terminados.length > 0 && !terminados.some(t => t.sku === prodTerminado)) {
      setProdTerminado(terminados[0].sku);
    }
  }, [products]);

  useEffect(() => {
    if (prodMateriaCant > 0) {
      const merma = ((prodMateriaCant - prodTerminadoCant) / prodMateriaCant) * 100;
      setMermaPct(parseFloat(merma.toFixed(1)));
    } else {
      setMermaPct(0);
    }
  }, [prodMateriaCant, prodTerminadoCant]);
  const handleProcesarCompra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compra.proveedorId || !compra.sku || compra.cantidad <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos Incompletos',
        text: 'Por favor complete todos los datos de la compra (Proveedor, Producto y Cantidad > 0).'
      });
      return;
    }

    const selectedProduct = products.find(p => p.sku === compra.sku);
    const selectedProveedor = proveedores.find(p => p.id === compra.proveedorId);
    if (!selectedProduct || !selectedProveedor) return;

    // Generar lote
    const loteFinal = (compra.lote || `LT-${Date.now().toString().slice(-6)}`).toUpperCase();

    // Actualizar stock
    setStock(prev => {
      const newStock = { ...prev };
      const currentList = newStock[compra.bodega] || [];
      const existingIndex = currentList.findIndex(item => item.sku === compra.sku && item.lote === loteFinal);
      if (existingIndex > -1) {
        const updatedList = [...currentList];
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          stock: updatedList[existingIndex].stock + compra.cantidad
        };
        newStock[compra.bodega] = updatedList;
      } else {
        newStock[compra.bodega] = [
          ...currentList,
          {
            sku: compra.sku,
            nombre: selectedProduct.nombre,
            stock: compra.cantidad,
            lote: loteFinal
          }
        ];
      }
      return newStock;
    });

    // F2: Crear y registrar Orden de Compra
    const ocId = generateId('oc');
    const totalOC = compra.cantidad * (compra.costoUnitario || selectedProduct.precio_compra || 0);
    const newOC: OrdenCompra = {
      id: ocId,
      proveedorId: selectedProveedor.id,
      proveedorNombre: selectedProveedor.nombre,
      fecha: new Date().toISOString(),
      estado: 'RECIBIDA',
      items: [
        {
          sku: compra.sku,
          nombre: selectedProduct.nombre,
          cantidad: compra.cantidad,
          precioUnitario: compra.costoUnitario || selectedProduct.precio_compra || 0,
          lote: loteFinal
        }
      ],
      totalCompra: totalOC,
      bodegaDestino: compra.bodega,
      actor: userRole,
      notas: `Lote recibido: ${loteFinal}`
    };
    setOrdenesCompra(prev => [newOC, ...prev]);

    // F2: Registrar Movimiento de Inventario
    const newMov: MovimientoInventario = {
      id: generateId('mov'),
      timestamp: new Date().toISOString(),
      tipo: 'ENTRADA_COMPRA',
      sku: compra.sku,
      nombreProducto: selectedProduct.nombre,
      bodegaDestino: compra.bodega,
      cantidad: compra.cantidad,
      lote: loteFinal,
      referenciaId: ocId,
      referenciaTipo: 'ORDEN_COMPRA',
      actor: userRole,
      notas: `Entrada por compra recibida de ${selectedProveedor.nombre}`
    };
    setMovimientos(prev => [newMov, ...prev]);

    // Publicar evento
    publishEvent(
      'METADATA_CONFIGURED',
      userRole,
      `Entrada de Compra: ${compra.cantidad} unidades de ${selectedProduct.nombre} ingresadas a ${compra.bodega} provenientes de ${selectedProveedor.nombre}. Lote: ${loteFinal}`,
      { proveedor: selectedProveedor, producto: selectedProduct, cantidad: compra.cantidad, lote: loteFinal, bodega: compra.bodega }
    );

    Swal.fire({
      icon: 'success',
      title: 'Entrada Registrada',
      text: `Se registraron ${compra.cantidad} unidades en ${compra.bodega} con Lote ${loteFinal}.`,
      confirmButtonColor: '#00B171'
    });

    // Resetear formulario (manteniendo proveedor y bodega)
    setCompra(prev => ({
      ...prev,
      cantidad: 10,
      costoUnitario: 0,
      lote: ''
    }));
  };

  const handleTraslado = (e: React.FormEvent) => {
    e.preventDefault();
    if (traslado.origen === traslado.destino) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'La bodega origen y destino no pueden ser iguales.' });
      return;
    }

    const itemOrigen = stock[traslado.origen]?.find(i => i.sku === traslado.sku);
    if (!itemOrigen || itemOrigen.stock < traslado.cantidad) {
      Swal.fire({ icon: 'error', title: 'Stock Insuficiente', text: 'La bodega de origen no dispone de existencias del lote.' });
      return;
    }

    // Procesar traslado de manera atómica local
    setStock(prev => {
      const newStock = { ...prev };
      // Restar
      newStock[traslado.origen] = newStock[traslado.origen].map(i =>
        i.sku === traslado.sku ? { ...i, stock: i.stock - traslado.cantidad } : i
      );
      // Sumar
      const itemDestino = newStock[traslado.destino]?.find(i => i.sku === traslado.sku);
      if (itemDestino) {
        newStock[traslado.destino] = newStock[traslado.destino].map(i =>
          i.sku === traslado.sku ? { ...i, stock: i.stock + traslado.cantidad } : i
        );
      } else {
        newStock[traslado.destino] = [
          ...(newStock[traslado.destino] || []),
          { sku: traslado.sku, nombre: itemOrigen.nombre, stock: traslado.cantidad, lote: itemOrigen.lote }
        ];
      }
      return newStock;
    });

    // F2: Registrar los movimientos de traslado (Salida y Entrada)
    const refId = generateId('tras');
    const movSalida: MovimientoInventario = {
      id: generateId('mov'),
      timestamp: new Date().toISOString(),
      tipo: 'TRASLADO_SALIDA',
      sku: traslado.sku,
      nombreProducto: itemOrigen.nombre,
      bodegaOrigen: traslado.origen,
      bodegaDestino: traslado.destino,
      cantidad: traslado.cantidad,
      lote: itemOrigen.lote,
      referenciaId: refId,
      referenciaTipo: 'TRASLADO',
      actor: userRole,
      notas: `Traslado a ${traslado.destino}`
    };
    const movEntrada: MovimientoInventario = {
      id: generateId('mov'),
      timestamp: new Date().toISOString(),
      tipo: 'TRASLADO_ENTRADA',
      sku: traslado.sku,
      nombreProducto: itemOrigen.nombre,
      bodegaOrigen: traslado.origen,
      bodegaDestino: traslado.destino,
      cantidad: traslado.cantidad,
      lote: itemOrigen.lote,
      referenciaId: refId,
      referenciaTipo: 'TRASLADO',
      actor: userRole,
      notas: `Traslado desde ${traslado.origen}`
    };

    setMovimientos(prev => [movSalida, movEntrada, ...prev]);

    Swal.fire({
      icon: 'success',
      title: 'Traslado Exitoso',
      text: `Se trasladaron ${traslado.cantidad} unidades del lote a ${traslado.destino}.`,
      confirmButtonColor: '#00B171'
    });
  };

  const handleProcesarProduccion = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemMP = stock['Bodega Principal']?.find(i => i.sku === prodMateriaPrima);
    if (!itemMP || itemMP.stock < prodMateriaCant) {
      Swal.fire({ icon: 'error', title: 'Falta Materia Prima', text: 'No hay suficiente pescado entero disponible en Bodega Principal.' });
      return;
    }

    let justificacionText = '';

    if (mermaPct > 35) {
      // Pedir PIN y justificación
      const { value: formValues } = await Swal.fire({
        title: 'Autorización Requerida (Merma > 35%)',
        html:
          '<p style="font-size: 13px; color: #EF4444; margin-bottom: 12px;">Se requiere autorización firmada para una merma del ' + mermaPct + '%.</p>' +
          '<input id="pin-input" class="swal2-input" type="password" placeholder="PIN de 4 dígitos" maxlength="4">' +
          '<textarea id="just-input" class="swal2-textarea" placeholder="Justificación de la merma alta (Ej. Pescado con mucha víscera)..."></textarea>',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Autorizar y Guardar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#EF4444',
        preConfirm: () => {
          return {
            pin: (document.getElementById('pin-input') as HTMLInputElement).value,
            justificacion: (document.getElementById('just-input') as HTMLTextAreaElement).value
          };
        }
      });

      if (!formValues || !formValues.pin || !formValues.justificacion) {
        Swal.fire({ icon: 'error', title: 'Denegado', text: 'Debe ingresar el PIN y la justificación.' });
        return;
      }

      // Validar PIN (Simulado, ej: 1234 o 4321)
      if (formValues.pin !== '1234' && formValues.pin !== '4321') {
        Swal.fire({ icon: 'error', title: 'PIN Inválido', text: 'El código ingresado no corresponde a un Jefe de Bodega autorizado.' });
        return;
      }
      justificacionText = formValues.justificacion;
    }

    // Procesar Producción
    setStock(prev => {
      const newStock = { ...prev };
      // Restar materia prima
      newStock['Bodega Principal'] = newStock['Bodega Principal'].map(i =>
        i.sku === prodMateriaPrima ? { ...i, stock: i.stock - prodMateriaCant } : i
      );
      // Sumar producto terminado
      newStock['Bodega Principal'] = newStock['Bodega Principal'].map(i =>
        i.sku === prodTerminado ? { ...i, stock: i.stock + prodTerminadoCant } : i
      );
      return newStock;
    });

    // F2: Registrar Movimientos de Producción (Consumo MP y Entrada PT)
    const prodRefId = generateId('prod');
    const nameMP = products.find(p => p.sku === prodMateriaPrima)?.nombre || 'Materia Prima';
    const namePT = products.find(p => p.sku === prodTerminado)?.nombre || 'Producto Terminado';
    const loteMP = stock['Bodega Principal']?.find(i => i.sku === prodMateriaPrima)?.lote || 'LOT-MP';
    const lotePT = `LT-PT-${Date.now().toString().slice(-6)}`;

    // Si merma > 35%, guardar la justificación en las notas
    const justificacionNotas = mermaPct > 35 && justificacionText 
      ? ` | Justificación: ${justificacionText}`
      : '';

    const movConsumo: MovimientoInventario = {
      id: generateId('mov'),
      timestamp: new Date().toISOString(),
      tipo: 'PRODUCCION_CONSUMO',
      sku: prodMateriaPrima,
      nombreProducto: nameMP,
      bodegaOrigen: 'Bodega Principal',
      cantidad: prodMateriaCant,
      lote: loteMP,
      referenciaId: prodRefId,
      referenciaTipo: 'PRODUCCION',
      actor: userRole,
      notas: `Consumo de materia prima para producción. Merma: ${mermaPct}%${justificacionNotas}`
    };

    const movSalida: MovimientoInventario = {
      id: generateId('mov'),
      timestamp: new Date().toISOString(),
      tipo: 'PRODUCCION_SALIDA',
      sku: prodTerminado,
      nombreProducto: namePT,
      bodegaDestino: 'Bodega Principal',
      cantidad: prodTerminadoCant,
      lote: lotePT,
      referenciaId: prodRefId,
      referenciaTipo: 'PRODUCCION',
      actor: userRole,
      notas: `Ingreso de producto terminado procesado. Merma: ${mermaPct}%`
    };

    setMovimientos(prev => [movConsumo, movSalida, ...prev]);

    Swal.fire({
      icon: 'success',
      title: 'Orden de Producción Procesada',
      text: `Se transformaron ${prodMateriaCant}kg en ${prodTerminadoCant}kg de producto final. Merma: ${mermaPct}%.`,
      confirmButtonColor: '#00B171'
    });
  };

  const activeProducts = products.filter(p => p.activo);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', height: '100%', overflowY: 'auto', paddingRight: '8px' }}>
      
      {/* Top Tabs */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        <button 
          onClick={() => setViewMode('operaciones')}
          style={{ background: 'none', border: 'none', fontSize: '16px', fontWeight: viewMode === 'operaciones' ? 800 : 500, color: viewMode === 'operaciones' ? 'var(--primary-color)' : '#64748B', cursor: 'pointer' }}
        >
          Operaciones de Inventario
        </button>
        <button 
          onClick={() => setViewMode('catalogo')}
          style={{ background: 'none', border: 'none', fontSize: '16px', fontWeight: viewMode === 'catalogo' ? 800 : 500, color: viewMode === 'catalogo' ? 'var(--primary-color)' : '#64748B', cursor: 'pointer' }}
        >
          Catálogo de Productos
        </button>
      </div>

      {viewMode === 'operaciones' && (
        <>
          {/* Grid de Operaciones */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Columna Izquierda: Consulta de Stock e Inventario */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Inventario WMS</span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>Stock por Bodegas</h2>
        </div>

        <div className="pos-categories" style={{ marginBottom: '0px' }}>
          {Object.keys(stock).map(bod => (
            <button
              key={bod}
              className={`pos-category-tab ${activeBodega === bod ? 'active' : ''}`}
              onClick={() => setActiveBodega(bod)}
            >
              {bod}
            </button>
          ))}
        </div>

        <div className="hr-table-card">
          <table className="hr-table">
            <thead>
              <tr>
                <th>Lote</th>
                <th>SKU</th>
                <th>Nombre del Producto</th>
                <th>Stock Físico</th>
              </tr>
            </thead>
            <tbody>
              {(stock[activeBodega] || []).map(item => (
                <tr key={item.sku}>
                  <td style={{ fontWeight: 700, color: '#00B171' }}>{item.lote}</td>
                  <td>{item.sku}</td>
                  <td style={{ fontWeight: 600 }}>{item.nombre}</td>
                  <td style={{ fontWeight: 700, fontSize: '15px' }}>{item.stock} unidades</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Entrada de Compra (Replenishment) */}
        <div className="hr-table-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={18} color="#00B171" /> Entrada de Mercadería (Proveedores)
          </h3>
          <form onSubmit={handleProcesarCompra} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Proveedor Origen</label>
                <select
                  className="form-control"
                  value={compra.proveedorId}
                  onChange={e => setCompra({ ...compra, proveedorId: e.target.value })}
                  style={{ border: '2px solid var(--primary-light)' }}
                >
                  <option value="">-- Seleccionar Proveedor --</option>
                  {proveedores.filter(p => p.activo).map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.nit})</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Bodega Destino</label>
                <select className="form-control" value={compra.bodega} onChange={e => setCompra({ ...compra, bodega: e.target.value })}>
                  <option value="Bodega Principal">Bodega Principal</option>
                  <option value="Bodega Secundaria">Bodega Secundaria</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Producto a Recibir</label>
                <select className="form-control" value={compra.sku} onChange={e => setCompra({ ...compra, sku: e.target.value })}>
                  {activeProducts.map(p => (
                    <option key={p.sku} value={p.sku}>{p.nombre} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cantidad</label>
                <input
                  type="number"
                  className="form-control"
                  value={compra.cantidad}
                  onChange={e => setCompra({ ...compra, cantidad: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Lote (Auto-generado si vacío)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. LT-2506"
                  value={compra.lote}
                  onChange={e => setCompra({ ...compra, lote: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Costo por Unidad ($ COP)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ej. 12000"
                  value={compra.costoUnitario || ''}
                  onChange={e => setCompra({ ...compra, costoUnitario: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <button type="submit" className="hr-btn-new" style={{ border: 'none', justifyContent: 'center', marginTop: '8px', backgroundColor: 'var(--primary-color)' }}>
              <span>Registrar Entrada de Compra</span>
              <PlusCircle size={16} />
            </button>
          </form>
        </div>

        {/* Sección de Traslados */}
        <div className="hr-table-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} color="#00B171" /> Traslado entre Bodegas
          </h3>
          <form onSubmit={handleTraslado} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Origen</label>
                <select className="form-control" value={traslado.origen} onChange={e => setTraslado({ ...traslado, origen: e.target.value })}>
                  <option value="Bodega Principal">Bodega Principal</option>
                  <option value="Bodega Secundaria">Bodega Secundaria</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Destino</label>
                <select className="form-control" value={traslado.destino} onChange={e => setTraslado({ ...traslado, destino: e.target.value })}>
                  <option value="Bodega Principal">Bodega Principal</option>
                  <option value="Bodega Secundaria">Bodega Secundaria</option>
                  <option value="Bodega Averías">Bodega Averías</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Producto a Trasladar</label>
                <select className="form-control" value={traslado.sku} onChange={e => setTraslado({ ...traslado, sku: e.target.value })}>
                  {activeProducts.map(p => (
                    <option key={p.sku} value={p.sku}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cantidad</label>
                <input
                  type="number"
                  className="form-control"
                  value={traslado.cantidad}
                  onChange={e => setTraslado({ ...traslado, cantidad: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <button type="submit" className="hr-btn-new" style={{ border: 'none', justifyContent: 'center', marginTop: '8px' }}>
              <span>Confirmar Traslado</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Columna Derecha: Control de Producción */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Producción y Rendimiento</span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>Transformación de Planta</h2>
        </div>

        <div className="hr-table-card" style={{ padding: '24px', flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} color="#00B171" /> Procesar Orden de Producción
          </h3>

          <form onSubmit={handleProcesarProduccion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', marginBottom: '12px' }}>MATERIA PRIMA (ENTRADA)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Insumo</label>
                  <select className="form-control" value={prodMateriaPrima} onChange={e => setProdMateriaPrima(e.target.value)}>
                    {activeProducts.filter(p => p.categoria === 'MATERIA PRIMA').map(p => (
                      <option key={p.sku} value={p.sku}>{p.nombre}</option>
                    ))}
                    {activeProducts.filter(p => p.categoria === 'MATERIA PRIMA').length === 0 && 
                      activeProducts.map(p => (
                        <option key={p.sku} value={p.sku}>{p.nombre}</option>
                      ))
                    }
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Cantidad (kg)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={prodMateriaCant}
                    onChange={e => setProdMateriaCant(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div style={{ border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', marginBottom: '12px' }}>PRODUCTO FINAL (SALIDA)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Destino</label>
                  <select className="form-control" value={prodTerminado} onChange={e => setProdTerminado(e.target.value)}>
                    {activeProducts.filter(p => p.categoria !== 'MATERIA PRIMA').map(p => (
                      <option key={p.sku} value={p.sku}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Rendimiento (kg)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={prodTerminadoCant}
                    onChange={e => setProdTerminadoCant(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Cálculo de Merma y Alertas en Vivo */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '12px',
              backgroundColor: mermaPct > 35 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              border: `1px solid ${mermaPct > 35 ? '#FCA5A5' : '#6EE7B7'}`,
              padding: '16px', borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Porcentaje de Merma Resultante:</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: mermaPct > 35 ? '#EF4444' : '#10B981' }}>{mermaPct}%</span>
              </div>
              {mermaPct > 35 ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#B91C1C', fontSize: '12px', lineHeight: 1.4 }}>
                  <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    La merma excede la tolerancia permitida (35%). Se bloqueará el procesamiento y se solicitará <strong>PIN de autorización</strong> y justificación al momento de guardar.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#047857', fontSize: '12px', lineHeight: 1.4 }}>
                  <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>La merma está dentro del rango operativo normal.</span>
                </div>
              )}
            </div>

            <button type="submit" className="hr-btn-new" style={{ border: 'none', justifyContent: 'center', marginTop: '12px' }}>
              Procesar Producción
            </button>
          </form>
        </div>
      </div>
      
      </div> {/* Fin del Grid de Operaciones */}

      {/* Panel de Trazabilidad e Historial */}
      <div className="hr-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Auditoría y Registro Operativo</span>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>Trazabilidad Transaccional</h3>
          </div>
          <div className="pos-categories" style={{ marginBottom: '0px', gap: '8px' }}>
            <button
              className={`pos-category-tab ${historyTab === 'movimientos' ? 'active' : ''}`}
              onClick={() => setHistoryTab('movimientos')}
            >
              Movimientos (Kardex)
            </button>
            <button
              className={`pos-category-tab ${historyTab === 'compras' ? 'active' : ''}`}
              onClick={() => setHistoryTab('compras')}
            >
              Órdenes de Compra
            </button>
          </div>
        </div>

        {historyTab === 'movimientos' ? (
          <div>
            {movimientos.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No se han registrado movimientos de inventario aún.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Producto</th>
                      <th>Origen</th>
                      <th>Destino</th>
                      <th>Cant.</th>
                      <th>Lote</th>
                      <th>Referencia</th>
                      <th>Usuario</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{new Date(m.timestamp).toLocaleString()}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                            backgroundColor: m.tipo.startsWith('ENTRADA') || m.tipo.includes('SALIDA_PRODUCCION') || m.tipo.includes('ENTRADA_TRASLADO') || m.tipo === 'PRODUCCION_SALIDA' || m.tipo === 'TRASLADO_ENTRADA' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: m.tipo.startsWith('ENTRADA') || m.tipo.includes('SALIDA_PRODUCCION') || m.tipo.includes('ENTRADA_TRASLADO') || m.tipo === 'PRODUCCION_SALIDA' || m.tipo === 'TRASLADO_ENTRADA' ? '#10B981' : '#EF4444'
                          }}>
                            {m.tipo}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{m.nombreProducto} <span style={{ fontSize: '11px', color: '#64748B' }}>({m.sku})</span></td>
                        <td style={{ fontSize: '13px' }}>{m.bodegaOrigen || '-'}</td>
                        <td style={{ fontSize: '13px' }}>{m.bodegaDestino || '-'}</td>
                        <td style={{ fontWeight: 700 }}>{m.cantidad}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#3B82F6' }}>{m.lote || '-'}</td>
                        <td style={{ fontSize: '11px', color: '#64748B' }}>
                          {m.referenciaTipo ? `${m.referenciaTipo}: ${m.referenciaId}` : '-'}
                        </td>
                        <td style={{ fontSize: '13px', fontWeight: 500 }}>{m.actor}</td>
                        <td style={{ fontSize: '12px', color: '#64748B', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.notas}>
                          {m.notas}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            {ordenesCompra.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No hay órdenes de compra registradas.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>OC-ID</th>
                      <th>Proveedor</th>
                      <th>Destino</th>
                      <th>Productos Recibidos</th>
                      <th>Total</th>
                      <th>Usuario</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesCompra.map(oc => (
                      <tr key={oc.id}>
                        <td style={{ fontSize: '12px' }}>{new Date(oc.fecha).toLocaleString()}</td>
                        <td style={{ fontWeight: 700 }}>{oc.id}</td>
                        <td style={{ fontWeight: 600 }}>{oc.proveedorNombre}</td>
                        <td>{oc.bodegaDestino}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {oc.items.map((item, idx) => (
                              <span key={idx} style={{ fontSize: '12px' }}>
                                {item.cantidad}x {item.nombre} ({item.sku}) - Lote: {item.lote}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: '#10B981' }}>
                          ${oc.totalCompra.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td>{oc.actor}</td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                            {oc.estado}
                          </span>
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
        </>
      )}

      {viewMode === 'catalogo' && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* COLUMNA IZQUIERDA: FORMULARIO PRODUCTOS */}
          <div className="hr-table-card" style={{ flex: '0 0 400px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>
              {editingProductId ? 'Editar Producto' : 'Registrar Nuevo Producto'}
            </h3>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">SKU (Código Único) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: FIL-ROB-004"
                  value={productForm.sku}
                  onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                  disabled={editingProductId !== null}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nombre del Producto *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: FILETE DE CORVINA"
                  value={productForm.nombre}
                  onChange={e => setProductForm({ ...productForm, nombre: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 0 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Categoría *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: PESCADOS, MARISCOS"
                    value={productForm.categoria}
                    onChange={e => setProductForm({ ...productForm, categoria: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Unidad de Medida *</label>
                  <select
                    className="form-control"
                    value={productForm.unidadMedida}
                    onChange={e => setProductForm({ ...productForm, unidadMedida: e.target.value as any })}
                  >
                    <option value="kg">Kilos (kg)</option>
                    <option value="und">Unidades (und)</option>
                    <option value="lb">Libras (lb)</option>
                    <option value="gr">Gramos (gr)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Costo Base ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={productForm.precio_compra || ''}
                    onChange={e => setProductForm({ ...productForm, precio_compra: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Buffer (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={productForm.buffer_seguridad}
                    onChange={e => setProductForm({ ...productForm, buffer_seguridad: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" className="btn-primary" style={{ border: 'none', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '6px' }}>
                  <Save size={16} />
                  <span>{editingProductId ? 'Guardar Cambios' : 'Registrar Producto'}</span>
                </button>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm({ sku: '', nombre: '', categoria: '', unidadMedida: 'kg', precio_compra: 0, buffer_seguridad: 5 });
                    }}
                    className="btn-secondary"
                    style={{ flex: 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', borderRadius: '6px' }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* COLUMNA DERECHA: LISTADO EN TABLA */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="pos-search-bar" style={{ marginBottom: 0, flex: 1 }}>
                <Search size={18} color="#64748B" />
                <input
                  type="text"
                  className="pos-search-input"
                  placeholder="Buscar producto por nombre o SKU..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="form-control"
                style={{ width: '150px', height: '48px', borderRadius: '12px' }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVOS">Activos</option>
                <option value="INACTIVOS">Inactivos</option>
              </select>
            </div>

            <div className="hr-table-card">
              <table className="hr-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>U. Medida</th>
                    <th>Costo Base</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => {
                    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.includes(searchTerm);
                    const matchStatus = statusFilter === 'TODOS' ? true : statusFilter === 'ACTIVOS' ? p.activo : !p.activo;
                    return matchSearch && matchStatus;
                  }).map(p => (
                    <tr key={p.sku} style={{ opacity: p.activo ? 1 : 0.6 }}>
                      <td style={{ fontWeight: 700, color: '#64748B' }}>{p.sku}</td>
                      <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                      <td>{p.categoria}</td>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', backgroundColor: '#F1F5F9', color: '#0F172A' }}>
                          {p.unidadMedida}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>${(p.precio_compra || 0).toLocaleString('es-CO')}</td>
                      <td>
                        <span
                          onClick={() => handleToggleProduct(p.sku)}
                          className={`badge-status ${p.activo ? 'activo' : 'inactivo'}`}
                          style={{ cursor: 'pointer' }}
                        >
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleEditProduct(p)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}>
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
