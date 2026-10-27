// src/schemas/prefactura.schema.ts
// Validadores Zod y reglas de negocio para el flujo de Preventa, Descuentos y Despacho (SPEC-037)

import { z } from 'zod';
import type {
  ItemPrefacturaInput,
  ItemPrefactura,
  EmitirPrefacturaInput,
  CobrarPrefacturaInput,
  DespachoVerificacionInput,
  ResultadoValidacionItem,
  ResultadoValidacion,
} from '../types/prefactura.types';

export const LIMITE_DESCUENTO_DEFAULT_PCT = 10;

// 1. Esquema Zod para Ítems de Preventa
export const itemPrefacturaZodSchema = z.object({
  productoId: z.string().min(1, 'El producto es obligatorio'),
  nombre: z.string().min(1, 'El nombre del producto es obligatorio'),
  cantidad: z.number().positive('La cantidad debe ser mayor a cero'),
  precioLista: z.number().positive('El precio de lista debe ser mayor a cero'),
  descuentoPct: z
    .number()
    .min(0, 'El descuento no puede ser negativo')
    .max(100, 'El descuento no puede superar el 100%')
    .default(0),
  supervisorPinAutorizado: z.boolean().optional(),
  supervisorId: z.string().optional(),
  loteId: z.string().optional(),
});

/**
 * Valida una línea de producto en la preventa, calculando precios finales y
 * verificando si el descuento comercial sobrepasa el umbral autorizado al vendedor.
 */
export function validarItemPrefactura(
  input: ItemPrefacturaInput,
  limiteDescuentoPct: number = LIMITE_DESCUENTO_DEFAULT_PCT
): ResultadoValidacionItem {
  const parseResult = itemPrefacturaZodSchema.safeParse(input);

  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map((e) => e.message).join(', ');
    return {
      success: false,
      requiereSupervisor: false,
      supervisorAutorizado: false,
      error: errorMsg,
    };
  }

  const { cantidad, precioLista, descuentoPct = 0, supervisorPinAutorizado, supervisorId } =
    parseResult.data;

  const excedeLimite = descuentoPct > limiteDescuentoPct;
  const requiereSupervisor = excedeLimite;
  const supervisorAutorizado = excedeLimite && Boolean(supervisorPinAutorizado);

  // Si requiere supervisor y no está autorizado, se reporta el estado
  const precioFinal = Math.round(precioLista * (1 - descuentoPct / 100));
  const subtotal = Math.round(precioFinal * cantidad);

  const itemProcesado: ItemPrefactura = {
    productoId: parseResult.data.productoId,
    nombre: parseResult.data.nombre,
    cantidad,
    precioLista,
    descuentoPct,
    precioFinal,
    subtotal,
    loteId: parseResult.data.loteId,
  };

  return {
    success: true,
    data: itemProcesado,
    requiereSupervisor,
    supervisorAutorizado,
  };
}

// 2. Esquema Zod para Emisión de Preventa (Payload Asesor)
export const emitirPrefacturaZodSchema = z.object({
  tenantId: z.string().min(1, 'El tenant_id es obligatorio para aislamiento de datos'),
  vendedorId: z.string().min(1, 'El vendedor es obligatorio'),
  vendedorNombre: z.string().min(1, 'El nombre del vendedor es obligatorio'),
  terminalId: z.string().min(1, 'La terminal de origen es obligatoria'),
  clienteDocumento: z.string().optional(),
  clienteNombre: z.string().optional(),
  items: z.array(itemPrefacturaZodSchema).min(1, 'La preventa debe contener al menos un ítem'),
  observaciones: z.string().optional(),
});

export interface PrefacturaCalculada extends EmitirPrefacturaInput {
  subtotal: number;
  descuentoTotal: number;
  total: number;
  itemsValidados: ItemPrefactura[];
}

export function validarEmitirPrefactura(
  input: EmitirPrefacturaInput,
  limiteDescuentoPct: number = LIMITE_DESCUENTO_DEFAULT_PCT
): ResultadoValidacion<PrefacturaCalculada> {
  const parseResult = emitirPrefacturaZodSchema.safeParse(input);

  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map((e) => e.message).join(', ');
    return { success: false, error: errorMsg };
  }

  const data = parseResult.data;
  const itemsValidados: ItemPrefactura[] = [];
  let subtotalSinDescuento = 0;
  let totalConDescuento = 0;

  for (const it of data.items) {
    const validacion = validarItemPrefactura(it, limiteDescuentoPct);
    if (!validacion.success || !validacion.data) {
      return { success: false, error: validacion.error || 'Error en ítem de preventa' };
    }
    itemsValidados.push(validacion.data);
    subtotalSinDescuento += validacion.data.precioLista * validacion.data.cantidad;
    totalConDescuento += validacion.data.subtotal;
  }

  const descuentoTotal = subtotalSinDescuento - totalConDescuento;

  return {
    success: true,
    data: {
      ...data,
      items: itemsValidados,
      itemsValidados,
      subtotal: subtotalSinDescuento,
      descuentoTotal,
      total: totalConDescuento,
    },
  };
}

// 3. Esquema Zod para Cobro en Caja Central
export const pagoCobroZodSchema = z.object({
  metodoPago: z.enum(['EFECTIVO', 'DATAFONO', 'TRANSFERENCIA', 'CREDITO']),
  monto: z.number().positive('El monto de pago debe ser mayor a cero'),
  referenciaComprobante: z.string().optional(),
});

export const cobrarPrefacturaZodSchema = z.object({
  prefacturaId: z.string().min(1, 'El identificador de prefactura es obligatorio'),
  tenantId: z.string().min(1, 'El tenant_id es obligatorio'),
  cajeroId: z.string().min(1, 'El cajero es obligatorio'),
  turnoId: z.string().min(1, 'El turno de caja es obligatorio'),
  montoTotal: z.number().positive('El monto total debe ser positivo'),
  pagos: z.array(pagoCobroZodSchema).min(1, 'Debe registrar al menos un método de pago'),
});

export function validarCobroCaja(
  input: CobrarPrefacturaInput
): ResultadoValidacion<CobrarPrefacturaInput> {
  const parseResult = cobrarPrefacturaZodSchema.safeParse(input);

  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map((e) => e.message).join(', ');
    return { success: false, error: errorMsg };
  }

  const { montoTotal, pagos } = parseResult.data;
  const sumaPagos = pagos.reduce((acc, p) => acc + p.monto, 0);

  if (sumaPagos < montoTotal) {
    return {
      success: false,
      error: `La suma de los pagos ($${sumaPagos.toLocaleString('es-CO')}) es menor que el total de la preventa ($${montoTotal.toLocaleString('es-CO')})`,
    };
  }

  return {
    success: true,
    data: parseResult.data,
  };
}

// 4. Esquema Zod para Despacho y Entrega Física
export const despachoVerificacionZodSchema = z.object({
  prefacturaId: z.string().min(1, 'La prefactura es obligatoria'),
  tenantId: z.string().min(1, 'El tenant_id es obligatorio'),
  asesorId: z.string().min(1, 'El asesor que despacha es obligatorio'),
  metodoVerificacion: z.enum(['QR_SCAN', 'BANDEJA_TACTIL']),
  codigoEscaneado: z.string().optional(),
  observaciones: z.string().optional(),
});

export function validarDespacho(
  input: DespachoVerificacionInput
): ResultadoValidacion<DespachoVerificacionInput> {
  const parseResult = despachoVerificacionZodSchema.safeParse(input);

  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map((e) => e.message).join(', ');
    return { success: false, error: errorMsg };
  }

  return {
    success: true,
    data: parseResult.data,
  };
}
