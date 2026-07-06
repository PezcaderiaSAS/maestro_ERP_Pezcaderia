export const SEED_DATA: Record<string, unknown> = {
  pezcaderia_bodegas: [
    { id: 'b1', nombre: 'Bodega Principal', activa: true },
    { id: 'b2', nombre: 'Bodega Norte', activa: true }
  ],
  pezcaderia_products_catalog: [
    // 6 Clase A
    { id: 'prod-inv-1', name: 'Salmón Fresco Premium', price: 40000, category: 'Pescados', active: true, claseABC: 'A' },
    { id: 'prod-inv-2', name: 'Trucha Arcoiris', price: 25000, category: 'Pescados', active: true, claseABC: 'A' },
    { id: 'prod-inv-3', name: 'Camarón Tigre', price: 45000, category: 'Mariscos', active: true, claseABC: 'A' },
    { id: 'prod-inv-4', name: 'Langostino', price: 60000, category: 'Mariscos', active: true, claseABC: 'A' },
    { id: 'prod-inv-5', name: 'Filete de Mero', price: 35000, category: 'Pescados', active: true, claseABC: 'A' },
    { id: 'prod-inv-6', name: 'Robalo Fresco', price: 32000, category: 'Pescados', active: true, claseABC: 'A' },
    // 2 Clase B
    { id: 'prod-inv-7', name: 'Tilapia Roja', price: 15000, category: 'Pescados', active: true, claseABC: 'B' },
    { id: 'prod-inv-8', name: 'Bagre', price: 18000, category: 'Pescados', active: true, claseABC: 'B' },
    // 2 Clase C
    { id: 'prod-inv-9', name: 'Pulpo Fresco', price: 55000, category: 'Mariscos', active: true, claseABC: 'C' },
    { id: 'prod-inv-10', name: 'Calamar', price: 20000, category: 'Mariscos', active: true, claseABC: 'C' }
  ],
  pezcaderia_stock: {
    'Bodega Principal': {
      'prod-inv-1': 50,
      'prod-inv-2': 30,
      'prod-inv-3': 40,
      'prod-inv-4': 25,
      'prod-inv-5': 0, // RN-01: No stock
      'prod-inv-6': 15,
      'prod-inv-7': 100,
      'prod-inv-8': 80,
      'prod-inv-9': 0, // RN-01: No stock
      'prod-inv-10': 45
    },
    'Bodega Norte': {
      'prod-inv-1': 20,
      'prod-inv-2': 10,
      'prod-inv-3': 15,
      'prod-inv-4': 5,
      'prod-inv-5': 0,
      'prod-inv-6': 5,
      'prod-inv-7': 40,
      'prod-inv-8': 30,
      'prod-inv-9': 0,
      'prod-inv-10': 20
    }
  },
  pezcaderia_ordenes_compra: [
    {
      id: 'oc-001',
      proveedorId: 'prov-test',
      fecha: new Date().toISOString(),
      estado: 'Pendiente',
      items: [
        { productId: 'prod-inv-5', quantity: 50, unitCost: 28000, total: 1400000 },
        { productId: 'prod-inv-9', quantity: 30, unitCost: 45000, total: 1350000 }
      ],
      total: 2750000,
      bodegaDestino: 'Bodega Principal'
    }
  ]
};

export function applySeed(): void {
  for (const [key, value] of Object.entries(SEED_DATA)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  console.log('✅ Inventory Seed applied successfully');
}
