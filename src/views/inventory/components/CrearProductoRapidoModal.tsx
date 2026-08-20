import React, { useState } from 'react';
import { PackagePlus, X, Save, FolderPlus } from 'lucide-react';
import Swal from 'sweetalert2';
import { CategoriaWizardModal } from './CategoriaWizardModal';
import { useCategoryStore, getCategoryPath } from '../../../store/useCategoryStore';
import * as localDb from '../../../services/localDb';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (newProduct: any) => void;
  categoriasExistentes?: string[];
}

export function CrearProductoRapidoModal({ isOpen, onClose, onProductCreated, categoriasExistentes = [] }: Props) {
  const { categorias } = useCategoryStore();
  const [sku, setSku] = useState(() => `PROD-${Date.now().toString().slice(-5)}`);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('PESCADO FRESCO');
  const [unidadMedida, setUnidadMedida] = useState<'kg' | 'und' | 'lb' | 'gr'>('kg');
  const [showWizard, setShowWizard] = useState(false);
  const [localCategorias, setLocalCategorias] = useState<string[]>([]);
  const [precioCompra, setPrecioCompra] = useState<number>(0);
  const [precioVentaPos, setPrecioVentaPos] = useState<number>(0);
  const [bufferSeguridad, setBufferSeguridad] = useState<number>(5);
  const [ivaPct, setIvaPct] = useState<number>(0); // Default: 0% Exento para productos marinos frescos

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El SKU y el Nombre del Producto son obligatorios.'
      });
      return;
    }

    const finalCategoria = categoria;
    const finalSku = sku.trim().toUpperCase();

    const newCatalogProduct = {
      id: `prod-${Date.now().toString(36)}`,
      sku: finalSku,
      nombre: nombre.trim().toUpperCase(),
      categoria: finalCategoria.toUpperCase(),
      unidadMedida: unidadMedida,
      precio_compra: Number(precioCompra) || 0,
      buffer_seguridad: Number(bufferSeguridad) || 5,
      precio_venta_pos: Number(precioVentaPos) || 0,
      precio_venta_restaurante: Number(precioVentaPos) || 0,
      precio_venta_mayorista: Number(precioVentaPos) || 0,
      activo: true,
      control_inventario: true,
      produccion: false,
      iva: Number(ivaPct) || 0,
      ivaIncluido: Number(ivaPct) > 0
    };

    const newPricingProduct = {
      id: `prc-${Date.now().toString(36)}`,
      productoId: newCatalogProduct.id,
      vigenciaDesde: new Date().toISOString(),
      precio_compra: newCatalogProduct.precio_compra,
      buffer_seguridad: newCatalogProduct.buffer_seguridad,
      precio_venta_pos: newCatalogProduct.precio_venta_pos,
      precio_venta_restaurante: newCatalogProduct.precio_venta_restaurante,
      precio_venta_mayorista: newCatalogProduct.precio_venta_mayorista,
      actualizadoPor: 'admin'
    };

    // Persistir en localDb ANTES de llamar al callback
    // (setProductsCatalog en el store llama loadInventory() que recarga desde localDb,
    //  si el producto no está ya persistido, se pierde en esa recarga)
    const existingCatalog = localDb.load<any[]>('productsCatalog', []);
    const safeCatalog = Array.isArray(existingCatalog) ? existingCatalog : [];
    localDb.save('productsCatalog', [...safeCatalog, newCatalogProduct]);

    const existingPricings = localDb.load<any[]>('productPricings', []);
    const safePricings = Array.isArray(existingPricings) ? existingPricings : [];
    localDb.save('productPricings', [...safePricings, newPricingProduct]);

    onProductCreated(newCatalogProduct);

    Swal.fire({
      icon: 'success',
      title: '¡Producto Creado!',
      text: `${newCatalogProduct.nombre} (${finalSku}) fue agregado al catálogo con ${newCatalogProduct.iva}% de IVA.`,
      timer: 1800,
      showConfirmButton: false
    });

    onClose();

    // Reset
    setSku(`PROD-${Date.now().toString().slice(-5)}`);
    setNombre('');
    setPrecioCompra(0);
    setPrecioVentaPos(0);
    setIvaPct(0);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Cabecera Modal */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <PackagePlus size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white m-0">Creación Rápida de Producto</h3>
              <p className="text-xs text-slate-400 m-0">Registra un nuevo producto en el catálogo al instante</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SKU / Código *</label>
              <input
                type="text"
                required
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase text-slate-800 focus:ring-2 focus:ring-emerald-500"
                placeholder="Ej. PES-001"
                value={sku}
                onChange={e => setSku(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre del Producto *</label>
              <input
                type="text"
                required
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                placeholder="Ej. Robalo Entero Limpio"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Categoría</label>
                <button
                  type="button"
                  onClick={() => setShowWizard(true)}
                  className="text-[11px] text-emerald-700 font-extrabold hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Crear una categoría avanzada"
                >
                  <FolderPlus size={12} /> + Crear Categoría
                </button>
              </div>
              <select
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                value={categoria}
                onChange={e => {
                  if (e.target.value === '_NEW_') {
                    setShowWizard(true);
                  } else {
                    setCategoria(e.target.value);
                  }
                }}
              >
                <option value="_NEW_" className="font-bold text-emerald-700 bg-emerald-50">+ Crear Nueva Categoría...</option>
                {categorias.map(cat => {
                  const path = getCategoryPath(cat.id, categorias);
                  return <option key={cat.id} value={path}>{path}</option>;
                })}
                <option disabled>───────</option>
                <option value="PESCADO FRESCO">PESCADO FRESCO</option>
                <option value="MARISCOS">MARISCOS</option>
                <option value="MATERIA PRIMA">MATERIA PRIMA</option>
                <option value="CONGELADOS">CONGELADOS</option>
                <option value="PROCESADO">PROCESADO</option>
                {categoriasExistentes.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {localCategorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unidad de Medida</label>
              <select
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800"
                value={unidadMedida}
                onChange={e => setUnidadMedida(e.target.value as any)}
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="und">Unidades (und)</option>
                <option value="lb">Libras (lb)</option>
                <option value="gr">Gramos (gr)</option>
              </select>
            </div>
          </div>

          {/* IMPUESTO IVA DEL PRODUCTO */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <label className="block text-xs font-black text-emerald-800 uppercase mb-1">Configurar IVA del Producto (Compra y Venta) *</label>
            <select
              className="w-full h-10 px-3 border border-emerald-300 bg-white rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              value={ivaPct}
              onChange={e => setIvaPct(parseInt(e.target.value) || 0)}
            >
              <option value={0}>0% Exento / Excluido (Pescado fresco, mariscos en estado natural)</option>
              <option value={19}>19% Gravado (Procesados, empaquetados, salsas, etc.)</option>
              <option value={5}>5% Tarifa Reducida</option>
            </select>
            <span className="text-[11px] text-emerald-700 font-medium block mt-1">
              Esta configuración afectará automáticamente las compras a proveedores y la venta de este producto en el POS.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Costo Compra ($ COP)</label>
              <input
                type="number"
                min="0"
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800"
                placeholder="Ej. 18000"
                value={precioCompra || ''}
                onChange={e => setPrecioCompra(parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Precio Venta ($ COP)</label>
              <input
                type="number"
                min="0"
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800"
                placeholder="Ej. 28000"
                value={precioVentaPos || ''}
                onChange={e => setPrecioVentaPos(parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stock Mínimo (Buffer)</label>
              <input
                type="number"
                min="1"
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800"
                value={bufferSeguridad}
                onChange={e => setBufferSeguridad(parseInt(e.target.value) || 5)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Save size={16} />
              <span>Guardar y Seleccionar</span>
            </button>
          </div>
        </form>
      </div>
      <CategoriaWizardModal 
        isOpen={showWizard} 
        onClose={() => setShowWizard(false)} 
        onCategoryCreated={(id, catStr) => {
          setLocalCategorias(prev => [...prev, catStr]);
          setCategoria(catStr);
        }}
      />
    </div>
  );
}
