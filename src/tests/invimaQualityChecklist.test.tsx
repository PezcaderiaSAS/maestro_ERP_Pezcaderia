// src/tests/invimaQualityChecklist.test.tsx
// TDD Suite para InvimaQualityChecklist (SPEC-050: TASK-050-02)

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  InvimaQualityChecklist,
  evaluateInvimaQuality,
  type InvimaQualityState,
} from '../views/inventory/components/dock/InvimaQualityChecklist.tsx';

describe('InvimaQualityChecklist Component Suite - TASK-050-02', () => {
  it('debe calcular la evaluación determinista INVIMA con la función pura evaluateInvimaQuality', () => {
    // 1. Todos óptimos -> APROBADO
    const estadoOptimo: InvimaQualityState = {
      ojos: 'OPTIMO',
      agallas: 'OPTIMO',
      olor: 'OPTIMO',
      textura: 'OPTIMO',
    };
    const evalOptimo = evaluateInvimaQuality(estadoOptimo);
    expect(evalOptimo.estado).toBe('APROBADO');
    expect(evalOptimo.aprobado).toBe(true);
    expect(evalOptimo.tieneNovedad).toBe(false);

    // 2. Un criterio aceptable con observación -> APROBADO_CON_OBSERVACION
    const estadoAceptable: InvimaQualityState = {
      ojos: 'OPTIMO',
      agallas: 'ACEPTABLE',
      olor: 'OPTIMO',
      textura: 'OPTIMO',
    };
    const evalAceptable = evaluateInvimaQuality(estadoAceptable);
    expect(evalAceptable.estado).toBe('APROBADO_CON_OBSERVACION');
    expect(evalAceptable.aprobado).toBe(true);
    expect(evalAceptable.tieneNovedad).toBe(true);

    // 3. Un criterio no conforme -> RECHAZADO (rechazo inmediato)
    const estadoRechazo: InvimaQualityState = {
      ojos: 'OPTIMO',
      agallas: 'OPTIMO',
      olor: 'NO_CONFORME',
      textura: 'OPTIMO',
    };
    const evalRechazo = evaluateInvimaQuality(estadoRechazo);
    expect(evalRechazo.estado).toBe('RECHAZADO');
    expect(evalRechazo.aprobado).toBe(false);
    expect(evalRechazo.tieneNovedad).toBe(true);
  });

  it('debe renderizar el checklist sensorial INVIMA con los 4 criterios (Ojos, Agallas, Olor, Textura)', () => {
    render(<InvimaQualityChecklist />);

    // Verificar encabezado y escudo normativo
    expect(screen.getByText(/Control Sensorial Organoléptico INVIMA/i)).toBeDefined();
    expect(screen.getByText(/Ojos \/ Pupilas/i)).toBeDefined();
    expect(screen.getByText(/Agallas \/ Branquias/i)).toBeDefined();
    expect(screen.getByText(/Olor Característico/i)).toBeDefined();
    expect(screen.getByText(/Textura \/ Elasticidad/i)).toBeDefined();

    // Debe mostrar el dictamen inicial APROBADO
    expect(screen.getByTestId('invima-verdict-badge')).toHaveTextContent(/APROBADO/i);
  });

  it('debe cambiar el dictamen a APROBADO CON OBSERVACIÓN al marcar un criterio como Aceptable', () => {
    const handleChange = vi.fn();
    render(<InvimaQualityChecklist onChange={handleChange} />);

    // Seleccionar opción Aceptable para Agallas
    const btnAgallasAceptable = screen.getByTestId('invima-agallas-ACEPTABLE');
    fireEvent.click(btnAgallasAceptable);

    expect(screen.getByTestId('invima-verdict-badge')).toHaveTextContent(/APROBADO CON OBSERVACIÓN/i);
    expect(handleChange).toHaveBeenCalled();
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    const [lastState, lastEval] = lastCall;
    expect(lastState.agallas).toBe('ACEPTABLE');
    expect(lastEval.estado).toBe('APROBADO_CON_OBSERVACION');
    expect(lastEval.aprobado).toBe(true);
  });

  it('debe cambiar el dictamen a RECHAZADO inmediatamente si cualquier criterio es No Conforme', () => {
    const handleChange = vi.fn();
    render(<InvimaQualityChecklist onChange={handleChange} />);

    // Seleccionar No Conforme para Olor
    const btnOlorRechazo = screen.getByTestId('invima-olor-NO_CONFORME');
    fireEvent.click(btnOlorRechazo);

    expect(screen.getByTestId('invima-verdict-badge')).toHaveTextContent(/RECHAZADO/i);
    expect(handleChange).toHaveBeenCalled();
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    const [lastState, lastEval] = lastCall;
    expect(lastState.olor).toBe('NO_CONFORME');
    expect(lastEval.estado).toBe('RECHAZADO');
    expect(lastEval.aprobado).toBe(false);
  });

  it('debe validar la temperatura del pescado y alertar si excede los 4°C reglamentarios', () => {
    const handleChange = vi.fn();
    render(<InvimaQualityChecklist onChange={handleChange} />);

    const tempInput = screen.getByTestId('invima-temperatura-input');
    fireEvent.change(tempInput, { target: { value: '6.5' } });

    // Debe mostrar advertencia de ruptura de cadena de frío (> 4°C)
    expect(screen.getByText(/Alerta Cadena de Frío/i)).toBeDefined();
    expect(screen.getByText(/Temperatura fuera de rango \(> 4°C\)/i)).toBeDefined();
  });

  it('debe respetar el modo de solo lectura (readOnly) sin alterar el estado al interactuar', () => {
    const handleChange = vi.fn();
    render(
      <InvimaQualityChecklist
        readOnly={true}
        onChange={handleChange}
        value={{
          ojos: 'OPTIMO',
          agallas: 'OPTIMO',
          olor: 'OPTIMO',
          textura: 'OPTIMO',
        }}
      />
    );

    const btnAgallasRechazo = screen.getByTestId('invima-agallas-NO_CONFORME');
    fireEvent.click(btnAgallasRechazo);

    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('invima-verdict-badge')).toHaveTextContent(/APROBADO/i);
  });
});

