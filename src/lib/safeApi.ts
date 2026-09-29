import Swal from 'sweetalert2';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
  statusCode: number;
}

export interface SafeExecuteOptions {
  showSwalOnError?: boolean;
  swalTitle?: string;
  customFallbackMessage?: string;
}

/**
 * Sanitiza los mensajes de error técnicos de PostgreSQL / PostgREST
 * eliminando detalles de infraestructura, rutas de archivos o stack traces.
 */
export function sanitizeErrorMessage(rawError: any, fallbackMessage = 'Error al procesar la operación'): string {
  if (!rawError) return fallbackMessage;

  const raw = typeof rawError === 'string' 
    ? rawError 
    : (rawError.message || rawError.error_description || JSON.stringify(rawError));

  if (raw.includes('MERMA_EXCESIVA_SIN_PIN')) {
    return 'La merma del despiece supera el 35% permitido. Se requiere PIN de autorización de un supervisor.';
  }
  if (raw.includes('violates foreign key')) {
    return 'El registro relacionado no existe o fue desvinculado previamente.';
  }
  if (raw.includes('violates row-level security policy') || raw.includes('42501')) {
    return 'Permisos insuficientes: La política de seguridad multi-empresa ha bloqueado el acceso a este registro.';
  }
  if (raw.includes('duplicate key value') || raw.includes('23505')) {
    return 'Ya existe un registro con la misma identificación o código SKU en la empresa.';
  }
  if (raw.includes('violates check constraint') || raw.includes('23514')) {
    return 'Los valores numéricos ingresados no cumplen con las reglas de negocio (ej. valores negativos o fechas inválidas).';
  }
  if (raw.includes('NetworkError') || raw.includes('Failed to fetch')) {
    return 'No se pudo establecer conexión con el servidor. Verifique su conexión de red o modo offline.';
  }

  return fallbackMessage;
}

/**
 * Wrapper de ejecución segura para consultas y mutaciones de Supabase/PostgREST
 */
export async function safeDatabaseExecute<T>(
  operationName: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: SafeExecuteOptions = {}
): Promise<ApiResponse<T>> {
  const { showSwalOnError = false, swalTitle = 'Error en Operación', customFallbackMessage } = options;

  try {
    const { data, error } = await queryFn();

    if (error) {
      const sanitized = sanitizeErrorMessage(error, customFallbackMessage);
      const statusCode = mapErrorToStatusCode(error.code);

      console.warn(`[API_SAFE_GUARD][${operationName}]`, {
        code: error.code,
        message: sanitized,
      });

      if (showSwalOnError) {
        Swal.fire({
          title: swalTitle,
          text: sanitized,
          icon: 'error',
          background: '#09090b',
          color: '#f4f4f5',
          confirmButtonColor: '#0284c7',
        });
      }

      return {
        success: false,
        error: error.code || 'DB_ERROR',
        message: sanitized,
        statusCode,
      };
    }

    return {
      success: true,
      data: data as T,
      message: 'Operación completada exitosamente',
      statusCode: 200,
    };
  } catch (err: any) {
    const sanitized = sanitizeErrorMessage(err, customFallbackMessage || 'Error inesperado del sistema');
    console.error(`[API_FATAL_GUARD][${operationName}]`, err);

    if (showSwalOnError) {
      Swal.fire({
        title: 'Error Inesperado',
        text: sanitized,
        icon: 'error',
        background: '#09090b',
        color: '#f4f4f5',
        confirmButtonColor: '#e11d48',
      });
    }

    return {
      success: false,
      error: 'UNEXPECTED_EXCEPTION',
      message: sanitized,
      statusCode: 500,
    };
  }
}

function mapErrorToStatusCode(code?: string): number {
  switch (code) {
    case 'P0001': return 422; // Regla de negocio / Excepción personalizada
    case '42501': return 403; // RLS / Privilegios insuficientes
    case '23505': return 409; // Conflicto / Unique key
    case '23503': return 400; // Foreign key
    default: return 400;
  }
}
