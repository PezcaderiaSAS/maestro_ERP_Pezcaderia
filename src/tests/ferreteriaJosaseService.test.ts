import { describe, it, expect, beforeEach } from 'vitest';
import { ferreteriaJosaseService } from '../services/ferreteriaJosaseService';
import { useInventoryStore } from '../store/useInventoryStore';
import { useClientStore } from '../store/useClientStore';

describe('Ferretería Josase - Data Ingestion & Stock Inicial = 100', () => {
  it('1. Debe cargar dinámicamente los 9.550 clientes y 5.351 ítems', async () => {
    const data = await ferreteriaJosaseService.loadData();

    expect(data.clientes.length).toBe(9550);
    expect(data.items.length).toBe(5351);

    // Verificar un cliente de muestra
    const sampleClient = data.clientes[0];
    expect(sampleClient.identificacion).toBeDefined();
    expect(sampleClient.nombre).toBeDefined();
    expect(sampleClient.tenantId).toBe('tenant-03');

    // Verificar un ítem de muestra
    const sampleItem = data.items[0];
    expect(sampleItem.sku).toBeDefined();
    expect(sampleItem.nombre).toBeDefined();
    expect(sampleItem.tenantId).toBe('tenant-03');
  }, 15000);

  it('2. Todos los ítems deben tener stockInicial = 100 y control de inventario activo', async () => {
    const data = await ferreteriaJosaseService.loadData();

    // Comprobar que todos los ítems tengan stockInicial = 100
    const todosConStock100 = data.items.every((it) => it.stockInicial === 100);
    expect(todosConStock100).toBe(true);

    const todosConControl = data.items.every((it) => it.control_inventario === true);
    expect(todosConControl).toBe(true);
  });

  it('3. El mapa de stock de Ferretería Josase debe contener exactamente 100 unidades por SKU', async () => {
    const data = await ferreteriaJosaseService.loadData();

    const bodegaJosase = data.stock['bodega-josase-01'];
    expect(bodegaJosase).toBeDefined();
    expect(Object.keys(bodegaJosase).length).toBe(5351);

    // Muestreo aleatorio de 10 ítems para verificar stock = 100
    const skus = Object.keys(bodegaJosase);
    for (let i = 0; i < 10; i++) {
      const randomSku = skus[Math.floor(Math.random() * skus.length)];
      expect(bodegaJosase[randomSku]).toBe(100);
    }
  });

  it('4. Debe sincronizar y aplicar los datos exitosamente a los Stores globales', async () => {
    const res = await ferreteriaJosaseService.applyToStores('bodega-josase-01');

    expect(res.clientesCount).toBe(9550);
    expect(res.itemsCount).toBe(5351);
    expect(res.stockAsignado).toBe(5351);

    const inventoryStore = useInventoryStore.getState();
    expect(inventoryStore.products.length).toBe(5351);
    expect(inventoryStore.stock['bodega-josase-01']).toBeDefined();

    const clientStore = useClientStore.getState();
    expect(clientStore.clientes.length).toBe(9550);
  });
});
