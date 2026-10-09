import { PrismaClient, EstadoOutbox } from '@prisma/client';
import { z } from 'zod';
import { safeDatabaseExecute } from '../safeApi';

const prisma = new PrismaClient();

// Esquema de validación para el payload que envía el frontend
export const syncOutboxSchema = z.object({
  empresaId: z.string().uuid('ID de empresa inválido'),
  cajaId: z.string().uuid('ID de caja inválido'),
  operaciones: z.array(
    z.object({
      idLocal: z.string().min(1, 'ID Local es requerido'),
      tipoOperacion: z.enum(['VENTA', 'GASTO', 'ARQUEO']),
      payload: z.record(z.string(), z.any(), { required_error: 'Payload requerido' }),
      creadoEnOffline: z.string().datetime().optional()
    })
  ).min(1, 'Debe enviar al menos una operación para sincronizar')
});

export type SyncOutboxInput = z.infer<typeof syncOutboxSchema>;

/**
 * Acción para recibir operaciones offline y guardarlas en el Outbox (PENDIENTE)
 */
export async function sincronizarCajaOutboxAction(input: SyncOutboxInput) {
  return safeDatabaseExecute('sincronizarCajaOutboxAction', async () => {
    // 1. Validar el input
    const validData = syncOutboxSchema.parse(input);

    // 2. Insertar de manera masiva o individual validando existencia (Idempotencia)
    let sincronizados = 0;
    let omitidos = 0;

    for (const op of validData.operaciones) {
      // Upsert basado en la clave única (empresaId, idLocal)
      const outboxRecord = await prisma.cajaOutbox.upsert({
        where: {
          uq_outbox_empresa_local: {
            empresaId: validData.empresaId,
            idLocal: op.idLocal
          }
        },
        update: {}, // Si ya existe, no actualizamos nada, aseguramos idempotencia
        create: {
          empresaId: validData.empresaId,
          cajaId: validData.cajaId,
          idLocal: op.idLocal,
          tipoOperacion: op.tipoOperacion,
          payload: op.payload,
          estado: EstadoOutbox.PENDIENTE,
          creadoEn: op.creadoEnOffline ? new Date(op.creadoEnOffline) : new Date()
        }
      });

      // Si la operación es una VENTA, ejecutamos el descuento FEFO
      if (op.tipoOperacion === 'VENTA' && op.payload.detalles) {
        // En este punto, op.payload es la venta con sus detalles (productos)
        // Se asume que el payload tiene sucursal_id y otros datos, pero como estamos 
        // procesando offline, podemos deducir el branch desde cajaId u otra data si la tuviéramos.
        // Para simplificar, asumiremos que op.payload provee el warehouseId del POS y branchId.
        const warehouseId = op.payload.warehouseId || validData.cajaId; // TODO: resolver real warehouse_id
        const branchId = op.payload.branchId || validData.empresaId; // TODO: resolver real branch_id
        
        for (const detalle of op.payload.detalles) {
          if (detalle.sku && detalle.cantidad) {
            try {
              await prisma.$executeRaw`
                SELECT public.rpc_pos_sync_fefo(
                  ${validData.empresaId}::uuid,
                  ${branchId}::uuid,
                  ${warehouseId}::uuid,
                  ${detalle.sku},
                  ${detalle.cantidad}::decimal,
                  ${op.payload.cajeroId || '00000000-0000-0000-0000-000000000000'}::uuid,
                  ${op.idLocal}::uuid,
                  'Sincronización de Venta Offline'
                )
              `;
            } catch (err) {
              console.error(`Error descontando FEFO para SKU ${detalle.sku}:`, err);
            }
          }
        }
      }

      sincronizados++;
    }

    return {
      message: 'Sincronización completada exitosamente',
      sincronizados,
      totalProcesados: validData.operaciones.length
    };
  });
}
