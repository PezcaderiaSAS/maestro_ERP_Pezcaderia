import { calcularDigitoVerificacion, determinarTipoPersonaPorNit } from './dianValidator';

export interface ParsedClientData {
  nombre?: string;
  identificacion?: string;
  tipoIdentificacion?: 'NIT' | 'CC' | 'CE';
  tipoPersona?: 'NATURAL' | 'JURIDICA';
  dv?: number;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  encargadoCompras?: string;
}

/**
 * Parser heurístico local en TypeScript de 0ms para extraer información de clientes
 * a partir de texto desestructurado (mensajes de WhatsApp, firmas de correo, RUT copiado).
 */
export function parseContactText(rawText: string): ParsedClientData {
  const result: ParsedClientData = {};
  if (!rawText || typeof rawText !== 'string') return result;

  const text = rawText.trim();

  // 1. Extracción de Email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    result.email = emailMatch[0].toLowerCase();
  }

  // 2. Extracción de Teléfono (Celular Colombia: 3xx xxx xxxx o fijo de 7-10 dígitos)
  const phoneMatch = text.match(/(?:\+?57\s?)?(?:3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|\b[2-8]\d{6}\b)/);
  if (phoneMatch) {
    result.telefono = phoneMatch[0].replace(/\D/g, '');
  }

  // 3. Extracción de NIT / Cédula y DV
  const nitRegex = /(?:NIT|C\.?C\.?|RUT|ID|Identificaci[oó]n|Doc)\s*:?\s*([\d.]{6,15})(?:[\s-]*(\d))?/i;
  const nitMatch = text.match(nitRegex);
  
  if (nitMatch) {
    const rawNit = nitMatch[1].replace(/\D/g, '');
    if (rawNit.length >= 6) {
      result.identificacion = rawNit;
      result.dv = nitMatch[2] ? parseInt(nitMatch[2], 10) : calcularDigitoVerificacion(result.identificacion);
      result.tipoIdentificacion = 'NIT';
      result.tipoPersona = determinarTipoPersonaPorNit(result.identificacion);
    }
  } else {
    // Buscar número de 7 a 10 dígitos aislado
    const standaloneNumber = text.match(/\b\d{7,10}\b/);
    if (standaloneNumber && standaloneNumber[0] !== result.telefono) {
      result.identificacion = standaloneNumber[0];
      result.dv = calcularDigitoVerificacion(result.identificacion);
      result.tipoIdentificacion = 'NIT';
      result.tipoPersona = determinarTipoPersonaPorNit(result.identificacion);
    }
  }

  // 4. Extracción de Dirección
  const addressRegex = /(?:Cra|Carrera|Calle|Cl|Cll|Av|Avenida|Transversal|Tv|Dg|Diagonal|Circular|Cq)\.?\s+[0-9A-Za-z\s#.-]+(?=,|\n|$|\bTel|\bCel|\bNIT|\bEmail)/i;
  const addressMatch = text.match(addressRegex);
  if (addressMatch) {
    result.direccion = addressMatch[0].replace(/\s+/g, ' ').trim();
  }

  // 5. Extracción de Ciudad Colombiana común
  const cities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', 'Santa Marta', 'Cúcuta', 'Ibagué', 'Villavicencio', 'Pasto', 'Armenia', 'Montería', 'Neiva', 'Popayán', 'Sincelejo', 'Valledupar', 'Tunja'];
  for (const city of cities) {
    const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
    if (cityRegex.test(text)) {
      result.ciudad = city;
      break;
    }
  }

  // 6. Extracción de Razón Social / Nombre
  // Heurística: Buscar nombres de empresas comunes (SAS, SA, LTDA, Restaurante, Inversiones, Hotel, etc.)
  const companyRegex = /(?:[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚña-z&.\s]+(?:\s+(?:S\.?A\.?S\.?|S\.?A\.?|LTDA\.?|E\.?U\.?|& CIA)))/i;
  const companyMatch = text.match(companyRegex);
  if (companyMatch) {
    result.nombre = companyMatch[0].trim();
    result.tipoPersona = 'JURIDICA';
  } else {
    // Si la primera línea tiene texto con letras y no es un NIT ni email
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const firstLine = lines[0];
      if (!firstLine.includes('@') && !firstLine.match(/^\d+$/) && firstLine.length < 60) {
        // Limpiar prefijos como "Cliente:", "Nombre:", "Facturar a:"
        const cleanName = firstLine.replace(/^(?:Cliente|Nombre|Facturar a|Razón Social|Empresa)\s*:?\s*/i, '').trim();
        if (cleanName.length >= 3) {
          result.nombre = cleanName;
        }
      }
    }
  }

  return result;
}
