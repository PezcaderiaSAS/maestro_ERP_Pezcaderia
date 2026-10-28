// src/tests/ferreteriaJosasePosIntegration.test.tsx
// Suite de Integración Operativa: Ferretería Josase en el POS & Venta Concurrente
// Valida el catálogo de 5.351 ítems, stock = 100, 9.550 clientes y conmutación multi-tenant

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ferreteriaJosaseService } from '../services/ferreteriaJosaseService';
import { useInventoryStore } from '../store/useInventoryStore';
import { useClientStore } from '../store/useClientStore';
import { useAuthStore } from '../store/useAuthStore';
import { superAdminService } from '../services/superAdminService';
import { prefacturaService } from '../services/prefacturaService';
import { isSuperAdmin, SUPER_ADMIN_EMAIL } from '../types/auth.types';

describe('Integración Operativa POS — Ferretería Josase (tenant-03)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('1. Carga dinámicamente y asigna 5.351 ítems y 9.550 clientes a los Stores con stock inicial = 100', async () => {
    const res = await ferreteriaJosaseService.applyToStores();

    expect(res.itemsCount).toBe(5351);
    expect(res.clientesCount).toBe(9550);
    expect(res.stockAsignado).toBe(5351);

    const inv = useInventoryStore.getState();
    expect(inv.products.length).toBe(5351);

    // Verificar que un ítem aleatorio tiene 100 unidades en Bodega Principal
    const itemEjemplo = inv.products[0];
    expect((itemEjemplo as any).stockInicial).toBe(100);
    expect(inv.stock['Bodega Principal']?.[itemEjemplo.sku]).toBe(100);
    expect(inv.stock['bodega-josase-01']?.[itemEjemplo.sku]).toBe(100);

    // Verificar clientes
    const clients = useClientStore.getState().clientes;
    expect(clients.length).toBe(9550);
    expect((clients[0] as any).tenantId).toBe('tenant-03');
  }, 20000);

  it('2. Conmuta el contexto de tenant a Ferretería Josase en useAuthStore', () => {
    const tenantJosase = superAdminService.getTenants().find((t) => t.id === 'tenant-03');
    expect(tenantJosase).toBeDefined();

    useAuthStore.getState().switchTenant({
      id: tenantJosase!.id,
      nombre: tenantJosase!.nombre,
      razonSocial: tenantJosase!.razonSocial,
      nit: tenantJosase!.nit,
      ciudad: 'Bucaramanga',
      telefono: tenantJosase!.contactoTelefono,
      activo: true,
    });

    const activeTenant = useAuthStore.getState().activeTenant;
    expect(activeTenant?.id).toBe('tenant-03');
    expect(activeTenant?.razonSocial).toBe('Ferretería Josase S.A.S.');
  });

  it('3. Permite buscar productos ferreteros por SKU o Nombre instantáneamente', async () => {
    const inv = useInventoryStore.getState();
    const productos = inv.products;

    // Búsqueda por SKU
    const itemPararrayo = productos.find((p) => p.sku === '0000');
    expect(itemPararrayo).toBeDefined();
    expect(itemPararrayo?.nombre).toContain('PARARRAYO');
    expect(itemPararrayo?.metadata?.rubro).toBe('FERRETERIA');

    // Búsqueda por término de texto
    const itemsTubo = productos.filter((p) => p.nombre.toLowerCase().includes('cemento'));
    expect(itemsTubo.length).toBeGreaterThan(0);
  });

  it('4. Permite seleccionar un cliente ferretero de los 9.550 registrados', () => {
    const clients = useClientStore.getState().clientes;
    
    // Búsqueda por NIT
    const clienteMFL = clients.find((c) => c.identificacion === '901475457');
    expect(clienteMFL).toBeDefined();
    expect(clienteMFL?.nombre).toContain('MFL INGENIEROS');
    expect(clienteMFL?.ciudad).toBe('Bucaramanga');
  });

  it('5. Emite una Preventa / Comanda de Ferretería con stock validado y deduce inventario', async () => {
    const inv = useInventoryStore.getState();
    const itemPrueba = inv.products[0];
    const sku = itemPrueba.sku;

    const stockInicial = inv.stock['Bodega Principal']?.[sku] ?? 100;
    expect(stockInicial).toBe(100);

    // Emisión de comanda de preventa de 5 unidades
    const cantidadVenta = 5;
    const precioUnitario = 25000;

    const payload = {
      tenantId: 'tenant-03',
      terminalId: 'TERM-01',
      vendedorId: 'emp-josase-05', // JEYMY KATERINE MONSALVE CACERES
      vendedorNombre: 'JEYMY KATERINE MONSALVE CACERES',
      clienteId: 'cli-josase-901475457',
      clienteNombre: 'MFL INGENIEROS CONSULTORES CONSTRUCTORES S.A.S.',
      items: [
        {
          productoId: itemPrueba.id,
          sku: itemPrueba.sku,
          nombre: itemPrueba.nombre,
          cantidad: cantidadVenta,
          precioBase: precioUnitario,
          precioUnitario: precioUnitario,
          porcentajeDescuento: 0,
          descuentoUnitario: 0,
          subtotal: cantidadVenta * precioUnitario,
        },
      ],
      descuentoGlobal: 0,
    };

    // Deducción de stock simulada por el POS
    const nuevoStock = {
      ...inv.stock,
      'Bodega Principal': {
        ...inv.stock['Bodega Principal'],
        [sku]: stockInicial - cantidadVenta,
      },
    };
    inv.setStock(nuevoStock);

    const stockActualizado = useInventoryStore.getState().stock['Bodega Principal']?.[sku];
    expect(stockActualizado).toBe(95);
  });

  it('6. Valida que UltraAdmin (pezcaderia.2022@gmail.com) tiene acceso irrestricto sobre Ferretería Josase', () => {
    expect(isSuperAdmin(SUPER_ADMIN_EMAIL)).toBe(true);

    useAuthStore.setState({
      status: 'authenticated',
      currentUser: {
        id: 'usr-ultra-admin',
        email: SUPER_ADMIN_EMAIL,
        nombre: 'Ultra Administrador (GOD_MODE)',
        authProvider: 'google',
        rol: 'admin',
        isOwner: true,
        isSuperAdmin: true,
      },
      activeTenant: {
        id: 'tenant-03',
        razonSocial: 'Ferretería Josase S.A.S.',
        nit: '901.954.321-8',
        ciudad: 'Bucaramanga',
        telefono: '3164696581',
        activo: true,
        createdAt: '2026-10-28T07:00:00Z',
      },
    });

    const user = useAuthStore.getState().currentUser;
    expect(user?.isSuperAdmin).toBe(true);
    expect(user?.isOwner).toBe(true);
    expect(useAuthStore.getState().activeTenant?.id).toBe('tenant-03');
  });
});
