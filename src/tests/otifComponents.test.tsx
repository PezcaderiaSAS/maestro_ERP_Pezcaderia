import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  OtifKpiHeaderCards,
  OtifFilterBar,
  DriverPerformanceTable,
  ColdChainAuditTimeline,
  OtifAuditDetailTable,
} from '../views/logistics/components';
import type {
  OtifKpiSummary,
  OtifFilterParams,
  DriverPerformanceRecord,
  OtifStopRecord,
} from '../types/otif.types';

describe('Componentes Atómicos UI — Dashboard de Métricas OTIF (TASK-026-04)', () => {
  const mockKpis: OtifKpiSummary = {
    totalDespachos: 3,
    totalEntregas: 10,
    entregasOtif: 9,
    entregasOnTime: 9,
    entregasInFull: 10,
    entregasCadenaFrioConforme: 10,
    tasaOtifPorcentaje: 91.5,
    tasaOnTimePorcentaje: 93.2,
    tasaInFullPorcentaje: 98.4,
    tasaCadenaFrioPorcentaje: 99.1,
    montoTotalRecaudadoCop: 2500000,
    tiempoPromedioAtencionMinutos: 14,
  };

  const mockParadas: OtifStopRecord[] = [
    {
      manifiestoId: 'MAN-ID-01',
      pedidoId: 'PED-01',
      numeroPedido: 'PED-2026-001',
      clienteId: 'CLI-01',
      clienteNombre: 'Restaurante El Faro',
      conductorId: 'COND-01',
      conductorNombre: 'Carlos Gómez',
      vehiculoPlaca: 'ABC-123',
      numeroManifiesto: 'MAN-2026-10-001',
      zonaRuta: 'Zona Norte',
      jornadaPactada: 'MANANA',
      horaLimitePactada: '2026-10-23T12:00:00Z',
      horaLlegadaSitio: '2026-10-23T11:40:00Z',
      horaEntregaEfectiva: '2026-10-23T11:55:00Z',
      tiempoTransitoMinutos: 35,
      tiempoAtencionMinutos: 15,
      cumplimientoSLA: 'A_TIEMPO',
      onTime: true,
      inFull: true,
      isOtif: true,
      temperaturaSalidaCelsius: 3.2,
      temperaturaEntregaCelsius: 3.8,
      estadoCadenaFrio: 'CONFORME',
      formaPago: 'EFECTIVO',
      montoCobrado: 450000,
      estadoEntrega: 'ENTREGADO_TOTAL',
      tieneDevolucion: false,
      totalKilosDespachados: 25,
      totalKilosDevueltos: 0,
    },
    {
      manifiestoId: 'MAN-ID-02',
      pedidoId: 'PED-02',
      numeroPedido: 'PED-2026-002',
      clienteId: 'CLI-02',
      clienteNombre: 'Mariscos del Pacífico',
      conductorId: 'COND-02',
      conductorNombre: 'María Rodríguez',
      vehiculoPlaca: 'XYZ-789',
      numeroManifiesto: 'MAN-2026-10-002',
      zonaRuta: 'Zona Sur',
      jornadaPactada: 'MANANA',
      horaLimitePactada: '2026-10-23T12:00:00Z',
      horaLlegadaSitio: '2026-10-23T13:40:00Z',
      horaEntregaEfectiva: '2026-10-23T14:00:00Z',
      tiempoTransitoMinutos: 60,
      tiempoAtencionMinutos: 20,
      cumplimientoSLA: 'DEMORADO',
      onTime: false,
      inFull: false,
      isOtif: false,
      temperaturaSalidaCelsius: 4.8,
      temperaturaEntregaCelsius: 5.5,
      estadoCadenaFrio: 'ALERTA',
      formaPago: 'TRANSFERENCIA_DIGITAL',
      montoCobrado: 200000,
      estadoEntrega: 'ENTREGADO_PARCIAL',
      tieneDevolucion: true,
      totalKilosDespachados: 15,
      totalKilosDevueltos: 3,
    },
  ];

  const mockScorecard: DriverPerformanceRecord[] = [
    {
      conductorId: 'COND-01',
      conductorNombre: 'Carlos Gómez',
      vehiculoPlaca: 'ABC-123',
      pedidosAsignados: 5,
      pedidosEntregados: 5,
      pedidosOtifConformes: 5,
      entregasOnTime: 5,
      entregasInFull: 5,
      tasaOtifPorcentaje: 100,
      tasaOnTimePorcentaje: 100,
      tasaInFullPorcentaje: 100,
      tiempoPromedioAtencionMinutos: 12,
      totalCobradoEfectivoCop: 500000,
      totalCobradoTransferenciaCop: 0,
      totalCreditoEntregadoCop: 0,
      totalRecaudadoEnCalleCop: 500000,
    },
    {
      conductorId: 'COND-02',
      conductorNombre: 'María Rodríguez',
      vehiculoPlaca: 'XYZ-789',
      pedidosAsignados: 5,
      pedidosEntregados: 5,
      pedidosOtifConformes: 4,
      entregasOnTime: 4,
      entregasInFull: 5,
      tasaOtifPorcentaje: 80,
      tasaOnTimePorcentaje: 80,
      tasaInFullPorcentaje: 100,
      tiempoPromedioAtencionMinutos: 16,
      totalCobradoEfectivoCop: 200000,
      totalCobradoTransferenciaCop: 300000,
      totalCreditoEntregadoCop: 0,
      totalRecaudadoEnCalleCop: 500000,
    },
  ];

  it('OtifKpiHeaderCards debe renderizar las 5 métricas clave y badges de estado', () => {
    render(<OtifKpiHeaderCards kpis={mockKpis} />);

    expect(screen.getByText('OTIF Global')).toBeDefined();
    expect(screen.getByText('91.5%')).toBeDefined();
    expect(screen.getByText('En Alerta')).toBeDefined();

    expect(screen.getByText('A Tiempo (On-Time)')).toBeDefined();
    expect(screen.getByText('Completo (In-Full)')).toBeDefined();
    expect(screen.getByText('Cadena de Frío')).toBeDefined();
    expect(screen.getByText('Recaudo Ruta')).toBeDefined();
  });

  it('OtifFilterBar debe permitir interacción táctil con presets, filtros y exportación', () => {
    const alCambiarFiltro = vi.fn();
    const alCambiarPreset = vi.fn();
    const alLimpiarFiltros = vi.fn();
    const alExportarCsv = vi.fn();

    const mockFiltros: OtifFilterParams = {
      fechaDesde: '2026-10-23',
      fechaHasta: '2026-10-23',
      estatusSLA: 'TODOS',
    };

    render(
      <OtifFilterBar
        filtros={mockFiltros}
        presetActivo="HOY"
        conductoresDisponibles={[{ id: 'COND-01', nombre: 'Carlos Gómez' }]}
        zonasDisponibles={['Zona Norte', 'Zona Sur']}
        alCambiarFiltro={alCambiarFiltro}
        alCambiarPreset={alCambiarPreset}
        alLimpiarFiltros={alLimpiarFiltros}
        alExportarCsv={alExportarCsv}
      />
    );

    // Clic en preset de últimos 7 días
    const btn7Dias = screen.getByRole('button', { name: /Últimos 7 Días/i });
    fireEvent.click(btn7Dias);
    expect(alCambiarPreset).toHaveBeenCalledWith('7_DIAS');

    // Clic en exportar CSV
    const btnCsv = screen.getByRole('button', { name: /Exportar Excel \(CSV\)/i });
    fireEvent.click(btnCsv);
    expect(alExportarCsv).toHaveBeenCalledTimes(1);

    // Clic en limpiar filtros
    const btnLimpiar = screen.getByTitle('Restablecer filtros');
    fireEvent.click(btnLimpiar);
    expect(alLimpiarFiltros).toHaveBeenCalledTimes(1);
  });

  it('DriverPerformanceTable debe renderizar conductores y emitir evento de selección', () => {
    const alSeleccionarConductor = vi.fn();

    render(
      <DriverPerformanceTable
        scorecard={mockScorecard}
        alSeleccionarConductor={alSeleccionarConductor}
      />
    );

    expect(screen.getByText('Carlos Gómez')).toBeDefined();
    expect(screen.getByText('María Rodríguez')).toBeDefined();
    expect(screen.getByText('Excelente')).toBeDefined();
    expect(screen.getByText('Crítico')).toBeDefined();

    // Clic sobre una fila de conductor
    fireEvent.click(screen.getByText('Carlos Gómez'));
    expect(alSeleccionarConductor).toHaveBeenCalledWith('COND-01');
  });

  it('ColdChainAuditTimeline debe alertar sobre paradas con precaución y despiece', () => {
    render(<ColdChainAuditTimeline paradas={mockParadas} />);

    expect(screen.getByText(/Control y Auditoría de Cadena de Frío/i)).toBeDefined();
    expect(screen.getByText('1 Conformes')).toBeDefined();
    expect(screen.getByText('1 Alerta')).toBeDefined();
    expect(screen.getByText(/Devolución: 3 kg/i)).toBeDefined();
  });

  it('OtifAuditDetailTable debe listar paradas y permitir búsqueda reactiva en vivo', () => {
    render(<OtifAuditDetailTable paradas={mockParadas} />);

    expect(screen.getByText('Restaurante El Faro')).toBeDefined();
    expect(screen.getByText('Mariscos del Pacífico')).toBeDefined();

    // Filtrar por término de búsqueda
    const inputBusqueda = screen.getByPlaceholderText(/Buscar pedido, cliente, chofer/i);
    fireEvent.change(inputBusqueda, { target: { value: 'Faro' } });

    expect(screen.getByText('Restaurante El Faro')).toBeDefined();
    expect(screen.queryByText('Mariscos del Pacífico')).toBeNull();
  });
});
