import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BulkHardwareImportModal } from '../views/inventory/BulkHardwareImportModal';
import { useInventoryStore } from '../store/useInventoryStore';
import { useWarehouseStore } from '../store/useWarehouseStore';

describe('BulkHardwareImportModal - Vista de Carga Masiva (SPEC-032: TASK-032-04)', () => {
  beforeEach(() => {
    useInventoryStore.setState({
      products: [],
      productsCatalog: [],
      productPricings: [],
      stock: {},
    });
    useWarehouseStore.setState({
      bodegas: [
        { id: 'bodega-pos', nombre: 'Punto de Venta Mostrador (POS)', tipo: 'PUNTO_VENTA', activa: true, esPuntoVenta: true },
        { id: 'bodega-central', nombre: 'Bodega Central Ferretería', tipo: 'PRINCIPAL', activa: true, esPuntoVenta: false },
      ],
    });
  });

  it('1. Debe renderizar el modal con selector de bodega y opciones de archivo', () => {
    render(<BulkHardwareImportModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Carga Masiva de Ferretería & Catálogo/i)).toBeInTheDocument();
    expect(screen.getByText(/Insertar Plantilla Demo/i)).toBeInTheDocument();
    expect(screen.getByText(/Subir Archivo/i)).toBeInTheDocument();
  });

  it('2. Al hacer clic en Insertar Plantilla Demo, debe poblar el textarea y mostrar la vista previa', () => {
    render(<BulkHardwareImportModal isOpen={true} onClose={vi.fn()} />);

    const btnDemo = screen.getByText(/Insertar Plantilla Demo/i);
    fireEvent.click(btnDemo);

    // Debe mostrar la vista previa con filas válidas
    expect(screen.getByText(/Vista Previa de Validación/i)).toBeInTheDocument();
    expect(screen.getAllByText(/TORN-DRY-01/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Martillo de Uña 16oz Mango Fibra/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/5 Válidas/i)).toBeInTheDocument();
  });

  it('3. Al hacer clic en Importar Ítems, debe guardar los productos y disparar onSuccess', () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <BulkHardwareImportModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    // Cargar plantilla demo
    fireEvent.click(screen.getByText(/Insertar Plantilla Demo/i));

    // Clic en importar
    const btnImportar = screen.getByText(/Importar 5 Ítems al Catálogo/i);
    fireEvent.click(btnImportar);

    expect(handleSuccess).toHaveBeenCalledWith(5);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Verificar que los productos están en el store
    const storeState = useInventoryStore.getState();
    expect(storeState.products.length).toBe(5);
    expect(storeState.products.some((p) => p.sku === 'TORN-DRY-01')).toBe(true);
  });
});
