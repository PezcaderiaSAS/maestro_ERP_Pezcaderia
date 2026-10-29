import React from 'react';
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TASK-039-04: POSView - Aislamiento de Scrollbars Independientes y Grid de Laptop', () => {
  const posViewPath = path.resolve(__dirname, '../views/POSView.tsx');
  const posViewContent = fs.readFileSync(posViewPath, 'utf-8');

  it('el contenedor de grilla de venta en POSView debe emplear una partición ergonómica para laptop (1fr_380px o ancho fijo para el panel de cobro)', () => {
    // Debe incluir lg:grid-cols-[1fr_380px] o similar para evitar que el carrito se aplaste o desborde en laptops
    expect(posViewContent).toMatch(/grid-cols-\[1fr_380px\]|grid-cols-\[1fr_390px\]|grid-cols-\[1fr_400px\]/);
  });

  it('el contenedor principal de POSView debe mantener h-full, min-h-0 y overflow-hidden para prevenir scroll de la ventana global', () => {
    expect(posViewContent).toContain('className="pos-layout w-full h-full min-h-0');
    expect(posViewContent).toContain('overflow-hidden');
  });

  it('la columna de liquidación y carrito debe contener overflow-hidden y min-h-0 para contener su barra de desplazamiento propia', () => {
    expect(posViewContent).toMatch(/min-h-0 h-full overflow-hidden/);
  });
});
