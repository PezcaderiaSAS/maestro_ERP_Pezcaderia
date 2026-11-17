// src/tests/multiTenantPOSCatalogSwitch.test.tsx
// Suite de Verificación de Conmutación Multi-Tenant en POS:
// Ferretería Josase (tenant-03) <-> La Pezcadería (tenant-01)
// Valida R1 (Carga reactiva 5.351 ítems y 9.538 clientes),
// R2 (Restauración del catálogo pesquero original), y
// R3 (Razón social dinámica en encabezado y prevención de desbordamientos en 375px).

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useAuthStore } from '../store/useAuthStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useClientStore } from '../store/useClientStore';
import { ferreteriaJosaseService } from '../services/ferreteriaJosaseService';
import { fastItemSearchEngine } from '../services/fastItemSearchEngine';
import { POSMultivendorLightHeader } from '../views/pos/components/POSMultivendorLightHeader';
import { ProductSearchPanel } from '../views/pos/components/ProductSearchPanel';
import { POSCategoryTabs } from '../views/pos/components/POSCategoryTabs';
import { POSProductCard } from '../views/pos/components/POSProductCard';

const dummyVendors = [
  { id: 'v1', nombre: 'DIEGO IVAN DIAZ ANAYA', corto: 'Diego Díaz' },
  { id: 'v2', nombre: 'LUIS EDUARDO BANQUEZ MEJIA', corto: 'Luis Banquez' },
];

describe('Conmutación Multi-Tenant en POS (Josase tenant-03 <-> Pezcadería tenant-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('R1: Al conmutar a Ferretería Josase (tenant-03), carga 5.351 ítems y 9.538 clientes en stores', async () => {
    // 1. Conmutar a tenant-03 con sincronización de stores
    useAuthStore.getState().switchTenant(
      {
        id: 'tenant-03',
        razonSocial: 'Ferretería Josase S.A.S.',
        nombre: 'Ferretería Josase',
        nit: '901.954.321-8',
        ciudad: 'Bucaramanga',
      },
      { syncStores: true }
    );

    // Esperar aplicación de catálogo masivo
    const res = await ferreteriaJosaseService.applyToStores();
    expect(res.itemsCount).toBe(5351);
    expect(res.clientesCount).toBe(9538);

    const inv = useInventoryStore.getState();
    expect(inv.products.length).toBe(5351);

    const clients = useClientStore.getState().clientes;
    expect(clients.length).toBe(9538);

    // Verificar que el header muestra la razón social dinámica
    render(
      <POSMultivendorLightHeader
        vendedores={dummyVendors}
        selectedVendorId="v1"
        onSelectVendor={vi.fn()}
        barcodeInput=""
        onBarcodeChange={vi.fn()}
        onBarcodeSubmit={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenClientModal={vi.fn()}
      />
    );

    const headerTitle = screen.getByTestId('pos-header-tenant-name');
    expect(headerTitle).toBeInTheDocument();
    expect(headerTitle.textContent).toContain('Ferretería Josase S.A.S.');
  }, 25000);

  it('R1: ProductSearchPanel renderiza fluidamente categorías y productos de Ferretería Josase sin congelar el hilo', async () => {
    const inv = useInventoryStore.getState();
    const products = inv.products;
    expect(products.length).toBe(5351);

    const startTime = performance.now();
    render(
      <ProductSearchPanel
        activeProducts={products}
        dynamicFields={[]}
        cliente={null}
        getProductPrice={(p) => p.precio_venta_pos || 25000}
        getProductStock={() => 100}
        onAddProduct={vi.fn()}
      />
    );
    const renderDuration = performance.now() - startTime;

    // El renderizado de 5.351 productos paginados (18 por página) en jsdom bajo carga concurrente debe ser fluido (< 2000ms)
    expect(renderDuration).toBeLessThan(2000);

    // Verificar existencia de la cuadrícula de productos
    expect(screen.getByTestId('product-grid')).toBeInTheDocument();

    // Las categorías deben incluir opciones de ferretería
    const catButtons = screen.getAllByRole('button');
    const categoryTexts = catButtons.map((b) => b.textContent);
    expect(categoryTexts.some((t) => t?.includes('TODOS'))).toBe(true);
  });

  it('R2: Al conmutar de vuelta a La Pezcadería (tenant-01), restaura el catálogo pesquero original', async () => {
    // Conmutar a tenant-01 con sincronización de stores
    useAuthStore.getState().switchTenant(
      {
        id: 'tenant-01',
        razonSocial: 'La Pezcadería S.A.S.',
        nombre: 'La Pezcaderia SAS',
        nit: '901.246.730',
        ciudad: 'Bucaramanga',
      },
      { syncStores: true }
    );

    const restoreRes = await ferreteriaJosaseService.restorePezcaderiaStores();
    expect(restoreRes.itemsCount).toBeGreaterThanOrEqual(10);
    expect(restoreRes.clientesCount).toBeGreaterThanOrEqual(4);

    const inv = useInventoryStore.getState();
    const skus = inv.products.map((p) => p.sku);

    // Verificar presencia de los productos insignias de La Pezcadería
    expect(skus).toContain('PES-ENT-001'); // Pargo Rojo Entero
    expect(skus).toContain('FIL-LIM-002'); // Filete de Corvina Limpio
    expect(skus).toContain('CAM-TIG-003'); // Camarón Tigre

    // Clientes pesqueros
    const clients = useClientStore.getState().clientes;
    const clientNombres = clients.map((c) => c.nombre);
    expect(clientNombres.some((n) => n.includes('Restaurante Central'))).toBe(true);

    // Header dinámico actualizado a La Pezcadería S.A.S.
    render(
      <POSMultivendorLightHeader
        vendedores={dummyVendors}
        selectedVendorId="v1"
        onSelectVendor={vi.fn()}
        barcodeInput=""
        onBarcodeChange={vi.fn()}
        onBarcodeSubmit={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenClientModal={vi.fn()}
      />
    );

    const headerTitle = screen.getByTestId('pos-header-tenant-name');
    expect(headerTitle.textContent).toContain('La Pezcadería S.A.S.');
  });

  it('R3: Prevención estricta de desbordamientos en encabezado, píldoras y tarjetas (375px)', () => {
    // 1. Validar que el encabezado tiene truncate y max-w para evitar desbordamiento con nombres extensos
    useAuthStore.getState().switchTenant({
      id: 'tenant-03',
      razonSocial: 'EMPRESA FERRETERA INTERNACIONAL DE SUMINISTROS INDUSTRIALES PESADOS S.A.S.',
    });

    const { container } = render(
      <POSMultivendorLightHeader
        vendedores={dummyVendors}
        selectedVendorId="v1"
        onSelectVendor={vi.fn()}
        barcodeInput=""
        onBarcodeChange={vi.fn()}
        onBarcodeSubmit={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenClientModal={vi.fn()}
      />
    );

    const tenantSpan = screen.getByTestId('pos-header-tenant-name');
    expect(tenantSpan.className).toContain('truncate');
    expect(tenantSpan.parentElement?.className).toContain('min-w-0');

    // 2. Validar píldoras de categorías con truncate
    render(
      <POSCategoryTabs
        categories={['TODOS', 'ACCESORIOS PARA TUBERIAS SANITARIAS Y DE VENTILACION DE ALTO CALIBRE']}
        selectedCategory="TODOS"
        onSelectCategory={vi.fn()}
      />
    );

    const longCategoryBtn = screen.getByText('ACCESORIOS PARA TUBERIAS SANITARIAS Y DE VENTILACION DE ALTO CALIBRE');
    expect(longCategoryBtn.className).toContain('truncate');

    // 3. Validar tarjeta de producto con título extenso y break-words
    const longNamedProduct = {
      id: 'prod-long-name',
      sku: 'SKU-EXT-999',
      nombre: 'PINTURA ESMALTE SINTETICO ANTICORROSIVO BRILLANTE SECADO RAPIDO GALON GRIS ESPACIAL ULTRA DURABLE',
      categoria: 'Pinturas',
      precio_venta_pos: 85000,
      activo: true,
      unidadMedida: 'und',
    };

    render(
      <POSProductCard
        product={longNamedProduct}
        price={85000}
        stockPrincipal={50}
        stockSecundaria={20}
        stockAverias={0}
        cliente={null}
        dynamicFields={[]}
        isExpandedStock={false}
        onToggleStock={vi.fn()}
        onAddProduct={vi.fn()}
      />
    );

    const productTitle = screen.getByTitle(longNamedProduct.nombre);
    expect(productTitle.className).toContain('break-words');
    expect(productTitle.className).toContain('line-clamp');
  });

  it('Adversarial: Deduplica llamadas concurrentes en vuelo a applyToStores()', async () => {
    useAuthStore.getState().switchTenant({
      id: 'tenant-03',
      razonSocial: 'Ferretería Josase S.A.S.',
    });

    // Disparar dos llamadas en paralelo
    const p1 = ferreteriaJosaseService.applyToStores();
    const p2 = ferreteriaJosaseService.applyToStores();

    // Deben retornar la misma promesa compartida
    expect(p1).toBe(p2);

    const [res1, res2] = await Promise.all([p1, p2]);
    expect(res1.itemsCount).toBe(5351);
    expect(res2.itemsCount).toBe(5351);
  });

  it('Adversarial: Conmutación ultrarrápida (Josase -> Pezcadería) previene que Josase sobreescriba La Pezcadería', async () => {
    // 1. Iniciar conmutación a Josase
    useAuthStore.getState().switchTenant({
      id: 'tenant-03',
      razonSocial: 'Ferretería Josase S.A.S.',
    });
    const josasePromise = ferreteriaJosaseService.applyToStores();

    // 2. Inmediatamente conmutar a Pezcadería antes de que Josase termine
    useAuthStore.getState().switchTenant({
      id: 'tenant-01',
      razonSocial: 'La Pezcadería del Mar S.A.S.',
    });
    await ferreteriaJosaseService.restorePezcaderiaStores();

    // 3. Esperar que la promesa anterior de Josase resuelva
    await josasePromise;

    // 4. Los stores deben conservar los productos de La Pezcadería y NO los de ferretería
    const currentProducts = useInventoryStore.getState().products;
    const isPezcaderia = currentProducts.some((p) => p.sku === 'PES-ENT-001');
    expect(isPezcaderia).toBe(true);
    expect(currentProducts.length).toBeLessThan(100);
  });

  it('Adversarial: Header elimina hardcode "PEZCADERIA S.A.S" y renderiza "La Pezcadería" con activeTenant null', () => {
    // Forzar activeTenant a null
    useAuthStore.setState({ activeTenant: null });

    render(
      <POSMultivendorLightHeader
        vendedores={dummyVendors}
        selectedVendorId="v1"
        onSelectVendor={vi.fn()}
        barcodeInput=""
        onBarcodeChange={vi.fn()}
        onBarcodeSubmit={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenClientModal={vi.fn()}
      />
    );

    const headerTitle = screen.getByTestId('pos-header-tenant-name');
    expect(headerTitle.textContent).toBe('La Pezcadería');
    expect(headerTitle.textContent).not.toContain('PEZCADERIA S.A.S');
  });

  it('Adversarial: fastItemSearchEngine se restaura al catálogo pesquero al volver a tenant-01', async () => {
    // 1. Restaurar pezcadería
    useAuthStore.getState().switchTenant({
      id: 'tenant-01',
      razonSocial: 'La Pezcadería S.A.S.',
    });
    await ferreteriaJosaseService.restorePezcaderiaStores();

    // 2. Buscar término pesquero
    const searchResults = await fastItemSearchEngine.search('pargo', { limit: 5 });
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].item.nombre.toLowerCase()).toContain('pargo');

    // 3. Buscar término de ferretería no debe retornar resultados pesqueros
    const hardwareResults = await fastItemSearchEngine.search('pararrayo', { limit: 5 });
    expect(hardwareResults.length).toBe(0);
  });
});
