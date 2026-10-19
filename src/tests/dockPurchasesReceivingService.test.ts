import { describe, it, expect, beforeEach } from 'vitest';
import { dockPurchasesReceivingService } from '../services/dockPurchasesReceivingService';
import { accountsPayableService } from '../services/accountsPayableService';
import { cashService } from '../services/cashService';
import * as inventoryService from '../services/inventoryService';

describe('TASK-022-03: dockPurchasesReceivingService - Orquestador Transaccional de Muelle & FEFO', () => {
  beforeEach(() => {
    localStorage.clear();
    dockPurchasesReceivingService.limpiarEnMemoria();
    accountsPayableService.limpiarEnMemoria();
  });

  describe('1. Recepción a Crédito Comercial con Lotes FEFO y CxP', () => {
    it('Procesa una recepción a crédito generando lotes FEFO y causación en CxP', () => {
      const input = {
        proveedorId: 'PROV-PACIFICO-01',
        proveedorNombre: 'Pesquera del Pacífico S.A.S.',
        proveedorNit: '900.123.456-7',
        placaVehiculo: 'WKL-482',
        conductorNombre: 'Carlos Benítez',
        temperaturaCava: 2.5,
        fechaFaena: '2026-10-19',
        tipoConservacion: 'FRESCO' as const,
        formaPago: 'CREDITO' as const,
        diasCredito: 15,
        bodegaDestinoId: '1',
        bodegaDestinoNombre: 'Bodega Principal',
        partidas: [
          {
            productoId: 'prod-mojarra-roja',
            productoNombre: 'Mojarra Roja Entera',
            sku: 'MOJ-ROJ-01',
            cantidadCanastillas: 4, // 4 * 2.0 = 8.0 kg tara
            pesoBrutoKg: 108.0,    // 108 - 8 = 100 kg con hielo
            porcentajeHielo: 5,     // 5% hielo = 5 kg -> 95 kg netos
            precioKgAcordado: 14500 // 95 * 14500 = 1.377.500 COP
          },
          {
            productoId: 'prod-salmon-chileno',
            productoNombre: 'Salmón Chileno Fresco',
            sku: 'SALM-CHIL-01',
            cantidadCanastillas: 2, // 2 * 2.0 = 4.0 kg tara
            pesoBrutoKg: 54.0,     // 54 - 4 = 50 kg con hielo
            porcentajeHielo: 0,     // 0% hielo = 0 kg -> 50 kg netos
            precioKgAcordado: 48000 // 50 * 48000 = 2.400.000 COP
          }
        ]
      };

      const resultado = dockPurchasesReceivingService.procesarRecepcionMuelle(input);

      expect(resultado.consecutivoMuelle).toMatch(/^REC-20261019-\d{4}$/);
      expect(resultado.totalKilosNetos).toBe(145.0); // 95 + 50
      expect(resultado.totalCompraCOP).toBe(3777500); // 1.377.500 + 2.400.000
      expect(resultado.formaPago).toBe('CREDITO');
      expect(resultado.cuentaPorPagarId).toBeDefined();

      // Verificar Lotes FEFO generados en inventoryService
      expect(resultado.lotesGenerados).toHaveLength(2);
      expect(resultado.lotesGenerados[0].codigoLote).toMatch(/^LOT-20261019-PACIFICO-0001$/);
      expect(resultado.lotesGenerados[0].pesoNetoKg).toBe(95.0);
      expect(resultado.lotesGenerados[0].fechaVencimiento).toBe('2026-10-27'); // +8 días fresco


      expect(resultado.lotesGenerados[1].pesoNetoKg).toBe(50.0);

      // Verificar que los lotes están registrados en inventoryService
      const lotesEnWms = inventoryService.obtenerLotesFEFO();
      expect(lotesEnWms.length).toBeGreaterThanOrEqual(2);

      // Verificar que se causó en cuentas_por_pagar
      const cuentas = accountsPayableService.obtenerTodas();
      expect(cuentas).toHaveLength(1);
      expect(cuentas[0].id).toBe(resultado.cuentaPorPagarId);
      expect(cuentas[0].saldoPendiente).toBe(3777500);
      expect(cuentas[0].fechaVencimiento).toBe('2026-11-03'); // 2026-10-19 + 15 días
    });
  });

  describe('2. Recepción de Contado Integrada con Turno de Caja', () => {
    it('Debita el monto de la compra en el turno de caja abierto', () => {
      // 1. Abrir caja y turno
      const caja = cashService.getCajas()[0] || cashService.guardarCaja({
        id: 'caja-test-1',
        bodegaId: '1',
        nombre: 'Caja Principal Mostrador',
        tipo: 'MAYOR',
        activa: true

      }).data!;

      const apertura = cashService.abrirTurno({
        cajaId: caja.id,
        cajeroId: 'cajero-test',
        baseInicial: 5000000
      });
      expect(apertura.data).toBeDefined();

      const input = {
        proveedorId: 'PROV-PESCADOR-LOCAL',
        proveedorNombre: 'Don Pedro Pescador',
        proveedorNit: '1098765432',
        placaVehiculo: 'XYZ-123',
        conductorNombre: 'Pedro Martínez',
        temperaturaCava: 3.0,
        fechaFaena: '2026-10-19',
        tipoConservacion: 'FRESCO' as const,
        formaPago: 'CONTADO' as const,
        bodegaDestinoId: '1',
        bodegaDestinoNombre: 'Bodega Principal',
        partidas: [
          {
            productoId: 'prod-bocachico',
            productoNombre: 'Bocachico Criollo',
            cantidadCanastillas: 2,
            pesoBrutoKg: 44.0, // 44 - 4 = 40 kg netos (0% hielo)
            porcentajeHielo: 0,
            precioKgAcordado: 12000 // 40 * 12000 = 480.000 COP
          }
        ]
      };

      const resultado = dockPurchasesReceivingService.procesarRecepcionMuelle(input);
      expect(resultado.totalCompraCOP).toBe(480000);
      expect(resultado.movimientoCajaId).toBeDefined();

      // Verificar que el turno de caja se decrementó
      const turnoActivo = cashService.getTurnos().find(t => t.id === apertura.data!.id);
      expect(turnoActivo?.totalEfectivo).toBe(5000000 - 480000);
    });

    it('Arroja error si la forma de pago es CONTADO y no hay ningún turno de caja abierto', () => {
      const input = {
        proveedorId: 'PROV-PESCADOR-LOCAL',
        proveedorNombre: 'Don Pedro Pescador',
        proveedorNit: '1098765432',
        placaVehiculo: 'XYZ-123',
        conductorNombre: 'Pedro Martínez',
        temperaturaCava: 3.0,
        fechaFaena: '2026-10-19',
        tipoConservacion: 'FRESCO' as const,
        formaPago: 'CONTADO' as const,
        partidas: [
          {
            productoId: 'prod-bocachico',
            productoNombre: 'Bocachico Criollo',
            cantidadCanastillas: 1,
            pesoBrutoKg: 22.0,
            porcentajeHielo: 0,
            precioKgAcordado: 12000
          }
        ]
      };

      expect(() => {
        dockPurchasesReceivingService.procesarRecepcionMuelle(input);
      }).toThrow(/No hay ningún turno de caja abierto para registrar el egreso de contado/);
    });
  });

  describe('3. Validaciones de Inconsistencia y Rechazo Atómico', () => {
    it('Rechaza y no genera lotes ni compras si alguna pesada tiene peso menor o igual a tara', () => {
      const inputInvalido = {
        proveedorId: 'PROV-1',
        proveedorNombre: 'Proveedor Test',
        proveedorNit: '12345',
        placaVehiculo: 'AAA-111',
        conductorNombre: 'Conductor Test',
        temperaturaCava: 2.0,
        fechaFaena: '2026-10-19',
        tipoConservacion: 'FRESCO' as const,
        formaPago: 'CREDITO' as const,
        diasCredito: 15,
        partidas: [
          {
            productoId: 'prod-1',
            productoNombre: 'Pescado 1',
            cantidadCanastillas: 3, // Tara = 6.0 kg
            pesoBrutoKg: 5.5,      // 5.5 <= 6.0 kg (Inconsistente)
            porcentajeHielo: 0,
            precioKgAcordado: 10000
          }
        ]
      };

      expect(() => {
        dockPurchasesReceivingService.procesarRecepcionMuelle(inputInvalido);
      }).toThrow(/El peso bruto.*debe ser superior al peso de las canastillas/);

      // Verificar que NO se crearon lotes ni cuentas por pagar
      expect(dockPurchasesReceivingService.obtenerHistorialRecepciones()).toHaveLength(0);
      expect(accountsPayableService.obtenerTodas()).toHaveLength(0);
    });
  });
});
