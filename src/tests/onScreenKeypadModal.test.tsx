import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnScreenKeypadModal } from '../views/pos/components/OnScreenKeypadModal';

describe('TASK-029-01: OnScreenKeypadModal TDD (Ergonomía Táctil y Regla del Niño de 12 Años)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el modal con visor numérico gigante, subtotal en COP y botones numéricos >= 56px', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <OnScreenKeypadModal
        isOpen={true}
        titulo="Ajustar Cantidad"
        subtitulo="Filete de Tilapia Roja"
        valorInicial={1.5}
        unidad="KG"
        precioUnitario={28000}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );

    // 1. Título y subtítulo visibles
    expect(screen.getByText('Ajustar Cantidad')).toBeInTheDocument();
    expect(screen.getByText('Filete de Tilapia Roja')).toBeInTheDocument();

    // 2. Visor numérico con el valor inicial y subtotal (1.5 * 28000 = $42.000 COP)
    const visorInput = screen.getByTestId('keypad-display-input') as HTMLInputElement;
    expect(visorInput.value).toBe('1.5');
    expect(screen.getByTestId('keypad-subtotal-cop').textContent).toContain('42.000');

    // 3. Supresión del teclado virtual nativo del OS
    expect(visorInput.getAttribute('inputmode')).toBe('none');

    // 4. Teclas numéricas deben tener altura >= 56px (Regla táctil industrial)
    const btn7 = screen.getByTestId('keypad-btn-7');
    expect(btn7).toBeInTheDocument();
    expect(btn7.className).toContain('min-h-[56px]');

    const btn5 = screen.getByTestId('keypad-btn-5');
    expect(btn5.className).toContain('min-h-[56px]');
  });

  it('debe permitir seleccionar chips de peso rápido (KG) >= 48px a 1 toque', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <OnScreenKeypadModal
        isOpen={true}
        titulo="Pesar Salmón"
        valorInicial={1}
        unidad="KG"
        precioUnitario={50000}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );

    // Chip de 2.5 o 2 kg debe tener altura >= 48px
    const chip2 = screen.getByRole('button', { name: /2 kg/i });
    expect(chip2.className).toContain('min-h-[48px]');

    // Tocar chip
    fireEvent.click(chip2);

    // Visor y subtotal deben actualizarse (2 * 50000 = $100.000 COP)
    const visorInput = screen.getByTestId('keypad-display-input') as HTMLInputElement;
    expect(visorInput.value).toBe('2');
    expect(screen.getByTestId('keypad-subtotal-cop').textContent).toContain('100.000');
  });

  it('debe mostrar chips de conteo entero para unidades (UND) como docena o media docena', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <OnScreenKeypadModal
        isOpen={true}
        titulo="Cantidad de Bebidas"
        valorInicial={1}
        unidad="UND"
        precioUnitario={4500}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );

    // Chip de 6 unidades (media docena) y 12 unidades (docena)
    const chip6 = screen.getByRole('button', { name: /6 und/i });
    expect(chip6).toBeInTheDocument();
    expect(chip6.className).toContain('min-h-[48px]');

    fireEvent.click(chip6);
    expect(screen.getByTestId('keypad-subtotal-cop').textContent).toContain('27.000');
  });

  it('debe permitir digitación táctil con punto decimal, retroceso y confirmación', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <OnScreenKeypadModal
        isOpen={true}
        titulo="Editar Cantidad"
        valorInicial={0}
        unidad="KG"
        precioUnitario={20000}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );

    // 1. Limpiar o presionar teclas: 3 -> . -> 7 -> 5
    fireEvent.click(screen.getByTestId('keypad-btn-clear'));
    fireEvent.click(screen.getByTestId('keypad-btn-3'));
    fireEvent.click(screen.getByTestId('keypad-btn-dot'));
    fireEvent.click(screen.getByTestId('keypad-btn-7'));
    fireEvent.click(screen.getByTestId('keypad-btn-5'));

    const visorInput = screen.getByTestId('keypad-display-input') as HTMLInputElement;
    expect(visorInput.value).toBe('3.75');
    expect(screen.getByTestId('keypad-subtotal-cop').textContent).toContain('75.000');

    // 2. Probar tecla Backspace
    fireEvent.click(screen.getByTestId('keypad-btn-backspace'));
    expect(visorInput.value).toBe('3.7');

    // 3. Confirmar con botón gigante >= 56px
    const btnConfirmar = screen.getByTestId('keypad-btn-confirm');
    expect(btnConfirmar.className).toContain('min-h-[56px]');
    fireEvent.click(btnConfirmar);

    expect(onConfirm).toHaveBeenCalledWith(3.7);
  });

  it('debe soportar atajos de teclado físico (Enter para confirmar, Escape para cerrar)', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <OnScreenKeypadModal
        isOpen={true}
        titulo="Atajo Teclado Físico"
        valorInicial={4}
        unidad="UND"
        precioUnitario={10000}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );

    // Presionar tecla física Enter
    fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
    expect(onConfirm).toHaveBeenCalledWith(4);

    // Presionar tecla física Escape
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
