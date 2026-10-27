import { describe, it, expect } from 'vitest';
import {
  UserCreationSchema,
  MandatoryPasswordChangeSchema,
  validarUserCreation,
  validarMandatoryPasswordChange,
} from '../schemas/auth.schema';
import {
  CANONICAL_PERMISSIONS,
  PermissionsMatrixSchema,
  validarPermissionsMatrix,
} from '../schemas/permissions.schema';

describe('TASK-036-01: Esquemas Zod de Creación de Usuarios, Contraseñas y Permisos', () => {
  describe('1. UserCreationSchema', () => {
    it('debe validar exitosamente un usuario con todos los campos obligatorios completos', () => {
      const input = {
        nombre: 'Carlos Andrés Rodríguez',
        identificacion: '1098765432',
        email: 'carlos.rodriguez@pezcaderia.com',
        telefono: '3151234567',
        rol: 'VENDEDOR',
        permisosPersonalizados: {
          'pos.apply_discounts': true,
          'pos.cancel_tickets': false,
        },
      };

      const result = validarUserCreation(input);
      expect(result.success).toBe(true);
      expect(result.data?.nombre).toBe('Carlos Andrés Rodríguez');
      expect(result.data?.identificacion).toBe('1098765432');
      expect(result.data?.email).toBe('carlos.rodriguez@pezcaderia.com');
      expect(result.data?.rol).toBe('VENDEDOR');
      expect(result.data?.permisosPersonalizados?.['pos.apply_discounts']).toBe(true);
    });

    it('debe rechazar un usuario si falta la cédula o contiene caracteres no numéricos', () => {
      const inputSinCedula = {
        nombre: 'Ana María Gómez',
        identificacion: '',
        email: 'ana@pezcaderia.com',
        telefono: '3109876543',
        rol: 'CAJERO',
      };
      const res1 = validarUserCreation(inputSinCedula);
      expect(res1.success).toBe(false);

      const inputCedulaInvalida = {
        nombre: 'Ana María Gómez',
        identificacion: 'CC-1098-ABC',
        email: 'ana@pezcaderia.com',
        telefono: '3109876543',
        rol: 'CAJERO',
      };
      const res2 = validarUserCreation(inputCedulaInvalida);
      expect(res2.success).toBe(false);
      expect(res2.error).toMatch(/solo números|identificación/i);
    });

    it('debe rechazar correos con formato inválido o nombres demasiado cortos', () => {
      const inputInvalido = {
        nombre: 'A',
        identificacion: '1234567',
        email: 'correo-sin-arroba',
        telefono: '123',
        rol: 'BODEGUERO',
      };
      const res = validarUserCreation(inputInvalido);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/correo|nombre|teléfono/i);
    });
  });

  describe('2. MandatoryPasswordChangeSchema', () => {
    it('debe aceptar una nueva contraseña fuerte que cumpla con mayúsculas y números', () => {
      const input = {
        newPassword: 'PasswordSeguro2026',
        confirmPassword: 'PasswordSeguro2026',
      };
      const result = validarMandatoryPasswordChange(input);
      expect(result.success).toBe(true);
      expect(result.data?.newPassword).toBe('PasswordSeguro2026');
    });

    it('debe rechazar si las contraseñas no coinciden', () => {
      const input = {
        newPassword: 'PasswordSeguro2026',
        confirmPassword: 'OtraPassword2026',
      };
      const result = validarMandatoryPasswordChange(input);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/no coinciden/i);
    });

    it('debe rechazar contraseñas débiles (menos de 8 caracteres o sin números/mayúsculas)', () => {
      const inputDebil = {
        newPassword: 'debil',
        confirmPassword: 'debil',
      };
      const result = validarMandatoryPasswordChange(inputDebil);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/8 caracteres|mayúscula|número/i);
    });
  });

  describe('3. PermissionsMatrixSchema', () => {
    it('debe contener las claves canónicas de permisos organizadas por módulo', () => {
      expect(CANONICAL_PERMISSIONS.length).toBeGreaterThan(5);
      const keys = CANONICAL_PERMISSIONS.map((p) => p.key);
      expect(keys).toContain('pos.access');
      expect(keys).toContain('pos.apply_discounts');
      expect(keys).toContain('cash.access');
      expect(keys).toContain('inventory.view');
      expect(keys).toContain('admin.users_manage');
    });

    it('debe validar y normalizar una matriz de permisos personalizada', () => {
      const matrix = {
        'pos.access': true,
        'pos.apply_discounts': false,
        'cash.access': true,
      };
      const result = validarPermissionsMatrix(matrix);
      expect(result.success).toBe(true);
      expect(result.data?.['pos.access']).toBe(true);
      expect(result.data?.['pos.apply_discounts']).toBe(false);
    });
  });
});
