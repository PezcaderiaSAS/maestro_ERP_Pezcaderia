import React, { useState, useEffect } from 'react';
import { Truck, PlusCircle, Trash2, Plus, PackageCheck, UserPlus, PackagePlus, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import { CrearProveedorRapidoModal } from './CrearProveedorRapidoModal';
import { CrearProductoRapidoModal } from './CrearProductoRapidoModal';

export function PurchaseOrderForm({
  compra,
  setCompra,
  proveedores = [],
  activeProducts = [],
  handleProcesarCompra,
  bodegas = [],
  onProductCreated,
  onProductIvaUpdate
}: any) {
  // Modales de creación rápida
  const [showModalProveedor, setShowModalProveedor] = useState(false);
  const [showModalProducto, setShowModalProducto] = useState(false);

  // State local para añadir producto borrador a la lista de ítems de la orden
  const [draftSku, setDraftSku] = useState<string>('');
  const [draftCantidad, setDraftCantidad] = useState<number>(1);
  const [draftCosto, setDraftCosto] = useState<number>(0);
  const [draftIva, setDraftIva] = useState<number>(0);
  const [draftLote, setDraftLote] = useState<string>('');
  const [fastCreatedProducts, setFastCreatedProducts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activeProducts.length > 0 && !draftSku) {
      const firstProd = activeProducts[0];
      setDraftSku(firstProd.sku);
      setDraftCosto(firstProd.precio_compra || 0);
      setDraftIva(firstProd.iva !== undefined ? firstProd.iva : 0);
    }
  }, [activeProducts, draftSku]);

  // Al cambiar el producto borrador, cargar su costo e IVA configurado en catálogo
  const handleProductSelect = (sku: string) => {
    setDraftSku(sku);
    const prod = activeProducts.find((p: any) => p.sku === sku);
    if (prod) {
      setDraftCosto(prod.precio_compra || 0);
      setDraftIva(prod.iva !== undefined ? prod.iva : 0);
    }
  };

  const handleAddDraftItem = () => {
    if (!draftSku) {
      Swal.fire({ icon: 'warning', title: 'Seleccione un producto' });
      return;
    }
    if (draftCantidad <= 0) {
      Swal.fire({ icon: 'warning', title: 'Cantidad inválida', text: 'La cantidad debe ser mayor a 0.' });
      return;
    }

    const prod = activeProducts.find((p: any) => p.sku === draftSku);

    // Actualizar IVA del producto en catálogo si fue modificado en la compra
    if (onProductIvaUpdate && prod && prod.iva !== draftIva) {
      onProductIvaUpdate(draftSku, draftIva);
    }

    const resolvedNombre = (prod?.nombre && prod.nombre !== prod.sku)
      ? prod.nombre
      : fastCreatedProducts[draftSku] || draftSku;

    const newItem = {
      sku: draftSku,
      nombre: resolvedNombre,
      cantidad: draftCantidad,
      precioUnitario: draftCosto,
      iva: draftIva,
      lote: (draftLote || `LT-${Date.now().toString().slice(-6)}`).toUpperCase()
    };

    const currentItems = Array.isArray(compra.items) ? compra.items : [];
    
    // Si el producto ya existe en la lista, acumular cantidad y actualizar costo/IVA
    const existingIndex = currentItems.findIndex((i: any) => i.sku === draftSku);
    let updatedItems = [];
    if (existingIndex >= 0) {
      updatedItems = [...currentItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        cantidad: updatedItems[existingIndex].cantidad + draftCantidad,
        precioUnitario: draftCosto > 0 ? draftCosto : updatedItems[existingIndex].precioUnitario,
        iva: draftIva
      };
    } else {
      updatedItems = [...currentItems, newItem];
    }

    setCompra({
      ...compra,
      items: updatedItems,
      sku: updatedItems[0]?.sku || '',
      cantidad: updatedItems[0]?.cantidad || 0,
      costoUnitario: updatedItems[0]?.precioUnitario || 0
    });

    // Reset borrador
    setDraftCantidad(1);
    setDraftLote('');
  };

  const handleRemoveItem = (index: number) => {
    const currentItems = Array.isArray(compra.items) ? compra.items : [];
    const updatedItems = currentItems.filter((_: any, i: number) => i !== index);
    
    setCompra({
      ...compra,
      items: updatedItems,
      sku: updatedItems[0]?.sku || '',
      cantidad: updatedItems[0]?.cantidad || 0,
      costoUnitario: updatedItems[0]?.precioUnitario || 0
    });
  };

  const handleSupplierCreated = (newSupplierId: string) => {
    setCompra((prev: any) => ({
      ...prev,
      proveedorId: newSupplierId
    }));
  };

  const handleFastProductCreated = (newProduct: any) => {
    if (onProductCreated) {
      onProductCreated(newProduct);
    }
    setDraftSku(newProduct.sku);
    setDraftCosto(newProduct.precio_compra || 0);
    setDraftIva(newProduct.iva !== undefined ? newProduct.iva : 0);
  };

  const itemsList = Array.isArray(compra.items) ? compra.items : [];
  const subtotalItems = itemsList.reduce((acc: number, item: any) => acc + (item.cantidad * item.precioUnitario), 0);
  
  // IVA total es la suma del IVA específico de cada producto en la orden
  const valorIvaCalculado = itemsList.reduce((acc: number, item: any) => {
    const itemSub = item.cantidad * item.precioUnitario;
    const itemIvaPct = item.iva !== undefined ? item.iva : 0;
    return acc + Math.round(itemSub * (itemIvaPct / 100));
  }, 0);

  const fletesCalculado = Number(compra.fletes) || 0;
  const totalGeneralOC = subtotalItems + valorIvaCalculado + fletesCalculado;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col gap-6">
      {/* Modales de Creación Rápida */}
      <CrearProveedorRapidoModal
        isOpen={showModalProveedor}
        onClose={() => setShowModalProveedor(false)}
        onSupplierCreated={handleSupplierCreated}
      />
      <CrearProductoRapidoModal
        isOpen={showModalProducto}
        onClose={() => setShowModalProducto(false)}
        onProductCreated={handleFastProductCreated}
        categoriasExistentes={Array.from(new Set(activeProducts.map((p: any) => p.categoria).filter(Boolean)))}
      />

      {/* CABECERA DE SECCIÓN */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shadow-xs">
            <Truck size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 m-0">Entrada de Mercadería a Proveedores</h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5">Ingresa los productos recibidos para aumentar el inventario físico y actualizar saldos</p>
          </div>
        </div>

        {itemsList.length > 0 && (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1.5 rounded-full border border-emerald-200 shadow-xs">
            {itemsList.length} producto{itemsList.length === 1 ? '' : 's'} en esta orden
          </span>
        )}
      </div>

      <form onSubmit={handleProcesarCompra} className="flex flex-col gap-6">
        
        {/* 1. SECCIÓN: PROVEEDOR, BODEGA Y FORMA DE PAGO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4.5 bg-slate-50/80 rounded-xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase m-0">Proveedor Origen *</label>
              <button
                type="button"
                onClick={() => setShowModalProveedor(true)}
                className="text-[11px] text-emerald-700 font-extrabold hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                title="Crear un nuevo proveedor al instante"
              >
                <UserPlus size={12} /> + Crear Proveedor
              </button>
            </div>
            <select
              required
              className="w-full h-10 px-3 border-2 border-emerald-200 bg-white rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-xs"
              value={compra.proveedorId}
              onChange={e => {
                if (e.target.value === '_NEW_') {
                  setShowModalProveedor(true);
                } else {
                  setCompra({ ...compra, proveedorId: e.target.value });
                }
              }}
            >
              <option value="">-- Seleccionar Proveedor --</option>
              <option value="_NEW_" className="font-bold text-emerald-700 bg-emerald-50">+ Crear Nuevo Proveedor...</option>
              {proveedores.filter((p: any) => p.activo).map((p: any) => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.nit})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">Bodega Destino *</label>
            <select
              className="w-full h-10 px-3 border border-slate-300 bg-white rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-xs"
              value={compra.bodega || 'Bodega Principal'}
              onChange={e => setCompra({ ...compra, bodega: e.target.value })}
            >
              {bodegas.filter((b: any) => b.activa).map((b: any) => (
                <option key={b.id} value={b.nombre}>{b.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">Forma de Pago *</label>
            <select
              className="w-full h-10 px-3 border border-slate-300 bg-white rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-xs"
              value={compra.formaPago || 'CONTADO'}
              onChange={e => setCompra({ ...compra, formaPago: e.target.value })}
            >
              <option value="CONTADO">Contado (Efectivo / Caja)</option>
              <option value="CREDITO">Crédito (Cuenta por Pagar)</option>
            </select>
          </div>
        </div>

        {/* 2. SECCIÓN: AGREGADOR DE PRODUCTOS (LAYOUT REORGANIZADO SIN OVERFLOW) */}
        <div className="p-5 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 rounded-xl border-2 border-emerald-200/90 flex flex-col gap-4 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <PlusCircle size={16} className="text-emerald-600" />
              Añadir Producto a esta Compra
            </span>
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600" />
              El IVA configurado aquí se sincroniza con las ventas POS
            </span>
          </div>

          {/* FILA 1: PRODUCTO Y LOTE */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 m-0">Producto a Recibir</label>
                <button
                  type="button"
                  onClick={() => setShowModalProducto(true)}
                  className="text-[11px] text-emerald-700 font-extrabold hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Crear un nuevo producto al catálogo"
                >
                  <PackagePlus size={12} /> + Crear Producto
                </button>
              </div>
              <select
                className="w-full h-10 px-3 border border-emerald-300 bg-white rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-xs"
                value={draftSku}
                onChange={e => {
                  if (e.target.value === '_NEW_') {
                    setShowModalProducto(true);
                  } else {
                    handleProductSelect(e.target.value);
                  }
                }}
              >
                <option value="">-- Seleccionar Producto --</option>
                <option value="_NEW_" className="font-bold text-emerald-700 bg-emerald-50">+ Crear Nuevo Producto...</option>
                {activeProducts.map((p: any) => (
                  <option key={p.sku} value={p.sku}>
                    {p.nombre} ({p.sku}) — IVA actual: {p.iva !== undefined ? p.iva : 0}%
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="text-xs font-bold text-slate-700 mb-1 block">Lote (Opcional)</label>
              <input
                type="text"
                className="w-full h-10 px-3 border border-slate-300 bg-white rounded-xl text-xs font-mono uppercase text-slate-800 shadow-xs"
                placeholder="Ej. LT-2506"
                value={draftLote}
                onChange={e => setDraftLote(e.target.value)}
              />
            </div>
          </div>

          {/* FILA 2: CANTIDAD, COSTO, IVA Y BOTÓN AÑADIR (SIN CORTES) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <label className="text-xs font-bold text-slate-700 mb-1 block">Cantidad</label>
              <input
                type="number"
                min="1"
                className="w-full h-10 px-3 border border-slate-300 bg-white rounded-xl text-sm font-bold text-slate-900 shadow-xs"
                value={draftCantidad}
                onChange={e => setDraftCantidad(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-bold text-slate-700 mb-1 block">Costo Unit ($ COP)</label>
              <input
                type="number"
                min="0"
                className="w-full h-10 px-3 border border-slate-300 bg-white rounded-xl text-sm font-bold text-slate-900 shadow-xs"
                placeholder="Ej. 12000"
                value={draftCosto || ''}
                onChange={e => setDraftCosto(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-extrabold text-emerald-900 mb-1 block">IVA Producto (%)</label>
              <select
                className="w-full h-10 px-3 border-2 border-emerald-400 bg-white rounded-xl text-sm font-bold text-slate-800 shadow-xs"
                value={draftIva}
                onChange={e => setDraftIva(parseInt(e.target.value) || 0)}
              >
                <option value={0}>0% (Exento)</option>
                <option value={19}>19% (Gravado)</option>
                <option value={5}>5% (Reducido)</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <button
                type="button"
                onClick={handleAddDraftItem}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer text-sm"
                title="Agregar ítem a la lista de compra"
              >
                <Plus size={18} />
                <span>+ Añadir Producto</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. SECCIÓN: TABLA DE DETALLE DE ÍTEMS */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4 text-center">Lote</th>
                <th className="py-3 px-4 text-right">Cantidad</th>
                <th className="py-3 px-4 text-right">Costo Unit.</th>
                <th className="py-3 px-4 text-center">IVA %</th>
                <th className="py-3 px-4 text-right">Subtotal + IVA</th>
                <th className="py-3 px-4 w-16 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {itemsList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 text-sm italic">
                    No has añadido productos a esta orden todavía. Selecciona un producto arriba y haz clic en <strong>(+ Añadir Producto)</strong>.
                  </td>
                </tr>
              ) : (
                itemsList.map((item: any, idx: number) => {
                  const subItemNeto = item.cantidad * item.precioUnitario;
                  const itemIvaPct = item.iva !== undefined ? item.iva : 0;
                  const itemIvaVal = Math.round(subItemNeto * (itemIvaPct / 100));
                  const totalItemConIva = subItemNeto + itemIvaVal;

                  return (
                    <tr key={`${item.sku}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-600">{item.sku}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{item.nombre}</td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-emerald-700 font-semibold">{item.lote}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">{item.cantidad} unidades</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700">${item.precioUnitario.toLocaleString('es-CO')}</td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${itemIvaPct > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                          {itemIvaPct}% {itemIvaPct > 0 ? 'Gravado' : 'Exento'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">${totalItemConIva.toLocaleString('es-CO')}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar de la compra"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. SECCIÓN: RESUMEN DE TOTALES Y BOTÓN PRINCIPAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-3 border-t border-slate-200">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">Fletes / Adicionales ($ COP)</label>
            <input
              type="number"
              min="0"
              className="w-full h-10 px-3 border border-slate-300 bg-white rounded-xl text-sm font-bold text-slate-900 shadow-xs"
              placeholder="0"
              value={compra.fletes || 0}
              onChange={e => setCompra({ ...compra, fletes: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex flex-col gap-1.5 bg-slate-50/90 p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex justify-between w-full text-xs text-slate-600 font-semibold">
              <span>Subtotal Productos (Neto):</span>
              <span>${subtotalItems.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between w-full text-xs text-slate-700 font-bold">
              <span>Total IVA Acumulado (por producto):</span>
              <span className="text-amber-700">${valorIvaCalculado.toLocaleString('es-CO')}</span>
            </div>
            {fletesCalculado > 0 && (
              <div className="flex justify-between w-full text-xs text-slate-600 font-semibold">
                <span>Fletes / Adicionales:</span>
                <span>${fletesCalculado.toLocaleString('es-CO')}</span>
              </div>
            )}
            <div className="flex justify-between w-full text-base font-black text-slate-900 border-t border-slate-200/80 pt-2 mt-1">
              <span>Total Orden de Compra:</span>
              <span className="text-emerald-600 text-xl font-black">${totalGeneralOC.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={itemsList.length === 0}
          className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PackageCheck size={22} />
          <span>Registrar Entrada de Compra ({itemsList.length} Producto{itemsList.length === 1 ? '' : 's'})</span>
        </button>
      </form>
    </div>
  );
}
