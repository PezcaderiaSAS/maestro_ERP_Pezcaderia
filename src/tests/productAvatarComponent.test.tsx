import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ProductAvatar } from '../components/common/ProductAvatar';

describe('ProductAvatar Component - Fallback Resiliente y Optimización SVG', () => {
  it('renderiza avatar SVG offline para productos sin imagen o con placeholder Unsplash', () => {
    const { container } = render(
      <ProductAvatar
        nombre="Camarón Crudo 41-50"
        categoria="Crustáceos"
        imagen="https://images.unsplash.com/photo-1534482421-64566f976cfa?w=300"
      />
    );

    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toContain('data:image/svg+xml');
    expect(img?.getAttribute('src')).toContain('grad_CAMARON');
  });

  it('renderiza imagen real cuando se proporciona una URL propia o Base64', () => {
    const realImgUrl = 'data:image/webp;base64,UklGRmYAAABXRUJQVlA4...';
    const { container } = render(
      <ProductAvatar
        nombre="Pargo Rojo Platero"
        categoria="Pescados"
        imagen={realImgUrl}
      />
    );

    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe(realImgUrl);
  });

  it('conmuta automáticamente a SVG vectorial si la imagen real falla al cargar (onError)', () => {
    const brokenImgUrl = 'https://servidor-caido.com/foto_inexistente.jpg';
    const { container } = render(
      <ProductAvatar
        nombre="Filete de Tilapia Fresco"
        categoria="Pescados"
        imagen={brokenImgUrl}
      />
    );

    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe(brokenImgUrl);

    // Disparar error de carga de red
    fireEvent.error(img!);

    // Tras el error, conmuta al SVG con tema CORTE_FILETE
    const fallbackImg = container.querySelector('img');
    expect(fallbackImg?.getAttribute('src')).toContain('data:image/svg+xml');
    expect(fallbackImg?.getAttribute('src')).toContain('grad_CORTE_FILETE');
  });
});
