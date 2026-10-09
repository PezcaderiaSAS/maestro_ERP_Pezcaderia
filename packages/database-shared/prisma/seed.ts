import { PrismaClient, TipoMovimientoKardex, RolUsuario, TipoPersona, TipoIdentificacion } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de artículos de prueba (Seed)...');

  const empresaId = '00000000-0000-0000-0000-000000000000';
  const usuarioId = '00000000-0000-0000-0000-000000000000';
  const bodegaId = '00000000-0000-0000-0000-000000000001';
  const productoId = '00000000-0000-0000-0000-000000000002';
  const loteId = '00000000-0000-0000-0000-000000000003';

  // 1. Crear Empresa
  const empresa = await prisma.empresa.upsert({
    where: { id: empresaId },
    update: {},
    create: {
      id: empresaId,
      nit: '900000000-1',
      razonSocial: 'La Pezcadería SAS',
      nombreComercial: 'La Pezcadería',
      direccion: 'Terminal Pesquero',
      telefono: '555-1234',
      email: 'admin@lapezcaderia.com',
    },
  });
  console.log('Empresa creada:', empresa.razonSocial);

  // 2. Crear Usuario
  const usuario = await prisma.usuario.upsert({
    where: { id: usuarioId },
    update: {},
    create: {
      id: usuarioId,
      empresaId: empresaId,
      email: 'bodeguero@lapezcaderia.com',
      nombre: 'Juan Bodeguero',
      rol: RolUsuario.BODEGUERO,
    },
  });
  console.log('Usuario creado:', usuario.nombre);

  // 3. Crear Bodega
  const bodega = await prisma.bodega.upsert({
    where: { id: bodegaId },
    update: {},
    create: {
      id: bodegaId,
      empresaId: empresaId,
      nombre: 'Cuarto Frío Principal',
      tipo: 'PRINCIPAL',
      ubicacion: 'Zona A - Congelados',
    },
  });
  console.log('Bodega creada:', bodega.nombre);

  // 4. Crear Producto
  const producto = await prisma.producto.upsert({
    where: { id: productoId },
    update: {},
    create: {
      id: productoId,
      empresaId: empresaId,
      sku: 'PES-SALMON-ENT-01',
      nombre: 'Salmón Entero Premium (Con Cabeza)',
      categoria: 'Pescado Entero',
      unidadMedida: 'KG',
      precioBase: 45000.00,
      costoPromedio: 30000.00,
      clasificacionAbc: 'A',
    },
  });
  console.log('Producto creado:', producto.nombre);

  // 5. Crear ProductoBodega (Stock agregado)
  const productoBodega = await prisma.productoBodega.upsert({
    where: { 
      uq_producto_bodega: {
        productoId: productoId,
        bodegaId: bodegaId
      }
    },
    update: {
      cantidadTotal: 50.00
    },
    create: {
      empresaId: empresaId,
      productoId: productoId,
      bodegaId: bodegaId,
      cantidadTotal: 50.00,
    },
  });
  console.log('Stock actualizado en Bodega:', productoBodega.cantidadTotal, 'KG');

  // 6. Crear Lote (Para FEFO)
  const lote = await prisma.lote.upsert({
    where: { id: loteId },
    update: {
      cantidadActual: 50.00
    },
    create: {
      id: loteId,
      empresaId: empresaId,
      productoId: productoId,
      bodegaId: bodegaId,
      numeroLote: 'LOT-2023-10-01',
      fechaExpiracion: new Date('2023-12-31T00:00:00Z'),
      cantidadOriginal: 100.00,
      cantidadActual: 50.00,
      costoUnitario: 30000.00,
      estado: 'ACTIVO',
    },
  });
  console.log('Lote creado:', lote.numeroLote, 'con cantidad actual', lote.cantidadActual);

  console.log('✅ Semillado completado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
