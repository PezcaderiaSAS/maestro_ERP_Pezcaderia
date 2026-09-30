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
 * Mapeo exhaustivo de códigos estándar SQLSTATE (PostgreSQL) y excepciones de dominio
 */
const SQLSTATE_ERROR_MAP: Record<string, string> = {
  '23503': 'El registro relacionado no existe o fue desvinculado previamente (referencia foránea inválida).',
  '23505': 'Ya existe un registro con la misma identificación o código SKU en la empresa.',
  '23514': 'Los valores numéricos ingresados no cumplen con las reglas de negocio (ej. valores negativos o fechas inválidas).',
  '42501': 'Permisos insuficientes: La política de seguridad multi-empresa ha bloqueado el acceso a este registro.',
  '40001': 'Conflicto de serialización por concurrencia. Intente la operación nuevamente.',
  '55P03': 'El registro está bloqueado por otra transacción activa. Reintente en un momento.',
  '08000': 'Error de conexión con la base de datos.',
  '08003': 'La conexión con la base de datos se cerró inesperadamente.',
  '08006': 'Fallo en la comunicación con el servidor de base de datos.',
};

/**
 * Sanitiza los mensajes de error técnicos de PostgreSQL / PostgREST
 * evaluando códigos SQLSTATE y códigos de dominio estructurados.
 */
export function sanitizeErrorMessage(rawError: any, fallbackMessage = 'Error al procesar la operación'): string {
  if (!rawError) return fallbackMessage;

  // 1. Evaluar por código SQLSTATE directo
  const code = String(rawError?.code || rawError?.status || '').trim();
  if (code && SQLSTATE_ERROR_MAP[code]) {
    return SQLSTATE_ERROR_MAP[code];
  }

  // 2. Extraer detalles o mensaje para excepciones de dominio personalizadas (P0001)
  const detail = String(rawError?.details || rawError?.hint || '').trim();
  const rawMsg = typeof rawError === 'string' 
    ? rawError 
    : (rawError.message || rawError.error_description || JSON.stringify(rawError));

  if (code === 'P0001' || rawMsg.includes('P0001') || detail) {
    if (detail.includes('ERR_MERMA_EXCESIVA') || rawMsg.includes('MERMA_CRITICA') || rawMsg.includes('MERMA_EXCESIVA')) {
      return 'La merma del despiece supera el 35% permitido. Se requiere autorización de un supervisor o administrador.';
    }
    if (detail.includes('PIN_SUPERVISOR_INVALIDO') || rawMsg.includes('PIN_SUPERVISOR_INVALIDO')) {
      return 'La acción requiere autorización activa de un supervisor o administrador.';
    }
    if (detail.includes('STOCK_INSUFICIENTE') || rawMsg.includes('STOCK_INSUFICIENTE')) {
      return 'Existencias insuficientes en la bodega seleccionada para completar la operación.';
    }
    if (detail.includes('CAJA_CERRADA') || rawMsg.includes('TURNO_YA_ABIERTO')) {
      return 'El estado de la caja o del turno no permite procesar transacciones en este momento.';
    }
  }

  // 3. Fallo de red en el cliente
  if (rawMsg.includes('NetworkError') || rawMsg.includes('Failed to fetch') || rawMsg.includes('Load failed')) {
    return 'No se pudo establecer conexión con el servidor. Verifique su conexión de red o continúe en modo offline.';
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
