import React, { useState, useMemo } from 'react';
import { Calendar, Filter, Download, ChevronDown, ChevronUp, Lock, FileText, BarChart2, PlusCircle } from 'lucide-react';

interface PurchasesReportProps {
  ordenesCompra: any[];
  proveedores: any[];
  productsCatalog: any[];
  categorias: any[];
  userRole: string;
  onOpenNuevaCompra?: () => void;
}

export function PurchasesReport({
  ordenesCompra = [],
  proveedores = [],
  productsCatalog = [],
  categorias: _categorias = [],
  userRole,
  onOpenNuevaCompra
}: PurchasesReportProps) {
  // 1. Verificación de Rol Administrativo (Solo 'admin' y 'administrativo' tienen acceso)
  const isAuthorized = userRole === 'admin' || userRole === 'administrativo';

  // 2. State de Filtros
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    // Default: Primer día del mes actual
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  const [selectedProveedorId, setSelectedProveedorId] = useState('TODOS');
  const [selectedSku, setSelectedSku] = useState('TODOS');
  const [selectedCategoriaId, setSelectedCategoriaId] = useState('TODOS');
  const [selectedFormaPago, setSelectedFormaPago] = useState('TODOS');
  const [sortBy, setSortBy] = useState<'totalKg' | 'totalPesos' | 'cantidadOrdenes'>('totalKg');
  
  // Expandir detalles de proveedor
  const [expandedProveedores, setExpandedProveedores] = useState<Record<string, boolean>>({});

  const toggleExpand = (proveedorId: string) => {
    setExpandedProveedores(prev => ({
      ...prev,
      [proveedorId]: !prev[proveedorId]
    }));
  };

  // 3. Filtrar y Procesar Órdenes
  const reportData = useMemo(() => {
    // Filtrar órdenes
    const filteredOCs = ordenesCompra.filter(oc => {
      // 1. Estado debe ser 'RECIBIDA'
      if (oc.estado !== 'RECIBIDA') return false;

      // 2. Filtro de Fecha (normalizada a día para comparación limpia)
      if (oc.fecha) {
        const ocDateStr = oc.fecha.split('T')[0];
        if (ocDateStr < fechaInicio || ocDateStr > fechaFin) return false;
      }

      // 3. Filtro Proveedor
      if (selectedProveedorId !== 'TODOS' && oc.proveedorId !== selectedProveedorId) return false;

      // 4. Filtro Forma Pago
      if (selectedFormaPago !== 'TODOS') {
        const fp = oc.formaPago || 'CONTADO';
        if (fp !== selectedFormaPago) return false;
      }

      return true;
    });

    // Agrupar por proveedor
    const supplierGroup: Record<string, {
      proveedorId: string;
      proveedorNombre: string;
      totalKg: number;
      totalPesos: number;
      totalSubtotal: number;
      totalIva: number;
      totalFletes: number;
      cantidadOrdenes: number;
      ocIds: Set<string>;
      items: Record<string, {
        sku: string;
        nombre: string;
        categoria: string;
        cantidad: number;
        precioUnitario: number;
        totalPesos: number;
        cantidadOrdenes: number;
      }>;
    }> = {};

    filteredOCs.forEach(oc => {
      const pId = oc.proveedorId || 'SIN_PROVEEDOR';
      const pNombre = oc.proveedorNombre || 'Proveedor No Especificado';

      if (!supplierGroup[pId]) {
        supplierGroup[pId] = {
          proveedorId: pId,
          proveedorNombre: pNombre,
          totalKg: 0,
          totalPesos: 0,
          totalSubtotal: 0,
          totalIva: 0,
          totalFletes: 0,
          cantidadOrdenes: 0,
          ocIds: new Set(),
          items: {}
        };
      }

      const group = supplierGroup[pId];
      group.ocIds.add(oc.id);
      group.totalPesos += (oc.totalCompra || 0);
      group.totalSubtotal += (oc.subtotal || 0);
      group.totalIva += (oc.valorIva || 0);
      group.totalFletes += (oc.fletes || 0);

      // Procesar items de la orden
      if (Array.isArray(oc.items)) {
        oc.items.forEach((item: any) => {
          const itemSku = item.sku || 'DESCONOCIDO';
          const itemNombre = item.nombre || itemSku;
          
          // Buscar producto en catálogo para categoría
          const prodCatalog = productsCatalog.find(p => p.sku === itemSku);
          const itemCat = prodCatalog?.categoria || 'General';

          // Aplicar filtros de SKU y Categoría
          if (selectedSku !== 'TODOS' && itemSku !== selectedSku) return;
          if (selectedCategoriaId !== 'TODOS' && itemCat !== selectedCategoriaId) return;

          const cant = Number(item.cantidad) || 0;
          const precio = Number(item.precioUnitario) || 0;
          const subtotalItem = cant * precio;

          group.totalKg += cant;

          if (!group.items[itemSku]) {
            group.items[itemSku] = {
              sku: itemSku,
              nombre: itemNombre,
              categoria: itemCat,
              cantidad: 0,
              precioUnitario: precio,
              totalPesos: 0,
              cantidadOrdenes: 0
            };
          }

          group.items[itemSku].cantidad += cant;
          group.items[itemSku].totalPesos += subtotalItem;
          group.items[itemSku].cantidadOrdenes += 1;
        });
      }
    });

    // Convertir a arreglo y mapear itemsList
    const result = Object.values(supplierGroup).map(grp => {
      const itemsList = Object.values(grp.items);
      return {
        ...grp,
        cantidadOrdenes: grp.ocIds.size,
        itemsList
      };
    }).filter(grp => grp.itemsList.length > 0); // Solo proveedores con items que pasaron el filtro

    // Ordenar según opción seleccionada
    result.sort((a, b) => {
      if (sortBy === 'totalKg') return b.totalKg - a.totalKg;
      if (sortBy === 'totalPesos') return b.totalPesos - a.totalPesos;
      if (sortBy === 'cantidadOrdenes') return b.cantidadOrdenes - a.cantidadOrdenes;
      return 0;
    });

    return result;
  }, [ordenesCompra, fechaInicio, fechaFin, selectedProveedorId, selectedSku, selectedCategoriaId, selectedFormaPago, productsCatalog, sortBy]);

  // 4. Totales Consolidados Globales
  const totals = useMemo(() => {
    let globalKg = 0;
    let globalPesos = 0;
    let globalSubtotal = 0;
    let globalIva = 0;
    let globalFletes = 0;
    let totalOrdenes = 0;

    reportData.forEach(prov => {
      globalKg += prov.totalKg;
      globalPesos += prov.totalPesos;
      globalSubtotal += prov.totalSubtotal;
      globalIva += prov.totalIva;
      globalFletes += prov.totalFletes;
      totalOrdenes += prov.cantidadOrdenes;
    });

    return {
      globalKg,
      globalPesos,
      globalSubtotal,
      globalIva,
      globalFletes,
      totalKg: globalKg,
      totalPesos: globalPesos,
      totalSubtotal: globalSubtotal,
      totalIva: globalIva,
      totalFletes: globalFletes,
      cantidadOrdenes: totalOrdenes,
      totalProveedores: reportData.length
    };
  }, [reportData]);

  // 5. Categorías únicas y productos únicos para filtros
  const filterOptions = useMemo(() => {
    const cats = Array.from(new Set(productsCatalog.map(p => p.categoria).filter(Boolean)));
    const skus = productsCatalog.filter(p => p.activo).map(p => ({ sku: p.sku, nombre: p.nombre }));
    return { cats, skus };
  }, [productsCatalog]);

  // 6. Exportar a CSV nativo
  const handleExportCSV = () => {
    if (reportData.length === 0) {
      alert('No hay datos disponibles para exportar en este período.');
      return;
    }

    const csvRows = [];
    // Encabezados
    csvRows.push(['Proveedor', 'Producto', 'SKU', 'Categoria', 'Cantidad (kg/un)', 'Valor COP', '# Ordenes', 'Periodo'].join(';'));

    reportData.forEach(prov => {
      prov.itemsList.forEach(item => {
        const row = [
          `"${prov.proveedorNombre.replace(/"/g, '""')}"`,
          `"${item.nombre.replace(/"/g, '""')}"`,
          `"${item.sku}"`,
          `"${item.categoria}"`,
          item.cantidad,
          Math.round(item.totalPesos),
          item.cantidadOrdenes || 1,
          `"${fechaInicio} a ${fechaFin}"`
        ];
        csvRows.push(row.join(';'));
      });
    });

    const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM para Excel UTF-8
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_compras_proveedor_${fechaInicio}_a_${fechaFin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pantalla de bloqueo si no tiene autorización
  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #E2E8F0', marginTop: '20px' }}>
        <div style={{ padding: '20px', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#EF4444', marginBottom: '16px' }}>
          <Lock size={48} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Acceso Restringido</h3>
        <p style={{ maxWidth: '450px', fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
          Este reporte contiene información contable confidencial (costos de compra, créditos a proveedores, fletes e impuestos). Comuníquese con el administrador del sistema para obtener los permisos correspondientes.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '12px' }}>
      {/* Cabecera y Título */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Módulo de Auditoría Financiera</span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>Reporte de Compras por Proveedor</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onOpenNuevaCompra && (
            <button
              onClick={onOpenNuevaCompra}
              className="hr-btn-new"
              style={{ backgroundColor: '#00B171', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <PlusCircle size={16} />
              <span>+ Registrar Nueva Compra</span>
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="hr-btn-new"
            style={{ backgroundColor: '#0F172A', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Download size={16} />
            <span>Exportar a CSV</span>
          </button>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="hr-table-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
          <Filter size={18} color="var(--primary-color)" />
          <span style={{ fontWeight: 700, fontSize: '15px' }}>Filtros de Búsqueda</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Rango de Fechas */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="fecha-inicio-input" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} /> Fecha Inicio
            </label>
            <input
              id="fecha-inicio-input"
              type="date"
              className="form-control"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="fecha-fin-input" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} /> Fecha Fin
            </label>
            <input
              id="fecha-fin-input"
              type="date"
              className="form-control"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
            />
          </div>

          {/* Proveedor */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="proveedor-select" className="form-label">Proveedor</label>
            <select
              id="proveedor-select"
              className="form-control"
              value={selectedProveedorId}
              onChange={e => setSelectedProveedorId(e.target.value)}
            >
              <option value="TODOS">-- Todos los Proveedores --</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Forma Pago */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="forma-pago-select" className="form-label">Forma de Pago</label>
            <select
              id="forma-pago-select"
              className="form-control"
              value={selectedFormaPago}
              onChange={e => setSelectedFormaPago(e.target.value)}
            >
              <option value="TODOS">-- Todas las Formas --</option>
              <option value="CONTADO">Contado</option>
              <option value="CREDITO">Crédito</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Categoria */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="categoria-select" className="form-label">Categoría</label>
            <select
              id="categoria-select"
              className="form-control"
              value={selectedCategoriaId}
              onChange={e => setSelectedCategoriaId(e.target.value)}
            >
              <option value="TODOS">-- Todas las Categorías --</option>
              {filterOptions.cats.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Producto */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="producto-select" className="form-label">Producto Específico</label>
            <select
              id="producto-select"
              className="form-control"
              value={selectedSku}
              onChange={e => setSelectedSku(e.target.value)}
            >
              <option value="TODOS">-- Todos los Productos --</option>
              {filterOptions.skus.map(p => (
                <option key={p.sku} value={p.sku}>{p.nombre} ({p.sku})</option>
              ))}
            </select>
          </div>

          {/* Ordenamiento */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Ordenar Reporte por</label>
            <select
              className="form-control"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
            >
              <option value="totalKg">Volumen Comprado (Kg)</option>
              <option value="totalPesos">Valor Invertido ($ COP)</option>
              <option value="cantidadOrdenes">Cantidad de Órdenes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumen KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="hr-table-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#059669' }}>
            <BarChart2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Volumen Total Comprado</span>
            <h4 style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>
              {totals.totalKg.toLocaleString()} kg
            </h4>
          </div>
        </div>

        <div className="hr-table-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#EEF2F6', color: '#334155' }}>
            <FileText size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Órdenes de Compra Recibidas</span>
            <h4 style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>
              {totals.cantidadOrdenes} órdenes
            </h4>
          </div>
        </div>

        <div className="hr-table-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
            <span style={{ fontSize: '20px', fontWeight: 900 }}>$</span>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Inversión Total COP (Con Fletes e IVA)</span>
            <h4 style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px', color: '#1E3A8A' }}>
              ${totals.totalPesos.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      {/* Detalle Financiero de Impuestos y Fletes */}
      <div className="hr-table-card" style={{ padding: '16px 20px', backgroundColor: '#F8FAFC', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', borderLeft: '4px solid #2563EB' }}>
        <div>
          <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Subtotal Neto</span>
          <p style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>${totals.totalSubtotal.toLocaleString()}</p>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Total IVA Pagado</span>
          <p style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px', color: '#475569' }}>${totals.totalIva.toLocaleString()}</p>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Total Fletes y Adicionales</span>
          <p style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px', color: '#D97706' }}>${totals.totalFletes.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="hr-table-card" style={{ padding: '0px', overflow: 'hidden' }}>
        <table className="hr-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Proveedor</th>
              <th style={{ textAlign: 'right' }}>Órdenes</th>
              <th style={{ textAlign: 'right' }}>Cantidad Comprada</th>
              <th style={{ textAlign: 'right' }}>Costo Fletes</th>
              <th style={{ textAlign: 'right' }}>IVA Acumulado</th>
              <th style={{ textAlign: 'right' }}>Total Inversión ($ COP)</th>
            </tr>
          </thead>
          <tbody>
            {reportData.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                  No se encontraron compras en el rango seleccionado que coincidan con los criterios de búsqueda.
                </td>
              </tr>
            ) : (
              reportData.map(prov => {
                const isExpanded = !!expandedProveedores[prov.proveedorId];
                return (
                  <React.Fragment key={prov.proveedorId}>
                    {/* Fila Principal del Proveedor */}
                    <tr 
                      onClick={() => toggleExpand(prov.proveedorId)} 
                      style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#F8FAFC' : 'transparent', fontWeight: 600 }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>{prov.proveedorNombre}</td>
                      <td style={{ textAlign: 'right' }}>{prov.cantidadOrdenes}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{prov.totalKg.toLocaleString()} kg</td>
                      <td style={{ textAlign: 'right', color: '#D97706' }}>${prov.totalFletes.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: '#475569' }}>${prov.totalIva.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary-color)' }}>
                        ${prov.totalPesos.toLocaleString()}
                      </td>
                    </tr>

                    {/* Fila del Desglose de Productos */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ padding: '0px 0px 16px 40px', backgroundColor: '#F8FAFC' }}>
                          <div style={{ padding: '16px', backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px', margin: '4px 16px 12px 16px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                              Desglose por Referencia (SKU)
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #F1F5F9', color: '#64748B', fontWeight: 600 }}>
                                  <th style={{ textAlign: 'left', padding: '6px' }}>SKU</th>
                                  <th style={{ textAlign: 'left', padding: '6px' }}>Producto</th>
                                  <th style={{ textAlign: 'left', padding: '6px' }}>Categoría</th>
                                  <th style={{ textAlign: 'right', padding: '6px' }}>Cantidad</th>
                                  <th style={{ textAlign: 'right', padding: '6px' }}>Costo Promedio Unitario</th>
                                  <th style={{ textAlign: 'right', padding: '6px' }}>Total COP</th>
                                </tr>
                              </thead>
                              <tbody>
                                {prov.itemsList.map(item => (
                                  <tr key={item.sku} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#3B82F6', padding: '8px 6px' }}>{item.sku}</td>
                                    <td style={{ fontWeight: 600, padding: '8px 6px' }}>{item.nombre}</td>
                                    <td style={{ color: '#64748B', padding: '8px 6px' }}>{item.categoria}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, padding: '8px 6px' }}>{item.cantidad.toLocaleString()} kg</td>
                                    <td style={{ textAlign: 'right', padding: '8px 6px' }}>
                                      ${Math.round(item.totalPesos / item.cantidad).toLocaleString()}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, padding: '8px 6px', color: '#1E293B' }}>
                                      ${Math.round(item.totalPesos).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
