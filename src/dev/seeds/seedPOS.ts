export const SEED_DATA: Record<string, unknown> = {
  pezcaderia_bodegas: [
    { id: 'b1', nombre: 'Bodega Principal', activa: true }
  ],
  pezcaderia_cajas: [
    { id: 'caja-test-menor', bodegaId: 'Bodega Principal', nombre: 'Caja Menor - Bodega Principal', activa: true },
    { id: 'caja-test-mayor', bodegaId: 'Bodega Principal', nombre: 'Caja Mayor - Bodega Principal', activa: true }
  ],
  pezcaderia_turnos_caja: [],
  pezcaderia_products_catalog: [
    { id: 'prod-salmon', name: 'Salmón Fresco', price: 35000, category: 'Pescados', active: true, claseABC: 'A' },
    { id: 'prod-tilapia', name: 'Tilapia Roja', price: 15000, category: 'Pescados', active: true, claseABC: 'B' },
    { id: 'prod-trucha', name: 'Trucha Arcoiris', price: 25000, category: 'Pescados', active: true, claseABC: 'A' }
  ],
  pezcaderia_stock: {
    'caja-test-menor': { 'prod-salmon': 10, 'prod-tilapia': 5, 'prod-trucha': 8 },
    'Bodega Principal': { 'prod-salmon': 10, 'prod-tilapia': 5, 'prod-trucha': 8 } // Adding both just in case the system relies on bodega or caja stock mapping
  },
  pezcaderia_clientes: [
    {
      id: 'cli-consumidor-final',
      nombre: 'Consumidor Final',
      identificacion: '222222222222',
      tipoIdentificacion: 'CC',
      tipoPersona: 'NATURAL',
      tipoPrecio: 'DETAL',
      cupoCredito: 0,
      activo: true
    }
  ]
};

export function applySeed(): void {
  for (const [key, value] of Object.entries(SEED_DATA)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  console.log('✅ POS Seed applied successfully');
}
