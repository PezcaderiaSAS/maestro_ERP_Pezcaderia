import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnterpriseSidebar } from '../components/layout/EnterpriseSidebar';

describe('TASK-035-06: EnterpriseSidebar RBAC Navigation Filtering Suite', () => {
  const defaultProps = {
    currentView: 'pos' as any,
    onSelectView: vi.fn(),
    isOpen: true,
    onToggleOpen: vi.fn(),
    onChangeRole: vi.fn(),
  };

  it('1. El rol "admin" debe visualizar todos los módulos incluyendo SuperAdmin', () => {
    render(<EnterpriseSidebar {...defaultProps} userRole="admin" />);

    // Verificar presencia de módulos clave de todos los departamentos
    expect(screen.getByTestId('nav-pos')).toBeInTheDocument();
    expect(screen.getByTestId('nav-inventario')).toBeInTheDocument();
    expect(screen.getByTestId('nav-caja')).toBeInTheDocument();
    expect(screen.getByTestId('nav-contabilidad')).toBeInTheDocument();
    expect(screen.getByTestId('nav-rrhh')).toBeInTheDocument();
    expect(screen.getByTestId('nav-superadmin')).toBeInTheDocument();
  });

  it('2. El rol "vendedor" solo debe visualizar módulos comerciales y no WMS, Caja ni Contabilidad', () => {
    render(<EnterpriseSidebar {...defaultProps} userRole="vendedor" />);

    // Módulos visibles para vendedor
    expect(screen.getByTestId('nav-pos')).toBeInTheDocument();
    expect(screen.getByTestId('nav-ventas-b2b')).toBeInTheDocument();
    expect(screen.getByTestId('nav-precios')).toBeInTheDocument();
    expect(screen.getByTestId('nav-clientes')).toBeInTheDocument();

    // Módulos que deben estar estrictamente ocultos para vendedor
    expect(screen.queryByTestId('nav-inventario')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-caja')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-contabilidad')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-rrhh')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-superadmin')).not.toBeInTheDocument();
  });

  it('3. El rol "cajero" solo debe visualizar POS, Control de Cajas y Cartera', () => {
    render(<EnterpriseSidebar {...defaultProps} userRole="cajero" />);

    // Módulos visibles para cajero
    expect(screen.getByTestId('nav-pos')).toBeInTheDocument();
    expect(screen.getByTestId('nav-caja')).toBeInTheDocument();
    expect(screen.getByTestId('nav-cartera')).toBeInTheDocument();

    // Módulos que deben estar estrictamente ocultos para cajero
    expect(screen.queryByTestId('nav-inventario')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-despiece')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-contabilidad')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-rrhh')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-superadmin')).not.toBeInTheDocument();
  });

  it('4. El rol "bodeguero" (o "bodega") solo debe visualizar operaciones WMS, Muelle y Despachos', () => {
    render(<EnterpriseSidebar {...defaultProps} userRole="bodega" />);

    // Módulos visibles para bodega
    expect(screen.getByTestId('nav-inventario')).toBeInTheDocument();
    expect(screen.getByTestId('nav-compras-muelle')).toBeInTheDocument();
    expect(screen.getByTestId('nav-despiece')).toBeInTheDocument();
    expect(screen.getByTestId('nav-alistamiento')).toBeInTheDocument();
    expect(screen.getByTestId('nav-despachos')).toBeInTheDocument();

    // Módulos que deben estar estrictamente ocultos para bodega
    expect(screen.queryByTestId('nav-pos')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-caja')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-contabilidad')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-rrhh')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-superadmin')).not.toBeInTheDocument();
  });

  it('5. El rol "supervisor" visualiza POS, WMS, Despachos, Cajas y Métricas OTIF', () => {
    render(<EnterpriseSidebar {...defaultProps} userRole="supervisor" />);

    expect(screen.getByTestId('nav-pos')).toBeInTheDocument();
    expect(screen.getByTestId('nav-inventario')).toBeInTheDocument();
    expect(screen.getByTestId('nav-despachos')).toBeInTheDocument();
    expect(screen.getByTestId('nav-caja')).toBeInTheDocument();
    expect(screen.getByTestId('nav-metricas-otif')).toBeInTheDocument();

    // SuperAdmin y Contabilidad profunda no son visibles
    expect(screen.queryByTestId('nav-superadmin')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-contabilidad')).not.toBeInTheDocument();
  });
});
