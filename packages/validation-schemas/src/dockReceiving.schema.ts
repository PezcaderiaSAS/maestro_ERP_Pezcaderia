import { z } from 'zod';

/**
 * Estado sanitario sensorial de los ojos del pescado
 */
export const EstadoOjosEnum = z.enum([
  'EXCELENTE_CONVEXO_TRANSPARENTE',
  'ACEPTABLE_PLANO_OPACO',
  'RECHAZADO_HUNDIDO_TURBIO',
]);
export type EstadoOjos = z.infer<typeof EstadoOjosEnum>;

/**
 * Estado sanitario sensorial de las agallas / branquias
 */
export const EstadoAgallasEnum = z.enum([
  'EXCELENTE_ROJO_VIVO_BRILLANTE',
  'ACEPTABLE_ROSADO_PALIDO',
  'RECHAZADO_PARDO_MUCOSO',
]);
export type EstadoAgallas = z.infer<typeof EstadoAgallasEnum>;

/**
 * Estado sanitario sensorial de la textura muscular
 */
export const TexturaMuscularEnum = z.enum([
  'EXCELENTE_FIRME_ELASTICA',
  'ACEPTABLE_LIGERAMENTE_BLANDA',
  'RECHAZADO_BLANDA_DEJA_HUELLA',
]);
export type TexturaMuscular = z.infer<typeof TexturaMuscularEnum>;

/**
 * Estado sanitario sensorial del olor
 */
export const OlorSensorialEnum = z.enum([
  'EXCELENTE_MAR_FRESCO_ALGAS',
  'ACEPTABLE_NEUTRO',
  'RECHAZADO_AMONIACAL_ACIDO',
]);
export type OlorSensorial = z.infer<typeof OlorSensorialEnum>;

/**
 * Esquema de Inspección Sanitaria Sensorial y Cadena de Frío en Muelle
 */
export const InspeccionSanitariaMuelleSchema = z.object({
  temperaturaPulpaC: z
    .number()
    .min(-5, 'La temperatura no puede ser inferior a -5°C')
    .max(15, 'Temperatura inverosímil para pescado fresco')
    .refine((val) => val <= 6.0, {
      message: 'BLOQUEO SANITARIO: La temperatura supera los 6.0°C. Riesgo de proliferación bacteriana y pérdida de cadena de frío.',
    }),
  ojos: EstadoOjosEnum,
  agallas: EstadoAgallasEnum,
  textura: TexturaMuscularEnum,
  olor: OlorSensorialEnum,
  inspectorCalidad: z.string().min(2, 'Debe registrar el nombre del inspector de calidad'),
  observacionesSensoriales: z.string().max(500).optional(),
});
export type InspeccionSanitariaMuelle = z.infer<typeof InspeccionSanitariaMuelleSchema>;

/**
 * Esquema para registrar pesaje por talla y calidad en muelle
 */
export const PesajeTallaMuelleSchema = z.object({
  id: z.string().optional(),
  tallaNombre: z.string().min(1, 'El nombre o rango de talla es requerido (ej: 400-600g, Mediano, Grande)'),
  calidad: z.enum(['PRIMERA', 'SEGUNDA', 'DESCARTE_INDUSTRIAL']).default('PRIMERA'),
  cantidadCanastillas: z.number().int().min(1, 'Debe indicar al menos 1 canastilla'),
  taraPorCanastillaKg: z.number().min(0).default(2.0),
  pesoBrutoBasculaKg: z.number().positive('El peso bruto debe ser mayor a 0'),
  porcentajeEscurridoHielo: z.number().min(0).max(20, 'El porcentaje de escurrido de hielo no debe superar el 20%').default(3.0),
  precioPorKgAcordado: z.number().positive('El precio pactado por kilo debe ser mayor a 0'),
});
export type PesajeTallaMuelle = z.infer<typeof PesajeTallaMuelleSchema>;

/**
 * Esquema de Deducciones de Faena Pesquera a descontar al pescador
 */
export const DeduccionFaenaSchema = z.object({
  id: z.string().optional(),
  tipoDeduccion: z.enum([
    'ANTICIPO_EFECTIVO',
    'COMBUSTIBLE_GASOLINA',
    'HIELO_FABRICA',
    'VIVERES_RANCHO',
    'MANTENIMIENTO_EQUIPOS',
    'OTRO',
  ]),
  descripcion: z.string().min(2, 'Descripción del rubro deducido'),
  montoDeducido: z.number().positive('El monto a deducir debe ser positivo'),
  soporteComprobante: z.string().optional(),
});
export type DeduccionFaena = z.infer<typeof DeduccionFaenaSchema>;

/**
 * Esquema completo para Recepción, Compra en Muelle y Liquidación a Pescadores
 */
export const RecepcionCompraMuelleSchema = z.object({
  id: z.string().optional(),
  consecutivoActa: z.string().min(1, 'El número de acta de muelle es requerido'),
  fechaRecepcion: z.string().min(1, 'La fecha y hora de recepción es requerida'),
  embarcacionNombre: z.string().min(2, 'Debe indicar el nombre de la lancha o embarcación'),
  patronPescadorNombre: z.string().min(2, 'Debe indicar el nombre del pescador o armador'),
  patronIdentificacion: z.string().min(5, 'Debe registrar la identificación del pescador'),
  puertoMuelleOrigen: z.string().min(2, 'Debe indicar el muelle o puerto de descarga'),
  especiePescado: z.string().min(2, 'Especie del lote (ej. Pargo Rojo, Corvina, Robalo, Trucha)'),
  bodegaDestinoId: z.string().min(1, 'Debe seleccionar el cuarto frío de destino'),
  inspeccionSanitaria: InspeccionSanitariaMuelleSchema,
  itemsTallas: z.array(PesajeTallaMuelleSchema).min(1, 'Debe registrar al menos un pesaje de talla'),
  deduccionesFaena: z.array(DeduccionFaenaSchema).optional().default([]),
  metodoPagoLiquidacion: z.enum(['EFECTIVO_CAJA_MENOR', 'TRANSFERENCIA_BANCARIA', 'CHEQUE', 'CREDITO_PROVEEDOR']).default('EFECTIVO_CAJA_MENOR'),
  observacionesLiquidacion: z.string().max(1000).optional(),
});
export type RecepcionCompraMuelle = z.infer<typeof RecepcionCompraMuelleSchema>;

/**
 * Función utilitaria determinista para calcular la liquidación completa de muelle
 */
export function calcularLiquidacionMuelle(
  itemsTallas: PesajeTallaMuelle[],
  deducciones: DeduccionFaena[]
) {
  let pesoBrutoTotalKg = 0;
  let taraTotalKg = 0;
  let pesoNetoEscurridoTotalKg = 0;
  let subtotalCompraPescado = 0;

  const desgloseTallas = itemsTallas.map((talla) => {
    const taraKg = talla.cantidadCanastillas * talla.taraPorCanastillaKg;
    const pesoNetoBascula = Math.max(0, talla.pesoBrutoBasculaKg - taraKg);
    const descuentoEscurridoKg = pesoNetoBascula * (talla.porcentajeEscurridoHielo / 100);
    const pesoNetoLiquidadoKg = Math.max(0, pesoNetoBascula - descuentoEscurridoKg);
    const valorTotalTalla = Math.round(pesoNetoLiquidadoKg * talla.precioPorKgAcordado);

    pesoBrutoTotalKg += talla.pesoBrutoBasculaKg;
    taraTotalKg += taraKg;
    pesoNetoEscurridoTotalKg += pesoNetoLiquidadoKg;
    subtotalCompraPescado += valorTotalTalla;

    return {
      ...talla,
      taraCalculadaKg: Number(taraKg.toFixed(2)),
      descuentoEscurridoKg: Number(descuentoEscurridoKg.toFixed(2)),
      pesoNetoLiquidadoKg: Number(pesoNetoLiquidadoKg.toFixed(2)),
      valorTotalTalla,
    };
  });

  const totalDeducciones = deducciones.reduce((sum, d) => sum + d.montoDeducido, 0);
  const netoPagarPescador = Math.max(0, subtotalCompraPescado - totalDeducciones);

  return {
    desgloseTallas,
    pesoBrutoTotalKg: Number(pesoBrutoTotalKg.toFixed(2)),
    taraTotalKg: Number(taraTotalKg.toFixed(2)),
    pesoNetoEscurridoTotalKg: Number(pesoNetoEscurridoTotalKg.toFixed(2)),
    subtotalCompraPescado,
    totalDeducciones,
    netoPagarPescador,
  };
}
