import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnterpriseDataTable, type EnterpriseColumn } from '../components/ui/EnterpriseDataTable';

interface MockItem {
  id: string;
  sku: string;
  nombre: string;
  stock: number;
  precio: number;
}

const mockData: MockItem[] = [
  { id: '1', sku: 'SAL-001', nombre: 'Salmón Premium', stock: 50, precio: 35000 },
  { id: '2', sku: 'TRU-002', nombre: 'Trucha Arcoíris', stock: 12, precio: 22000 },
  { id: '3', sku: 'CAM-003', nombre: 'Camarón Tigre', stock: 80, precio: 45000 },
  { id: '4', sku: 'ROB-004', nombre: 'Filete de Róbalo', stock: 5, precio: 38000 },
];

const mockColumns: EnterpriseColumn<MockItem>[] = [
  { key: 'sku', header: 'SKU', sortable: true },
  { key: 'nombre', header: 'Producto', sortable: true },
  { key: 'stock', header: 'Stock (kg)', sortable: true, align: 'right' },
  {
    key: 'precio',
    header: 'Precio',
    sortable: true,
    align: 'right',
    render: (r) => `$${r.precio.toLocaleString('es-CO')}`
  },
];

describe('EnterpriseDataTable Component Suite (AntD / Shadcn Style)', () => {
  it('debe renderizar las cabeceras, filas iniciales y paginador correctamente', () => {
    render(
      <EnterpriseDataTable
        columns={mockColumns}
        data={mockData}
        rowKey={(r) => r.id}
        initialPageSize={10}
      />
    );

    // Cabeceras presentes
    expect(screen.getByText('SKU')).toBeInTheDocument();
    expect(screen.getByText('Producto')).toBeInTheDocument();
    expect(screen.getByText('Stock (kg)')).toBeInTheDocument();
    expect(screen.getByText('Precio')).toBeInTheDocument();

    // Filas renderizadas
    expect(screen.getByText('Salmón Premium')).toBeInTheDocument();
    expect(screen.getByText('Trucha Arcoíris')).toBeInTheDocument();

    // Paginador
    expect(screen.getByText(/Mostrando 1 a 4 de 4/i)).toBeInTheDocument();
  });

  it('debe filtrar en vivo las filas al ingresar texto en el buscador', () => {
    render(
      <EnterpriseDataTable
        columns={mockColumns}
        data={mockData}
        rowKey={(r) => r.id}
        searchPlaceholder="Buscar productos..."
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar productos...');
    fireEvent.change(searchInput, { target: { value: 'Trucha' } });

    // Solo debe verse Trucha Arcoíris
    expect(screen.getByText('Trucha Arcoíris')).toBeInTheDocument();
    expect(screen.queryByText('Salmón Premium')).not.toBeInTheDocument();
    expect(screen.queryByText('Camarón Tigre')).not.toBeInTheDocument();
  });

  it('debe ordenar ascendentemente y descendentemente al hacer clic en la cabecera', () => {
    const { container } = render(
      <EnterpriseDataTable
        columns={mockColumns}
        data={mockData}
        rowKey={(r) => r.id}
      />
    );

    const headerStock = screen.getByText('Stock (kg)');
    // Primer clic: sort asc (menor stock: 5 ROB-004)
    fireEvent.click(headerStock);
    const rowsAsc = container.querySelectorAll('tbody tr');
    expect(rowsAsc[0]).toHaveTextContent('Filete de Róbalo');

    // Segundo clic: sort desc (mayor stock: 80 CAM-003)
    fireEvent.click(headerStock);
    const rowsDesc = container.querySelectorAll('tbody tr');
    expect(rowsDesc[0]).toHaveTextContent('Camarón Tigre');
  });

  it('debe paginar los registros cuando el tamaño de página es menor a los datos', () => {
    render(
      <EnterpriseDataTable
        columns={mockColumns}
        data={mockData}
        rowKey={(r) => r.id}
        initialPageSize={2}
      />
    );

    expect(screen.getByText(/Mostrando 1 a 2 de 4/i)).toBeInTheDocument();
    expect(screen.getByText('Salmón Premium')).toBeInTheDocument();
    expect(screen.queryByText('Camarón Tigre')).not.toBeInTheDocument();

    // Click página siguiente
    const nextBtn = screen.getByTitle('Página siguiente');
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Mostrando 3 a 4 de 4/i)).toBeInTheDocument();
    expect(screen.getByText('Camarón Tigre')).toBeInTheDocument();
  });
});

import { GlobalOmniboxModal } from '../components/layout/GlobalOmniboxModal';

describe('GlobalOmniboxModal Component Suite', () => {
  it('no debe renderizar nada cuando isOpen es false', () => {
    const { container } = render(
      <GlobalOmniboxModal isOpen={false} onClose={() => {}} onNavigate={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('debe renderizar la lista de acciones de navegación y buscador al estar abierto', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();

    render(
      <GlobalOmniboxModal isOpen={true} onClose={onClose} onNavigate={onNavigate} />
    );

    // Acciones de navegación esperadas
    expect(screen.getByText('Punto de Venta (POS)')).toBeInTheDocument();
    expect(screen.getByText('Compras de Muelle & Pescadores')).toBeInTheDocument();
    expect(screen.getByText('Producción & Rendimiento de Fileteo')).toBeInTheDocument();
    expect(screen.getByText('Bodegas & WMS')).toBeInTheDocument();

    // Click en una acción
    const posOption = screen.getByText('Punto de Venta (POS)');
    fireEvent.click(posOption);

    expect(onNavigate).toHaveBeenCalledWith('pos');
    expect(onClose).toHaveBeenCalled();
  });

  it('debe filtrar acciones según el texto ingresado en el buscador del Omnibox', () => {
    render(
      <GlobalOmniboxModal isOpen={true} onClose={() => {}} onNavigate={() => {}} />
    );

    const input = screen.getByPlaceholderText(/buscar módulo, producto/i);
    fireEvent.change(input, { target: { value: 'Muelle' } });

    expect(screen.getByText('Compras de Muelle & Pescadores')).toBeInTheDocument();
    expect(screen.queryByText('Alquiler Cuarto Frío (3PL)')).not.toBeInTheDocument();
  });

  it('debe permitir buscar y navegar a Gestión de Bodegas desde el Omnibox', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();

    render(
      <GlobalOmniboxModal isOpen={true} onClose={onClose} onNavigate={onNavigate} />
    );

    const input = screen.getByPlaceholderText(/buscar módulo, producto/i);
    fireEvent.change(input, { target: { value: 'bodega' } });

    expect(screen.getByText('Bodegas & WMS')).toBeInTheDocument();
    expect(screen.getByText('Gestión y Creación de Bodegas (Cuartos Fríos)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Gestión y Creación de Bodegas (Cuartos Fríos)'));
    expect(onNavigate).toHaveBeenCalledWith('configuracion_bodegas');
    expect(onClose).toHaveBeenCalled();
  });
});

import { EnterpriseSidebar } from '../components/layout/EnterpriseSidebar';

describe('EnterpriseSidebar Bodegas & WMS Navigation Suite', () => {
  it('debe mostrar visiblemente los accesos a "Bodegas & WMS" y "Gestión de Bodegas"', () => {
    const onSelectView = vi.fn();

    render(
      <EnterpriseSidebar
        currentView="pos"
        onSelectView={onSelectView}
        isOpen={true}
        onToggleOpen={() => {}}
        userRole="admin"
        onChangeRole={() => {}}
      />
    );

    // Los botones de Bodegas & WMS deben ser visibles en el DOM
    const btnBodegasWMS = screen.getByTestId('nav-inventario');
    expect(btnBodegasWMS).toBeInTheDocument();
    expect(screen.getByText('Bodegas & WMS')).toBeInTheDocument();

    const btnConfigBodegas = screen.getByTestId('nav-config-bodegas');
    expect(btnConfigBodegas).toBeInTheDocument();
    expect(screen.getByText('Gestión de Bodegas')).toBeInTheDocument();

    // Al hacer click, deben llamar onSelectView
    fireEvent.click(btnBodegasWMS);
    expect(onSelectView).toHaveBeenCalledWith('inventario');

    fireEvent.click(btnConfigBodegas);
    expect(onSelectView).toHaveBeenCalledWith('configuracion_bodegas');
  });
});
