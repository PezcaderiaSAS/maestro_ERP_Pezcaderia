import { describe, it, expect } from 'vitest';
import { calcularDigitoVerificacion, validarNitCompleto, determinarTipoPersonaPorNit } from '../utils/dianValidator';
import { parseContactText } from '../utils/smartContactParser';

describe('dianValidator - Cálculo de Módulo 11', () => {
  it('calcula correctamente el DV para NITs colombianos reales conocidos', () => {
    // Éxito: 890900608 -> DV 9
    expect(calcularDigitoVerificacion('890900608')).toBe(9);
    // Bancolombia: 890903938 -> DV 8
    expect(calcularDigitoVerificacion('890903938')).toBe(8);
    // Ecopetrol: 899999068 -> DV 1
    expect(calcularDigitoVerificacion('899999068')).toBe(1);
    // Cédula ejemplo: 71234567 -> calcula número entre 0 y 9
    const dv = calcularDigitoVerificacion('71234567');
    expect(dv).toBeGreaterThanOrEqual(0);
    expect(dv).toBeLessThanOrEqual(9);
  });

  it('valida formato completo NIT-DV', () => {
    const validacion = validarNitCompleto('890900608-9');
    expect(validacion.isValid).toBe(true);
    expect(validacion.dvCalculado).toBe(9);
    expect(validacion.dvIngresado).toBe(9);

    const invalido = validarNitCompleto('890900608-3');
    expect(invalido.isValid).toBe(false);
  });

  it('detecta tipo de persona jurídica por prefijo de NIT', () => {
    expect(determinarTipoPersonaPorNit('901234567')).toBe('JURIDICA');
    expect(determinarTipoPersonaPorNit('800123456')).toBe('JURIDICA');
    expect(determinarTipoPersonaPorNit('1020304050')).toBe('NATURAL');
  });
});

describe('smartContactParser - Extracción de texto no estructurado', () => {
  it('extrae datos completos de un mensaje típico de WhatsApp', () => {
    const texto = `
      Buenas tardes, por favor facturar a nombre de:
      Restaurante La Marea Azul S.A.S.
      NIT: 901.234.567-8
      Dirección: Carrera 43A # 18-50 Local 102
      Ciudad: Medellín
      Celular: 300 456 7890
      Correo: facturas@lamareazul.com.co
    `;

    const parsed = parseContactText(texto);

    expect(parsed.nombre).toContain('La Marea Azul');
    expect(parsed.identificacion).toBe('901234567');
    expect(parsed.email).toBe('facturas@lamareazul.com.co');
    expect(parsed.telefono).toBe('3004567890');
    expect(parsed.ciudad).toBe('Medellín');
    expect(parsed.direccion).toContain('Carrera 43A # 18-50');
    expect(parsed.tipoPersona).toBe('JURIDICA');
  });
});
