import React, { useState, useMemo } from 'react';
import {
  generateProductSVGAvatar,
  isExternalPlaceholder,
} from '../../utils/productVisualGenerator';

export type ProductAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ProductAvatarProps {
  nombre: string;
  categoria?: string;
  imagen?: string | null;
  size?: ProductAvatarSize;
  className?: string;
  alt?: string;
  objectFit?: 'cover' | 'contain';
}

const SIZE_CLASSES: Record<ProductAvatarSize, string> = {
  xs: 'w-7 h-7 text-[9px] rounded-md',
  sm: 'w-10 h-10 text-xs rounded-lg',
  md: 'w-14 h-14 text-sm rounded-xl',
  lg: 'w-20 h-20 text-base rounded-2xl',
  xl: 'w-28 h-28 text-lg rounded-2xl',
  full: 'w-full h-full rounded-none',
};

/**
 * Componente de Alto Rendimiento para Avatares Visuales Ligeros de Productos (La Pezcadería ERP).
 * - 0ms de carga para productos sin foto real (genera SVG vectorial temático offline).
 * - Detecta y sustituye automáticamente URLs externas de Unsplash por el avatar de marca.
 * - Soporta imágenes reales subidas por el usuario con fallback instantáneo ante error de red.
 */
export const ProductAvatar: React.FC<ProductAvatarProps> = ({
  nombre,
  categoria = '',
  imagen,
  size = 'md',
  className = '',
  alt,
  objectFit = 'cover',
}) => {
  const [imageError, setImageError] = useState(false);

  // Si no hay imagen, es placeholder de Unsplash o falló la carga previa, usar SVG generado
  const shouldRenderSVG = useMemo(() => {
    if (imageError) return true;
    return isExternalPlaceholder(imagen);
  }, [imagen, imageError]);

  const svgDataUrl = useMemo(() => {
    return generateProductSVGAvatar(nombre || 'Producto', categoria);
  }, [nombre, categoria]);

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const imageAlt = alt || nombre || 'Producto del mar';

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
