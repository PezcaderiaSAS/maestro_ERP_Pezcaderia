import { describe, it, expect } from 'vitest';
import {
  classifyProductVisualTheme,
  getProductInitials,
  generateProductSVGAvatar,
} from '../utils/productVisualGenerator';

describe('productVisualGenerator - Clasificación y Generación SVG', () => {
  it('clasifica correctamente camarones y langostinos en MARISCO', () => {
    const theme = classifyProductVisualTheme('Camarón Tigre 16/20', 'Mariscos');
    expect(theme.categoryType).toBe('MARISCO');
    expect(theme.badgeLabel).toBe('MARISCO');
  });

  it('clasifica filetes y cortes en CORTE_FILETE', () => {
    const theme = classifyProductVisualTheme('Filete de Salmón Premium', 'Pescados');
    expect(theme.categoryType).toBe('CORTE_FILETE');
    expect(theme.badgeLabel).toBe('CORTE');
  });

  it('clasifica productos congelados o IQF en CONGELADO', () => {
    const theme = classifyProductVisualTheme('Anillos de Calamar IQF Congelado', 'Congelados');
    expect(theme.categoryType).toBe('CONGELADO');
    expect(theme.badgeLabel).toBe('CONGELADO');
  });

  it('extrae iniciales representativas correctamente', () => {
    expect(getProductInitials('Salmón')).toBe('SAL');
    expect(getProductInitials('Salmón Premium')).toBe('SPR');
    expect(getProductInitials('Filete de Robalo Fresco')).toBe('FRF');
  });

  it('genera un Data URL SVG válido con gradiente e iniciales', () => {
    const svgDataUrl = generateProductSVGAvatar('Trucha Arcoíris', 'Frescos');
    expect(svgDataUrl.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    expect(svgDataUrl).toContain('grad_PESCADO');
  });
});
