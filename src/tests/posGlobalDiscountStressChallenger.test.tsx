// src/tests/posGlobalDiscountStressChallenger.test.tsx
// Suite de Pruebas de Estrés Financiero y Casos Extremos (Challenger 1 - Hito M2)
// Valida robustez matemática, ausencia de NaN/overflow, no-negatividad estricta y precisión COP

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { POSMultivendorCart } from '../views/pos/components/POSMultivendorCart';
import { useMultiVendorPosStore } from '../stores/useMultiVendorPosStore';
import type { Product } from '../types/erp.types';
import type { MultivendorCartItem } from '../views/pos/components/POSMultivendorCart';

describe('Challenger 1: Estrés Financiero y Casos Extremos - Motor de Descuento Global (Hito M2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMultiVendorPosStore.setState({
      cartItems: [],
      terminalId: 'TERM-CHALLENGER-01',
      descuentoGlobal: null,
      maxDescuentoVendedorPct: 10,
    });
  });

  // =========================================================================
  // Dimensión 1: Descuento en pesos mayor al subtotal (Subtotal $50.000 vs Desc $100.000)
  // =========================================================================
  describe('Dimensión 1: Descuento en pesos mayor al subtotal (No-negatividad estricta)', () => {
    it('Descuento de $100.000 sobre subtotal de $50.000 produce totalFinal = 0 y descuento clamped a $50.000', () => {
      const store = useMultiVendorPosStore.getState();
      store.agregarItem({
        productoId: 'fish-01',
        nombre: 'Filete de Salmón Premium',
        cantidad: 1,
        precioLista: 50000,
        descuentoPct: 0,
      });

      expect(store.obtenerSubtotalCart()).toBe(50000);

      // Aplicar descuento en monto muy superior al subtotal
      const res = store.aplicarDescuentoGlobal('monto', 100000);
      expect(res.ok).toBe(true);

      const totales = store.obtenerTotalesCart();

      // Total a pagar NUNCA debe ser negativo
      expect(totales.totalFinal).toBe(0);
      expect(totales.totalFinal).toBeGreaterThanOrEqual(0);
      expect(Object.is(totales.totalFinal, -0)).toBe(false);

      // El descuento global efectivo debe acotarse al subtotal neto
      expect(totales.descuentoGlobalMonto).toBe(50000);
      expect(totales.descuentoTotal).toBe(50000);
      expect(store.obtenerTotalCart()).toBe(0);
    });

    it('Descuento absurdo ($1.000.000.000) sobre comanda pequeña ($5.000) no corrompe el store ni produce negativos', () => {
      const store = useMultiVendorPosStore.getState();
      store.agregarItem({
        productoId: 'lata-01',
        nombre: 'Sardinas en Tomate',
        cantidad: 1,
        precioLista: 5000,
        descuentoPct: 0,
      });

      store.aplicarDescuentoGlobal('monto', 1_000_000_000);
      const totales = store.obtenerTotalesCart();

      expect(totales.totalFinal).toBe(0);
      expect(totales.descuentoGlobalMonto).toBe(5000);
      expect(totales.subtotalNeto).toBe(5000);
      expect(totales.subtotalBruto).toBe(5000);
    });

    it('En componente UI: ingresar monto mayor al subtotal en el popover acota el valor enviado a onApplyGlobalDiscount', () => {
      const onApply = vi.fn();
      const mockProduct: Product = {
        id: 'p1',
        sku: 'MOJ-01',
        nombre: 'Mojarra',
        categoria: 'Pescados',
        unidadMedida: 'kg',
        precio_venta_pos: 50000,
        precio_compra: 30000,
        buffer_seguridad: 5,
        precio_venta_restaurante: 48000,
        precio_venta_mayorista: 45000,
        activo: true,
      };

      const items: MultivendorCartItem[] = [
        { product: mockProduct, cantidad: 1, precioOverride: 50000 },
      ];

      render(
        <POSMultivendorCart
          items={items}
          subtotal={50000}
          descuento={0}
          total={50000}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          onEmitirComanda={vi.fn()}
          onApplyGlobalDiscount={onApply}
        />
      );

      // Abrir popover F4
      fireEvent.click(screen.getByTestId('btn-descuento-global-f4'));
      // Cambiar a monto fijo
      fireEvent.click(screen.getByTestId('btn-modo-monto'));

      const input = screen.getByTestId('input-descuento-global-valor');
      fireEvent.change(input, { target: { value: '100000' } });

      fireEvent.click(screen.getByTestId('btn-aplicar-descuento-global'));

      // Debe haber acotado a 50000 exactamente
      expect(onApply).toHaveBeenCalledWith('monto', 50000);
    });
  });

  // =========================================================================
  // Dimensión 2: Descuento porcentual 0% y 100% (Coherencia matemática)
  // =========================================================================
  describe('Dimensión 2: Descuento porcentual 0% y 100% (Límites matemáticos)', () => {
    it('Descuento del 0% restablece el estado de descuento y mantiene el subtotal íntegro', () => {
      const store = useMultiVendorPosStore.getState();
      store.agregarItem({
        productoId: 'prod-01',
        nombre: 'Camarón Tigre',
        cantidad: 2,
        precioLista: 45000,
        descuentoPct: 0,
      });

      // Primero aplicar 10%
      store.aplicarDescuentoGlobal('porcentaje', 10);
      expect(store.obtenerTotalCart()).toBe(81000);

      // Luego aplicar 0%
      const res = store.aplicarDescuentoGlobal('porcentaje', 0);
      expect(res.ok).toBe(true);
      expect(res.requiereSupervisor).toBe(false);

      const totales = store.obtenerTotalesCart();
      expect(totales.descuentoGlobalMonto).toBe(0);
      expect(totales.totalFinal).toBe(90000);
      expect(store.descuentoGlobal).toBeNull();
    });

    it('Descuento del 100% liquida la comanda a $0 exactos sin residuos decimales', () => {
      const store = useMultiVendorPosStore.getState();
      store.agregarItem({
        productoId: 'prod-01',
        nombre: 'Robalo Fresco',
        cantidad: 3.5,
        precioLista: 32000,
        descuentoPct: 0,
      });

      // Subtotal = 3.5 * 32.000 = 112.000 COP
      expect(store.obtenerSubtotalCart()).toBe(112000);

      const res = store.aplicarDescuentoGlobal('porcentaje', 100);
      expect(res.ok).toBe(true);
      expect(res.requiereSupervisor).toBe(true); // 100% > maxDescuentoVendedorPct (10%)

      const totales = store.obtenerTotalesCart();
      expect(totales.descuentoGlobalMonto).toBe(112000);
      expect(totales.totalFinal).toBe(0);
      expect(store.obtenerTotalCart()).toBe(0);
    });

    it('Porcentaje mayor al 100% (ej. 250%) se acota estrictamente al 100% y totalFinal = 0', () => {
      const store = useMultiVendorPosStore.getState();
      store.agregarItem({
        productoId: 'prod-01',
        nombre: 'Trucha Arcoíris',
        cantidad: 2,
        precioLista: 25000,
        descuentoPct: 0,
      });

      store.aplicarDescuentoGlobal('porcentaje', 250);
      const totales = store.obtenerTotalesCart();

      expect(totales.descuentoGlobalMonto).toBe(50000);
      expect(totales.totalFinal).toBe(0);
    });

    it('Porcentaje negativo (ej. -15%) es sanitizado a 0 y no incrementa el total como sobrecargo', () => {
      const store = useMultiVendorPosStore.getState();
      store.agregarItem({
        productoId: 'prod-01',
        nombre: 'Sierra',
        cantidad: 1,
        precioLista: 30000,
        descuentoPct: 0,
      });

      store.aplicarDescuentoGlobal('porcentaje', -15);
      const totales = store.obtenerTotalesCart();

      expect(totales.descuentoGlobalMonto).toBe(0);
      expect(totales.totalFinal).toBe(30000); // No debe subir a 34500
    });
  });

  // =========================================================================
  // Dimensión 3: Descuentos con decimales (12.5%, 33.333%) y redondeo monetario COP
  // =========================================================================
  describe('Dimensión 3: Descuentos con decimales y precisión monetaria en COP', () => {
    it('Descuento del 12.5% sobre $70.500 redondea a entero COP sin centavos flotantes', () => {
      const store = useMultiVendorPosStore.getState();
      // $70.500 * 0.125 = 8.812,5 COP => Redondeo comercial = 8.813 COP
      // Total = 70.500 - 8.813 = 61.687 COP
      store.agregarItem({
        productoId: 'prod-01',
        nombre: 'Pargo Rojo',
        cantidad: 1,
        precioLista: 70500,
        descuentoPct: 0,
      });

      store.aplicarDescuentoGlobal('porcentaje', 12.5);
      const totales = store.obtenerTotalesCart();

      expect(totales.descuentoGlobalMonto).toBe(8813);
      expect(totales.totalFinal).toBe(61687);
      expect(Number.isInteger(totales.totalFinal)).toBe(true);
      expect(totales.subtotalNeto - totales.descuentoGlobalMonto).toBe(totales.totalFinal);
    });

    it('Descuento de tercio 33.333% sobre $100.000 preserva la identidad subtotalNeto = totalFinal + descuentoGlobalMonto', () => {
      const store = useMultiVendorPosStore.getState();
      store.agregarItem({
        productoId: 'prod-02',
        nombre: 'Cazuela de Mariscos',
        cantidad: 2,
        precioLista: 50000,
        descuentoPct: 0,
      });

      // 100.000 * 0.33333 = 33.333 COP
      store.aplicarDescuentoGlobal('porcentaje', 33.333);
      const totales = store.obtenerTotalesCart();

      expect(totales.descuentoGlobalMonto).toBe(33333);
      expect(totales.totalFinal).toBe(66667);
      expect(totales.totalFinal + totales.descuentoGlobalMonto).toBe(totales.subtotalNeto);
    });

    it('Cantidades con decimales de balanza (ej. 1.347 kg) mantienen coherencia en recálculo', () => {
      const store = useMultiVendorPosStore.getState();
      // 1.347 kg * $23.500 = $31.654,5 => precio neto línea
      store.agregarItem({
        productoId: 'prod-balanza',
        nombre: 'Filete Corvina Granel',
        cantidad: 1.347,
        precioLista: 23500,
        descuentoPct: 0,
      });

      store.aplicarDescuentoGlobal('porcentaje', 15);
      const totales = store.obtenerTotalesCart();

      expect(totales.totalFinal).toBeGreaterThan(0);
      expect(Number.isInteger(totales.descuentoGlobalMonto)).toBe(true);
      // Preservación estricta de la identidad matemática sin deriva de punto flotante
      expect(Math.abs((totales.totalFinal + totales.descuentoGlobalMonto) - totales.subtotalNeto)).toBeLessThan(0.00001);
      expect(Math.round(totales.totalFinal)).toBe(26907);
    });
  });

  // =========================================================================
  // Dimensión 4: Carrito vacío (subtotal 0) con intento de aplicar descuento
  // =========================================================================
  describe('Dimensión 4: Carrito vacío (Subtotal 0) y tolerancia a fallos', () => {
    it('Aplicar descuento por porcentaje o monto con carrito vacío no lanza excepción y totalFinal = 0', () => {
      const store = useMultiVendorPosStore.getState();
      expect(store.cartItems).toHaveLength(0);

      // Intentar aplicar porcentaje con carrito vacío
      expect(() => {
        store.aplicarDescuentoGlobal('porcentaje', 15);
      }).not.toThrow();

      let totales = store.obtenerTotalesCart();
      expect(totales.subtotalBruto).toBe(0);
      expect(totales.subtotalNeto).toBe(0);
      expect(totales.descuentoGlobalMonto).toBe(0);
      expect(totales.totalFinal).toBe(0);
      expect(store.obtenerTotalCart()).toBe(0);

      // Intentar aplicar monto fijo con carrito vacío
      expect(() => {
        store.aplicarDescuentoGlobal('monto', 50000);
      }).not.toThrow();

      totales = store.obtenerTotalesCart();
      expect(totales.totalFinal).toBe(0);
      expect(totales.descuentoGlobalMonto).toBe(0);

      // Limpiar no debe fallar
      expect(() => {
        store.limpiarDescuentoGlobal();
      }).not.toThrow();
    });

    it('Si se pre-configura un descuento y luego se agrega un ítem, el cálculo se aplica reactivamente', () => {
      const store = useMultiVendorPosStore.getState();
      store.aplicarDescuentoGlobal('porcentaje', 10);

      // Inicialmente con carrito vacío: 0
      expect(store.obtenerTotalCart()).toBe(0);

      // Agregar ítem de $40.000
      store.agregarItem({
        productoId: 'prod-nuevo',
        nombre: 'Calamar Tubo',
        cantidad: 1,
        precioLista: 40000,
        descuentoPct: 0,
      });

      const totales = store.obtenerTotalesCart();
      expect(totales.subtotalNeto).toBe(40000);
      expect(totales.descuentoGlobalMonto).toBe(4000);
      expect(totales.totalFinal).toBe(36000);
    });

    it('En componente UI: botón de descuento está inhabilitado con carrito vacío', () => {
      render(
        <POSMultivendorCart
          items={[]}
          subtotal={0}
          descuento={0}
          total={0}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          onEmitirComanda={vi.fn()}
        />
      );

      const btnF4 = screen.getByTestId('btn-descuento-global-f4');
      expect(btnF4).toBeDisabled();
      expect(screen.queryByTestId('pos-discount-popover')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Dimensión 5: Descuento Combinado (Ítem Individual + Global Comanda)
  // =========================================================================
  describe('Dimensión 5: Descuento Combinado (Línea Individual + Comanda Global)', () => {
    it('Descuento de línea del 20% + Descuento global del 10% aplica sobre el neto sin duplicidad de descuento', () => {
      const store = useMultiVendorPosStore.getState();

      // Ítem 1: 2 und * $30.000 = $60.000 bruto. Con 20% descuento de ítem:
      // Precio unitario con desc = Math.round(30000 * 0.8) = 24.000.
      // Subtotal neto ítem 1 = 24.000 * 2 = 48.000. Descuento línea = 12.000.
      store.agregarItem({
        productoId: 'prod-desc-linea',
        nombre: 'Pulpo Baby Congelado',
        cantidad: 2,
        precioLista: 30000,
        descuentoPct: 20,
      });

      // Ítem 2: 1 und * $40.000 = $40.000 bruto sin descuento
      store.agregarItem({
        productoId: 'prod-sin-desc',
        nombre: 'Langostinos U15',
        cantidad: 1,
        precioLista: 40000,
        descuentoPct: 0,
      });

      // Subtotal Bruto = 60.000 + 40.000 = 100.000 COP
      // Descuento Líneas = 12.000 COP
      // Subtotal Neto = 48.000 + 40.000 = 88.000 COP
      let totales = store.obtenerTotalesCart();
      expect(totales.subtotalBruto).toBe(100000);
      expect(totales.descuentoLineas).toBe(12000);
      expect(totales.subtotalNeto).toBe(88000);
      expect(totales.totalFinal).toBe(88000);

      // Ahora aplicar 10% global comanda sobre el Neto ($88.000)
      store.aplicarDescuentoGlobal('porcentaje', 10);
      totales = store.obtenerTotalesCart();

      // 10% de $88.000 = $8.800 COP
      expect(totales.descuentoGlobalMonto).toBe(8800);
      // Descuento total = 12.000 (líneas) + 8.800 (global) = 20.800 COP
      expect(totales.descuentoTotal).toBe(20800);
      // Total final = 88.000 - 8.800 = 79.200 COP
      expect(totales.totalFinal).toBe(79200);

      // Identidad matemática fundamental de la factura:
      // Subtotal Bruto - Descuento Total = Total Final
      expect(totales.subtotalBruto - totales.descuentoTotal).toBe(totales.totalFinal);
    });

    it('Descuento de línea + Descuento global en monto fijo no sobrepasan el neto disponible', () => {
      const store = useMultiVendorPosStore.getState();

      // Bruto: 50.000. Descuento de línea 50% => Neto = 25.000
      store.agregarItem({
        productoId: 'prod-desc-50',
        nombre: 'Ceviche Mixto',
        cantidad: 1,
        precioLista: 50000,
        descuentoPct: 50,
      });

      // Aplicar descuento global en monto de $40.000 (mayor al neto restante de $25.000)
      store.aplicarDescuentoGlobal('monto', 40000);
      const totales = store.obtenerTotalesCart();

      expect(totales.subtotalBruto).toBe(50000);
      expect(totales.descuentoLineas).toBe(25000);
      expect(totales.subtotalNeto).toBe(25000);

      // El descuento global debe acotarse a $25.000, no a $40.000
      expect(totales.descuentoGlobalMonto).toBe(25000);
      expect(totales.descuentoTotal).toBe(50000);
      expect(totales.totalFinal).toBe(0);
    });

    it('Si las líneas ya tienen 100% de descuento (obsequio comercial), el descuento global no resta más', () => {
      const store = useMultiVendorPosStore.getState();
      store.agregarItem({
        productoId: 'prod-obsequio',
        nombre: 'Salsa Tártara Cortesía',
        cantidad: 2,
        precioLista: 6000,
        descuentoPct: 100,
      });

      const totalesPrev = store.obtenerTotalesCart();
      expect(totalesPrev.subtotalNeto).toBe(0);
      expect(totalesPrev.totalFinal).toBe(0);

      store.aplicarDescuentoGlobal('monto', 10000);
      const totalesPost = store.obtenerTotalesCart();

      expect(totalesPost.descuentoGlobalMonto).toBe(0);
      expect(totalesPost.totalFinal).toBe(0);
    });
  });

  // =========================================================================
  // Dimensión 6: Cifras Financieras Masivas ($999.999.999 COP) y Sin Overflow/NaN
  // =========================================================================
  describe('Dimensión 6: Cifras financieras masivas ($999.999.999 COP) y estabilidad numérica', () => {
    it('Línea masiva de $999.999.999 COP con 15% de descuento global calcula con total precisión', () => {
      const store = useMultiVendorPosStore.getState();
      store.agregarItem({
        productoId: 'prod-bulk-massive',
        nombre: 'Cargamento Mayorista Contenedor Atún',
        cantidad: 1,
        precioLista: 999_999_999,
        descuentoPct: 0,
      });

      // 999.999.999 * 0.15 = 149.999.999,85 => Redondeo a 150.000.000 COP
      // Total = 999.999.999 - 150.000.000 = 849.999.999 COP
      store.aplicarDescuentoGlobal('porcentaje', 15);
      const totales = store.obtenerTotalesCart();

      expect(totales.subtotalBruto).toBe(999_999_999);
      expect(totales.descuentoGlobalMonto).toBe(150_000_000);
      expect(totales.totalFinal).toBe(849_999_999);

      // Verificación estricta de no-NaN y no-Infinity
      expect(Number.isNaN(totales.totalFinal)).toBe(false);
      expect(Number.isFinite(totales.totalFinal)).toBe(true);
      expect(totales.totalFinal).toBeLessThan(Number.MAX_SAFE_INTEGER);
    });

    it('Monto masivo de comanda ($10.000.000.000 COP) y descuento fijo de $500.000.000 COP', () => {
      const store = useMultiVendorPosStore.getState();
      store.agregarItem({
        productoId: 'prod-wholesale',
        nombre: 'Lote Pescado Exportación',
        cantidad: 10,
        precioLista: 1_000_000_000,
        descuentoPct: 0,
      });

      // Subtotal = 10 * 1.000.000.000 = 10.000.000.000 COP (10 mil millones)
      expect(store.obtenerSubtotalCart()).toBe(10_000_000_000);

      store.aplicarDescuentoGlobal('monto', 500_000_000);
      const totales = store.obtenerTotalesCart();

      expect(totales.descuentoGlobalMonto).toBe(500_000_000);
      expect(totales.totalFinal).toBe(9_500_000_000);
      expect(Number.isNaN(totales.totalFinal)).toBe(false);
    });

    it('Fuzzing numérico: pasar NaN, undefined o valores corruptos se maneja con resiliencia sin romper el store', () => {
      const store = useMultiVendorPosStore.getState();
      store.agregarItem({
        productoId: 'prod-1',
        nombre: 'Mojarra',
        cantidad: 1,
        precioLista: 20000,
        descuentoPct: 0,
      });

      // Pasar NaN como valor (en JS NaN es tipo number, pero matemáticamente inválido)
      store.aplicarDescuentoGlobal('porcentaje', NaN);
      let totales = store.obtenerTotalesCart();
      expect(totales.totalFinal).toBe(20000);
      expect(Number.isNaN(totales.totalFinal)).toBe(false);

      // Pasar string corrupto
      // @ts-expect-error probando entrada corrupta adversaria
      store.aplicarDescuentoGlobal('monto', 'valor_invalido');
      totales = store.obtenerTotalesCart();
      expect(totales.totalFinal).toBe(20000);
      expect(Number.isNaN(totales.totalFinal)).toBe(false);
    });
  });

  // =========================================================================
  // Dimensión 7: Reactividad Dinámica ante Modificaciones del Carrito
  // =========================================================================
  describe('Dimensión 7: Reactividad Dinámica ante Modificaciones Posteriores del Carrito', () => {
    it('Si el carrito cambia de cantidad tras aplicar descuento porcentual, el descuento se escala automáticamente', () => {
      const store = useMultiVendorPosStore.getState();
      store.agregarItem({
        productoId: 'prod-scale',
        nombre: 'Langosta Entera',
        cantidad: 1,
        precioLista: 100000,
        descuentoPct: 0,
      });

      // 10% de $100.000 = $10.000. Total = $90.000
      store.aplicarDescuentoGlobal('porcentaje', 10);
      expect(store.obtenerTotalCart()).toBe(90000);

      // Duplicar la cantidad a 2 unidades => Subtotal $200.000
      store.actualizarCantidadItem('prod-scale', 2);

      // El store debe recalcular reactivamente: 10% de $200.000 = $20.000. Total = $180.000
      const totales = store.obtenerTotalesCart();
      expect(totales.subtotalNeto).toBe(200000);
      expect(totales.descuentoGlobalMonto).toBe(20000);
      expect(totales.totalFinal).toBe(180000);
    });

    it('Si el subtotal se reduce por debajo de un descuento fijo activo, se acota suavemente sin caer en negativo', () => {
      const store = useMultiVendorPosStore.getState();
      store.agregarItem({
        productoId: 'prod-reduc',
        nombre: 'Mero Fileteado',
        cantidad: 3,
        precioLista: 20000,
        descuentoPct: 0,
      });

      // Subtotal = $60.000. Descuento fijo = $40.000 => Total = $20.000
      store.aplicarDescuentoGlobal('monto', 40000);
      expect(store.obtenerTotalCart()).toBe(20000);

      // Ahora se reduce la cantidad a 1 unidad => Subtotal cae a $20.000
      store.actualizarCantidadItem('prod-reduc', 1);

      // El descuento fijo de $40.000 debe acotarse al nuevo subtotal ($20.000), totalFinal = 0
      const totales = store.obtenerTotalesCart();
      expect(totales.subtotalNeto).toBe(20000);
      expect(totales.descuentoGlobalMonto).toBe(20000);
      expect(totales.totalFinal).toBe(0);
      expect(store.obtenerTotalCart()).toBe(0);
    });

    it('Vaciar el carrito mediante limpiarCart() restablece tanto los ítems como el descuentoGlobal', () => {
      useMultiVendorPosStore.getState().agregarItem({
        productoId: 'prod-clear',
        nombre: 'Ceviche',
        cantidad: 2,
        precioLista: 15000,
        descuentoPct: 0,
      });
      useMultiVendorPosStore.getState().aplicarDescuentoGlobal('porcentaje', 15);

      expect(useMultiVendorPosStore.getState().descuentoGlobal).not.toBeNull();
      useMultiVendorPosStore.getState().limpiarCart();

      expect(useMultiVendorPosStore.getState().cartItems).toHaveLength(0);
      expect(useMultiVendorPosStore.getState().descuentoGlobal).toBeNull();
      expect(useMultiVendorPosStore.getState().obtenerTotalCart()).toBe(0);
    });
  });
});
