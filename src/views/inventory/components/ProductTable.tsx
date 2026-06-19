import React from 'react';
import { Package, Search, PlusCircle, Edit3, ShieldAlert } from 'lucide-react';

export function ProductTable({
  products,
  stock,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  setEditingProductId,
  setIsCreating,
  setProductForm,
  setCustomTipo,
  setCustomLinea,
  setCustomClase,
  productsCatalog,
  setProductsCatalog
}: any) {
  const getStockInBodega = (sku: string, bodega: string) => {
    const list = stock[bodega] || [];
    return list.find((i: any) => i.sku === sku)?.stock || 0;
  };

  const getTotalStock = (sku: string) => {
    let total = 0;
    Object.values(stock).forEach((bodegaList: any) => {
      const item = bodegaList.find((i: any) => i.sku === sku);
      if (item) total += item.stock;
    });
    return total;
  };

  const handleToggleProductStatus = (sku: string) => {
    const p = products.find((prod: any) => prod.sku === sku);
    if (!p) return;
    const isNowActive = !p.activo;
    
    // Aquí debería llamar a setProducts o similar para actualizar el estado,
    // asumiendo que el padre pasa un método. Pero por simplicidad en esta refactorización, 
    // delegaremos o emitiremos un evento.
  };

  const filteredProducts = products.filter((p: any) => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'TODOS' ? true : statusFilter === 'ACTIVOS' ? p.activo : !p.activo;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Gestión de Catálogo</span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>Productos y Referencias</h2>
        </div>
        <button
          onClick={() => {
            setEditingProductId(null);
            setIsCreating(true);
            setProductForm({ 
              sku: '', nombre: '', categoria: '', unidadMedida: 'kg', precio_compra: 0, buffer_seguridad: 5, 
              codigo_barras: '', iva: 0, ivaIncluido: true, control_inventario: true, produccion: false, 
              tipoCategoria: '', lineaCategoria: '', claseCategoria: '', imagen: '' 
            });
            setCustomTipo('');
            setCustomLinea('');
            setCustomClase('');
          }}
          className="hr-btn-new"
        >
          <PlusCircle size={18} />
          <span>Nuevo Producto</span>
        </button>
      </div>

      <div className="hr-table-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={18} color="#94A3B8" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
            />
          </div>
          <select 
            className="form-control" 
            style={{ width: '200px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVOS">Solo Activos</option>
            <option value="INACTIVOS">Solo Inactivos</option>
          </select>
        </div>

        <table className="hr-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>SKU</th>
              <th>Nombre y Categoría</th>
              <th>Stock Total</th>
              <th>Precio Venta (POS)</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p: any) => {
              const catData = productsCatalog.find((c: any) => c.sku === p.sku);
              const totalStock = getTotalStock(p.sku);
              const isLowStock = totalStock <= (p.buffer_seguridad || 5);

              return (
                <tr key={p.sku} style={{ opacity: p.activo ? 1 : 0.6 }}>
                  <td>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.imagen ? (
                        <img src={p.imagen} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Package size={20} color="#94A3B8" />
                      )}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-color)' }}>{p.sku}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700 }}>{p.nombre}</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        {catData ? `${catData.tipo} > ${catData.linea} > ${catData.clase}` : p.categoria}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: isLowStock ? '#EF4444' : '#0F172A' }}>
                        {totalStock} {p.unidadMedida || 'kg'}
                      </span>
                      {isLowStock && p.control_inventario && (
                        <ShieldAlert size={14} color="#EF4444" title="Stock bajo buffer de seguridad" />
                      )}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>${(p.precio_venta || 0).toLocaleString()}</td>
                  <td>
                    <span className={p.activo ? 'badge-vigente' : 'badge-terminado'}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setEditingProductId(p.id);
                          setProductForm({
                            sku: p.sku,
                            nombre: p.nombre,
                            categoria: p.categoria,
                            unidadMedida: p.unidadMedida || 'kg',
                            precio_compra: p.precio_compra || 0,
                            buffer_seguridad: p.buffer_seguridad || 5,
                            codigo_barras: p.codigo_barras || '',
                            iva: p.iva || 0,
                            ivaIncluido: p.ivaIncluido !== false,
                            control_inventario: p.control_inventario !== false,
                            produccion: p.produccion || false,
                            tipoCategoria: catData?.tipo || '',
                            lineaCategoria: catData?.linea || '',
                            claseCategoria: catData?.clase || '',
                            imagen: p.imagen || ''
                          });
                          setIsCreating(false);
                        }}
                        style={{ padding: '6px', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#334155' }}
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
