import React from 'react';
import { Package, RefreshCw, Save } from 'lucide-react';

export function ProductForm({
  editingProductId,
  isCreating,
  productForm,
  setProductForm,
  customTipo,
  setCustomTipo,
  customLinea,
  setCustomLinea,
  customClase,
  setCustomClase,
  isGeneratingImage,
  handleGenerateAIImage,
  handleSaveProduct,
  setEditingProductId,
  setIsCreating,
  uniqueTipos,
  uniqueLineas,
  uniqueClases,
  stock
}: any) {

  const getStockInBodega = (sku: string, bodega: string) => {
    return stock?.[bodega]?.[sku] || 0;
  };

  const getTotalStock = (sku: string) => {
    let total = 0;
    if (!stock) return 0;
    Object.values(stock).forEach((bodegaStock: any) => {
      if (bodegaStock && typeof bodegaStock === 'object') {
        total += bodegaStock[sku] || 0;
      }
    });
    return total;
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setIsCreating(false);
    setProductForm({ 
      sku: '', nombre: '', categoria: '', unidadMedida: 'KG', precio_compra: 0, buffer_seguridad: 5, 
      codigo_barras: '', iva: 0, ivaIncluido: true, control_inventario: true, produccion: false, 
      tipoCategoria: '', lineaCategoria: '', claseCategoria: '', imagen: '' 
    });
    setCustomTipo('');
    setCustomLinea('');
    setCustomClase('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Encabezado del Formulario */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Ficha de Producto</span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>
            {editingProductId ? `Editar: ${productForm.nombre}` : 'Registrar Nuevo Producto'}
          </h2>
        </div>
        <button
          type="button"
          onClick={cancelEdit}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', border: '1px solid #CBD5E1', cursor: 'pointer' }}
        >
          Volver al Catálogo
        </button>
      </div>

      {/* Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
        
        {/* PANEL IZQUIERDO: IMAGEN, SKU, INDICADORES */}
        <div className="hr-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
          <div style={{ width: '100%', aspectRatio: '1.2', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {productForm.imagen ? (
              <img 
                src={productForm.imagen} 
                alt={productForm.nombre} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isGeneratingImage ? 0.3 : 1 }} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534080391025-09795d197a5b?w=400';
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#94A3B8', opacity: isGeneratingImage ? 0.3 : 1 }}>
                <Package size={64} strokeWidth={1} />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Sin Imagen de Producto</span>
              </div>
            )}

            {isGeneratingImage && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                zIndex: 10
              }}>
                <RefreshCw className="animate-spin" size={32} color="var(--primary-color)" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-color)' }}>Generando con IA...</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleGenerateAIImage}
            disabled={isGeneratingImage}
            className="btn-secondary"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', fontWeight: 700,
              backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: isGeneratingImage ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={16} className={isGeneratingImage ? "animate-spin" : ""} />
            <span>✨ Generar con IA</span>
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Código SKU</span>
            <span className="badge-vigente" style={{ alignSelf: 'flex-start', fontFamily: 'monospace', fontSize: '14px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', borderColor: 'transparent', padding: '4px 12px' }}>
              {productForm.sku || 'NUEVO-PRODUCTO'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>INDICADORES DE CONTROL</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Control de Stock:</span>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                  backgroundColor: productForm.control_inventario ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: productForm.control_inventario ? '#10B981' : '#EF4444'
                }}>
                  {productForm.control_inventario ? 'SÍ' : 'NO'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Transformable en Planta:</span>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                  backgroundColor: productForm.produccion ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: productForm.produccion ? '#10B981' : '#EF4444'
                }}>
                  {productForm.produccion ? 'SÍ' : 'NO'}
                </span>
              </div>
            </div>
          </div>

          {editingProductId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>RESUMEN DE STOCK</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {Object.keys(stock).map(bodegaName => {
                  const qty = getStockInBodega(productForm.sku, bodegaName);
                  return (
                    <div key={bodegaName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#64748B' }}>{bodegaName}:</span>
                      <span style={{ fontWeight: 600 }}>{qty} {productForm.unidadMedida}</span>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #E2E8F0', paddingTop: '8px', marginTop: '4px', fontSize: '14px', fontWeight: 700 }}>
                  <span>Stock Total:</span>
                  <span style={{ color: 'var(--primary-color)' }}>{getTotalStock(productForm.sku)} {productForm.unidadMedida}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* PANEL DERECHO: FORMULARIO EXTENSO */}
        <div className="hr-table-card" style={{ padding: '24px' }}>
          <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>Datos Básicos y Clasificación</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">SKU (Código Único) *</label>
                  <input type="text" className="form-control" placeholder="Ej: FIL-ROB-004" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} disabled={editingProductId !== null} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nombre del Producto *</label>
                  <input type="text" className="form-control" placeholder="Ej: FILETE DE RÓBALO LIMPIO" value={productForm.nombre} onChange={e => setProductForm({ ...productForm, nombre: e.target.value })} />
                </div>
              </div>

              {/* SELECTORES DE CATEGORÍA ANIDADOS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tipo de Categoría *</label>
                  <select className="form-control" value={productForm.tipoCategoria} onChange={e => { const val = e.target.value; setProductForm((prev: any) => ({ ...prev, tipoCategoria: val, lineaCategoria: '', claseCategoria: '' })); setCustomTipo(''); setCustomLinea(''); setCustomClase(''); }}>
                    <option value="">-- Seleccione Tipo --</option>
                    {uniqueTipos.map((t: string) => <option key={t} value={t}>{t}</option>)}
                    <option value="NEW_TIPO" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>[+ Crear nuevo Tipo]</option>
                  </select>
                  {productForm.tipoCategoria === 'NEW_TIPO' && <input type="text" className="form-control" style={{ marginTop: '8px', borderColor: 'var(--primary-color)' }} placeholder="Escriba el nuevo Tipo..." value={customTipo} onChange={e => setCustomTipo(e.target.value)} />}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Línea de Categoría</label>
                  <select className="form-control" value={productForm.lineaCategoria} onChange={e => { const val = e.target.value; setProductForm((prev: any) => ({ ...prev, lineaCategoria: val, claseCategoria: '' })); setCustomLinea(''); setCustomClase(''); }} disabled={!productForm.tipoCategoria}>
                    <option value="">-- Seleccione Línea --</option>
                    {uniqueLineas.map((l: string) => <option key={l} value={l}>{l}</option>)}
                    <option value="NEW_LINEA" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>[+ Crear nueva Línea]</option>
                  </select>
                  {productForm.lineaCategoria === 'NEW_LINEA' && <input type="text" className="form-control" style={{ marginTop: '8px', borderColor: 'var(--primary-color)' }} placeholder="Escriba la nueva Línea..." value={customLinea} onChange={e => setCustomLinea(e.target.value)} />}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Clase de Categoría</label>
                  <select className="form-control" value={productForm.claseCategoria} onChange={e => { const val = e.target.value; setProductForm((prev: any) => ({ ...prev, claseCategoria: val })); setCustomClase(''); }} disabled={!productForm.lineaCategoria}>
                    <option value="">-- Seleccione Clase --</option>
                    {uniqueClases.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    <option value="NEW_CLASE" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>[+ Crear nueva Clase]</option>
                  </select>
                  {productForm.claseCategoria === 'NEW_CLASE' && <input type="text" className="form-control" style={{ marginTop: '8px', borderColor: 'var(--primary-color)' }} placeholder="Escriba la nueva Clase..." value={customClase} onChange={e => setCustomClase(e.target.value)} />}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Código de Barras</label>
                  <input type="text" className="form-control" placeholder="Ej: 770123456789" value={productForm.codigo_barras} onChange={e => setProductForm({ ...productForm, codigo_barras: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Unidad de Medida *</label>
                  <select className="form-control" value={productForm.unidadMedida} onChange={e => setProductForm({ ...productForm, unidadMedida: e.target.value as any })}>
                    <option value="KG">Kilos (kg)</option>
                    <option value="UNIDAD">Unidades (und)</option>
                    <option value="GRAMO">Gramos (gr)</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Imagen (URL)</label>
                  <input type="text" className="form-control" placeholder="https://ejemplo.com/foto.jpg" value={productForm.imagen} onChange={e => setProductForm({ ...productForm, imagen: e.target.value })} />
                </div>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>Política Comercial, Impuestos y Costos</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Costo Base ($ COP)</label>
                  <input type="number" className="form-control" value={productForm.precio_compra || ''} onChange={e => setProductForm({ ...productForm, precio_compra: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Buffer de Seguridad (%)</label>
                  <input type="number" className="form-control" value={productForm.buffer_seguridad} onChange={e => setProductForm({ ...productForm, buffer_seguridad: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">IVA (Tarifa)</label>
                  <select className="form-control" value={productForm.iva} onChange={e => setProductForm({ ...productForm, iva: parseInt(e.target.value) || 0 })}>
                    <option value="0">Exento (0%)</option>
                    <option value="5">Excluido/Bajo (5%)</option>
                    <option value="19">General (19%)</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">IVA Incluido</label>
                  <select className="form-control" value={productForm.ivaIncluido ? 'si' : 'no'} onChange={e => setProductForm({ ...productForm, ivaIncluido: e.target.value === 'si' })}>
                    <option value="si">Sí, IVA Incluido</option>
                    <option value="no">No, IVA Excluido</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>Parámetros del Sistema</h4>
              <div style={{ display: 'flex', gap: '32px', margin: '4px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                  <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }} checked={productForm.control_inventario} onChange={e => setProductForm({ ...productForm, control_inventario: e.target.checked })} />
                  Controlar Inventario (WMS / Kardex)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                  <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }} checked={productForm.produccion} onChange={e => setProductForm({ ...productForm, produccion: e.target.checked })} />
                  Es transformable en Planta (Producción)
                </label>
              </div>
            </div>

            {/* Previsualización de Precios Sugeridos */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Simulación de Precios de Venta Sugeridos (Márgenes estándar)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Precio POS (+40% + Buffer):</span>
                  <strong style={{ fontSize: '15px', color: '#0F172A' }}>
                    ${Math.round(productForm.precio_compra * (1 + (productForm.buffer_seguridad / 100) + 0.40)).toLocaleString('es-CO')}
                  </strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Precio Restaurante (+30% + Buffer):</span>
                  <strong style={{ fontSize: '15px', color: '#0F172A' }}>
                    ${Math.round(productForm.precio_compra * (1 + (productForm.buffer_seguridad / 100) + 0.30)).toLocaleString('es-CO')}
                  </strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Precio Mayorista (+15% + Buffer):</span>
                  <strong style={{ fontSize: '15px', color: '#0F172A' }}>
                    ${Math.round(productForm.precio_compra * (1 + (productForm.buffer_seguridad / 100) + 0.15)).toLocaleString('es-CO')}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ border: 'none', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                <Save size={18} />
                <span>{editingProductId ? 'Guardar Cambios' : 'Registrar Producto'}</span>
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="btn-secondary"
                style={{ flex: 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', borderRadius: '12px', fontWeight: 600, border: '1px solid #CBD5E1', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
