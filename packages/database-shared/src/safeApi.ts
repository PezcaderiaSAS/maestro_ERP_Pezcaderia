export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
  statusCode: number;
}

function mapErrorToStatusCode(code: string | undefined): number {
  if (!code) return 500;
  // Prisma error mapping
  if (code === 'P2002') return 409; // Unique constraint failed
  if (code === 'P2025') return 404; // Record not found
  if (code === 'P2003') return 400; // Foreign key constraint failed
  return 500;
}

function sanitizeErrorMessage(error: any): string {
  if (error && typeof error.message === 'string') {
    // Keep it clean for the frontend, avoid exposing DB internals
    if (error.code === 'P2002') return 'El registro ya existe (violación de unicidad).';
    if (error.code === 'P2025') return 'Registro no encontrado en la base de datos.';
    if (error.code === 'P2003') return 'No se puede realizar la acción debido a dependencias relacionadas.';
    // En modo producción, no deberíamos devolver el stack entero.
    return `Error interno de base de datos (${error.code || 'Desconocido'})`;
  }
  return 'Error de servidor desconocido.';
}

export async function safeDatabaseExecute<T>(
  operationName: string,
  queryFn: () => Promise<T>
): Promise<ApiResponse<T>> {
  try {
    const data = await queryFn();
    return {
      success: true,
      data,
      message: `${operationName} completada exitosamente`,
      statusCode: 200,
    };
  } catch (error: any) {
    console.error(`[DB_ERROR] ${operationName}:`, error);
    return {
      success: false,
      error: error.code || 'DB_ERROR',
      message: sanitizeErrorMessage(error),
      statusCode: mapErrorToStatusCode(error.code),
    };
  }
}
