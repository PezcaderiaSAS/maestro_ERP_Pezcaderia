import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BucaramangaReceivingWizard } from '../views/inventory/components/BucaramangaReceivingWizard';

describe('BucaramangaReceivingWizard Component Suite (Regla de los 12 Años)', () => {
  it('debe renderizar los 3 pasos intuitivos del Wizard en pantalla', () => {
    render(<BucaramangaReceivingWizard />);

    expect(screen.getByText(/1\. El Furgón/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. La Báscula/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. El Frío y la Plata/i)).toBeInTheDocument();
  });

  it('debe mostrar los controles del Paso 1: Furgón, temperatura y botón gigante para avanzar', () => {
    render(<BucaramangaReceivingWizard />);

    expect(screen.getByText(/Paso 1: ¿De dónde viene el camión y cómo llegó el frío\?/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ej\. WDF-452/i)).toBeInTheDocument();
    expect(screen.getByText(/Continuar a la Báscula/i)).toBeInTheDocument();
  });

  it('debe navegar al Paso 2 (La Báscula) al pulsar Continuar a la Báscula', () => {
    render(<BucaramangaReceivingWizard />);

    const btnContinuar = screen.getByText(/Continuar a la Báscula/i);
    fireEvent.click(btnContinuar);

    expect(screen.getByText(/Paso 2: Pesaje Canastilla por Canastilla/i)).toBeInTheDocument();
    expect(screen.getByText(/Capturar Peso Báscula/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Guardar Pesada Canastilla/i)).toBeInTheDocument();
  });

  it('debe permitir agregar una canastilla y reflejar los kilos netos acumulados', () => {
    render(<BucaramangaReceivingWizard />);

    // Ir al Paso 2
    fireEvent.click(screen.getByText(/Continuar a la Báscula/i));

    // El peso bruto inicial está en 52 kg (50 kg netos con 2 kg de tara)
    const btnAgregar = screen.getByText(/\+ Guardar Pesada Canastilla/i);
    fireEvent.click(btnAgregar);

    // Debe mostrar la canastilla registrada
    expect(screen.getByText(/Canastillas Registradas en el Lote/i)).toBeInTheDocument();
    expect(screen.getByText(/50\.00 kg/i)).toBeInTheDocument();
  });

  it('5. debe aplicar estrictamente Light Mode WCAG 2.2 AA+ y semáforo térmico de alto contraste', () => {
    const { container } = render(<BucaramangaReceivingWizard />);

    // El contenedor principal debe tener tipografía legible en pizarra oscuro y fondo claro
    expect(container.firstChild).toHaveClass('text-slate-900');

    // Semáforo de temperatura en Light Mode (temperatura inicial 1.5°C es ÓPTIMA fresco)
    const semaforo = screen.getByText(/🟢 ÓPTIMA/i);
    expect(semaforo.className).toContain('text-emerald-800');
    expect(semaforo.className).toContain('bg-emerald-50');
    expect(semaforo.className).toContain('border-emerald-300');
  });

  it('6. debe asegurar dimensiones ergonómicas mínimas: targets >= 48px y primarios >= 56px', () => {
    render(<BucaramangaReceivingWizard />);

    // Botón de toggle historial debe ser >= 48px
    const btnHistorial = screen.getByTestId('btn-toggle-historial');
    expect(btnHistorial.className).toContain('min-h-[48px]');

    // Botones del Wizard deben ser >= 56px
    const step1 = screen.getByTestId('step-btn-furgon');
    const step2 = screen.getByTestId('step-btn-bascula');
    const step3 = screen.getByTestId('step-btn-frio');
    expect(step1.className).toContain('min-h-[56px]');
    expect(step2.className).toContain('min-h-[56px]');
    expect(step3.className).toContain('min-h-[56px]');

    // Botón primario de avanzar a báscula >= 56px
    const btnAvanzar = screen.getByTestId('btn-continuar-bascula');
    expect(btnAvanzar.className).toContain('min-h-[56px]');

    // Navegar al paso 2
    fireEvent.click(btnAvanzar);

    // Botones de báscula y guardar canastilla >= 56px
    const btnBascula = screen.getByTestId('btn-capturar-bascula');
    const btnGuardarPesada = screen.getByTestId('btn-guardar-pesada');
    expect(btnBascula.className).toContain('min-h-[56px]');
    expect(btnGuardarPesada.className).toContain('min-h-[56px]');
  });

  it('7. debe permitir navegar al Paso 3 y mostrar botón gigante de confirmación >= 56px', () => {
    render(<BucaramangaReceivingWizard />);

    // Ir a Paso 2 y agregar canastilla
    fireEvent.click(screen.getByTestId('btn-continuar-bascula'));
    fireEvent.click(screen.getByTestId('btn-guardar-pesada'));

    // Ir a Paso 3
    const btnIrFrio = screen.getByTestId('btn-ir-frio-liquidar');
    expect(btnIrFrio.className).toContain('min-h-[56px]');
    fireEvent.click(btnIrFrio);

    // En Paso 3 debe mostrar resumen de liquidación y botón finalizador >= 56px
    expect(screen.getByText(/Resumen de Liquidación Puesto en Bucaramanga/i)).toBeInTheDocument();
    const btnFinalizar = screen.getByTestId('btn-finalizar-recepcion');
    expect(btnFinalizar.className).toContain('min-h-[56px]');
  });
});
