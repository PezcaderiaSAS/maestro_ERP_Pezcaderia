import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DenominationsCalculator } from '../views/pos/components/DenominationsCalculator';

describe('DenominationsCalculator', () => {
  it('renderiza correctamente todas las denominaciones', () => {
    const onChange = vi.fn();
    const onConfirm = vi.fn();
    
    render(
      <DenominationsCalculator 
        value={{}} 
        onChange={onChange} 
        onConfirm={onConfirm} 
      />
    );
    
    expect(screen.getByText('Billetes')).toBeDefined();
    expect(screen.getByText('Monedas')).toBeDefined();
    // Aceptar coma o punto según el locale
    expect(screen.getByText(/\$50[,.]000/)).toBeDefined();
    expect(screen.getByText('Total Calculado')).toBeDefined();
  });

  it('calcula el total correctamente cuando recibe valores iniciales', () => {
    const value = {
      '50000': 2,
      '20000': 1,
      '500': 4
    }; // Total: 100000 + 20000 + 2000 = 122000

    render(
      <DenominationsCalculator 
        value={value} 
        onChange={vi.fn()} 
        onConfirm={vi.fn()} 
      />
    );
    
    expect(screen.getByText(/\$122[,.]000/)).toBeDefined();
  });

  it('llama a onChange al interactuar con los botones', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DenominationsCalculator 
        value={{ '50000': 1 }} 
        onChange={onChange} 
        onConfirm={vi.fn()} 
      />
    );
    
    // Buscar la fila de 50.000 y hacer clic en incrementar
    const rows = Array.from(container.querySelectorAll('.flex.items-center.justify-between'));
    const row50k = rows.find(r => r.textContent?.includes('50.000') || r.textContent?.includes('50,000'));
    
    if (row50k) {
      const incrementBtn = row50k.querySelectorAll('button')[1]; // Segundo botón (Plus)
      fireEvent.click(incrementBtn);
      
      expect(onChange).toHaveBeenCalledWith({ '50000': 2 });
    }
  });

  it('llama a onConfirm cuando se marca el checkbox', () => {
    const onConfirm = vi.fn();
    const { getByLabelText } = render(
      <DenominationsCalculator 
        value={{}} 
        onChange={vi.fn()} 
        onConfirm={onConfirm} 
      />
    );
    
    const checkbox = getByLabelText(/Confirmo que el conteo es exacto/i);
    fireEvent.click(checkbox);
    
    expect(onConfirm).toHaveBeenCalledWith(true);
    
    fireEvent.click(checkbox);
    expect(onConfirm).toHaveBeenCalledWith(false);
  });
});
