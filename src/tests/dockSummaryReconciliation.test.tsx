// src/tests/dockSummaryReconciliation.test.tsx
// TDD Suite para DockSummaryReconciliation (SPEC-050: TASK-050-03)

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  DockSummaryReconciliation,
  calculateReconciliation,
} from '../views/inventory/components/dock/DockSummaryReconciliation.tsx';

describe('DockSummaryReconciliation Component Suite - TASK-050-03', () => {
  describe('Función pura calculateReconciliation', () => {
    it('debe catalogar como NORMAL una merma <= 3% y no sugerir nota débito', () => {
      // 1000 kg en guía, 980 kg en báscula -> 20 kg merma (2.0% <= 3%)
      const result = calculateReconciliation({
        kilosGuia: 1000,
        kilosBascula: 980,
        precioKiloPromedio: 15000,
        toleranciaPct: 3.0,
        anticipos: 5000000,
        fleteTotal: 1000000,
      });

      expect(result.mermaKilos).toBe(20);
      expect(result.mermaPct).toBe(2.0);
      expect(result.semaforo).toBe('NORMAL');
      expect(result.kilosExcedentesMerma).toBe(0);
      expect(result.montoNotaDebitoSugerida).toBe(0);
      expect(result.subtotalBascula).toBe(980 * 15000); // 14,700,000
      expect(result.saldoNetoProveedor).toBe(980 * 15000 - 5000000); // 9,700,000
      expect(result.costoPuestoEnPlanta).toBe(980 * 15000 + 1000000); // 15,700,000
    });

    it('debe catalogar como ALERTA una merma entre 3% y 7% y calcular nota débito sobre exceso', () => {
      // 1000 kg en guía, 950 kg en báscula -> 50 kg merma (5.0%)
      // Tolerancia 3% = 30 kg exentos. Kilos a reclamar = 20 kg * 15000 = 300,000 COP
      const result = calculateReconciliation({
        kilosGuia: 1000,
        kilosBascula: 950,
        precioKiloPromedio: 15000,
        toleranciaPct: 3.0,
      });

      expect(result.mermaKilos).toBe(50);
      expect(result.mermaPct).toBe(5.0);
      expect(result.semaforo).toBe('ALERTA');
      expect(result.kilosExcedentesMerma).toBe(20);
      expect(result.montoNotaDebitoSugerida).toBe(300000);
    });

    it('debe catalogar como CRITICA una merma > 7% y sugerir nota débito inmediata', () => {
      // 1000 kg en guía, 900 kg en báscula -> 100 kg merma (10.0% > 7%)
      // Tolerancia 3% = 30 kg exentos. Kilos a reclamar = 70 kg * 15000 = 1,050,000 COP
      const result = calculateReconciliation({
        kilosGuia: 1000,
        kilosBascula: 900,
        precioKiloPromedio: 15000,
        toleranciaPct: 3.0,
      });

      expect(result.mermaKilos).toBe(100);
      expect(result.mermaPct).toBe(10.0);
      expect(result.semaforo).toBe('CRITICA');
      expect(result.kilosExcedentesMerma).toBe(70);
      expect(result.montoNotaDebitoSugerida).toBe(1050000);
    });

    it('debe manejar ganancia de kilos cuando báscula supera guía sin generar merma negativa', () => {
      // 1000 kg en guía, 1020 kg en báscula -> 0 kg merma, 20 kg ganancia
      const result = calculateReconciliation({
        kilosGuia: 1000,
        kilosBascula: 1020,
        precioKiloPromedio: 15000,
      });

      expect(result.mermaKilos).toBe(0);
      expect(result.mermaPct).toBe(0);
      expect(result.esExceso).toBe(true);
      expect(result.excesoKilos).toBe(20);
      expect(result.semaforo).toBe('NORMAL');
      expect(result.montoNotaDebitoSugerida).toBe(0);
    });
  });

  describe('Renderizado de UI y Componente', () => {
    it('debe renderizar el panel de conciliación con valores numéricos en font-mono', () => {
      render(
        <DockSummaryReconciliation
          kilosGuia={1000}
          kilosBascula={980}
          precioKiloPromedio={15000}
          anticipos={5000000}
          fleteTotal={1000000}
        />
      );

      // Kilos y valores en formato legible
      expect(screen.getByText(/Conciliación de Mermas & Liquidación de Compra/i)).toBeDefined();
      expect(screen.getByText('1,000.00 kg')).toBeDefined();
      expect(screen.getByText('980.00 kg')).toBeDefined();
      expect(screen.getByText('20.00 kg')).toBeDefined();

      // Badge de merma normal
      expect(screen.getByTestId('dock-reconciliation-badge')).toHaveTextContent(/MERMA TOLERABLE/i);
    });

    it('debe mostrar alerta visual y sugerencia de nota débito cuando la merma es crítica', () => {
      const handleDebitNote = vi.fn();

      render(
        <DockSummaryReconciliation
          kilosGuia={1000}
          kilosBascula={900}
          precioKiloPromedio={15000}
          onGenerateDebitNote={handleDebitNote}
        />
      );

      // Badge crítico
      expect(screen.getByTestId('dock-reconciliation-badge')).toHaveTextContent(/MERMA CRÍTICA/i);
      expect(screen.getByText(/10.00%/)).toBeDefined();

      // Botón para aplicar nota débito
      const btnNotaDebito = screen.getByRole('button', { name: /Aplicar Nota Débito/i });
      expect(btnNotaDebito).toBeDefined();

      fireEvent.click(btnNotaDebito);
      expect(handleDebitNote).toHaveBeenCalledTimes(1);
      const [monto, kilos] = handleDebitNote.mock.calls[0];
      expect(monto).toBe(1050000);
      expect(kilos).toBe(70);
    });

    it('debe ejecutar callback onConfirmReconciliation al confirmar la liquidación', () => {
      const handleConfirm = vi.fn();

      render(
        <DockSummaryReconciliation
          kilosGuia={500}
          kilosBascula={495}
          precioKiloPromedio={20000}
          onConfirmReconciliation={handleConfirm}
        />
      );

      const btnConfirmar = screen.getByRole('button', { name: /Confirmar Liquidación/i });
      fireEvent.click(btnConfirmar);

      expect(handleConfirm).toHaveBeenCalledTimes(1);
      const summary = handleConfirm.mock.calls[0][0];
      expect(summary.kilosGuia).toBe(500);
      expect(summary.kilosBascula).toBe(495);
      expect(summary.saldoNetoProveedor).toBe(495 * 20000);
    });
  });
});

