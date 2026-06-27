export const SEED_DATA: Record<string, unknown> = {
  pezcaderia_clientes: [
    {
      id: 'cli-b2b-test',
      nombre: 'Distribuidora Pérez S.A.S',
      identificacion: '900123456',
      tipoIdentificacion: 'NIT',
      tipoPersona: 'JURIDICA',
      tipoPrecio: 'MAYORISTA',
      cupoCredito: 500000,
      activo: true
    }
  ],
  pezcaderia_products_catalog: [
    { id: 'prod-salmon', name: 'Salmón Fresco', price: 35000, category: 'Pescados', active: true, claseABC: 'A' },
    { id: 'prod-tilapia', name: 'Tilapia Roja', price: 15000, category: 'Pescados', active: true, claseABC: 'B' },
    { id: 'prod-trucha', name: 'Trucha Arcoiris', price: 25000, category: 'Pescados', active: true, claseABC: 'A' },
    { id: 'prod-camaron', name: 'Camarón Tigre', price: 45000, category: 'Mariscos', active: true, claseABC: 'A' },
    { id: 'prod-pulpo', name: 'Pulpo Entero', price: 55000, category: 'Mariscos', active: true, claseABC: 'C' }
  ],
  pezcaderia_product_pricings: [
    { id: 'pricing-1', productId: 'prod-salmon', priceType: 'MAYORISTA', price: 30000 },
    { id: 'pricing-2', productId: 'prod-tilapia', priceType: 'MAYORISTA', price: 12000 },
    { id: 'pricing-3', productId: 'prod-trucha', priceType: 'MAYORISTA', price: 20000 },
    { id: 'pricing-4', productId: 'prod-camaron', priceType: 'MAYORISTA', price: 40000 },
    { id: 'pricing-5', productId: 'prod-pulpo', priceType: 'MAYORISTA', price: 48000 }
  ],
  pezcaderia_quotations: [
    {
      id: 'quot-001',
      clienteId: 'cli-b2b-test',
      fecha: new Date().toISOString(),
      estado: 'PENDIENTE',
      items: [
        { productId: 'prod-salmon', quantity: 10, unitPrice: 30000, total: 300000 }
      ],
      total: 300000,
      notas: 'Cotización B2B de prueba'
    }
  ],
  pezcaderia_ventas: [],
  pezcaderia_cartera: [
    { 
      id: 'cartera-b2b-test',
      clienteId: 'cli-b2b-test', 
      saldo: 450000,
      ultimaActualizacion: new Date().toISOString()
    }
  ]
};

export function applySeed(): void {
  for (const [key, value] of Object.entries(SEED_DATA)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  console.log('✅ B2B Seed applied successfully');
}
