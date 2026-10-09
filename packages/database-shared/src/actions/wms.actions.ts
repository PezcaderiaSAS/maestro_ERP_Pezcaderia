import { prisma } from '../client';
import { safeDatabaseExecute, ApiResponse } from '../safeApi';
import { 
  EntradaStockSchema, 
  EntradaStockDTO, 
  MermaDespieceSchema, 
  MermaDespieceDTO 
} from '../../../validation-schemas/src/wms.schema';

export async function registrarEntradaStockAction(
  payload: EntradaStockDTO
): Promise<ApiResponse<any>> {
  return safeDatabaseExecute('Registrar Entrada de Stock', async () => {
    // 1. Validate payload with Zod
    const data = EntradaStockSchema.parse(payload);

    // 2. Ejecutar todo en una transacción estricta
    const resultado = await prisma.$transaction(async (tx) => {
      // 2.1 Crear el Lote
      const lote = await tx.lote.create({
        data: {
          empresaId: data.empresaId,
          productoId: data.productoId,
          bodegaId: data.bodegaId,
          numeroLote: data.numeroLote,
          fechaExpiracion: new Date(data.fechaExpiracion),
          cantidadOriginal: data.cantidad,
          cantidadActual: data.cantidad,
          costoUnitario: data.costoUnitario,
          estado: 'ACTIVO',
        },
      });

      // 2.2 Registrar en Kardex
      const kardex = await tx.kardexMovimiento.create({
        data: {
          empresaId: data.empresaId,
          bodegaId: data.bodegaId,
          productoId: data.productoId,
          loteId: lote.id,
          usuarioId: data.usuarioId,
          tipoMovimiento: 'ENTRADA_COMPRA',
          cantidad: data.cantidad,
          saldoDespues: data.cantidad, // Simplificado, requeriría leer saldo anterior si se lleva a nivel global
          costoUnitario: data.costoUnitario,
          referenciaDocumento: data.referenciaDocumento,
          observacion: data.observacion || `Ingreso manual de Lote ${data.numeroLote}`,
        },
      });

      // 2.3 Upsert a ProductoBodega para saldo rápido
      const productoBodega = await tx.productoBodega.upsert({
        where: {
          uq_producto_bodega: {
            productoId: data.productoId,
            bodegaId: data.bodegaId,
          },
        },
        create: {
          empresaId: data.empresaId,
          productoId: data.productoId,
          bodegaId: data.bodegaId,
          cantidadTotal: data.cantidad,
        },
        update: {
          cantidadTotal: {
            increment: data.cantidad,
          },
        },
      });

      return { lote, kardex, productoBodega };
    });

    return resultado;
  });
}

export async function registrarMermaDespieceAction(
  payload: MermaDespieceDTO
): Promise<ApiResponse<any>> {
  return safeDatabaseExecute('Registrar Merma de Despiece', async () => {
    // 1. Validación Zod
    const data = MermaDespieceSchema.parse(payload);

    const resultado = await prisma.$transaction(async (tx) => {
      let loteAfectadoId = data.loteId;

      // 2.1 Si no se envía loteId, aplicar FIFO estricto buscando el lote más antiguo con saldo
      if (!loteAfectadoId) {
        const loteFifo = await tx.lote.findFirst({
          where: {
            empresaId: data.empresaId,
            productoId: data.productoId,
            bodegaId: data.bodegaId,
            estado: 'ACTIVO',
            cantidadActual: { gte: data.cantidad },
          },
          orderBy: { fechaExpiracion: 'asc' },
        });

        if (!loteFifo) {
          throw new Error('No hay saldo suficiente en ningún lote activo para cubrir la merma.');
        }
        loteAfectadoId = loteFifo.id;
      }

      // 2.2 Descontar del Lote
      const lote = await tx.lote.update({
        where: { id: loteAfectadoId },
        data: {
          cantidadActual: {
            decrement: data.cantidad,
          },
        },
      });

      if (Number(lote.cantidadActual) < 0) {
         throw new Error('El lote seleccionado no tiene saldo suficiente.');
      }

      // 2.3 Descontar del acumulado de Bodega
      const productoBodega = await tx.productoBodega.update({
        where: {
          uq_producto_bodega: {
            productoId: data.productoId,
            bodegaId: data.bodegaId,
          },
        },
        data: {
          cantidadTotal: {
            decrement: data.cantidad,
          },
        },
      });

      // 2.4 Registrar en Kardex
      const kardex = await tx.kardexMovimiento.create({
        data: {
          empresaId: data.empresaId,
          bodegaId: data.bodegaId,
          productoId: data.productoId,
          loteId: lote.id,
          usuarioId: data.usuarioId,
          tipoMovimiento: 'MERMA_DESPIECE',
          cantidad: data.cantidad,
          saldoDespues: productoBodega.cantidadTotal, 
          costoUnitario: lote.costoUnitario,
          referenciaDocumento: data.referenciaDocumento,
          observacion: data.observacion,
        },
      });

      return { lote, kardex, productoBodega };
    });

    return resultado;
  });
}
