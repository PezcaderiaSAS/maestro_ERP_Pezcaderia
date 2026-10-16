import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BucaramangaReceivingWizard } from '../views/inventory/components/BucaramangaReceivingWizard';
import { WarehouseTransferPanel } from '../views/inventory/components/WarehouseTransferPanel';
import { save } from '../services/localDb';
import type { WarehouseTransfer, Product } from '../types/erp.types';

describe('Suite de Integración y Regla del Niño de 12 Años - Fase 2: Bodega, Muelle BCM y Cuarto Frío WMS', () => {
  const MOCK_PRODUCTS: Product[] = [
    {
      id: 'prod-mojarra',
      sku: 'MOJ-ROJA-001',
      nombre: 'Mojarra Roja Fresca',
      categoria: 'Pescados',
      precio_compra: 9500,
      buffer_seguridad: 20,
      precio_venta_pos: 14000,
      precio_venta_restaurante: 13000,
      precio_venta_mayorista: 12000,
      activo: true,
    },
    {
      id: 'prod-salmon',
      sku: 'SALM-CHIL-001',
      nombre: 'Salmón Chileno Premium',
      categoria: 'Pescados',
      precio_compra: 38000,
      buffer_seguridad: 15,
      precio_venta_pos: 52000,
      precio_venta_restaurante: 48000,
      precio_venta_mayorista: 45000,
      activo: true,
    },
  ];

  const MOCK_BODEGAS = [
    { id: 'bodega-central', nombre: 'Cuarto Frío Principal (BCM)', codigo: 'B01', activa: true, esencial: true },
    { id: 'bodega-pos', nombre: 'Mostrador Minorista POS', codigo: 'B02', activa: true, esencial: false },
    { id: 'bodega-restaurante', nombre: 'Punto Express Cabecera', codigo: 'B03', activa: true, esencial: false },
  ];

  const MOCK_TRANSFERS: WarehouseTransfer[] = [
    {
      id: 'trf-wms-01',
      codigo_guia: 'TRF-BCM-2026-001',
      bodega_origen_id: 'bodega-central',
      bodega_origen_nombre: 'Cuarto Frío Principal (BCM)',
      bodega_destino_id: 'bodega-pos',
      bodega_destino_nombre: 'Mostrador Minorista POS',
      estado: 'EN_TRANSITO',
      fecha_creacion: '2026-10-16T08:00:00.000Z',
      usuario_despacha: 'Operario Cuarto Frío',
      items: [
        {
          producto_id: 'prod-mojarra',
          sku: 'MOJ-ROJA-001',
          nombre: 'Mojarra Roja Fresca',
          cantidad_kg: 40,
          costo_unitario: 9500,
        },
      ],
    },
  ];

  beforeEach(() => {
    save('warehouse_transfers', MOCK_TRANSFERS);
    save('stock', {
      'bodega-central': {
        'MOJ-ROJA-001': 250,
        'SALM-CHIL-001': 80,
      },
    });
  });

  /* ==========================================================================
   * SECCIÓN 1: MUELLE BUCARAMANGA (BucaramangaReceivingWizard)
   * ========================================================================== */
  describe('1. Muelle Bucaramanga - Recepción Furgón y Báscula', () => {
    it('1.1 debe cumplir con CERO etiquetas <img> y paleta Light Mode WCAG 2.2 AA+', () => {
      const { container } = render(<BucaramangaReceivingWizard />);

      // Regla innegociable: CERO imágenes raster/externas
      const imgElements = container.querySelectorAll('img');
      expect(imgElements.length).toBe(0);

      // Contenedor principal con tipografía oscura accesible sobre fondo claro
      expect(container.firstChild).toHaveClass('text-slate-900');
    });

    it('1.2 debe renderizar los 3 pasos secuenciales del wizard con altura táctil >= 56px', () => {
      render(<BucaramangaReceivingWizard />);

      const step1 = screen.getByTestId('step-btn-furgon');
      const step2 = screen.getByTestId('step-btn-bascula');
      const step3 = screen.getByTestId('step-btn-frio');

      expect(step1).toBeInTheDocument();
      expect(step2).toBeInTheDocument();
      expect(step3).toBeInTheDocument();

      expect(step1.className).toContain('min-h-[56px]');
      expect(step2.className).toContain('min-h-[56px]');
      expect(step3.className).toContain('min-h-[56px]');
    });

    it('1.3 semáforo térmico: debe alertar cromáticamente en Light Mode según la temperatura', () => {
      render(<BucaramangaReceivingWizard />);

      // Temperatura inicial por defecto (1.5°C) -> ÓPTIMA (Verde esmeralda)
      const semaforoInicial = screen.getByText(/🟢 ÓPTIMA/i);
      expect(semaforoInicial.className).toContain('text-emerald-800');
      expect(semaforoInicial.className).toContain('bg-emerald-50');

      // Cambiar a 3.0°C -> PRECAUCIÓN (Ámbar)
      const inputTemp = screen.getByDisplayValue('1.5');
      fireEvent.change(inputTemp, { target: { value: '3.0' } });
      const semaforoPrecaucion = screen.getByText(/🟡 PRECAUCIÓN/i);
      expect(semaforoPrecaucion.className).toContain('text-amber-800');
      expect(semaforoPrecaucion.className).toContain('bg-amber-50');

      // Cambiar a 6.0°C -> ALERTA SANITARIA (Rojo)
      fireEvent.change(inputTemp, { target: { value: '6.0' } });
      const semaforoPeligro = screen.getByText(/🔴 ALERTA SANITARIA/i);
      expect(semaforoPeligro.className).toContain('text-rose-800');
      expect(semaforoPeligro.className).toContain('bg-rose-50');
    });

    it('1.4 pesaje y tara: debe descontar 2 kg de canastilla plástica y calcular peso neto en báscula', () => {
      render(<BucaramangaReceivingWizard />);

      // Navegar a Paso 2 (Báscula)
      fireEvent.click(screen.getByTestId('btn-continuar-bascula'));

      // Verificar que el botón de captura y guardar pesada midan >= 56px
      const btnBascula = screen.getByTestId('btn-capturar-bascula');
      const btnGuardarPesada = screen.getByTestId('btn-guardar-pesada');
      expect(btnBascula.className).toContain('min-h-[56px]');
      expect(btnGuardarPesada.className).toContain('min-h-[56px]');

      // Guardar pesada de 52 kg bruto (debe restar 2 kg de tara = 50.00 kg netos)
      fireEvent.click(btnGuardarPesada);

      // Verificar lista de canastillas registradas
      expect(screen.getByText(/Canastillas Registradas en el Lote/i)).toBeInTheDocument();
      expect(screen.getByText(/50\.00 kg/i)).toBeInTheDocument();
    });

    it('1.5 paso 3 liquidación: debe exhibir resumen de mermas y botón gigante de ingreso a frío >= 56px', () => {
      render(<BucaramangaReceivingWizard />);

      // Avanzar de Paso 1 a Paso 2 y registrar pesada
      fireEvent.click(screen.getByTestId('btn-continuar-bascula'));
      fireEvent.click(screen.getByTestId('btn-guardar-pesada'));

      // Avanzar al Paso 3 (El Frío y la Plata)
      const btnIrFrio = screen.getByTestId('btn-ir-frio-liquidar');
      expect(btnIrFrio.className).toContain('min-h-[56px]');
      fireEvent.click(btnIrFrio);

      // Resumen puesto en Bucaramanga y botón finalizador
      expect(screen.getByText(/Resumen de Liquidación Puesto en Bucaramanga/i)).toBeInTheDocument();
      const btnFinalizar = screen.getByTestId('btn-finalizar-recepcion');
      expect(btnFinalizar.className).toContain('min-h-[56px]');
      expect(btnFinalizar.className).toContain('bg-emerald-600');
    });
  });

  /* ==========================================================================
   * SECCIÓN 2: TRASLADOS A SUCURSALES (WarehouseTransferPanel)
   * ========================================================================== */
  describe('2. Traslados Internos a Sucursales - Wizard en 2 Toques', () => {
    it('2.1 debe cumplir con CERO etiquetas <img> y paleta Light Mode WCAG 2.2 AA+', () => {
      const { container } = render(
        <WarehouseTransferPanel bodegas={MOCK_BODEGAS} products={MOCK_PRODUCTS} />
      );

      const imgElements = container.querySelectorAll('img');
      expect(imgElements.length).toBe(0);

      // Fondos y bordes claros
      expect(container.firstChild).toHaveClass('text-slate-900');
    });

    it('2.2 paso 1: tarjetas táctiles de sucursal destino deben medir >= 56px y avanzar con 1 toque al Paso 2', () => {
      render(<WarehouseTransferPanel bodegas={MOCK_BODEGAS} products={MOCK_PRODUCTS} />);

      // Abrir modal o vista de nueva guía
      fireEvent.click(screen.getByText('Emitir Nueva Guía'));

      // Verificar que el paso 1 esté activo
      expect(screen.getByText(/1\. ¿A dónde lo enviamos\?/i)).toBeInTheDocument();

      // Las tarjetas de sucursal deben tener altura ergonómica
      const bodegaCards = screen.getAllByTestId('target-bodega-card');
      expect(bodegaCards.length).toBeGreaterThanOrEqual(2);
      bodegaCards.forEach((card) => {
        expect(
          card.className.includes('min-h-[56px]') ||
            card.className.includes('min-h-[64px]') ||
            card.className.includes('h-20')
        ).toBe(true);
      });

      // Tocar sucursal 'Mostrador Minorista POS' -> Debe avanzar automáticamente al Paso 2
      const targetCard = screen.getByTestId('target-bodega-bodega-pos');
      fireEvent.click(targetCard);

      // Validar que ahora está en el Paso 2
      expect(screen.getByText(/2\. ¿Qué producto y cuántos kilos\?/i)).toBeInTheDocument();
    });

    it('2.3 paso 2: botones de incremento rápido de kilos deben medir >= 48px y pre-seleccionar producto', () => {
      render(<WarehouseTransferPanel bodegas={MOCK_BODEGAS} products={MOCK_PRODUCTS} />);

      fireEvent.click(screen.getByText('Emitir Nueva Guía'));
      fireEvent.click(screen.getByTestId('target-bodega-bodega-pos'));

      // Los botones rápidos (+1 Kg, +5 Kg, +10 Kg, +20 Kg, etc.)
      const quickBtns = screen.getAllByTestId('quick-kilo-btn');
      expect(quickBtns.length).toBeGreaterThanOrEqual(4);

      quickBtns.forEach((btn) => {
        expect(
          btn.className.includes('min-h-[48px]') ||
            btn.className.includes('h-12') ||
            btn.className.includes('h-14')
        ).toBe(true);
      });

      // Tocar botón de +20 Kg (Canastilla)
      const btnCanastilla = screen.getByText(/\+20 Kg \(Canastilla\)/i);
      fireEvent.click(btnCanastilla);

      const inputKilos = screen.getByTestId('transfer-kilos-input') as HTMLInputElement;
      expect(parseFloat(inputKilos.value)).toBe(20);
    });

    it('2.4 validación de sobre-stock: debe prevenir traslados superiores al inventario físico en bodega central', () => {
      render(<WarehouseTransferPanel bodegas={MOCK_BODEGAS} products={MOCK_PRODUCTS} />);

      fireEvent.click(screen.getByText('Emitir Nueva Guía'));
      fireEvent.click(screen.getByTestId('target-bodega-bodega-pos'));

      // Seleccionar Mojarra (Stock en Central = 250 kg)
      const mojarraCard = screen.getByTestId('product-card-MOJ-ROJA-001');
      fireEvent.click(mojarraCard);

      // Ingresar 300 kg (mayor a 250 kg)
      const inputKilos = screen.getByTestId('transfer-kilos-input') as HTMLInputElement;
      fireEvent.change(inputKilos, { target: { value: '300' } });

      // Debe mostrar alerta de stock insuficiente y deshabilitar el botón de confirmación
      expect(screen.getByText(/Stock insuficiente en origen/i)).toBeInTheDocument();
      const submitBtn = screen.getByTestId('submit-transfer-btn') as HTMLButtonElement;
      expect(submitBtn.disabled).toBe(true);
    });

    it('2.5 botón de despacho: debe tener altura gigante >= 56px, fondo esmeralda y feedback táctil active:scale-95', () => {
      render(<WarehouseTransferPanel bodegas={MOCK_BODEGAS} products={MOCK_PRODUCTS} />);

      fireEvent.click(screen.getByText('Emitir Nueva Guía'));
      fireEvent.click(screen.getByTestId('target-bodega-bodega-pos'));

      // Tocar incremento rápido de +20 Kg para habilitar el formulario
      fireEvent.click(screen.getByText(/\+20 Kg \(Canastilla\)/i));

      const submitBtn = screen.getByTestId('submit-transfer-btn');
      expect(
        submitBtn.className.includes('min-h-[56px]') ||
          submitBtn.className.includes('h-14') ||
          submitBtn.className.includes('h-16')
      ).toBe(true);
      expect(submitBtn.className).toContain('bg-emerald-600');
      expect(submitBtn.className).toContain('active:scale-95');
    });
  });
});
