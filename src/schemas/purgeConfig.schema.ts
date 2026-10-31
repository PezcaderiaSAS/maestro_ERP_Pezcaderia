import { z } from 'zod';

/**
 * Esquema Zod canónico para la configuración del proceso de purga y resiembra.
 */
export const purgeConfigSchema = z.object({
  tenantId: z.string().min(1, 'El tenantId es obligatorio'),
  limpiarRemotoSupabase: z.boolean().default(true),
  conservarSesionTurno: z.boolean().default(false),
  motivo: z.string().optional(),
});

export type PurgeConfig = z.infer<typeof purgeConfigSchema>;
