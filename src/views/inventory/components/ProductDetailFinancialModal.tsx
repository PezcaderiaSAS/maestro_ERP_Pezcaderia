import React, { useState, useEffect } from 'react';
import { X, Save, Package, DollarSign, Activity, FileText, Tag, Image as ImageIcon } from 'lucide-react';
import { useInventoryStore, Producto } from '../../../store/useInventoryStore';
import { useAppStore } from '../../../store/useAppStore';
import { FinancialAdvisorService } from '../../../services/financialAdvisorService';
import Swal from 'sweetalert2';
import { TipoPromocion, EstadoMargen } from '../../../types/erp.types';

interface ProductDetailFinancialModalProps {
  product: Producto;
  onClose: () => void;
  onSave?: () => void;
}

export const ProductDetailFinancialModal: React.FC<ProductDetailFinancialModalProps> = ({
  product,
  onClose,
  onSave
}) => {
  const { userRole } = useAppStore();
  const { productsCatalog, productPricings, setProductsCatalog, setProductPricings, stock } = useInventoryStore();
  
  const isEditable = userRole === 'admin' || userRole === 'administrativo';

  const [activeTab, setActiveTab] = useState<number>(1);
  const [formData, setFormData] = useState<Partial<Producto>>({ ...product });

  // Financial simulation state
  const [simPos, setSimPos] = useState<any>(null);
  const [simRest, setSimRest] = useState<any>(null);
  const [simMay, setSimMay] = useState<any>(null);
  const [promoEval, setPromoEval] = useState<any>(null);

  useEffect(() => {
    // Run financial simulations whenever prices or costs change
    const cpp = formData.precio_compra || 0;
    const merma = formData.porcentaje_merma_esperada || 0;
    const abc = formData.categoriaABC || 'C';
    const iva = formData.iva || 0;
    const ivaIncluido = formData.ivaIncluido || false;

    const costoReal = FinancialAdvisorService.calcularCostoAprovechable(cpp, merma);

    setSimPos(FinancialAdvisorService.simularRentabilidadCanal(
      costoReal, formData.precio_venta_pos || 0, iva, ivaIncluido, abc, 'POS'
    ));
    setSimRest(FinancialAdvisorService.simularRentabilidadCanal(
      costoReal, formData.precio_venta_restaurante || 0, iva, ivaIncluido, abc, 'RESTAURANTE'
    ));
    setSimMay(FinancialAdvisorService.simularRentabilidadCanal(
      costoReal, formData.precio_venta_mayorista || 0, iva, ivaIncluido, abc, 'MAYORISTA'
    ));

    if (formData.promocion_activa?.activa) {
      setPromoEval(FinancialAdvisorService.evaluarOfertaAvanzada(
        formData.promocion_activa.tipo,
        formData.promocion_activa.valor,
        simPos?.precio_base_sin_iva || 0, // Reference using POS base price
        costoReal
      ));
    } else {
      setPromoEval(null);
    }

  }, [
    formData.precio_compra, formData.porcentaje_merma_esperada, formData.categoriaABC, 
    formData.iva, formData.ivaIncluido, formData.precio_venta_pos, 
    formData.precio_venta_restaurante, formData.precio_venta_mayorista,
    formData.promocion_activa
  ]);

  const handleInputChange = (field: string, value: any) => {
    if (!isEditable) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    if (!isEditable) return;
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof Producto] as any || {}),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!isEditable) return;

    try {
      // 1. Update Catalog
      const catalogData = {
        id: formData.id,
        sku: formData.sku,
        nombre: formData.nombre,
        categoria: formData.categoria,
        unidadMedida: formData.unidadMedida,
        codigo_barras: formData.codigo_barras,
        iva: formData.iva,
        ivaIncluido: formData.ivaIncluido,
        activo: formData.activo,
        categoriaABC: formData.categoriaABC,
        porcentaje_merma_esperada: formData.porcentaje_merma_esperada,
        cuenta_contable_ingreso: (formData as any).cuenta_contable_ingreso,
        promocion_activa: (formData as any).promocion_activa
      };

      let newCatalog = [...productsCatalog];
      const catIdx = newCatalog.findIndex(c => c.id === formData.id);
      if (catIdx >= 0) {
        newCatalog[catIdx] = { ...newCatalog[catIdx], ...catalogData };
      } else {
        newCatalog.push(catalogData);
      }
      setProductsCatalog(newCatalog);

      // 2. Insert new Pricing validity (historic record)
      const pricingData = {
        id: `PRC-${Date.now()}`,
        productoId: formData.id,
        vigenciaDesde: new Date().toISOString(),
        precio_compra: formData.precio_compra,
        buffer_seguridad: formData.buffer_seguridad,
        precio_venta_pos: formData.precio_venta_pos,
        precio_venta_restaurante: formData.precio_venta_restaurante,
        precio_venta_mayorista: formData.precio_venta_mayorista,
        actualizadoPor: userRole
      };

      const newPricings = [...productPricings, pricingData];
      setProductPricings(newPricings);

      Swal.fire({
        icon: 'success',
        title: 'Guardado Exitoso',
        text: 'La ficha del producto y sus vigencias de precio han sido actualizadas.',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#3b82f6'
      });

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la información del producto.',
        background: '#1e293b',
        color: '#f8fafc'
      });
    }
  };

  const renderBadge = (estado: EstadoMargen) => {
    switch(estado) {
      case 'OPTIMO': return <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs">Óptimo</span>;
      case 'AJUSTADO': return <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded text-xs">Ajustado</span>;
      case 'PERDIDA': return <span className="bg-rose-500/20 text-rose-400 px-2 py-1 rounded text-xs animate-pulse">Pérdida</span>;
      default: return null;
    }
  };

  const totalStock = Object.values(stock).reduce((acc: number, bodega: any) => acc + (bodega[product.sku] || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900/90 border border-white/10 shadow-2xl rounded-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden text-slate-200">
        
        {/* Header - Dark Glassmorphism */}
        <div className="p-6 border-b border-white/10 bg-slate-800/50 flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl bg-slate-700/50 flex items-center justify-center border border-white/5">
              {product.imagen ? (
                <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <ImageIcon className="text-slate-500" size={32} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white bg-transparent outline-none">
                  {isEditable ? (
                    <input 
                      type="text" 
                      value={formData.nombre} 
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      className="bg-transparent border-b border-dashed border-slate-500 focus:border-blue-500 outline-none"
                    />
                  ) : formData.nombre}
                </h2>
                <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded-md text-blue-400 border border-blue-900/50">
                  {formData.sku}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-slate-400">Estado:</span>
                  <input 
                    type="checkbox" 
                    checked={formData.activo} 
                    onChange={(e) => handleInputChange('activo', e.target.checked)}
                    disabled={!isEditable}
                    className="toggle-checkbox" 
                  />
                  <span className={`text-sm ${formData.activo ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {formData.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </label>
                <span className="text-sm text-slate-400">Clasificación: <strong className="text-white">{formData.categoriaABC || 'C'}</strong></span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex px-6 border-b border-white/10 bg-slate-800/30 overflow-x-auto hide-scrollbar">
          {[
            { id: 1, label: 'Resumen 360°', icon: Activity },
            { id: 2, label: 'Datos Maestros', icon: Package },
            { id: 3, label: 'Asesor Financiero', icon: DollarSign },
            { id: 4, label: 'Impuestos & NIIF', icon: FileText },
            { id: 5, label: 'Promociones & Ofertas', icon: Tag }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                  <h3 className="text-slate-400 text-sm mb-1">Stock Total Existencias</h3>
                  <div className="text-3xl font-bold text-white">{totalStock} <span className="text-sm font-normal text-slate-500">{formData.unidadMedida}</span></div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                  <h3 className="text-slate-400 text-sm mb-1">Valoración en Libros (Costo)</h3>
                  <div className="text-3xl font-bold text-emerald-400">${((totalStock) * (formData.precio_compra || 0)).toLocaleString()}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                  <h3 className="text-slate-400 text-sm mb-1">Precio Venta POS Promedio</h3>
                  <div className="text-3xl font-bold text-blue-400">${(formData.precio_venta_pos || 0).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-4">Distribución por Bodega</h3>
                <div className="space-y-3">
                  {Object.entries(stock).map(([bodega, items]: [string, any]) => {
                    const qty = items[product.sku] || 0;
                    if (qty <= 0) return null;
                    const max = 1000; // Mock max for progress bar
                    const pct = Math.min((qty / max) * 100, 100);
                    return (
                      <div key={bodega} className="bg-slate-800/30 p-3 rounded-lg flex items-center gap-4">
                        <div className="w-32 truncate text-sm font-medium text-slate-300">{bodega}</div>
                        <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="w-20 text-right font-mono text-sm text-slate-300">{qty} {formData.unidadMedida}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white border-b border-white/10 pb-2">Información Básica</h3>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">SKU</label>
                  <input type="text" value={formData.sku} onChange={e => handleInputChange('sku', e.target.value)} disabled={!isEditable} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Categoría</label>
                  <input type="text" value={formData.categoria} onChange={e => handleInputChange('categoria', e.target.value)} disabled={!isEditable} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Unidad de Medida</label>
                    <select value={formData.unidadMedida} onChange={e => handleInputChange('unidadMedida', e.target.value)} disabled={!isEditable} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                      <option value="kg">Kilogramos (kg)</option>
                      <option value="und">Unidades (und)</option>
                      <option value="lb">Libras (lb)</option>
                      <option value="gr">Gramos (gr)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Cód. Barras</label>
                    <input type="text" value={formData.codigo_barras || ''} onChange={e => handleInputChange('codigo_barras', e.target.value)} disabled={!isEditable} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white border-b border-white/10 pb-2">Inventario & Logística</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Merma Esperada (%)</label>
                    <div className="relative">
                      <input type="number" value={formData.porcentaje_merma_esperada || 0} onChange={e => handleInputChange('porcentaje_merma_esperada', parseFloat(e.target.value))} disabled={!isEditable} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                      <span className="absolute right-3 top-2.5 text-slate-500">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Buffer Seguridad</label>
                    <input type="number" value={formData.buffer_seguridad || 0} onChange={e => handleInputChange('buffer_seguridad', parseFloat(e.target.value))} disabled={!isEditable} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Clasificación ABC</label>
                  <select value={formData.categoriaABC || 'C'} onChange={e => handleInputChange('categoriaABC', e.target.value)} disabled={!isEditable} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                    <option value="A">A - Alta Rotación / Alto Valor</option>
                    <option value="B">B - Rotación Media</option>
                    <option value="C">C - Baja Rotación</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-6">
              <div className="bg-slate-800/40 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Costo Compra Ponderado (CPP)</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-white">$</span>
                    <input type="number" value={formData.precio_compra || 0} onChange={e => handleInputChange('precio_compra', parseFloat(e.target.value))} disabled={!isEditable} className="bg-transparent text-2xl font-bold text-white border-b border-dashed border-slate-500 focus:border-blue-500 outline-none w-32" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">Costo Aprovechable (Con Merma)</p>
                  <p className="text-2xl font-bold text-rose-400">${FinancialAdvisorService.calcularCostoAprovechable(formData.precio_compra || 0, formData.porcentaje_merma_esperada || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* POS Channel */}
                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                    <h4 className="font-medium text-white">Canal POS</h4>
                    {simPos && renderBadge(simPos.estado)}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400">Precio de Venta</label>
                      <input type="number" value={formData.precio_venta_pos || 0} onChange={e => handleInputChange('precio_venta_pos', parseFloat(e.target.value))} disabled={!isEditable} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-right" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Margen Bruto:</span>
                      <span className={simPos?.estado === 'PERDIDA' ? 'text-rose-400' : 'text-emerald-400'}>{simPos?.margen_bruto_pct || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Utilidad Unid.:</span>
                      <span className="text-white">${simPos?.utilidad_cop.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                      <span className="text-slate-400">Margen Obj:</span>
                      <span className="text-slate-300">{simPos?.margen_objetivo_pct || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-400 font-medium cursor-help" title="Precio Sugerido sin IVA">Precio Sugerido (Sin IVA):</span>
                      <span className="text-blue-400">${simPos?.precio_sugerido_asesor.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>

                {/* RESTAURANTE Channel */}
                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                    <h4 className="font-medium text-white">Canal Restaurante</h4>
                    {simRest && renderBadge(simRest.estado)}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400">Precio de Venta</label>
                      <input type="number" value={formData.precio_venta_restaurante || 0} onChange={e => handleInputChange('precio_venta_restaurante', parseFloat(e.target.value))} disabled={!isEditable} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-right" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Margen Bruto:</span>
                      <span className={simRest?.estado === 'PERDIDA' ? 'text-rose-400' : 'text-emerald-400'}>{simRest?.margen_bruto_pct || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Utilidad Unid.:</span>
                      <span className="text-white">${simRest?.utilidad_cop.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                      <span className="text-slate-400">Margen Obj:</span>
                      <span className="text-slate-300">{simRest?.margen_objetivo_pct || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-400 font-medium">Precio Sugerido (Sin IVA):</span>
                      <span className="text-blue-400">${simRest?.precio_sugerido_asesor.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>

                {/* MAYORISTA Channel */}
                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                    <h4 className="font-medium text-white">Canal Mayorista</h4>
                    {simMay && renderBadge(simMay.estado)}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400">Precio de Venta</label>
                      <input type="number" value={formData.precio_venta_mayorista || 0} onChange={e => handleInputChange('precio_venta_mayorista', parseFloat(e.target.value))} disabled={!isEditable} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-right" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Margen Bruto:</span>
                      <span className={simMay?.estado === 'PERDIDA' ? 'text-rose-400' : 'text-emerald-400'}>{simMay?.margen_bruto_pct || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Utilidad Unid.:</span>
                      <span className="text-white">${simMay?.utilidad_cop.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                      <span className="text-slate-400">Margen Obj:</span>
                      <span className="text-slate-300">{simMay?.margen_objetivo_pct || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-400 font-medium">Precio Sugerido (Sin IVA):</span>
                      <span className="text-blue-400">${simMay?.precio_sugerido_asesor.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white border-b border-white/10 pb-2">Impuestos (IVA)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Tarifa de IVA (%)</label>
                    <select value={formData.iva || 0} onChange={e => handleInputChange('iva', parseInt(e.target.value))} disabled={!isEditable} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                      <option value="0">0% (Exento)</option>
                      <option value="5">5%</option>
                      <option value="19">19%</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.ivaIncluido || false} onChange={e => handleInputChange('ivaIncluido', e.target.checked)} disabled={!isEditable} className="form-checkbox bg-slate-800 border-slate-700 text-blue-500 rounded" />
                      <span className="text-sm text-slate-300">Precio de Venta incluye IVA</span>
                    </label>
                  </div>
                </div>
                
                <div className="bg-slate-800/30 p-4 rounded-lg mt-4 border border-white/5">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Desglose POS Actual</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Base Gravable:</span>
                    <span className="text-white">${simPos?.precio_base_sin_iva?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-400">Cuota IVA:</span>
                    <span className="text-amber-400">${simPos?.cuota_iva?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white border-b border-white/10 pb-2">Contabilidad NIIF (PUC)</h3>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Cuenta de Ingreso (Ventas)</label>
                  <input type="text" value={(formData as any).cuenta_contable_ingreso || '4135'} onChange={e => handleInputChange('cuenta_contable_ingreso', e.target.value)} disabled={!isEditable} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none" placeholder="Ej: 413505" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Cuenta de Costo</label>
                  <input type="text" value={(formData as any).cuenta_contable_costo || '6135'} disabled className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-400 font-mono" />
                  <p className="text-xs text-slate-500 mt-1">Heredada de la categoría del producto.</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Cuenta de Inventario</label>
                  <input type="text" value={(formData as any).cuenta_contable_inventario || '1435'} disabled className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-400 font-mono" />
                  <p className="text-xs text-slate-500 mt-1">Heredada de la categoría del producto.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 5 && (
            <div className="space-y-6">
              <div className="bg-slate-800/40 p-5 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2"><Tag size={18} className="text-fuchsia-400"/> Promoción Activa</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-slate-400">Activar Oferta</span>
                    <input type="checkbox" checked={(formData as any).promocion_activa?.activa || false} onChange={e => handleNestedChange('promocion_activa', 'activa', e.target.checked)} disabled={!isEditable} className="toggle-checkbox" />
                  </label>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${(formData as any).promocion_activa?.activa ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Tipo de Promoción</label>
                    <select value={(formData as any).promocion_activa?.tipo || 'PORCENTAJE'} onChange={e => handleNestedChange('promocion_activa', 'tipo', e.target.value)} disabled={!isEditable} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                      <option value="PORCENTAJE">Descuento Porcentual (%)</option>
                      <option value="PRECIO_FIJO">Precio Fijo Especial ($)</option>
                      <option value="2X1">2x1 (Lleva 2, Paga 1)</option>
                      <option value="12_MAS_1">12 + 1 (Docena)</option>
                      <option value="VOLUMEN">Descuento por Volumen (Kg)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Valor / Porcentaje</label>
                    <input type="number" value={(formData as any).promocion_activa?.valor || 0} onChange={e => handleNestedChange('promocion_activa', 'valor', parseFloat(e.target.value))} disabled={!isEditable} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                  </div>
                  
                  {/* Promo Evaluator Alert */}
                  {promoEval && (
                    <div className={`col-span-2 p-4 rounded-lg mt-2 border ${promoEval.estado === 'PERDIDA' ? 'bg-rose-500/10 border-rose-500/30' : promoEval.estado === 'AJUSTADO' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                      <h4 className={`text-sm font-semibold mb-1 ${promoEval.estado === 'PERDIDA' ? 'text-rose-400' : promoEval.estado === 'AJUSTADO' ? 'text-amber-400' : 'text-emerald-400'}`}>Guardián Financiero: Auditoría de Oferta</h4>
                      <p className="text-sm text-slate-300">Precio Unitario Efectivo: <strong>${promoEval.precio_unitario_efectivo?.toLocaleString()}</strong></p>
                      <p className="text-sm text-slate-300">Margen Efectivo Promocional: <strong>{promoEval.margen_efectivo_pct}%</strong> (Utilidad: ${promoEval.utilidad_efectiva_cop?.toLocaleString()})</p>
                      {promoEval.advertencia && <p className="text-xs text-rose-300 mt-2 font-medium">⚠️ {promoEval.advertencia}</p>}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-800/80 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors">
            Cerrar
          </button>
          {isEditable && (
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
              <Save size={18} />
              Guardar Cambios
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
