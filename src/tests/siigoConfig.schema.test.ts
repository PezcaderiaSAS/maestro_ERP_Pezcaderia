// src/tests/siigoConfig.schema.test.ts
import { describe, it, expect } from 'vitest';
import {
  SiigoCredentialsConfigSchema,
  SiigoTestPingSchema,
  validarCredencialesSiigo,
  enmascararAccessKey
} from '../../packages/validation-schemas/src/siigoConfig.schema';

describe('TASK-025-01: Esquemas de Validación Zod para Integración SIIGO Nube API v2', () => {
  describe('SiigoCredentialsConfigSchema', () => {
    it('debe validar exitosamente una configuración de credenciales completa y válida', () => {
      const validConfig = {
        username: 'facturacion@lapezcaderia.com',
        accessKey: 'siigo_prod_key_9876543210abcdef',
        isSandbox: false,
        partnerId: 'LaPezcaderiaERP',
        urlBase: 'https://api.siigo.com'
      };

      const result = SiigoCredentialsConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('facturacion@lapezcaderia.com');
        expect(result.data.isSandbox).toBe(false);
        expect(result.data.partnerId).toBe('LaPezcaderiaERP');
        expect(result.data.urlBase).toBe('https://api.siigo.com');
      }
    });

    it('debe aplicar valores por defecto a partnerId, isSandbox y urlBase si se omiten', () => {
      const minimalConfig = {
        username: 'admin@lapezcaderia.co',
        accessKey: 'clave_secreta_siigo_123'
      };

      const parsed = SiigoCredentialsConfigSchema.parse(minimalConfig);
      expect(parsed.isSandbox).toBe(false);
      expect(parsed.partnerId).toBe('LaPezcaderiaERP');
      expect(parsed.urlBase).toBe('https://api.siigo.com');
    });

    it('debe rechazar un username que no tenga formato de correo electrónico', () => {
      const invalidUsername = {
        username: 'usuario_invalido_sin_arroba',
        accessKey: 'clave_valida_123456789'
      };

      const result = SiigoCredentialsConfigSchema.safeParse(invalidUsername);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMsg = result.error.errors[0]?.message;
        expect(errorMsg).toMatch(/correo electr[oó]nico/i);
      }
    });

    it('debe rechazar una access_key con menos de 10 caracteres', () => {
      const shortKey = {
        username: 'contabilidad@lapezcaderia.co',
        accessKey: 'corta'
      };

      const result = SiigoCredentialsConfigSchema.safeParse(shortKey);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMsg = result.error.errors[0]?.message;
        expect(errorMsg).toMatch(/10 caracteres/i);
      }
    });

    it('debe recortar espacios en blanco (trim) en username y accessKey', () => {
      const whitespaceConfig = {
        username: '  tesoreria@lapezcaderia.com   ',
        accessKey: '   clave_con_espacios_12345   '
      };

      const parsed = SiigoCredentialsConfigSchema.parse(whitespaceConfig);
      expect(parsed.username).toBe('tesoreria@lapezcaderia.com');
      expect(parsed.accessKey).toBe('clave_con_espacios_12345');
    });

    it('debe permitir activar el flag isSandbox explícitamente', () => {
      const sandboxConfig = {
        username: 'sandbox@lapezcaderia.com',
        accessKey: 'sandbox_access_key_99999',
        isSandbox: true
      };

      const parsed = SiigoCredentialsConfigSchema.parse(sandboxConfig);
      expect(parsed.isSandbox).toBe(true);
    });
  });

  describe('SiigoTestPingSchema', () => {
    it('debe validar exitosamente los parámetros para un ping de prueba de conexión', () => {
      const pingData = {
        username: 'test.siigo@pezcaderia.com',
        accessKey: 'test_key_123456789',
        isSandbox: true
      };

      const result = SiigoTestPingSchema.safeParse(pingData);
      expect(result.success).toBe(true);
    });

    it('debe rechazar ping si faltan campos obligatorios', () => {
      const result = SiigoTestPingSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('Funciones Auxiliares de Validación y Seguridad', () => {
    it('validarCredencialesSiigo debe retornar objeto exitoso si los datos son correctos', () => {
      const res = validarCredencialesSiigo({
        username: 'valido@empresa.com',
        accessKey: '1234567890abcdef'
      });
      expect(res.valido).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.error).toBeUndefined();
    });

    it('validarCredencialesSiigo debe retornar error amigable si los datos son inválidos', () => {
      const res = validarCredencialesSiigo({
        username: 'no-es-correo',
        accessKey: '123'
      });
      expect(res.valido).toBe(false);
      expect(res.error).toBeDefined();
      expect(res.data).toBeUndefined();
    });

    it('enmascararAccessKey debe ocultar la clave dejando visibles solo los últimos 4 caracteres', () => {
      expect(enmascararAccessKey('siigo_api_key_abcdef1234')).toBe('********************1234');
      expect(enmascararAccessKey('1234567890')).toBe('******7890');
      expect(enmascararAccessKey('')).toBe('');
      expect(enmascararAccessKey('abc')).toBe('***');
    });
  });
});
