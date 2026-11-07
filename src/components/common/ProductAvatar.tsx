import React, { useState, useMemo } from 'react';
import {
  generateProductSVGAvatar,
  isExternalPlaceholder,
} from '../../utils/productVisualGenerator';
import {
  Fish,
  Waves,
  UtensilsCrossed,
  Snowflake,
  Package,
  type LucideIcon,
} from 'lucide-react';

export type ProductAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ProductAvatarProps {
  nombre: string;
  categoria?: string;
  imagen?: string | null;
  size?: ProductAvatarSize;
  className?: string;
  alt?: string;
  objectFit?: 'cover' | 'contain';
  vectorOnly?: boolean;
  darkTheme?: boolean;
}

const SIZE_CLASSES: Record<ProductAvatarSize, string> = {
  xs: 'w-7 h-7 text-[9px] rounded-md',
  sm: 'w-10 h-10 text-xs rounded-lg',
  md: 'w-14 h-14 text-sm rounded-xl',
  lg: 'w-20 h-20 text-base rounded-2xl',
  xl: 'w-28 h-28 text-lg rounded-2xl',
  full: 'w-full h-full rounded-none',
};

interface VectorMeta {
  Icon: LucideIcon;
  bgColor: string;
  textColor: string;
  borderColor: string;
  darkBgColor: string;
  darkTextColor: string;
  darkBorderColor: string;
}

const getVectorMeta = (nombre: string, categoria: string): VectorMeta => {
  const text = `${nombre || ''} ${categoria || ''}`.toLowerCase();

  if (text.match(/camar[oó]n|marisco|crust[aá]ceo|langostino|piangua/)) {
    return {
      Icon: Waves,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200',
      darkBgColor: 'bg-amber-950/40',
      darkTextColor: 'text-amber-400',
      darkBorderColor: 'border-amber-500/30',
    };
  }

  if (text.match(/filete|corte|porci[oó]n|tilapia|trucha|salm[oó]n/)) {
    return {
      Icon: UtensilsCrossed,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      darkBgColor: 'bg-emerald-950/40',
      darkTextColor: 'text-emerald-400',
      darkBorderColor: 'border-emerald-500/30',
    };
  }

  if (text.match(/congelad|iqf|hielo/)) {
    return {
      Icon: Snowflake,
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      borderColor: 'border-cyan-200',
      darkBgColor: 'bg-cyan-950/40',
      darkTextColor: 'text-cyan-400',
      darkBorderColor: 'border-cyan-500/30',
    };
  }

  if (text.match(/bebida|jugo|gaseosa|insumo|empaque|caja/)) {
    return {
      Icon: Package,
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-700',
      borderColor: 'border-slate-200',
      darkBgColor: 'bg-slate-900/60',
      darkTextColor: 'text-slate-300',
      darkBorderColor: 'border-white/10',
    };
  }

  return {
    Icon: Fish,
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
    darkBgColor: 'bg-sky-950/40',
    darkTextColor: 'text-sky-400',
    darkBorderColor: 'border-sky-500/30',
  };
};

/**
 * Componente de Alto Rendimiento para Avatares Visuales Ligeros de Productos (La Pezcadería ERP).
 * - Soporta modo `vectorOnly` (Regla del Niño de 12 Años: cero imágenes, 100% SVG Lucide React).
 * - 0ms de carga para productos sin foto real (genera SVG vectorial temático offline).
 * - Detecta y sustituye automáticamente URLs externas de Unsplash por el avatar de marca.
 * - Soporta imágenes reales con fallback instantáneo ante error de red.
 */
export const ProductAvatar: React.FC<ProductAvatarProps> = ({
  nombre,
  categoria = '',
  imagen,
  size = 'md',
  className = '',
  alt,
  objectFit = 'cover',
  vectorOnly = false,
  darkTheme = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const vectorMeta = useMemo(() => {
    return getVectorMeta(nombre, categoria);
  }, [nombre, categoria]);

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const imageAlt = alt || nombre || 'Producto del mar';
  const svgDataUrl = useMemo(() => {
    return generateProductSVGAvatar(nombre || 'Producto', categoria);
  }, [nombre, categoria]);

  // Si se solicita vectorOnly (Regla de Cero Imágenes estricta)
  if (vectorOnly) {
    const IconComponent = vectorMeta.Icon;
    const colorClasses = darkTheme
      ? `${vectorMeta.darkBgColor} ${vectorMeta.darkTextColor} ${vectorMeta.darkBorderColor}`
      : `${vectorMeta.bgColor} ${vectorMeta.textColor} ${vectorMeta.borderColor}`;

    return (
      <div
        data-testid="product-avatar-vector"
        className={`relative flex items-center justify-center overflow-hidden flex-shrink-0 select-none border ${colorClasses} ${sizeClass} ${className}`}
        title={`${nombre} (${categoria || 'Producto'})`}
      >
        <IconComponent className="w-3/5 h-3/5 transition-transform duration-300 group-hover:scale-110" />
      </div>
    );
  }

  // Si no hay imagen, es placeholder de Unsplash o falló la carga previa, usar SVG generado
  const shouldRenderSVG = imageError || isExternalPlaceholder(imagen);

  if (shouldRenderSVG) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden flex-shrink-0 select-none ${sizeClass} ${className}`}
        title={`${nombre} (${categoria || 'Producto'})`}
      >
        <img
          src={svgDataUrl}
          alt={imageAlt}
          className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'} transition-transform duration-300 group-hover:scale-105`}
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden flex-shrink-0 select-none bg-slate-100 ${sizeClass} ${className}`}
      title={`${nombre} (${categoria || 'Producto'})`}
    >
      <img
        src={imagen as string}
        alt={imageAlt}
        className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'} transition-transform duration-300 group-hover:scale-105`}
        loading="lazy"
        decoding="async"
        onError={() => setImageError(true)}
      />
    </div>
  );
};
