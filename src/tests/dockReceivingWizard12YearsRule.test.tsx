import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DockReceivingWizard } from '../views/purchases/components/DockReceivingWizard';
import { useSupplierStore } from '../store/useSupplierStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { dockPurchasesReceivingService } from '../services/dockPurchasesReceivingService';

// Mock de SweetAlert2 para pruebas de UI
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true })
  }
}));

describe('TASK-022-05: Wizard Asistido Modular de Muelle ("Regla del Niño de 12 Años")', () => {
  beforeEach(() => {
    // Inicializar store de proveedores con un proveedor de prueba
    useSupplierStore.setState({
      proveedores: [
        {
          id: 'prov-buenaventura-1',
          nombre: 'Pescadores del Pacífico S.A.S',
          nit: '900888777-1',
          tipoIdentificacion: 'NIT',
          direccion: 'Muelle La Pagoda Bodega 4',
          telefono: '3151234567',
          email: 'contacto@pacificomuelle.com',
          ciudad: 'Buenaventura',
          plazoPagoDias: 15,
          activo: true
        }
      ]
    });

    // Inicializar store de inventario con productos marinos
    useInventoryStore.setState({
      products: [
        {
          id: 'prod-corvina',
          sku: 'PES-CORV-01',
          nombre: 'Corvina de Muelle Fresca',
          categoria: 'Pescados',
          precio_compra: 18000,
          precio_venta_pos: 24000,
          precio_venta_restaurante: 22000,
          precio_venta_mayorista: 20000,
          buffer_seguridad: 10,
          activo: true
        }
      ]
    });
  });

  it('1. Renderiza Paso 1 (Furgón & Frío) sin etiquetas <img> y con botón principal >= 56px', () => {
    const { container } = render(<DockReceivingWizard />);

    // Verificar indicador de stepper
    expect(screen.getByTestId('wizard-step-indicator-1')).toBeDefined();
    expect(screen.getByTestId('step1-furgon-cadena-frio')).toBeDefined();

    // Regla del Niño de 12 Años: Cero etiquetas <img>
    expect(container.querySelectorAll('img')).toHaveLength(0);

    // Botón principal de avance >= 56px (h-14 o min-h-[56px])
    const btnNext = screen.getByTestId('btn-step1-next');
    expect(btnNext.className).toContain('min-h-[56px]');
    expect(btnNext.className).toContain('h-14');
  });

  it('2. Valida campos obligatorios en Paso 1 impidiendo avanzar sin proveedor o placa', () => {
    render(<DockReceivingWizard />);

    const btnNext = screen.getByTestId('btn-step1-next');
    fireEvent.click(btnNext);

    // Debe mostrar error de validación
    expect(screen.getByTestId('step1-validation-error')).toBeDefined();
    expect(screen.getByText(/Por favor seleccione o cree un proveedor/i)).toBeDefined();
  });

  it('3. Permite seleccionar proveedor, ingresar placa y avanzar fluidamente al Paso 2', () => {
    render(<DockReceivingWizard />);

    // Seleccionar proveedor
    const selectProv = screen.getByTestId('select-supplier');
    fireEvent.change(selectProv, { target: { value: 'prov-buenaventura-1' } });

    // Ingresar placa
    const inputPlaca = screen.getByTestId('input-vehicle-plate');
    fireEvent.change(inputPlaca, { target: { value: 'TRK-987' } });

    // Avanzar a Paso 2
    const btnNext = screen.getByTestId('btn-step1-next');
    fireEvent.click(btnNext);

    // Verificar que estamos en Paso 2 (Báscula)
    expect(screen.getByTestId('step2-bascula-canastillas')).toBeDefined();
    expect(screen.getByTestId('muelle-weight-scale-widget')).toBeDefined();

    // Botón de avanzar en Paso 2 debe estar deshabilitado al no haber pesadas registradas
    const btnNextStep2 = screen.getByTestId('btn-step2-next');
    expect(btnNextStep2.hasAttribute('disabled')).toBe(true);
  });

  it('4. Permite agregar una pesada con deducción metrológica, renderiza tabla y botón eliminar >= 48px', () => {
    render(<DockReceivingWizard />);

    // Llenar Paso 1
    fireEvent.change(screen.getByTestId('select-supplier'), { target: { value: 'prov-buenaventura-1' } });
    fireEvent.change(screen.getByTestId('input-vehicle-plate'), { target: { value: 'TRK-987' } });
    fireEvent.click(screen.getByTestId('btn-step1-next'));

    // En Paso 2, ingresar peso bruto en báscula
    const inputPeso = screen.getByTestId('input-peso-bruto');
    fireEvent.change(inputPeso, { target: { value: '108.0' } });

    // Registrar la pesada
    const btnAddPesada = screen.getByTestId('btn-add-weighing-item');
    fireEvent.click(btnAddPesada);

    // Verificar que la tabla de partidas se renderiza
    expect(screen.getByTestId('table-partidas-muelle')).toBeDefined();
    expect(screen.getByText('Corvina de Muelle Fresca')).toBeDefined();

    // Botón eliminar pesada debe tener tamaño táctil >= 48px
    const btnRemove = screen.getByTestId('btn-remove-partida-0');
    expect(btnRemove.className).toContain('min-h-[48px]');
    expect(btnRemove.className).toContain('min-w-[48px]');

    // Botón de avance al Paso 3 ahora debe estar habilitado
    const btnNextStep2 = screen.getByTestId('btn-step2-next');
    expect(btnNextStep2.hasAttribute('disabled')).toBe(false);
  });

  it('5. Flujo completo: Paso 1 -> Paso 2 -> Paso 3, alternando formas de pago y confirmando con éxito', async () => {
    const finalizarSpy = vi.spyOn(dockPurchasesReceivingService, 'finalizarRecepcion').mockResolvedValueOnce({
      consecutivoMuelle: 'REC-20261019-001',
      proveedorNombre: 'Pescadores del Pacífico S.A.S',
      totalKilosNetos: 100.7,
      totalCompraCOP: 1812600,
      formaPago: 'CREDITO (15 días)',
      lotesGenerados: [
        {
          loteId: 'lote-123',
          codigoLote: 'LOT-20261019-PES-001',
          productoId: 'prod-corvina',
          productoNombre: 'Corvina de Muelle Fresca',
          pesoNetoKg: 100.7,
          fechaVencimiento: '2026-10-27'
        }
      ],
      cuentaPorPagarId: 'CXP-20261019-001',
      createdAt: '2026-10-19T07:00:00'
    });

    const onFinishedMock = vi.fn();

    render(<DockReceivingWizard onFinished={onFinishedMock} />);

    // 1. Paso 1
    fireEvent.change(screen.getByTestId('select-supplier'), { target: { value: 'prov-buenaventura-1' } });
    fireEvent.change(screen.getByTestId('input-vehicle-plate'), { target: { value: 'TRK-987' } });
    fireEvent.click(screen.getByTestId('btn-step1-next'));

    // 2. Paso 2: Registrar partida
    fireEvent.change(screen.getByTestId('input-peso-bruto'), { target: { value: '108.0' } });
    fireEvent.click(screen.getByTestId('btn-add-weighing-item'));
    fireEvent.click(screen.getByTestId('btn-step2-next'));

    // 3. Paso 3: Liquidación & Entrada a Frío
    expect(screen.getByTestId('step3-liquidacion-frio')).toBeDefined();
    expect(screen.getByTestId('display-total-compra-cop')).toBeDefined();

    // Seleccionar forma de pago Crédito
    fireEvent.click(screen.getByTestId('btn-payment-credito'));
    expect(screen.getByTestId('panel-credito-presets')).toBeDefined();

    // Seleccionar preset de 15 días
    fireEvent.click(screen.getByTestId('btn-credit-preset-15'));

    // Botón gigante final >= 56px
    const btnConfirm = screen.getByTestId('btn-confirm-dock-receiving');
    expect(btnConfirm.className).toContain('min-h-[56px]');
    expect(btnConfirm.className).toContain('h-14');

    // Confirmar recepción
    fireEvent.click(btnConfirm);

    await waitFor(() => {
      expect(finalizarSpy).toHaveBeenCalledTimes(1);
      expect(onFinishedMock).toHaveBeenCalledTimes(1);
    });

    // Vista de éxito con consecutivo y botón de imprimir
    await waitFor(() => {
      expect(screen.getByTestId('dock-receiving-success-view')).toBeDefined();
      expect(screen.getByText('REC-20261019-001')).toBeDefined();
      expect(screen.getByTestId('btn-print-dock-act')).toBeDefined();
    });
  });
});
