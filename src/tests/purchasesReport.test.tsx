import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PurchasesReport } from '../views/inventory/components/PurchasesReport';

const MOCK_PROVEEDORES = [
  { id: 'prov-1', nombre: 'Proveedor Pacífico', nit: '900111' },
  { id: 'prov-2', nombre: 'Proveedor Caribe', nit: '800222' }
];

const MOCK_PRODUCTS = [
  { sku: 'SKU-001', nombre: 'Filete de Merluza', categoria: 'Pescados', activo: true },
  { sku: 'SKU-002', nombre: 'Camarón Pelado', categoria: 'Mariscos', activo: true }
];

const MOCK_CATEGORIAS = [
  { id: 'cat-1', tipo: 'Producto', linea: 'Pescados', clase: 'Filetes' }
];

const todayStr = new Date().toISOString();

const MOCK_ORDENES = [
  {
    id: 'oc-1',
    proveedorId: 'prov-1',
    proveedorNombre: 'Proveedor Pacífico',
    fecha: todayStr,
    estado: 'RECIBIDA',
    items: [
      { sku: 'SKU-001', nombre: 'Filete de Merluza', cantidad: 50, precioUnitario: 10000, lote: 'L1' }
    ],
    totalCompra: 520000, // 500000 + 20000 flete
    subtotal: 500000,
    iva: 0,
    valorIva: 0,
    fletes: 20000,
    formaPago: 'CONTADO'
  },
  {
    id: 'oc-2',
    proveedorId: 'prov-2',
    proveedorNombre: 'Proveedor Caribe',
    fecha: todayStr,
    estado: 'RECIBIDA',
    items: [
      { sku: 'SKU-002', nombre: 'Camarón Pelado', cantidad: 20, precioUnitario: 25000, lote: 'L2' }
    ],
    totalCompra: 595000, // 500000 + 95000 iva
    subtotal: 500000,
    iva: 19,
    valorIva: 95000,
    fletes: 0,
    formaPago: 'CREDITO'
  },
  {
    id: 'oc-3',
    proveedorId: 'prov-1',
    proveedorNombre: 'Proveedor Pacífico',
    fecha: todayStr,
    estado: 'SOLICITADO', // Excluida del reporte por no estar RECIBIDA
    items: [
      { sku: 'SKU-001', nombre: 'Filete de Merluza', cantidad: 100, precioUnitario: 10000, lote: 'L3' }
    ],
    totalCompra: 1000000
  }
];

describe('PurchasesReport Component (RN-41)', () => {
  it('debería bloquear el acceso a roles no autorizados (vendedor)', () => {
    render(
      <PurchasesReport 
        ordenesCompra={MOCK_ORDENES}
        proveedores={MOCK_PROVEEDORES}
        productsCatalog={MOCK_PRODUCTS}
        categorias={MOCK_CATEGORIAS}
        userRole="vendedor"
      />
    );
    
    expect(screen.getByText('Acceso Restringido')).toBeInTheDocument();
    expect(screen.queryByText('Reporte de Compras por Proveedor')).not.toBeInTheDocument();
  });

  it('debería permitir acceso a roles autorizados (admin) y mostrar totales correctos', () => {
    render(
      <PurchasesReport 
        ordenesCompra={MOCK_ORDENES}
        proveedores={MOCK_PROVEEDORES}
        productsCatalog={MOCK_PRODUCTS}
        categorias={MOCK_CATEGORIAS}
        userRole="admin"
      />
    );
    
    expect(screen.getByText('Reporte de Compras por Proveedor')).toBeInTheDocument();
    
    // Total Kg recibidos (solo de ordenes RECIBIDA: 50kg + 20kg = 70kg)
    expect(screen.getAllByText('70 kg')[0]).toBeInTheDocument();
    
    // Total Ordenes recibidas (solo 2 de 3 ordenes estan RECIBIDAS)
    expect(screen.getAllByText('2 órdenes')[0]).toBeInTheDocument();
    
    // Total Inversión COP (520,000 + 595,000 = 1,115,000)
    expect(screen.getAllByText('$1.115.000')[0]).toBeInTheDocument();
  });

  it('debería filtrar compras por forma de pago (CREDITO)', () => {
    render(
      <PurchasesReport 
        ordenesCompra={MOCK_ORDENES}
        proveedores={MOCK_PROVEEDORES}
        productsCatalog={MOCK_PRODUCTS}
        categorias={MOCK_CATEGORIAS}
        userRole="admin"
      />
    );

    const selectPago = screen.getByLabelText('Forma de Pago');
    fireEvent.change(selectPago, { target: { value: 'CREDITO' } });

    // Con Crédito solo está oc-2 (20kg, 1 orden, $595.000)
    expect(screen.getAllByText('20 kg')[0]).toBeInTheDocument();
    expect(screen.getAllByText('1 órdenes')[0]).toBeInTheDocument();
    expect(screen.getAllByText('$595.000')[0]).toBeInTheDocument();
  });

  it('debería permitir exportar a CSV', () => {
    const createObjectURLMock = vi.fn(() => 'blob:url');
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = vi.fn();

    render(
      <PurchasesReport 
        ordenesCompra={MOCK_ORDENES}
        proveedores={MOCK_PROVEEDORES}
        productsCatalog={MOCK_PRODUCTS}
        categorias={MOCK_CATEGORIAS}
        userRole="admin"
      />
    );

    const btnExportar = screen.getByText('Exportar a CSV');
    expect(btnExportar).toBeInTheDocument();
    
    // Hacemos click en exportar
    fireEvent.click(btnExportar);
    
    expect(createObjectURLMock).toHaveBeenCalled();
  });
});
