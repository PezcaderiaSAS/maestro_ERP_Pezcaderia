// src/tests/inventoryBentoKpis.test.tsx
// Pruebas TDD para el Bento Grid de 4 KPIs Ejecutivos WMS (SPEC-048: TASK-048-01)

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InventoryBentoKpis } from '../views/inventory/components/InventoryBentoKpis.tsx';

describe('TASK-048-01: InventoryBentoKpis Component', () => {
  it('renderiza las 4 tarjetas Bento con sus valores monetarios y operacionales en font-mono', () => {
    render(
      <InventoryBentoKpis
        valorTotalStock={125000000}
        totalProductosActivos={48}
        ocupacionCuartosFriosKg={3500}
        capacidadTotalKg={5000}
        temperaturaPromedioC={-18.5}
        lotesCriticosFefoCount={0}
        tasaMermaDespiecePct={22.4}
        productosClaseAPct={80}
      />
    );

    // 1. Valor Total
    expect(screen.getByText('Valoración Total Stock')).toBeDefined();
    expect(screen.getByText(/125\.000\.000/)).toBeDefined();
    expect(screen.getByText(/48 refs activas/)).toBeDefined();

    // 2. Cuartos Fríos
    expect(screen.getByText('Cámaras & Frío')).toBeDefined();
    expect(screen.getByText('-18.5 °C')).toBeDefined();
    expect(screen.getByText(/3\.500 kg/)).toBeDefined();
    expect(screen.getByText(/70% cap\./)).toBeDefined();

    // 3. Caducidad FEFO
    expect(screen.getByText('Caducidad FEFO')).toBeDefined();
    expect(screen.getByText('Sin riesgo inminente')).toBeDefined();
    expect(screen.getByText('FEFO Normal')).toBeDefined();

    // 4. Despiece y Pareto
    expect(screen.getByText('Rendimiento & ABC')).toBeDefined();
    expect(screen.getByText('22.4%')).toBeDefined();
    expect(screen.getByText(/Clase A: 80% valor/)).toBeDefined();
    expect(screen.getByText('Pareto 80/20')).toBeDefined();
  });

  it('renderiza valores por defecto seguros cuando no se proveen props', () => {
    render(<InventoryBentoKpis />);

    expect(screen.getByText('$0')).toBeDefined();
    expect(screen.getByText('0 refs activas')).toBeDefined();
    expect(screen.getByText('-18.0 °C')).toBeDefined();
    expect(screen.getByText(/0% cap\./)).toBeDefined();
  });

  it('activa el semáforo crítico y animación de alerta cuando hay lotes FEFO por vencer (<48h)', () => {
    render(
      <InventoryBentoKpis
        lotesCriticosFefoCount={3}
      />
    );

    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('lotes críticos')).toBeDefined();
    expect(screen.getByText('< 48h vencimiento')).toBeDefined();
    expect(screen.getByText('Despachar Hoy')).toBeDefined();

    const fefoCard = screen.getByTestId('bento-kpi-fefo-riesgo');
    expect(fefoCard.className).toContain('border-rose-500');
  });

  it('activa advertencia visual de merma cuando la tasa de despiece supera el umbral del 35%', () => {
    render(
      <InventoryBentoKpis
        tasaMermaDespiecePct={38.2}
      />
    );

    expect(screen.getByText('38.2%')).toBeDefined();
    expect(screen.getByText('Merma Crítica')).toBeDefined();

    const despieceCard = screen.getByTestId('bento-kpi-despiece-pareto');
    expect(despieceCard.className).toContain('border-rose-500');
  });
});
