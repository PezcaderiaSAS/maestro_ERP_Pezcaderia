import { describe, it, expect, beforeEach } from 'vitest';
import {
  cashService,
  getCategoriasGastos,
  crearCategoriaGasto,
  obtenerCategoriasMasUsadas,
  CATEGORIAS_SEMILLA_GASTOS,
} from '../services/cashService';
import * as localDb from '../services/localDb';
import { MovimientoCaja, TurnoCaja } from '../types/cash.types';

describe('Módulo 005: Categorías Rápidas e Inteligentes de Egresos de Caja Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reiniciar base de datos local
    localDb.save('categoriasGastos', CATEGORIAS_SEMILLA_GASTOS);
    localDb.save('cajas', []);
    localDb.save('turnosCaja', []);
    localDb.save('movimientosCaja', []);
  });

  it('1. Debe inicializar el catálogo semilla con las 8 categorías estándar del negocio', () => {
    const categorias = getCategoriasGastos();
    expect(categorias.length).toBeGreaterThanOrEqual(8);

    const nombres = categorias.map((c) => c.nombre);
    expect(nombres).toContain('Flete Camión');
    expect(nombres).toContain('Pago Pescado');
    expect(nombres).toContain('Hielo / Cavas');
    expect(nombres).toContain('Insumos Bodega');
    expect(nombres).toContain('Pago Domicilios');
    expect(nombres).toContain('Cafetería / Refrigerios');
    expect(nombres).toContain('Aseo y Limpieza');
  });

  it('2. Debe permitir crear una categoría rápida en caliente (in-flight) y persistirla', () => {
    const nueva = crearCategoriaGasto({
      nombre: 'Domicilios Bucaramanga Express',
      icono: '🛵',
      colorBadge: 'emerald',
      descripcion: 'Entregas en moto área metropolitana',
    });

    expect(nueva.id).toBeDefined();
    expect(nueva.nombre).toBe('Domicilios Bucaramanga Express');
    expect(nueva.icono).toBe('🛵');
    expect(nueva.activa).toBe(true);

    const todas = getCategoriasGastos();
    const encontrada = todas.find((c) => c.nombre === 'Domicilios Bucaramanga Express');
    expect(encontrada).toBeDefined();
    expect(encontrada?.icono).toBe('🛵');
  });

  it('3. EARS-W01: No debe duplicar categorías si el nombre coincide insensible a mayúsculas o acentos', () => {
    const cat1 = crearCategoriaGasto({
      nombre: 'Cafetería Operarios',
      icono: '☕',
    });

    const cat2 = crearCategoriaGasto({
      nombre: 'cafeteria operarios', // Sin tilde y en minúsculas
      icono: '☕',
    });

    expect(cat1.id).toBe(cat2.id);

    const todas = getCategoriasGastos();
    const filtradas = todas.filter(
      (c) => c.nombre.toLowerCase().includes('cafeter') && c.nombre.toLowerCase().includes('operarios')
    );
    expect(filtradas.length).toBe(1);
  });

  it('4. Debe rankear las Top categorías más usadas basándose en los movimientos registrados del día', () => {
    // Simulamos movimientos de egreso
    const movimientosFalsos: Partial<MovimientoCaja>[] = [
      { id: '1', tipo: 'EGRESO_GASTO', categoriaEgreso: 'Pago Domicilios', monto: 15000 },
      { id: '2', tipo: 'EGRESO_GASTO', categoriaEgreso: 'Pago Domicilios', monto: 12000 },
      { id: '3', tipo: 'EGRESO_GASTO', categoriaEgreso: 'Pago Domicilios', monto: 18000 },
      { id: '4', tipo: 'EGRESO_GASTO', categoriaEgreso: 'Insumos Bodega', monto: 45000 },
      { id: '5', tipo: 'EGRESO_GASTO', categoriaEgreso: 'Insumos Bodega', monto: 30000 },
      { id: '6', tipo: 'EGRESO_GASTO', categoriaEgreso: 'Flete Camión', monto: 120000 },
    ];

    const ranking = obtenerCategoriasMasUsadas(movimientosFalsos as MovimientoCaja[], 3);
    expect(ranking.length).toBe(3);

    // Pago Domicilios tuvo 3 usos -> debe estar de primero
    expect(ranking[0].nombre).toBe('Pago Domicilios');
    // Insumos Bodega tuvo 2 usos -> debe estar de segundo
    expect(ranking[1].nombre).toBe('Insumos Bodega');
  });

  it('5. Debe permitir registrar un egreso operativo con una categoría personalizada y descontar efectivo', () => {
    // 1. Crear caja y abrir turno con $250.000 COP
    const resApertura = cashService.abrirTurno('caja-test-1', 'admin', 250000);
    expect(resApertura.error).toBeNull();
    const turno = resApertura.data as TurnoCaja;

    // 2. Crear categoría rápida
    const cat = crearCategoriaGasto({
      nombre: 'Refrigerios y Tintos',
      icono: '☕',
    });

    // 3. Registrar egreso con la nueva categoría
    const resEgreso = cashService.registrarEgresoOperativo({
      turnoId: turno.id,
      cajaId: turno.cajaId,
      categoriaEgreso: cat.nombre,
      metodoPago: 'EFECTIVO',
      monto: 35000,
      concepto: 'Tintos y panes para descargue de camión',
      usuarioId: 'admin',
    });

    expect(resEgreso.error).toBeNull();
    expect(resEgreso.data?.categoriaEgreso).toBe('Refrigerios y Tintos');
    expect(resEgreso.data?.monto).toBe(35000);

    // 4. Verificar que el turno disminuyó el efectivo a $215.000 COP
    const turnoActualizado = cashService.getTurnoActivo(turno.cajaId);
    expect(turnoActualizado?.totalEfectivo).toBe(215000);
    expect(turnoActualizado?.saldoTeoricoGlobal).toBe(215000);
  });
});
