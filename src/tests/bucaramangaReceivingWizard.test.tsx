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
});
