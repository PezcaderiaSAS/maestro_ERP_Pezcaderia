import { describe, it, expect } from 'vitest';
import {
  classifyProductVisualTheme,
  getProductInitials,
  generateProductSVGAvatar,
  isExternalPlaceholder,
} from '../utils/productVisualGenerator';

describe('productVisualGenerator - Taxonomía Marina de 6 Familias y Generación SVG', () => {
  it('clasifica camarones y langostinos en familia CAMARON con badge CAMARÓN', () => {
    const theme1 = classifyProductVisualTheme('Camarón Tigre 16/20', 'Mariscos');
    expect(theme1.categoryType).toBe('CAMARON');
    expect(theme1.badgeLabel).toBe('CAMARÓN');
    expect(theme1.gradientColors).toEqual(['#F97316', '#DC2626']);

    const theme2 = classifyProductVisualTheme('Langostino U10', 'Crustáceos');
    expect(theme2.categoryType).toBe('CAMARON');

    const theme3 = classifyProductVisualTheme('Colas de Camarón Tití', 'Congelados');
    expect(theme3.categoryType).toBe('CAMARON');
  });

  it('clasifica pulpo, calamar y otros moluscos en familia MARISCO con badge MARISCO', () => {
    const theme1 = classifyProductVisualTheme('Pulpo Baby Entero', 'Mariscos');
    expect(theme1.categoryType).toBe('MARISCO');
    expect(theme1.badgeLabel).toBe('MARISCO');
    expect(theme1.gradientColors).toEqual(['#7C3AED', '#D97706']);

    const theme2 = classifyProductVisualTheme('Anillos de Calamar Limpios', 'Mariscos');
    expect(theme2.categoryType).toBe('MARISCO');

    const theme3 = classifyProductVisualTheme('Muelas de Jaiba / Cangrejo', 'Mariscos');
    expect(theme3.categoryType).toBe('MARISCO');
  });

  it('clasifica pescados de mar y río enteros en familia PESCADO con badge PESCADO', () => {
    const theme1 = classifyProductVisualTheme('Mojarra Roja Entera', 'Pescados');
    expect(theme1.categoryType).toBe('PESCADO');
    expect(theme1.badgeLabel).toBe('PESCADO');
    expect(theme1.gradientColors).toEqual(['#0284C7', '#1E3A8A']);

    const theme2 = classifyProductVisualTheme('Pargo Rojo Platero', 'Frescos');
    expect(theme2.categoryType).toBe('PESCADO');

    const theme3 = classifyProductVisualTheme('Trucha Arcoíris', 'Frescos');
    expect(theme3.categoryType).toBe('PESCADO');
  });

  it('clasifica filetes, postas y porciones en familia CORTE_FILETE con badge CORTE', () => {
    const theme1 = classifyProductVisualTheme('Filete de Salmón Premium', 'Pescados');
    expect(theme1.categoryType).toBe('CORTE_FILETE');
    expect(theme1.badgeLabel).toBe('CORTE');
    expect(theme1.gradientColors).toEqual(['#059669', '#0D9488']);

    const theme2 = classifyProductVisualTheme('Posta de Bagre', 'Pescados');
    expect(theme2.categoryType).toBe('CORTE_FILETE');

    const theme3 = classifyProductVisualTheme('Lomo de Atún Aleta Amarilla', 'Pescados');
    expect(theme3.categoryType).toBe('CORTE_FILETE');
  });

  it('clasifica bloques congelados, IQF y productos fríos en familia CONGELADO', () => {
    const theme1 = classifyProductVisualTheme('Bloque Congelado IQF Especial', 'Congelados');
    expect(theme1.categoryType).toBe('CONGELADO');
    expect(theme1.badgeLabel).toBe('CONGELADO');
    expect(theme1.gradientColors).toEqual(['#38BDF8', '#2563EB']);

    const theme2 = classifyProductVisualTheme('Hielo en Escamas x Bulto', 'Frío');
    expect(theme2.categoryType).toBe('CONGELADO');

    const theme3 = classifyProductVisualTheme('Empanadas de Mariscos', 'Congelados');
    expect(theme3.categoryType).toBe('CONGELADO');
  });

  it('clasifica bolsas, cajas, empaques y canastillas en familia INSUMO', () => {
    const theme1 = classifyProductVisualTheme('Bolsas al Vacío 20x30 cm', 'Insumos');
    expect(theme1.categoryType).toBe('INSUMO');
    expect(theme1.badgeLabel).toBe('INSUMO');
    expect(theme1.gradientColors).toEqual(['#475569', '#1E293B']);

    const theme2 = classifyProductVisualTheme('Caja Térmica Icopor 40L', 'Empaque');
    expect(theme2.categoryType).toBe('INSUMO');

    const theme3 = classifyProductVisualTheme('Canastilla Plástica Perforada', 'Equipamiento');
    expect(theme3.categoryType).toBe('INSUMO');
  });

  it('detecta URLs externas y placeholders de Unsplash correctamente con isExternalPlaceholder', () => {
    expect(isExternalPlaceholder('https://images.unsplash.com/photo-1534482421-64566f976cfa?w=300')).toBe(true);
    expect(isExternalPlaceholder('https://unsplash.com/photos/xyz')).toBe(true);
    expect(isExternalPlaceholder('')).toBe(true);
    expect(isExternalPlaceholder('   ')).toBe(true);
    expect(isExternalPlaceholder(null)).toBe(true);
    expect(isExternalPlaceholder(undefined)).toBe(true);

    // Imágenes locales reales del usuario
    expect(isExternalPlaceholder('data:image/webp;base64,UklGRm...')).toBe(false);
    expect(isExternalPlaceholder('/uploads/mi_foto_local.png')).toBe(false);
    expect(isExternalPlaceholder('https://storage.miservidor.com/fotos/pargo.jpg')).toBe(false);
  });

  it('extrae iniciales representativas de 2 y 3 letras omitiendo conectores', () => {
    expect(getProductInitials('Salmón')).toBe('SAL');
    expect(getProductInitials('Salmón Premium')).toBe('SPR');
    expect(getProductInitials('Filete de Robalo Fresco')).toBe('FRF');
    expect(getProductInitials('Camarón Crudo 41-50')).toBe('CCR');
    expect(getProductInitials('Trucha Arcoíris del Lago')).toBe('TAL');
    expect(getProductInitials('')).toBe('PZ');
  });

  it('genera un Data URL SVG válido con siluetas vectoriales y tipografía legible', () => {
    const svgPescado = generateProductSVGAvatar('Mojarra Roja', 'Pescados');
    expect(svgPescado.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    expect(svgPescado).toContain('grad_PESCADO');
    expect(svgPescado).toContain('PESCADO');

    const svgCamaron = generateProductSVGAvatar('Camarón Tití', 'Mariscos');
    expect(svgCamaron).toContain('grad_CAMARON');
    expect(svgCamaron).toContain('CAMAR%C3%93N'); // CAMARÓN url-encoded
  });
});
