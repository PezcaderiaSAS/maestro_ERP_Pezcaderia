import { describe, it, expect } from 'vitest';
import {
  DriverLoginCredentialsSchema,
  EvidenciaEntregaClienteSchema,
  DevolucionItemRutaSchema,
  RegistroEjecucionParadaSchema,
  calcularTotalRecaudoParada,
  calcularKilosDevueltosTotales
} from '../../packages/validation-schemas/src/driverDeliveryPwa.schema';

describe('TASK-023-01: driverDeliveryPwa.schema - Validación Zod y Contratos PWA', () => {
  describe('1. DriverLoginCredentialsSchema (Autenticación de Conductor)', () => {
    it('Valida credenciales corporativas correctas', () => {
      const valid = {
        email: 'conductor.juan@pezcaderia.com',
        password: 'ClaveSegura2026*'
      };
      const result = DriverLoginCredentialsSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('conductor.juan@pezcaderia.com');
      }
    });

    it('Rechaza correos con formato inválido', () => {
      const invalid = {
        email: 'juan_no_es_correo',
        password: 'password123'
      };
      const result = DriverLoginCredentialsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/correo electrónico corporativo válido/i);
      }
    });

    it('Rechaza contraseñas con menos de 6 caracteres', () => {
      const invalid = {
        email: 'conductor@pezcaderia.com',
        password: '123'
      };
      const result = DriverLoginCredentialsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/mínimo 6 caracteres/i);
      }
    });
  });

  describe('2. EvidenciaEntregaClienteSchema (Firma Táctil y Parámetros Térmicos)', () => {
    const validSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    it('Acepta evidencia completa con firma Base64 PNG y temperatura adecuada', () => {
      const valid = {
        nombreReceptor: 'Carlos Mendoza',
        cedulaReceptor: '1098765432',
        firmaCanvasBase64: validSignature,
        temperaturaLlegada: 3.2
      };
      const result = EvidenciaEntregaClienteSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nombreReceptor).toBe('Carlos Mendoza');
        expect(result.data.temperaturaLlegada).toBe(3.2);
      }
    });

    it('Rechaza firma digital que no cumpla con formato data:image/png;base64', () => {
      const invalid = {
        nombreReceptor: 'Carlos Mendoza',
        cedulaReceptor: '1098765432',
        firmaCanvasBase64: 'https://example.com/firma.jpg',
        temperaturaLlegada: 3.5
      };
      const result = EvidenciaEntregaClienteSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/imagen PNG codificada en Base64/i);
      }
    });

    it('Rechaza temperaturas fuera de los rangos biológicamente admisibles', () => {
      const tooHot = {
        nombreReceptor: 'Carlos Mendoza',
        cedulaReceptor: '1098765432',
        firmaCanvasBase64: validSignature,
        temperaturaLlegada: 45
      };
      expect(EvidenciaEntregaClienteSchema.safeParse(tooHot).success).toBe(false);

      const tooCold = {
        nombreReceptor: 'Carlos Mendoza',
        cedulaReceptor: '1098765432',
        firmaCanvasBase64: validSignature,
        temperaturaLlegada: -40
      };
      expect(EvidenciaEntregaClienteSchema.safeParse(tooCold).success).toBe(false);
    });

    it('Rechaza nombre de receptor menor a 3 caracteres o cédula menor a 5 caracteres', () => {
      const shortName = {
        nombreReceptor: 'Al',
        cedulaReceptor: '12345678',
        firmaCanvasBase64: validSignature,
        temperaturaLlegada: 2.0
      };
      expect(EvidenciaEntregaClienteSchema.safeParse(shortName).success).toBe(false);

      const shortId = {
        nombreReceptor: 'Alberto Gomez',
        cedulaReceptor: '12',
        firmaCanvasBase64: validSignature,
        temperaturaLlegada: 2.0
      };
      expect(EvidenciaEntregaClienteSchema.safeParse(shortId).success).toBe(false);
    });
  });

  describe('3. DevolucionItemRutaSchema (Rechazos Parciales y Mermas)', () => {
    it('Valida un registro de devolución correcto con motivo válido', () => {
      const valid = {
        sku: 'MOJ-ENT-001',
        nombre: 'Mojarra Roja Entera',
        kilosDevueltos: 5.4,
        motivoRechazo: 'CALIBRE_INCORRECTO',
        observaciones: 'Cliente solicitó calibre 500-600g y llegó 300-400g'
      };
      const result = DevolucionItemRutaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('Rechaza kilos menores o iguales a 0', () => {
      const zeroKilos = {
        sku: 'MOJ-ENT-001',
        nombre: 'Mojarra Roja Entera',
        kilosDevueltos: 0,
        motivoRechazo: 'EMPAQUE_AVERIADO'
      };
      const result = DevolucionItemRutaSchema.safeParse(zeroKilos);
      expect(result.success).toBe(false);
    });

    it('Rechaza motivos no contemplados en el enum', () => {
      const invalidReason = {
        sku: 'MOJ-ENT-001',
        nombre: 'Mojarra Roja Entera',
        kilosDevueltos: 3.0,
        motivoRechazo: 'MOTIVO_INEXISTENTE'
      };
      const result = DevolucionItemRutaSchema.safeParse(invalidReason);
      expect(result.success).toBe(false);
    });
  });

  describe('4. RegistroEjecucionParadaSchema (Contrato Completo de Parada)', () => {
    const validSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const evidenciaValida = {
      nombreReceptor: 'Chef Mario',
      cedulaReceptor: '987654321',
      firmaCanvasBase64: validSignature,
      temperaturaLlegada: 1.8
    };

    it('Valida exitosamente una entrega total con recaudo mixto', () => {
      const paradaTotal = {
        paradaId: 'stop-001',
        pedidoId: 'ped-8841',
        manifiestoId: 'man-2026-10-19',
        estadoFinal: 'ENTREGADO_TOTAL',
        evidencia: evidenciaValida,
        devoluciones: [],
        montoCobradoEfectivo: 150000,
        montoCobradoTransferencia: 200000,
        comprobanteTransferencia: 'NEQUI-998182'
      };
      const result = RegistroEjecucionParadaSchema.safeParse(paradaTotal);
      expect(result.success).toBe(true);
    });

    it('Falla si el estado es ENTREGADO_PARCIAL pero no se adjuntan ítems devueltos (Refinement)', () => {
      const paradaParcialSinItems = {
        paradaId: 'stop-002',
        pedidoId: 'ped-8842',
        manifiestoId: 'man-2026-10-19',
        estadoFinal: 'ENTREGADO_PARCIAL',
        evidencia: evidenciaValida,
        devoluciones: [],
        montoCobradoEfectivo: 50000
      };
      const result = RegistroEjecucionParadaSchema.safeParse(paradaParcialSinItems);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/debe registrar al menos un ítem devuelto/i);
      }
    });

    it('Valida exitosamente entrega parcial cuando tiene ítems devueltos', () => {
      const paradaParcialConItems = {
        paradaId: 'stop-002',
        pedidoId: 'ped-8842',
        manifiestoId: 'man-2026-10-19',
        estadoFinal: 'ENTREGADO_PARCIAL',
        evidencia: evidenciaValida,
        devoluciones: [
          {
            sku: 'SALM-01',
            nombre: 'Salmón Premium',
            kilosDevueltos: 2.5,
            motivoRechazo: 'EMPAQUE_AVERIADO'
          }
        ],
        montoCobradoEfectivo: 85000
      };
      const result = RegistroEjecucionParadaSchema.safeParse(paradaParcialConItems);
      expect(result.success).toBe(true);
    });

    it('Rechaza montos negativos de cobro', () => {
      const negativePayment = {
        paradaId: 'stop-003',
        pedidoId: 'ped-8843',
        manifiestoId: 'man-2026-10-19',
        estadoFinal: 'ENTREGADO_TOTAL',
        evidencia: evidenciaValida,
        montoCobradoEfectivo: -1000
      };
      const result = RegistroEjecucionParadaSchema.safeParse(negativePayment);
      expect(result.success).toBe(false);
    });
  });

  describe('5. Utilidades Puras de Cálculo', () => {
    it('calcularTotalRecaudoParada suma efectivo y transferencias de forma segura', () => {
      expect(calcularTotalRecaudoParada(150000, 250000)).toBe(400000);
      expect(calcularTotalRecaudoParada(0, 100000)).toBe(100000);
      expect(calcularTotalRecaudoParada(50000, 0)).toBe(50000);
      expect(calcularTotalRecaudoParada(-10, 50000)).toBe(50000);
    });

    it('calcularKilosDevueltosTotales totaliza la merma de devolución con precisión de 2 decimales', () => {
      const devoluciones = [
        {
          sku: 'SKU-1',
          nombre: 'Producto 1',
          kilosDevueltos: 3.125,
          motivoRechazo: 'CADENA_FRIO' as const
        },
        {
          sku: 'SKU-2',
          nombre: 'Producto 2',
          kilosDevueltos: 1.45,
          motivoRechazo: 'OTRO' as const
        }
      ];
      expect(calcularKilosDevueltosTotales(devoluciones)).toBe(4.58);
      expect(calcularKilosDevueltosTotales([])).toBe(0);
    });
  });
});
