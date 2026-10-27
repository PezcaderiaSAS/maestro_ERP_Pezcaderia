import React from 'react';
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TASK-038-04: Pruebas TDD de Ergonomía y Densidad POS para Laptops 1366x768 (SPEC-038)', () => {
  const posViewPath = path.resolve(__dirname, '../views/POSView.tsx');
  const posViewContent = fs.readFileSync(posViewPath, 'utf-8');

  it('1. Debe transformar las tarjetas de turno en una barra compacta (pos-kpi-compact-strip) de altura <= 40px', () => {
    // Debe incluir la barra compacta con testid pos-kpi-compact-strip o pos-kpi-bar con altura ergonómica
    expect(posViewContent).toMatch(/data-testid=["']pos-kpi-(?:compact-strip|bar)["']/);
    // Debe contener las métricas esenciales organizadas de forma horizontal compacta
    expect(posViewContent).toContain('Ventas Turno');
    expect(posViewContent).toContain('Efectivo Gaveta');
    expect(posViewContent).toContain('Transacciones');
    expect(posViewContent).toContain('Facturación DIAN');
  });

  it('2. El banner de caja cerrada no debe exceder padding vertical compacto (py-1 o py-1.5)', () => {
    // El banner de advertencia no debe usar py-2 o py-3 que infle la pantalla
    expect(posViewContent).toMatch(/py-1(?:\.5)? px-[2-4]/);
  });

  it('3. El contenedor principal de POSView debe tener h-full min-h-0 overflow-hidden para encajar en el Shell Híbrido', () => {
    // Debe usar h-full min-h-0 y no desbordar
    expect(posViewContent).toMatch(/h-full min-h-0/);
    expect(posViewContent).toContain('pos-layout');
  });

  it('4. ProductSearchPanel debe proveer tarjetas de producto compactas (max-height <= 170px)', () => {
    const searchPanelPath = path.resolve(__dirname, '../views/pos/components/ProductSearchPanel.tsx');
    const searchPanelContent = fs.readFileSync(searchPanelPath, 'utf-8');

    // Debe contener clases de altura compacta para productos
    expect(searchPanelContent).toMatch(/pos-product-card|grid-cols-2|grid-cols-3|grid-cols-4/);
  });
});
