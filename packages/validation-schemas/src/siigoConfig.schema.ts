import { z } from 'zod';

/**
 * Esquema de credenciales y configuración para la integración con SIIGO Nube API v2
 */
export const SiigoCredentialsConfigSchema = z.object({
  username: z
    .string()
    .trim()
    .email('Debe ingresar un correo electrónico corporativo válido'),
  accessKey: z
    .string()
    .trim()
    .min(10, 'La access_key de SIIGO debe tener al menos 10 caracteres'),
  isSandbox: z
    .boolean()
    .default(false),
  partnerId: z
    .string()
    .trim()
    .min(2, 'El Partner-Id debe tener al menos 2 caracteres')
    .default('LaPezcaderiaERP'),
  urlBase: z
    .string()
    .trim()
    .url('La URL base debe ser una URL válida')
    .default('https://api.siigo.com')
});

export type SiigoCredentialsConfig = z.infer<typeof SiigoCredentialsConfigSchema>;

/**
 * Esquema para solicitar un ping de prueba de conexión con SIIGO
 */
export const SiigoTestPingSchema = z.object({
  username: z
    .string()
    .trim()
    .email('Debe ingresar un correo electrónico corporativo válido'),
  accessKey: z
    .string()
    .trim()
    .min(10, 'La access_key de SIIGO debe tener al menos 10 caracteres'),
  isSandbox: z
    .boolean()
    .default(false)
});

export type SiigoTestPingInput = z.infer<typeof SiigoTestPingSchema>;

/**
 * Función auxiliar para validar credenciales de forma segura
 */
export function validarCredencialesSiigo(data: unknown): {
  valido: boolean;
  data?: SiigoCredentialsConfig;
  error?: string;
} {
  const result = SiigoCredentialsConfigSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map(e => e.message).join(', ');
    return { valido: false, error: errorMsg };
  }
  return { valido: true, data: result.data };
}

/**
 * Función de seguridad para enmascarar access_key en UI y logs
 * Deja visibles únicamente los últimos 4 caracteres
 */
export function enmascararAccessKey(accessKey: string): string {
  if (!accessKey) return '';
  if (accessKey.length <= 4) {
    return '*'.repeat(accessKey.length);
  }
  const ocultarLen = accessKey.length - 4;
  return '*'.repeat(ocultarLen) + accessKey.slice(-4);
}
