import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductDetailFinancialModal } from '../views/inventory/components/ProductDetailFinancialModal';
import { useInventoryStore } from '../store/useInventoryStore';
import { useAppStore } from '../store/useAppStore';

// Mock Zustand stores
vi.mock('../store/useInventoryStore', () => ({
  useInventoryStore: vi.fn()
}));

vi.mock('../store/useAppStore', () => ({
  useAppStore: vi.fn()
}));

// Mock SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn()
  }
}));

const mockProduct = {
  id: 'prod-1',
  sku: 'SALMON-01',
  nombre: 'Salmón Fresco',
  categoria: 'Pescados',
  unidadMedida: 'kg' as const,
  precio_compra: 25000,
  buffer_seguridad: 10,
  precio_venta_pos: 45000,
  precio_venta_restaurante: 40000,
  precio_venta_mayorista: 35000,
  activo: true,
  categoriaABC: 'A' as const
};

describe('ProductDetailFinancialModal', () => {
  let mockSetProductsCatalog: any;
  let mockSetProductPricings: any;

  beforeEach(() => {
    mockSetProductsCatalog = vi.fn();
    mockSetProductPricings = vi.fn();

    (useInventoryStore as any).mockReturnValue({
      productsCatalog: [mockProduct],
      productPricings: [],
      setProductsCatalog: mockSetProductsCatalog,
      setProductPricings: mockSetProductPricings,
      stock: { 'Bodega Central': { 'SALMON-01': 150 } }
    });

    (useAppStore as any).mockReturnValue({
      userRole: 'admin'
    });
  });

  it('renders modal with product information', () => {
    const handleClose = vi.fn();
    render(<ProductDetailFinancialModal product={mockProduct} onClose={handleClose} />);
    
    // Check header
    expect(screen.getByDisplayValue('Salmón Fresco')).toBeDefined();
    expect(screen.getByText('SALMON-01')).toBeDefined();
    
    // Check that all 5 tabs are present
    expect(screen.getByText('Resumen 360°')).toBeDefined();
    expect(screen.getByText('Datos Maestros')).toBeDefined();
    expect(screen.getByText('Asesor Financiero')).toBeDefined();
    expect(screen.getByText('Impuestos & NIIF')).toBeDefined();
    expect(screen.getByText('Promociones & Ofertas')).toBeDefined();
  });

  it('allows switching tabs and viewing financial simulator', () => {
    const handleClose = vi.fn();
    render(<ProductDetailFinancialModal product={mockProduct} onClose={handleClose} />);
    
    const financialTab = screen.getByText('Asesor Financiero');
    fireEvent.click(financialTab);

    // It should render "Canal POS", "Canal Restaurante", "Canal Mayorista"
    expect(screen.getByText('Canal POS')).toBeDefined();
    expect(screen.getByText('Canal Restaurante')).toBeDefined();
    expect(screen.getByText('Canal Mayorista')).toBeDefined();
  });

  it('calls atomic save functions when Guardar Cambios is clicked', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();
    
    render(<ProductDetailFinancialModal product={mockProduct} onClose={handleClose} onSave={handleSave} />);
    
    const saveButton = screen.getByText('Guardar Cambios');
    fireEvent.click(saveButton);

    // Assert atomic state updates were called
    expect(mockSetProductsCatalog).toHaveBeenCalled();
    expect(mockSetProductPricings).toHaveBeenCalled();
    expect(handleSave).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });
});
