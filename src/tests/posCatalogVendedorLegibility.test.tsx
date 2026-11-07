import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { ProductSearchPanel } from '../views/pos/components/ProductSearchPanel';

const mockProducts: any[] = [
  {
    id: 'prod-001',
    sku: 'SAL-NOR-01',
    nombre: 'Salmón Noruego Fresco Importado Especial',
    categoria: 'Pescados',
    unidadMedida: 'KG',
    precioVenta: 48000,
    buffer_seguridad: 5,
    activo: true,
  },
  {
    id: 'prod-002',
    sku: 'CAM-TIG-01',
    nombre: 'Camarón Tigre Congelado 16/20',
    categoria: 'Crustáceos',
    unidadMedida: 'KG',
    precioVenta: 62000,
    buffer_seguridad: 3,
    activo: true,
  },
  {
    id: 'prod-003',
    sku: 'EMP-CAJ-01',
    nombre: 'Caja Térmica de Icopor Mediana',
    categoria: 'Empaques',
    unidadMedida: 'UND',
    precioVenta: 12000,
    buffer_seguridad: 10,
    activo: true,
  },
];

const mockGetProductPrice = (p: any) => p.precioVenta;
const mockGetProductStock = (_sku: string, bodega: string) => {
  return bodega === 'Bodega Principal' ? 15 : 5;
};

describe('SPEC-055: Legibilidad, Contraste y Ergonomía del Catálogo de Productos POS (Pantalla Vendedor)', () => {
  it('1. src/index.css no debe contener la regla destructiva .product-card-name con color: #0f172a !important', () => {
    const cssPath = path.resolve(__dirname, '../index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    // Debe eliminarse el blackout destructivo
    expect(cssContent).not.toMatch(/\.product-card-name\s*\{[^}]*color:\s*#0f172a\s*!important/);
  });

  it('2. src/index.css no debe contener background-color: #F1F5F9 en .product-image-container', () => {
    const cssPath = path.resolve(__dirname, '../index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    // Debe eliminarse la caja blanca deslumbrante
    expect(cssContent).not.toMatch(/\.product-image-container\s*\{[^}]*background-color:\s*#F1F5F9/i);
  });

  it('3. src/index.css no debe camuflar el tag de precio con background-color: #0f172a !important', () => {
    const cssPath = path.resolve(__dirname, '../index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    expect(cssContent).not.toMatch(/\.product-card-price-tag\s*\{[^}]*background-color:\s*#0f172a\s*!important/);
  });

  it('4. ProductSearchPanel debe renderizar nombres de productos con line-clamp-1 y alto contraste en texto blanco', () => {
    const { container } = render(
      <ProductSearchPanel
        activeProducts={mockProducts}
        dynamicFields={[]}
        cliente={null}
        getProductPrice={mockGetProductPrice}
        getProductStock={mockGetProductStock}
        onAddProduct={() => {}}
      />
    );

    const nameElements = container.querySelectorAll('.product-card-name');
    expect(nameElements.length).toBe(3);

    nameElements.forEach((el) => {
      // Debe aplicar line-clamp-1 según decisión explícita de usuario
      expect(el.className).toContain('line-clamp-1');
      // Debe aplicar color blanco de alto contraste
      expect(el.className).toMatch(/text-white|text-slate-100/);
    });
  });

  it('5. ProductSearchPanel debe renderizar precios con tono esmeralda/blanco de alta jerarquía y badges de unidad', () => {
    render(
      <ProductSearchPanel
        activeProducts={mockProducts}
        dynamicFields={[]}
        cliente={null}
        getProductPrice={mockGetProductPrice}
        getProductStock={mockGetProductStock}
        onAddProduct={() => {}}
      />
    );

    expect(screen.getByText('$48.000')).toBeInTheDocument();
    expect(screen.getByText('$62.000')).toBeInTheDocument();
    expect(screen.getByText('$12.000')).toBeInTheDocument();

    // Badges de Kilos y Unidad
    expect(screen.getAllByText(/KILOS/i).length).toBe(2);
    expect(screen.getAllByText(/UNIDAD/i).length).toBe(1);
  });

  it('6. Debe respetar la Regla del Niño de 12 Años (cero etiquetas <img> y tarjetas con min-h-[72px])', () => {
    const { container } = render(
      <ProductSearchPanel
        activeProducts={mockProducts}
        dynamicFields={[]}
        cliente={null}
        getProductPrice={mockGetProductPrice}
        getProductStock={mockGetProductStock}
        onAddProduct={() => {}}
      />
    );

    expect(container.querySelectorAll('img').length).toBe(0);

    const cards = container.querySelectorAll('.product-card');
    cards.forEach((card) => {
      expect(card.className).toContain('min-h-[72px]');
    });
  });
});

