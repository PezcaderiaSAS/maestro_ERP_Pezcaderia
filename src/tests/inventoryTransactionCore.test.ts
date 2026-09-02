import { describe, it, expect, beforeEach } from 'vitest';
import {
  calcularNuevoCPP,
  registrarMovimientoKardex,
  obtenerKardex,
  procesarDespieceConProrrateo,
  crearComandaProcesamiento,
  obtenerComandasProcesamiento,
  actualizarEstadoComanda,
  crearGuiaTraslado,
  confirmarRecepcionTraslado,
  obtenerTraslados,
  obtenerLotesFEFO,
  registrarLoteFEFO,
  registrarEntrada,
} from '../services/inventoryService';
import { save } from '../services/localDb';
import type { Producto } from '../types/inventory.types';

describe('Inventory Service Core - Tarea 2 Suite', () => {
  beforeEach(() => {
    // Reset test database
    save('stock', {});
    save('movimientos', []);
    save('kardex_movements', []);
    save('processing_orders', []);
    save('warehouse_transfers', []);
    save('inventory_batches', []);
    save('productsCatalog', [
      { id: 'prod-salmon-entero', sku: 'SALM-001', nombre: 'Salmón Entero Fresco', unidadMedida: 'kg' },
      { id: 'prod-filete-salmon', sku: 'SALM-002', nombre: 'Filete de Salmón Premium', unidadMedida: 'kg' },
      { id: 'prod-porciones-salmon', sku: 'SALM-003', nombre: 'Porciones de Salmón', unidadMedida: 'kg' },
      { id: 'prod-espinas-salmon', sku: 'SALM-004', nombre: 'Espinas para Caldo', unidadMedida: 'kg' },
    ]);
  });

  describe('1. Cálculo de Costo Promedio Ponderado (CPP / NIC 2)', () => {
    it('debe calcular correctamente el CPP ponderado continuo', () => {
      // Stock inicial: 100 kg @ $30,000. Compra: 50 kg @ $36,000.
      // Total esperado: ((100 * 30,000) + (50 * 36,000)) / 150 = (3,000,000 + 1,800,000) / 150 = $32,000
      const nuevoCpp = calcularNuevoCPP(100, 30000, 50, 36000);
      expect(nuevoCpp).toBe(32000);
    });

    it('debe manejar guard clause cuando el stock previo es 0 o negativo', () => {
      const nuevoCpp = calcularNuevoCPP(0, 0, 50, 25000);
      expect(nuevoCpp).toBe(25000);
    });

    it('debe retornar cppActual si la cantidad de entrada es 0', () => {
      const cpp = calcularNuevoCPP(100, 30000, 0, 40000);
      expect(cpp).toBe(30000);
    });
  });

  describe('2. Kardex Contable NIIF Inmutable', () => {
    it('debe registrar entrada y acumular saldo y CPP', () => {
      const res = registrarMovimientoKardex({
        producto_id: 'prod-salmon-entero',
        sku: 'SALM-001',
        nombre_producto: 'Salmón Entero Fresco',
        tipo_movimiento: 'ENTRADA_COMPRA',
        cantidad_kg: 100,
        costo_unitario: 30000,
        costo_total: 3000000,
        documento_referencia: 'FAC-001',
        usuario_responsable: 'Admin',
      });

      expect(res.error).toBeNull();
      expect(res.data?.saldo_cantidad_kg).toBe(100);
      expect(res.data?.saldo_costo_promedio).toBe(30000);
      expect(res.data?.saldo_valor_total).toBe(3000000);

      const historial = obtenerKardex({ sku: 'SALM-001' });
      expect(historial.length).toBe(1);
    });
  });

  describe('3. Despiece con Prorrateo por Valor de Mercado', () => {
    it('debe realizar balance de masa y cuadrar 100% el costo entre los cortes', () => {
      // 1. Ingresar 100 kg de Materia Prima a bodega-1
      registrarEntrada({
        bodegaId: 'bodega-1',
        productoId: 'prod-salmon-entero',
        cantidad: 100,
      });

      // 2. Procesar despiece: 100 kg @ $30,000/kg = $3,000,000 MP
      // Cortes: Filete 65 kg (1.3x), Porciones 15 kg (1.1x), Espinas 10 kg (0.3x). Merma = 10 kg
      const resultado = procesarDespieceConProrrateo({
        materia_prima_id: 'prod-salmon-entero',
        materia_prima_nombre: 'Salmón Entero Fresco',
        bodega_id: 'bodega-1',
        peso_inicial_kg: 100,
        costo_unitario_mp: 30000,
        costo_total_mp: 3000000,
        cortes_obtenidos: [
          {
            producto_id: 'prod-filete-salmon',
            sku: 'SALM-002',
            nombre_corte: 'Filete de Salmón Premium',
            peso_obtenido_kg: 65,
            factor_valor_mercado: 1.3,
            costo_asignado_unitario: 0,
            costo_asignado_total: 0,
          },
          {
            producto_id: 'prod-porciones-salmon',
            sku: 'SALM-003',
            nombre_corte: 'Porciones de Salmón',
            peso_obtenido_kg: 15,
            factor_valor_mercado: 1.1,
            costo_asignado_unitario: 0,
            costo_asignado_total: 0,
          },
          {
            producto_id: 'prod-espinas-salmon',
            sku: 'SALM-004',
            nombre_corte: 'Espinas para Caldo',
            peso_obtenido_kg: 10,
            factor_valor_mercado: 0.3,
            costo_asignado_unitario: 0,
            costo_asignado_total: 0,
          },
        ],
        merma_no_aprovechable_kg: 10,
        merma_porcentaje: 10,
        usuario_responsable: 'Chef Cortes',
        fecha: new Date().toISOString(),
      });

      expect(resultado.error).toBeNull();
      expect(resultado.data?.mermaKg).toBe(10);
      expect(resultado.data?.mermaPct).toBe(10);

      // Verificar que la suma de costos de los cortes sea exactamente $3,000,000 (cuadre contable)
      const sumaCostos = resultado.data?.cortesProcesados.reduce((acc, c) => acc + c.costo_asignado_total, 0);
      expect(sumaCostos).toBe(3000000);
    });
  });

  describe('4. Comandas de Despiece de Cuarto Frío', () => {
    it('debe crear y gestionar el ciclo de vida de una comanda', () => {
      const creacion = crearComandaProcesamiento({
        origen: 'POS_MOSTRADOR',
        producto_solicitado_id: 'prod-filete-salmon',
        sku_solicitado: 'SALM-002',
        nombre_producto_solicitado: 'Filete de Salmón',
        cantidad_solicitada_kg: 5,
        prioridad: 'ALTA',
        materia_prima_disponible_id: 'prod-salmon-entero',
        materia_prima_nombre: 'Salmón Entero Fresco',
      });

      expect(creacion.error).toBeNull();
      expect(creacion.data?.estado).toBe('PENDIENTE');

      const pendientes = obtenerComandasProcesamiento('PENDIENTE');
      expect(pendientes.length).toBe(1);

      const actualizacion = actualizarEstadoComanda(creacion.data!.id, 'EN_CORTE', 'Operario 1');
      expect(actualizacion.data?.estado).toBe('EN_CORTE');
      expect(actualizacion.data?.responsable_corte).toBe('Operario 1');
    });
  });

  describe('5. Traslados Multibodega', () => {
    it('debe crear guía en tránsito y confirmar recepción acreditando en destino', () => {
      // 1. Ingresar stock en Bodega Principal
      registrarEntrada({
        bodegaId: 'bodega-principal',
        productoId: 'prod-salmon-entero',
        cantidad: 50,
      });

      // 2. Crear traslado a Punto de Venta
      const guia = crearGuiaTraslado({
        bodega_origen_id: 'bodega-principal',
        bodega_origen_nombre: 'Cuarto Frío Principal',
        bodega_destino_id: 'bodega-pos',
        bodega_destino_nombre: 'Mostrador POS',
        usuario_despacha: 'Bodeguero Central',
        items: [
          {
            producto_id: 'prod-salmon-entero',
            sku: 'SALM-001',
            nombre: 'Salmón Entero',
            cantidad_kg: 20,
            costo_unitario: 30000,
          },
        ],
      });

      expect(guia.error).toBeNull();
      expect(guia.data?.estado).toBe('EN_TRANSITO');

      // 3. Confirmar recepción en destino
      const recepcion = confirmarRecepcionTraslado(guia.data!.id, 'Cajero POS');
      expect(recepcion.error).toBeNull();
      expect(recepcion.data?.estado).toBe('RECIBIDO_CONFORME');

      const traslados = obtenerTraslados('RECIBIDO_CONFORME');
      expect(traslados.length).toBe(1);
    });
  });

  describe('6. Trazabilidad FEFO de Lotes', () => {
    it('debe calcular días restantes y estado semafórico', () => {
      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 5); // 5 días -> CRITICO (<10d)

      const reg = registrarLoteFEFO({
        producto_id: 'prod-salmon-entero',
        sku: 'SALM-001',
        numero_lote: 'LOT-2026-001',
        fecha_ingreso: new Date().toISOString(),
        fecha_vencimiento: fechaFutura.toISOString(),
        cantidad_inicial_kg: 100,
        cantidad_disponible_kg: 100,
        bodega_id: 'bodega-1',
        bodega_nombre: 'Cuarto Frío 1',
        costo_compra_unitario: 30000,
      });

      expect(reg.error).toBeNull();
      expect(reg.data?.estado).toBe('CRITICO');

      const lotes = obtenerLotesFEFO('SALM-001');
      expect(lotes.length).toBe(1);
      expect(lotes[0].estado).toBe('CRITICO');
    });
  });
});
