// src/tests/scaleIndustrialDisplay.test.tsx
// TDD Suite para ScaleIndustrialDisplay (SPEC-050: TASK-050-01)

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScaleIndustrialDisplay } from '../views/inventory/components/dock/ScaleIndustrialDisplay.tsx';

describe('ScaleIndustrialDisplay Component Suite - TASK-050-01', () => {
  it('debe renderizar el display de báscula con peso bruto, tara y neto en font-mono', () => {
    render(
      <ScaleIndustrialDisplay
        pesoBruto={24.5}
        tara={2.0}
        pesoNeto={22.5}
        isStable={true}
        isConnected={true}
        onCapture={() => {}}
        onTare={() => {}}
      />
    );

    // Debe mostrar los valores numéricos formateados
    expect(screen.getByText('24.50 kg')).toBeDefined();
    expect(screen.getByText('2.00 kg')).toBeDefined();
    expect(screen.getByText('22.50 kg')).toBeDefined();

    // Debe indicar estado de báscula conectada y estable
    expect(screen.getByText(/ESTABLE/i)).toBeDefined();
    expect(screen.getByText(/CONECTADA/i)).toBeDefined();
  });

  it('debe mostrar indicador de lectura inestable cuando isStable es false', () => {
    render(
      <ScaleIndustrialDisplay
        pesoBruto={15.2}
        tara={2.0}
        pesoNeto={13.2}
        isStable={false}
        isConnected={true}
        onCapture={() => {}}
        onTare={() => {}}
      />
    );

    expect(screen.getByText(/LEYENDO \/ INESTABLE/i)).toBeDefined();
  });

  it('debe ejecutar los callbacks onCapture y onTare al presionar los botones táctiles', () => {
    const handleCapture = vi.fn();
    const handleTare = vi.fn();

    render(
      <ScaleIndustrialDisplay
        pesoBruto={30.0}
        tara={2.0}
        pesoNeto={28.0}
        isStable={true}
        isConnected={true}
        onCapture={handleCapture}
        onTare={handleTare}
      />
    );

    const btnCapturar = screen.getByRole('button', { name: /Capturar Pesada/i });
    const btnTarar = screen.getByRole('button', { name: /Tarar Báscula/i });

    fireEvent.click(btnCapturar);
    expect(handleCapture).toHaveBeenCalledTimes(1);

    fireEvent.click(btnTarar);
    expect(handleTare).toHaveBeenCalledTimes(1);
  });

  it('debe deshabilitar el botón de captura si el peso neto es menor o igual a cero', () => {
    const handleCapture = vi.fn();

    render(
      <ScaleIndustrialDisplay
        pesoBruto={2.0}
        tara={2.0}
        pesoNeto={0.0}
        isStable={true}
        isConnected={true}
        onCapture={handleCapture}
        onTare={() => {}}
      />
    );

    const btnCapturar = screen.getByRole('button', { name: /Capturar Pesada/i });
    expect(btnCapturar).toBeDefined();
    fireEvent.click(btnCapturar);
    expect(handleCapture).not.toHaveBeenCalled();
  });
});
