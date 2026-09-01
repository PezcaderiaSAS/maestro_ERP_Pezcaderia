/**
 * Algoritmo Oficial de la DIAN (Colombia) - Validación y Cálculo de Dígito de Verificación (Módulo 11)
 */

const DIAN_PRIMES = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/**
 * Calcula el Dígito de Verificación (DV) para un NIT o Cédula colombiana usando Módulo 11.
 * @param nit Número de identificación sin puntos, guiones ni DV.
 * @returns Dígito de verificación (0-9).
 */
export function calcularDigitoVerificacion(nit: string | number): number {
  const cleanNit = String(nit).replace(/\D/g, '');
  if (!cleanNit || cleanNit.length === 0) return 0;

  const len = cleanNit.length;
  let suma = 0;

  for (let i = 0; i < len; i++) {
    const digito = parseInt(cleanNit.charAt(i), 10);
    // Factores ponderados en orden inverso
    const ponderacion = DIAN_PRIMES[len - i - 1];
    suma += digito * (ponderacion || 0);
  }

  const residuo = suma % 11;
  if (residuo === 0 || residuo === 1) {
    return residuo;
  }
  return 11 - residuo;
}

/**
 * Valida si un NIT con formato "NIT-DV" o "NIT" es válido y extrae sus componentes.
 */
export function validarNitCompleto(nitInput: string): {
  isValid: boolean;
  nit: string;
  dvCalculado: number;
  dvIngresado?: number;
} {
  const parts = nitInput.trim().split('-');
  const cleanNit = parts[0].replace(/\D/g, '');
  const dvCalculado = calcularDigitoVerificacion(cleanNit);

  if (parts.length > 1) {
    const dvIngresado = parseInt(parts[1].replace(/\D/g, ''), 10);
    return {
      isValid: dvCalculado === dvIngresado,
      nit: cleanNit,
      dvCalculado,
      dvIngresado,
    };
  }

  return {
    isValid: cleanNit.length >= 6,
    nit: cleanNit,
    dvCalculado,
  };
}

/**
 * Determina heurísticamente si un NIT corresponde a Persona Jurídica o Persona Natural en Colombia.
 * Los NITs de empresas suelen comenzar con 8xx o 9xx y tener 9 dígitos.
 */
export function determinarTipoPersonaPorNit(nit: string): 'NATURAL' | 'JURIDICA' {
  const clean = nit.replace(/\D/g, '');
  if (clean.length === 9 && (clean.startsWith('8') || clean.startsWith('9'))) {
    return 'JURIDICA';
  }
  return 'NATURAL';
}
