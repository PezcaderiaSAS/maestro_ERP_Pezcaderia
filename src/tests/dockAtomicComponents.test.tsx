import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThermalTrafficLightBadge } from '../views/purchases/components/ThermalTrafficLightBadge';
import { MuelleWeightScaleWidget } from '../views/purchases/components/MuelleWeightScaleWidget';
import { QuickSupplierModal } from '../views/purchases/components/QuickSupplierModal';

describe('TASK-022-04: Componentes Atómicos Táctiles de Muelle (Regla Niño de 12 Años)', () => {
  describe('1. ThermalTrafficLightBadge', () => {
    it('Renderiza semáforo Óptimo en verde para pescado fresco <= 4.0°C sin etiquetas img', () => {
      const { container } = render(
        <ThermalTrafficLightBadge temperatura={2.5} tipoProducto="FRESCO" />
      );

      const badge = screen.getByTestId('thermal-traffic-light-badge');
      expect(badge).toBeDefined();
      expect(badge.className).toContain('bg-emerald-50');
      expect(screen.getByText('TEMPERATURA ÓPTIMA')).toBeDefined();
      expect(screen.getByText('+2.5')).toBeDefined();

      // Cero imágenes externas (Regla del Niño de 12 Años)
      expect(container.querySelectorAll('img')).toHaveLength(0);
    });

    it('Renderiza Precaución Sanitaria para temperaturas entre 4.1°C y 7.0°C', () => {
      render(
        <ThermalTrafficLightBadge temperatura={5.8} tipoProducto="FRESCO" />
      );

      const badge = screen.getByTestId('thermal-traffic-light-badge');
      expect(badge.className).toContain('bg-amber-50');
      expect(screen.getByText('PRECAUCIÓN SANITARIA')).toBeDefined();
      expect(screen.getByText('+5.8')).toBeDefined();
    });

    it('Renderiza Alerta Crítica para temperaturas > 7.0°C', () => {
      render(
        <ThermalTrafficLightBadge temperatura={8.5} tipoProducto="FRESCO" />
      );

      const badge = screen.getByTestId('thermal-traffic-light-badge');
      expect(badge.className).toContain('bg-rose-50');
      expect(screen.getByText('ALERTA CRÍTICA DE INOCUIDAD')).toBeDefined();
    });
  });

  describe('2. MuelleWeightScaleWidget', () => {
    it('Renderiza display de peso, controles táctiles >= 48px y cero imágenes', () => {
      const onPesoChange = vi.fn();
      const onCanastillasChange = vi.fn();
      const onHieloChange = vi.fn();
      const onPrecioChange = vi.fn();

      const { container } = render(
        <MuelleWeightScaleWidget
          pesoBrutoKg={108.0}
          onPesoBrutoChange={onPesoChange}
          cantidadCanastillas={4}
          onCantidadCanastillasChange={onCanastillasChange}
          porcentajeHielo={5}
          onPorcentajeHieloChange={onHieloChange}
          precioKgAcordado={14500}
          onPrecioKgChange={onPrecioChange}
        />
      );

      const widget = screen.getByTestId('muelle-weight-scale-widget');
      expect(widget).toBeDefined();

      // Verificar que los botones táctiles cumplen >= 48px (min-h-[48px] / min-w-[48px])
      const btnPlus = screen.getByRole('button', { name: /\+5/i });
      expect(btnPlus.className).toContain('min-h-[48px]');

      // Verificar chips de hielo >= 48px
      const chip5 = screen.getByRole('button', { name: '5%' });
      expect(chip5.className).toContain('min-h-[48px]');
      expect(chip5.className).toContain('bg-blue-600'); // seleccionado

      // Cero imágenes externas
      expect(container.querySelectorAll('img')).toHaveLength(0);
    });

    it('Muestra alerta preventiva si el peso bruto es menor o igual a la tara total', () => {
      render(
        <MuelleWeightScaleWidget
          pesoBrutoKg={6.0} // 4 canastillas * 2.0 = 8.0 kg tara -> 6 <= 8 (Inválido)
          onPesoBrutoChange={vi.fn()}
          cantidadCanastillas={4}
          onCantidadCanastillasChange={vi.fn()}
          porcentajeHielo={0}
          onPorcentajeHieloChange={vi.fn()}
          precioKgAcordado={10000}
          onPrecioKgChange={vi.fn()}
        />
      );

      expect(screen.getByText(/Peso menor o igual a la tara/i)).toBeDefined();
    });
  });

  describe('3. QuickSupplierModal', () => {
    it('Renderiza modal accesible con botón principal >= 56px e inputs >= 48px', () => {
      const onClose = vi.fn();
      const onCreated = vi.fn();

      const { container } = render(
        <QuickSupplierModal
          isOpen={true}
          onClose={onClose}
          onSupplierCreated={onCreated}
        />
      );

      const modal = screen.getByTestId('quick-supplier-modal');
      expect(modal).toBeDefined();

      // Botón principal de guardado >= 56px (min-h-[56px])
      const submitBtn = screen.getByRole('button', { name: /REGISTRAR Y SELECCIONAR PROVEEDOR/i });
      expect(submitBtn.className).toContain('min-h-[56px]');

      // Botón de cierre >= 48px
      const closeBtn = screen.getByRole('button', { name: '' });
      expect(closeBtn.className).toContain('min-h-[48px]');

      // Inputs con min-h-[48px]
      const nitInput = screen.getByPlaceholderText(/900\.123\.456-7/i);
      expect(nitInput.className).toContain('min-h-[48px]');

      // Cero imágenes externas
      expect(container.querySelectorAll('img')).toHaveLength(0);
    });

    it('No renderiza nada si isOpen es falso', () => {
      const { container } = render(
        <QuickSupplierModal
          isOpen={false}
          onClose={vi.fn()}
          onSupplierCreated={vi.fn()}
        />
      );

      expect(container.innerHTML).toBe('');
    });
  });
});
