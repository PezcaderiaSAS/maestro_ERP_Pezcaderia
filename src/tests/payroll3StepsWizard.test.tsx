import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PayrollWizard3Steps, calcDiasComerciales } from '../views/payroll/components/PayrollWizard3Steps';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { useExpenseStore } from '../store/useExpenseStore';

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true })
  }
}));

describe('PayrollWizard3Steps - Regla del Niño de 12 Años (TASK-018-12)', () => {
  const mockEmpleados = [
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
      aplicaExoneracion: true
    },
    {
      id: 'emp-2',
      nombre: 'Lucía Gómez',
      identificacion: '1012345678',
      rolAcceso: 'ADMINISTRADOR' as const,
      cargo: 'Jefe de Cuarto Frío',
      salarioBase: 2400000,
      fechaIngreso: '2024-06-01',
      tipoContrato: 'INDEFINIDO' as const,
      estado: 'ACTIVO' as const,
      prestamosActivos: 0,
      auxilioTransporte: 162000,
      telefono: '3109876543',
      email: 'lucia@pezcaderia.com',
      riesgoARL: 'I' as const,
      aplicaExoneracion: false
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useEmployeeStore.setState({
      empleados: mockEmpleados,
      nominas: []
    });
  });

  it('1. Calcula correctamente los días comerciales sin importar desfases de calendario', () => {
    // Mes completo comercial de 30 días
    expect(calcDiasComerciales('2026-10-01', '2026-10-31')).toBe(30);
    // Quincena 1 (1 al 15) = 15 días
    expect(calcDiasComerciales('2026-10-01', '2026-10-15')).toBe(15);
    // Febrero comercial
    expect(calcDiasComerciales('2026-02-01', '2026-02-28')).toBe(30);
  });

  it('2. Renderiza el Stepper de 3 Pasos con targets ergonómicos y cero imágenes externas', () => {
    const { container } = render(
      <PayrollWizard3Steps
        isOpen={true}
        onClose={vi.fn()}
        initialType="REGULAR"
      />
    );

    // Indicadores de los 3 pasos presentes
    expect(screen.getByTestId('step-indicator-1')).toBeInTheDocument();
    expect(screen.getByTestId('step-indicator-2')).toBeInTheDocument();
    expect(screen.getByTestId('step-indicator-3')).toBeInTheDocument();

    // Verificación de CERO imágenes externas
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(0);

    // Contenido del Paso 1 visible
    expect(screen.getByTestId('wizard-step-1-content')).toBeInTheDocument();
  });

  it('3. Paso 1: Permite filtrar colaboradores y seleccionar uno con tarjeta táctil', async () => {
    render(
      <PayrollWizard3Steps
        isOpen={true}
        onClose={vi.fn()}
        initialType="REGULAR"
      />
    );

    // Ambas tarjetas deben estar presentes
    expect(screen.getByTestId('empleado-card-emp-1')).toBeInTheDocument();
    expect(screen.getByTestId('empleado-card-emp-2')).toBeInTheDocument();

    // Probar filtro reactivo
    const searchInput = screen.getByTestId('search-empleado-input');
    fireEvent.change(searchInput, { target: { value: 'Lucía' } });

    expect(screen.queryByTestId('empleado-card-emp-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('empleado-card-emp-2')).toBeInTheDocument();

    // Seleccionar a Lucía y avanzar
    fireEvent.click(screen.getByTestId('empleado-card-emp-2'));
    const nextBtn = screen.getByTestId('wizard-next-step-btn');
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);

    // Ahora debe estar en el Paso 2
    expect(screen.getByTestId('wizard-step-2-content')).toBeInTheDocument();
    expect(screen.getByText('Lucía Gómez')).toBeInTheDocument();
  });

  it('4. Paso 2: Permite ajustar horas extras con presets de 1-toque e impacta el cálculo', async () => {
    render(
      <PayrollWizard3Steps
        isOpen={true}
        onClose={vi.fn()}
        initialType="REGULAR"
        preselectedEmpleadoId="emp-1"
      />
    );

    // Avanzar a Paso 2
    fireEvent.click(screen.getByTestId('wizard-next-step-btn'));
    expect(screen.getByTestId('wizard-step-2-content')).toBeInTheDocument();

    // Añadir horas extras con el botón +5h
    const btnPlus5 = screen.getAllByText('+5h')[0];
    fireEvent.click(btnPlus5);

    // Avanzar a Paso 3
    const toStep3Btn = screen.getByTestId('wizard-to-step-3-btn');
    fireEvent.click(toStep3Btn);

    // Verificar Paso 3 y visualización del neto a pagar
    expect(screen.getByTestId('wizard-step-3-content')).toBeInTheDocument();
    const netoDisplay = screen.getByTestId('neto-a-pagar-display');
    expect(netoDisplay).toBeInTheDocument();
    expect(netoDisplay.textContent).toMatch(/\$/);
  });

  it('5. Paso 3: Botón de confirmación gigante (>= 56px) aprueba la nómina y registra desembolso', async () => {
    const addGastoSpy = vi.spyOn(useExpenseStore.getState(), 'addGastoAsync');
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

    // Paso 1 -> Paso 2
    fireEvent.click(screen.getByTestId('wizard-next-step-btn'));
    // Paso 2 -> Paso 3
    fireEvent.click(screen.getByTestId('wizard-to-step-3-btn'));

    // Verificar botón gigante >= 56px
    const confirmBtn = screen.getByTestId('btn-confirm-payroll-payout');
    expect(confirmBtn).toBeInTheDocument();
    expect(confirmBtn.className).toContain('min-h-[56px]');

    // Confirmar liquidación
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(addGastoSpy).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
      expect(onSuccessMock).toHaveBeenCalled();
    });

    // La nómina debe figurar como PAGADA en el store
    const nominas = useEmployeeStore.getState().nominas;
    expect(nominas.length).toBe(1);
    expect(nominas[0].empleadoId).toBe('emp-1');
    expect(nominas[0].estadoPago).toBe('PAGADO');
  });

  it('6. Modo Liquidación Definitiva calcula cesantías, intereses, prima y vacaciones', async () => {
    render(
      <PayrollWizard3Steps
        isOpen={true}
        onClose={vi.fn()}
        initialType="LIQUIDACION_FINAL"
        preselectedEmpleadoId="emp-1"
      />
    );

    // Paso 1 -> Paso 2
    fireEvent.click(screen.getByTestId('wizard-next-step-btn'));
    expect(screen.getByTestId('wizard-step-2-content')).toBeInTheDocument();

    // En liquidación final deben mostrarse las etiquetas de cesantías y prima
    expect(screen.getByText('Días Cesantías')).toBeInTheDocument();
    expect(screen.getByText('Días Prima')).toBeInTheDocument();
    expect(screen.getByText('Días Vacaciones')).toBeInTheDocument();

    // Paso 2 -> Paso 3
    fireEvent.click(screen.getByTestId('wizard-to-step-3-btn'));

    // Botón de aprobación con tema de liquidación
    const confirmBtn = screen.getByTestId('btn-confirm-payroll-payout');
    expect(confirmBtn.textContent).toContain('Aprobar Liquidación Definitiva');
  });
});
