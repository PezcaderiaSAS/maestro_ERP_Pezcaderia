import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExecutiveTrafficLightWidget } from '../views/dashboard/components/ExecutiveTrafficLightWidget';
import { PayrollWizard3Steps } from '../views/payroll/components/PayrollWizard3Steps';
import { useCashStore } from '../store/useCashStore';
import { useOrderStore } from '../store/useOrderStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { cashService } from '../services/cashService';
import { AppRouteId } from '../routes/AppRoute';

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

describe('Suite de Integración y Regla del Niño de 12 Años - Fase 4: Dashboard y Nómina Asistida (SPEC-018)', () => {
  const MOCK_EMPLEADOS = [
    {
      id: 'emp-1',
      nombre: 'Carlos Méndez',
      identificacion: '1098765432',
      rolAcceso: 'VENDEDOR' as const,
      cargo: 'Fileteador Experto',
      salarioBase: 1500000,
      fechaIngreso: '2025-01-01',
      tipoContrato: 'INDEFINIDO' as const,
      estado: 'ACTIVO' as const,
      prestamosActivos: 200000,
      auxilioTransporte: 162000,
      telefono: '3001234567',
      email: 'carlos@pezcaderia.com',
      riesgoARL: 'II' as const,
      aplicaExoneracion: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Estado inicial de Caja
    useCashStore.setState({
      activeShift: {
        id: 'shift-phase4-01',
        cajeroId: 'user-01',
        cajeroNombre: 'Yurgen Martinez',
        fechaInicio: new Date().toISOString(),
        fechaFin: null,
        montoInicial: 200000,
        montoEsperado: 450000,
        estado: 'ABIERTO',
        efectivoActual: 450000,
        bancosActual: 150000,
      },
    } as any);

    // Estado inicial de Pedidos B2B
    useOrderStore.setState({
      quotations: [
        {
          id: 'ped-ready-01',
          numeroPedido: 'PED-P4-01',
          clientName: 'Restaurante El Ancla',
          estado: 'LISTO',
          fecha: '2026-10-18',
          totalFinal: 320000,
        },
        {
          id: 'ped-route-01',
          numeroPedido: 'PED-P4-02',
          clientName: 'Hotel Hilton Cartagena',
          estado: 'EN_DESPACHO',
          fecha: '2026-10-18',
          totalFinal: 850000,
        },
      ] as any,
    });

    // Estado inicial de Inventario con buffer de seguridad
    useInventoryStore.setState({
      productsCatalog: [
        { id: 'prod-01', sku: 'SALM-01', nombre: 'Salmón Premium', activo: true },
        { id: 'prod-02', sku: 'ROB-02', nombre: 'Róbalo Fresco', activo: true },
      ] as any,
      stock: {
        'bodega-central': {
          'SALM-01': 2,
          'ROB-02': 0,
        },
      },
    });

    // Estado inicial de Empleados
    useEmployeeStore.setState({
      empleados: MOCK_EMPLEADOS,
      nominas: [],
    });
  });

  describe('1. ExecutiveTrafficLightWidget (Dashboard Táctil)', () => {
    it('debe renderizar los 3 semáforos ejecutivos con altura >= 100px y cero etiquetas <img>', () => {
      const onNavigateMock = vi.fn();
      const { container } = render(<ExecutiveTrafficLightWidget onNavigate={onNavigateMock} />);

      // Regla de Oro: Cero imágenes externas (100% SVG semántico)
      const images = container.querySelectorAll('img');
      expect(images.length).toBe(0);

      // Verificación de los 3 botones táctiles principales
      const btnCaja = screen.getByTestId('traffic-light-caja');
      const btnDespachos = screen.getByTestId('traffic-light-despachos');
      const btnStock = screen.getByTestId('traffic-light-stock');

      expect(btnCaja).toBeInTheDocument();
      expect(btnDespachos).toBeInTheDocument();
      expect(btnStock).toBeInTheDocument();

      // Ergonomía táctil para tablet de mostrador
      expect(btnCaja.className).toMatch(/min-h-\[100px\]/);
      expect(btnDespachos.className).toMatch(/min-h-\[100px\]/);
      expect(btnStock.className).toMatch(/min-h-\[100px\]/);
    });

    it('al hacer clic en cualquier semáforo debe redirigir a la vista operacional correspondiente', () => {
      const onNavigateMock = vi.fn();
      render(<ExecutiveTrafficLightWidget onNavigate={onNavigateMock} />);

      // 1. Clic en Caja
      fireEvent.click(screen.getByTestId('traffic-light-caja'));
      expect(onNavigateMock).toHaveBeenCalledWith(AppRouteId.CASH_DESK);

      // 2. Clic en Despachos
      fireEvent.click(screen.getByTestId('traffic-light-despachos'));
      expect(onNavigateMock).toHaveBeenCalledWith(AppRouteId.ORDERS_KANBAN);

      // 3. Clic en Stock
      fireEvent.click(screen.getByTestId('traffic-light-stock'));
      expect(onNavigateMock).toHaveBeenCalledWith(AppRouteId.INVENTORY);
    });
  });

  describe('2. PayrollWizard3Steps (Nómina Táctil en 3 Pasos)', () => {
    it('debe renderizar el Stepper asistido en 3 pasos con controles >= 48px y botón gigante de liquidación >= 56px', async () => {
      const onCloseMock = vi.fn();

      const { container } = render(
        <PayrollWizard3Steps
          isOpen={true}
          onClose={onCloseMock}
          initialType="REGULAR"
        />
      );

      // Regla de Oro: Cero etiquetas <img>
      expect(container.querySelectorAll('img').length).toBe(0);

      // Verificación de los 3 indicadores de paso
      expect(screen.getByTestId('step-indicator-1')).toBeInTheDocument();
      expect(screen.getByTestId('step-indicator-2')).toBeInTheDocument();
      expect(screen.getByTestId('step-indicator-3')).toBeInTheDocument();

      // Seleccionar colaborador Carlos Méndez con tarjeta táctil
      const employeeCard = screen.getByTestId('empleado-card-emp-1');
      expect(employeeCard).toBeInTheDocument();
      fireEvent.click(employeeCard);

      // Botón Continuar a Paso 2 (target >= 48px)
      const btnNextStep1 = screen.getByTestId('wizard-next-step-btn');
      expect(btnNextStep1).not.toBeDisabled();
      expect(btnNextStep1.className).toMatch(/min-h-\[48px\]|h-12/);
      fireEvent.click(btnNextStep1);

      // En Paso 2: Contenido de novedades
      expect(screen.getByTestId('wizard-step-2-content')).toBeInTheDocument();
      const btnNextStep2 = screen.getByTestId('wizard-to-step-3-btn');
      expect(btnNextStep2.className).toMatch(/min-h-\[48px\]|h-12/);
      fireEvent.click(btnNextStep2);

      // En Paso 3: Resumen y Liquidación con Botón Gigante >= 56px
      expect(screen.getByTestId('wizard-step-3-content')).toBeInTheDocument();
      const btnConfirmPayroll = screen.getByTestId('btn-confirm-payroll-payout');
      expect(btnConfirmPayroll).toBeInTheDocument();
      expect(btnConfirmPayroll.className).toMatch(/min-h-\[56px\]|h-14/);
    });

    it('al liquidar en efectivo debe registrar automáticamente el egreso en el turno activo de caja', async () => {
      const addGastoSpy = vi.spyOn(useExpenseStore.getState(), 'addGastoAsync');
      const spyRegistrarMovimiento = vi.spyOn(cashService, 'registrarMovimiento').mockResolvedValue({
        id: 'mov-payroll-test',
      } as any);

      const onCloseMock = vi.fn();
      const onSuccessMock = vi.fn();

      render(
        <PayrollWizard3Steps
          isOpen={true}
          onClose={onCloseMock}
          initialType="REGULAR"
          preselectedEmpleadoId="emp-1"
          onSuccess={onSuccessMock}
        />
      );

      // 1. Paso 1: Con empleado preseleccionado, avanzar directamente a Paso 2
      fireEvent.click(screen.getByTestId('wizard-next-step-btn'));

      // 2. Paso 2: Avanzar a Paso 3
      fireEvent.click(screen.getByTestId('wizard-to-step-3-btn'));

      // 3. Paso 3: Confirmar Liquidación y Desembolso
      const btnConfirmPayroll = screen.getByTestId('btn-confirm-payroll-payout');
      fireEvent.click(btnConfirmPayroll);

      await waitFor(() => {
        expect(addGastoSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            categoria: 'NÓMINA',
            monto: expect.any(Number),
            metodoPago: expect.any(String),
          })
        );
        expect(onSuccessMock).toHaveBeenCalled();
        expect(onCloseMock).toHaveBeenCalled();
      });

      // La nómina debe figurar como PAGADA en el store de empleados
      const nominas = useEmployeeStore.getState().nominas;
      expect(nominas.length).toBe(1);
      expect(nominas[0].empleadoId).toBe('emp-1');
      expect(nominas[0].estadoPago).toBe('PAGADO');
    });
  });
});
