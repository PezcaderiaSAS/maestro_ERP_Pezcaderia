import { describe, it, expect, vi } from 'vitest';
import { sanitizeErrorMessage, safeDatabaseExecute } from '../lib/safeApi';

// Mock sweetalert2 para evitar llamadas al DOM en tests
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
  },
}));

describe('Gobernanza de Errores: safeApi & SQLSTATE Mapping', () => {
  describe('sanitizeErrorMessage', () => {
    it('debe mapear el código SQLSTATE 23503 a mensaje amigable de clave foránea', () => {
      const error = { code: '23503', message: 'insert or update on table "x" violates foreign key constraint' };
      const msg = sanitizeErrorMessage(error);
      expect(msg).toContain('El registro relacionado no existe o fue desvinculado previamente');
    });

    it('debe mapear el código SQLSTATE 23505 a mensaje amigable de registro duplicado', () => {
      const error = { code: '23505', message: 'duplicate key value violates unique constraint' };
      const msg = sanitizeErrorMessage(error);
      expect(msg).toContain('Ya existe un registro con la misma identificación o código SKU');
    });

    it('debe mapear el código SQLSTATE 23514 a mensaje amigable de restricción CHECK', () => {
      const error = { code: '23514', message: 'new row for relation violates check constraint' };
      const msg = sanitizeErrorMessage(error);
      expect(msg).toContain('Los valores numéricos ingresados no cumplen con las reglas de negocio');
    });

    it('debe mapear el código SQLSTATE 42501 a mensaje amigable de RLS y permisos', () => {
      const error = { code: '42501', message: 'permission denied for table' };
      const msg = sanitizeErrorMessage(error);
      expect(msg).toContain('Permisos insuficientes: La política de seguridad multi-empresa ha bloqueado el acceso');
    });

    it('debe mapear el código SQLSTATE 40001 a mensaje de serialización concurrente', () => {
      const error = { code: '40001', message: 'could not serialize access due to concurrent update' };
      const msg = sanitizeErrorMessage(error);
      expect(msg).toContain('Conflicto de serialización por concurrencia');
    });

    it('debe mapear excepciones de dominio P0001 para merma crítica', () => {
      const error = { code: 'P0001', details: 'ERR_MERMA_EXCESIVA: Merma 42% no autorizada' };
      const msg = sanitizeErrorMessage(error);
      expect(msg).toContain('La merma del despiece supera el 35% permitido');
    });

    it('debe manejar errores de conectividad o red sin reventar la UI', () => {
      const error = new Error('Failed to fetch from Supabase edge');
      const msg = sanitizeErrorMessage(error);
      expect(msg).toContain('No se pudo establecer conexión con el servidor');
    });
  });

  describe('safeDatabaseExecute', () => {
    it('debe retornar payload exitoso con statusCode 200 cuando no hay error', async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        data: [{ id: '1', nombre: 'Salmón Premium' }],
        error: null,
      });

      const response = await safeDatabaseExecute('test_query', mockQuery);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.data).toEqual([{ id: '1', nombre: 'Salmón Premium' }]);
    });

    it('debe retornar statusCode 409 cuando la base de datos reporta SQLSTATE 23505', async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key' },
      });

      const response = await safeDatabaseExecute('insert_duplicate', mockQuery);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(409);
      expect(response.message).toContain('Ya existe un registro con la misma identificación o código SKU');
    });

    it('debe capturar excepciones no controladas y retornar statusCode 500', async () => {
      const mockQuery = vi.fn().mockRejectedValue(new Error('Crash inesperado de conexión'));

      const response = await safeDatabaseExecute('fatal_query', mockQuery);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(500);
      expect(response.error).toBe('UNEXPECTED_EXCEPTION');
    });
  });
});
