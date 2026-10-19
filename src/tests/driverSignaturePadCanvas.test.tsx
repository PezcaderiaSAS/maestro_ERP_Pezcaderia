import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DriverSignaturePadCanvas } from '../views/driver/components/DriverSignaturePadCanvas';

describe('TASK-023-03: DriverSignaturePadCanvas (Firma Táctil HTML5 Canvas Nativo)', () => {
  const dummyPngDataUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeEach(() => {
    // Configuración de mock seguro para contexto de dibujo 2D en entorno JSDOM
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      scale: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      lineCap: 'round',
      lineJoin: 'round',
      lineWidth: 2.8,
      strokeStyle: '#0f172a'
    }) as any;

    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue(dummyPngDataUrl);
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
    HTMLCanvasElement.prototype.releasePointerCapture = vi.fn();
  });

  it('Renderiza correctamente la cabecera, lienzo y botones táctiles conformes a WCAG', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <DriverSignaturePadCanvas
        titulo="Firma Entrega Restaurante"
        subtitulo="Firma del receptor autorizado"
        onFirmaConfirmada={handleConfirm}
        onCancelar={handleCancel}
      />
    );

    // 1. Título y subtítulo
    expect(screen.getByText('Firma Entrega Restaurante')).toBeDefined();
    expect(screen.getByText('Firma del receptor autorizado')).toBeDefined();

    // 2. Lienzo táctil
    const canvas = screen.getByLabelText('Lienzo de firma digital táctil');
    expect(canvas).toBeDefined();
    expect(canvas.style.touchAction).toBe('none');

    // 3. Botones de acción táctiles
    const btnLimpiar = screen.getByText('Borrar y Repetir Firma').closest('button');
    const btnConfirmar = screen.getByText(/CONFIRMAR FIRMA/i).closest('button');

    expect(btnLimpiar).toBeDefined();
    expect(btnConfirmar).toBeDefined();

    // Inicialmente los botones están deshabilitados hasta que el usuario dibuje
    expect(btnLimpiar?.disabled).toBe(true);
    expect(btnConfirmar?.disabled).toBe(true);

    // Botón cancelar
    const btnCerrar = screen.getByLabelText('Cerrar firma');
    fireEvent.click(btnCerrar);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('Captura trazos táctiles con Pointer Events y habilita la confirmación', () => {
    const handleConfirm = vi.fn();

    render(<DriverSignaturePadCanvas onFirmaConfirmada={handleConfirm} />);

    const canvas = screen.getByLabelText('Lienzo de firma digital táctil');
    const btnConfirmar = screen.getByText(/CONFIRMAR FIRMA/i).closest('button');

    expect(btnConfirmar?.disabled).toBe(true);

    // Simular inicio de trazo con puntero táctil (PointerDown)
    fireEvent.pointerDown(canvas, {
      clientX: 50,
      clientY: 50,
      pointerId: 1
    });

    // Simular movimiento (PointerMove)
    fireEvent.pointerMove(canvas, {
      clientX: 120,
      clientY: 90,
      pointerId: 1
    });

    // Simular levantamiento del dedo (PointerUp)
    fireEvent.pointerUp(canvas, {
      clientX: 120,
      clientY: 90,
      pointerId: 1
    });

    // Ahora la firma está activa y muestra el indicador
    expect(screen.getByText('Trazo Capturado')).toBeDefined();
    expect(btnConfirmar?.disabled).toBe(false);

    // Confirmar firma
    fireEvent.click(btnConfirmar!);
    expect(handleConfirm).toHaveBeenCalledWith(dummyPngDataUrl);
  });

  it('Permite borrar la firma para volver a trazarla con el botón secundario', () => {
    const handleConfirm = vi.fn();

    render(<DriverSignaturePadCanvas onFirmaConfirmada={handleConfirm} />);

    const canvas = screen.getByLabelText('Lienzo de firma digital táctil');
    const btnLimpiar = screen.getByText('Borrar y Repetir Firma').closest('button');
    const btnConfirmar = screen.getByText(/CONFIRMAR FIRMA/i).closest('button');

    // Trazar firma
    fireEvent.pointerDown(canvas, { clientX: 30, clientY: 40, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 60, clientY: 80, pointerId: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });

    expect(btnConfirmar?.disabled).toBe(false);
    expect(btnLimpiar?.disabled).toBe(false);

    // Limpiar firma
    fireEvent.click(btnLimpiar!);

    // Vuelve al estado inicial deshabilitado y sin indicador
    expect(btnConfirmar?.disabled).toBe(true);
    expect(btnLimpiar?.disabled).toBe(true);
    expect(screen.queryByText('Trazo Capturado')).toBeNull();
    expect(screen.getByText(/Firme aquí con el dedo o stylus/i)).toBeDefined();
  });
});
