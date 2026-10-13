/**
 * Motor de Generación Visual Automática de Productos a Costo 0 para MaestroPescaderia ERP.
 * Genera Avatares SVG vectoriales temáticos instantáneos (0ms, 100% offline) y helpers de compresión WebP.
 */

export type ProductVisualCategoryType =
  | 'CAMARON'
  | 'MARISCO'
  | 'PESCADO'
  | 'CORTE_FILETE'
  | 'CONGELADO'
  | 'INSUMO'
  | 'GENERAL';

export interface ProductVisualTheme {
  categoryType: ProductVisualCategoryType;
  gradientColors: [string, string];
  textColor: string;
  iconName: string;
  badgeLabel: string;
}

/**
 * Detecta si una URL de imagen es un placeholder genérico o remoto obsoleto (ej: Unsplash).
 */
export function isExternalPlaceholder(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (trimmed === '') return true;
  if (trimmed.includes('images.unsplash.com') || trimmed.includes('unsplash.com')) return true;
  return false;
}

/**
 * Clasifica semánticamente el nombre o categoría del producto en una de las 6 familias marinas.
 */
export function classifyProductVisualTheme(productName: string, category = ''): ProductVisualTheme {
  const cat = (category || '').toLowerCase();
  const text = `${productName || ''} ${category || ''}`.toLowerCase();

  // 1. Insumos / Empaque / Servicios (prioridad máxima para no confundir bolsas/cajas con pescado)
  if (cat.includes('insumo') || cat.includes('empaque') || text.match(/bolsa|caja|canastilla|termo|vac[ií]o|etiqueta|cinta|bandeja|empaque|insumo/)) {
    return {
      categoryType: 'INSUMO',
      gradientColors: ['#475569', '#1E293B'], // Slate neutro
      textColor: '#FFFFFF',
      iconName: 'package',
      badgeLabel: 'INSUMO',
    };
  }

  // 2. Procesados y fritos congelados (Empanadas, Apanados, Deditos, Hielo)
  if (text.match(/empanada|apanad|dedito|croqueta|nugget|hielo|bloque\s+congelad/)) {
    return {
      categoryType: 'CONGELADO',
      gradientColors: ['#38BDF8', '#2563EB'], // Azul Hielo / Celeste ártico
      textColor: '#FFFFFF',
      iconName: 'snowflake',
      badgeLabel: 'CONGELADO',
    };
  }

  // 2. Camarones, Langostinos y Crustáceos específicos (alta especificidad sobre congelado general)
  if (text.match(/camar[oó]n|langost|tit[ií]|tigre|colas?\s+de\s+camar/)) {
    return {
      categoryType: 'CAMARON',
      gradientColors: ['#F97316', '#DC2626'], // Coral / Naranja Fuego
      textColor: '#FFFFFF',
      iconName: 'shrimp',
      badgeLabel: 'CAMARÓN',
    };
  }

  // 3. Otros Mariscos y Moluscos (Pulpo, Calamar, Almejas, Ostras, Jaibas, etc.)
  if (text.match(/pulpo|calamar|anillo|mejill[oó]n|ostra|almeja|jaiba|cangrejo|piangua|marisco|molusco/)) {
    return {
      categoryType: 'MARISCO',
      gradientColors: ['#7C3AED', '#D97706'], // Púrpura Profundo / Ámbar
      textColor: '#FFFFFF',
      iconName: 'shell',
      badgeLabel: 'MARISCO',
    };
  }

  // 4. Cortes / Filetes / Porciones / Postas
  if (text.match(/filete|porci[oó]n|posta|medall[oó]n|despiece|lomo|trozo|porcion/)) {
    return {
      categoryType: 'CORTE_FILETE',
      gradientColors: ['#059669', '#0D9488'], // Esmeralda / Teal fresco
      textColor: '#FFFFFF',
      iconName: 'cut',
      badgeLabel: 'CORTE',
    };
  }

  // 5. Congelados, Bloques e IQF (cuando no especifica una especie marina previa)
  if (cat.includes('congelad') || text.match(/\biqf\b|bloque\s+congelad|hielo|empanada|apanad|dedito/)) {
    return {
      categoryType: 'CONGELADO',
      gradientColors: ['#38BDF8', '#2563EB'], // Azul Hielo / Celeste ártico
      textColor: '#FFFFFF',
      iconName: 'snowflake',
      badgeLabel: 'CONGELADO',
    };
  }

  // 6. Pescados Generales de Mar y Río (Mojarra, Pargo, Corvina, Trucha, Bagre, Salmón, etc.)
  return {
    categoryType: 'PESCADO',
    gradientColors: ['#0284C7', '#1E3A8A'], // Cyan Profundo / Azul Océano
    textColor: '#FFFFFF',
    iconName: 'fish',
    badgeLabel: 'PESCADO',
  };
}

/**
 * Obtiene las 2 o 3 iniciales más representativas del nombre del producto.
 */
export function getProductInitials(name: string): string {
  if (!name || !name.trim()) return 'PZ';
  const words = name
    .trim()
    .split(/\s+/)
    .filter(w => !w.match(/^(de|del|la|el|en|y|a|con|sin)$/i))
    .filter(w => !w.match(/^[\d\-_/xX]+$/i))
    .filter(w => !w.match(/^\d+[gGkKmMlL]+$/i));

  if (words.length === 0) return 'PZ';
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }
  if (words.length === 2) {
    return (words[0][0] + words[1].substring(0, 2)).toUpperCase();
  }
  return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
}

/**
 * Genera un SVG nativo vectorizado en formato Data URL (0ms, 0 bytes de almacenamiento en backend).
 */
export function generateProductSVGAvatar(productName: string, category = ''): string {
  const theme = classifyProductVisualTheme(productName, category);
  const initials = getProductInitials(productName);
  const [c1, c2] = theme.gradientColors;

  // Iconos y siluetas SVG vectoriales de las 6 familias
  let iconPath = '';
  switch (theme.categoryType) {
    case 'CAMARON':
      // Silueta estilizada de camarón curvado con segmentos
      iconPath = `
        <path d="M 40 40 C 45 28 65 24 78 32 C 90 40 92 58 84 70 C 76 82 60 84 52 78 C 46 73 45 65 48 58" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="3" stroke-linecap="round"/>
        <path d="M 76 34 Q 92 24 100 20 M 78 38 Q 95 32 104 30" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="70" cy="36" r="2.5" fill="rgba(255,255,255,0.5)"/>
      `;
      break;
    case 'MARISCO':
      // Silueta de concha marina bivalvo con estrías
      iconPath = `
        <path d="M 32 75 C 30 48 42 32 60 32 C 78 32 90 48 88 75 C 74 84 46 84 32 75 Z" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="3" stroke-linecap="round"/>
        <path d="M 60 34 L 60 80 M 46 40 L 52 78 M 74 40 L 68 78" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.8" stroke-linecap="round"/>
      `;
      break;
    case 'PESCADO':
      // Silueta hidrodinámica de pez entero con aletas y cola
      iconPath = `
        <path d="M 22 60 C 35 42 68 38 92 60 C 68 82 35 78 22 60 Z" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="3" stroke-linecap="round"/>
        <path d="M 24 60 L 14 48 M 24 60 L 14 72 M 14 48 Q 18 60 14 72" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="80" cy="56" r="2.5" fill="rgba(255,255,255,0.5)"/>
      `;
      break;
    case 'CORTE_FILETE':
      // Silueta de filete / porción con cortes diagonales limpios
      iconPath = `
        <path d="M 28 65 C 28 45 42 35 72 38 C 92 40 96 58 88 72 C 75 82 45 80 28 65 Z" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="3" stroke-linecap="round"/>
        <path d="M 45 44 L 40 68 M 58 45 L 53 72 M 72 48 L 68 72" fill="none" stroke="rgba(255,255,255,0.24)" stroke-width="2" stroke-linecap="round"/>
      `;
      break;
    case 'CONGELADO':
      // Cristal de hielo / copo simétrico
      iconPath = `
        <path d="M 60 30 L 60 90 M 30 60 L 90 60 M 38 38 L 82 82 M 38 82 L 82 38" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="60" cy="60" r="14" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-dasharray="4 3"/>
      `;
      break;
    case 'INSUMO':
      // Caja cúbica isométrica
      iconPath = `
        <path d="M 60 30 L 88 44 L 60 58 L 32 44 Z" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M 32 44 L 32 74 L 60 88 L 60 58" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M 88 44 L 88 74 L 60 88" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="2.5" stroke-linejoin="round"/>
      `;
      break;
    default:
      iconPath = `<circle cx="60" cy="60" r="30" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3" stroke-dasharray="6 4"/>`;
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="grad_${theme.categoryType}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
    <filter id="shadow_${theme.categoryType}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="120" height="120" rx="18" fill="url(#grad_${theme.categoryType})" />
  <g transform="translate(0, -6)">
    ${iconPath}
    <text x="60" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" font-size="28" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.2" filter="url(#shadow_${theme.categoryType})">
      ${initials}
    </text>
  </g>
  <rect x="18" y="94" width="84" height="18" rx="9" fill="rgba(0,0,0,0.32)" stroke="rgba(255,255,255,0.18)" stroke-width="0.7" />
  <text x="60" y="106.5" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" font-size="8.5" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.8">
    ${theme.badgeLabel}
  </text>
</svg>
`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Helper client-side para comprimir imágenes subidas por el usuario a formato WebP (<30 KB).
 */
export async function compressImageToWebP(file: File, maxDimension = 400, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Exportar como WebP liviano
        const webpDataUrl = canvas.toDataURL('image/webp', quality);
        resolve(webpDataUrl);
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen para compresión'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.readAsDataURL(file);
  });
}
