/**
 * Motor de Generación Visual Automática de Productos a Costo 0 para MaestroPescaderia ERP.
 * Genera Avatares SVG vectoriales temáticos instantáneos (0ms, 100% offline) y helpers de compresión WebP.
 */

export interface ProductVisualTheme {
  categoryType: 'PESCADO' | 'MARISCO' | 'CORTE_FILETE' | 'CONGELADO' | 'INSUMO' | 'GENERAL';
  gradientColors: [string, string];
  textColor: string;
  iconName: string;
  badgeLabel: string;
}

/**
 * Clasifica semánticamente el nombre o categoría del producto para asignar un tema visual coherente.
 */
export function classifyProductVisualTheme(productName: string, category = ''): ProductVisualTheme {
  const cat = category.toLowerCase();
  const text = `${productName} ${category}`.toLowerCase();

  // 1. Insumos / Empaque / Servicios (prioridad máxima para no confundir bolsas con alimentos)
  if (cat.includes('insumo') || cat.includes('empaque') || text.match(/bolsa|caja|termo|vac[ií]o|etiqueta|cinta|bandeja/)) {
    return {
      categoryType: 'INSUMO',
      gradientColors: ['#475569', '#1E293B'], // Slate neutro
      textColor: '#FFFFFF',
      iconName: 'package',
      badgeLabel: 'INSUMO',
    };
  }

  // 2. Congelados e IQF (si la categoría es Congelados o el producto es bloque de congelación)
  if (cat.includes('congelad') || text.match(/\biqf\b|bloque congelad|hielo en escamas/)) {
    return {
      categoryType: 'CONGELADO',
      gradientColors: ['#0284C7', '#2563EB'], // Azul Hielo / Indigo
      textColor: '#FFFFFF',
      iconName: 'snowflake',
      badgeLabel: 'CONGELADO',
    };
  }

  // 3. Mariscos / Crustáceos / Moluscos
  if (text.match(/camar[oó]n|langost|pulpo|calamar|mejill[oó]n|ostra|almeja|jaiba|cangrejo|piangua|marisco/)) {
    return {
      categoryType: 'MARISCO',
      gradientColors: ['#F97316', '#DC2626'], // Coral / Naranja fuego
      textColor: '#FFFFFF',
      iconName: 'shell',
      badgeLabel: 'MARISCO',
    };
  }

  // 4. Cortes / Filetes / Porciones
  if (text.match(/filete|porci[oó]n|posta|medall[oó]n|despiece|lomo|trozo/)) {
    return {
      categoryType: 'CORTE_FILETE',
      gradientColors: ['#059669', '#0D9488'], // Esmeralda / Teal fresco
      textColor: '#FFFFFF',
      iconName: 'cut',
      badgeLabel: 'CORTE',
    };
  }

  // 5. Pescados Generales (Salmón, Róbalo, Corvina, Mojarra, Trucha, Atún, etc.)
  return {
    categoryType: 'PESCADO',
    gradientColors: ['#0E7490', '#1E3A8A'], // Cyan Profundo / Azul Marino
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
  const words = name.trim().split(/\s+/).filter(w => !w.match(/^(de|del|la|el|en|y|a|con|sin)$/i));
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

  // Iconos SVG minimalistas vectoriales
  let iconPath = '';
  if (theme.categoryType === 'PESCADO') {
    // Silueta de Pez
    iconPath = `<path d="M 50 15 C 30 25 15 45 15 60 C 15 75 30 95 50 105 C 70 95 85 75 85 60 C 85 45 70 25 50 15 Z M 50 45 A 5 5 0 1 1 50 55 A 5 5 0 1 1 50 45" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3" stroke-linecap="round"/>`;
  } else if (theme.categoryType === 'MARISCO') {
    // Concha / Marisco
    iconPath = `<path d="M 30 75 C 30 45 40 30 60 30 C 80 30 90 45 90 75 C 75 85 45 85 30 75 Z" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3" stroke-linecap="round"/>`;
  } else {
    // Icono abstracto geométrico
    iconPath = `<circle cx="60" cy="60" r="30" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3" stroke-dasharray="6 4"/>`;
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="grad_${theme.categoryType}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="24" fill="url(#grad_${theme.categoryType})" />
  <g transform="translate(0, -5)">
    ${iconPath}
    <text x="60" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="28" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
      ${initials}
    </text>
  </g>
  <rect x="20" y="94" width="80" height="18" rx="9" fill="rgba(0,0,0,0.25)" />
  <text x="60" y="106" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="8.5" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.8">
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
