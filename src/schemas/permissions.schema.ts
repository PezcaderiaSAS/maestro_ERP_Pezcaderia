import { z } from 'zod';

export interface CanonicalPermissionItem {
  key: string;
  modulo: 'Punto de Venta' | 'Caja & Tesorería' | 'Inventario & WMS' | 'Compras & Muelle' | 'Administración';
  label: string;
  descripcion: string;
  rolesDefault: string[];
}

export const CANONICAL_PERMISSIONS: CanonicalPermissionItem[] = [
  // Punto de Venta
  {
    key: 'pos.access',
    modulo: 'Punto de Venta',
    label: 'Acceso a Terminales POS',
    descripcion: 'Permite abrir el Punto de Venta y emitir preventas/facturas',
    rolesDefault: ['ADMINISTRADOR', 'GERENTE', 'VENDEDOR', 'CAJERO', 'SUPERVISOR'],
  },
  {
    key: 'pos.apply_discounts',
    modulo: 'Punto de Venta',
    label: 'Aplicar Descuentos Discrecionales',
    descripcion: 'Autoriza aplicar descuentos superiores al 10% en el carrito',
    rolesDefault: ['ADMINISTRADOR', 'GERENTE', 'SUPERVISOR'],
  },
  {
    key: 'pos.cancel_tickets',
    modulo: 'Punto de Venta',
    label: 'Anular Tickets y Comandas',
    descripcion: 'Permite cancelar ventas y reversar preventas retenidas',
    rolesDefault: ['ADMINISTRADOR', 'GERENTE', 'SUPERVISOR'],
  },

  // Caja & Tesorería
  {
    key: 'cash.access',
    modulo: 'Caja & Tesorería',
    label: 'Acceso a Caja y Turnos',
    descripcion: 'Permite abrir turnos, ver gaveta y registrar ingresos',
    rolesDefault: ['ADMINISTRADOR', 'GERENTE', 'CAJERO', 'SUPERVISOR'],
  },
  {
    key: 'cash.blind_audit',
    modulo: 'Caja & Tesorería',
    label: 'Arqueo de Caja Ciega',
    descripcion: 'Permite cerrar turno y ejecutar arqueo ciego sin ver saldo esperado',
    rolesDefault: ['ADMINISTRADOR', 'GERENTE', 'CAJERO', 'SUPERVISOR'],
  },
  {
    key: 'cash.expenses',
    modulo: 'Caja & Tesorería',
    label: 'Egresos Operativos de Caja',
    descripcion: 'Permite registrar salidas de dinero para gastos menores',
    rolesDefault: ['ADMINISTRADOR', 'GERENTE', 'CAJERO', 'SUPERVISOR'],
  },

  // Inventario & WMS
  {
    key: 'inventory.view',
    modulo: 'Inventario & WMS',
    label: 'Ver Existencias Multibodega',
    descripcion: 'Consulta de stock físico en bodegas y cuartos fríos',
    rolesDefault: ['ADMINISTRADOR', 'GERENTE', 'BODEGUERO', 'SUPERVISOR', 'VENDEDOR'],
  },
  {
    key: 'inventory.view_costs',
    modulo: 'Inventario & WMS',
    label: 'Ver Costos y Márgenes',
    descripcion: 'Muestra costo promedio ponderado y márgenes de ganancia',
    rolesDefault: ['ADMINISTRADOR', 'GERENTE', 'CONTADOR', 'SUPERVISOR'],
  },
  {
    key: 'inventory.adjust',
    modulo: 'Inventario & WMS',
    label: 'Ajustes Manuales y Mermas',
    descripcion: 'Permite registrar mermas de despiece y ajustes de inventario',
    rolesDefault: ['ADMINISTRADOR', 'GERENTE', 'SUPERVISOR', 'BODEGUERO'],
  },

  // Compras & Muelle
  {
    key: 'purchases.reception',
    modulo: 'Compras & Muelle',
    label: 'Recepción de Muelle / Furgón',
    descripcion: 'Permite recibir mercancía de proveedores y furgones',
    rolesDefault: ['ADMINISTRADOR', 'GERENTE', 'BODEGUERO', 'SUPERVISOR'],
  },

  // Administración
  {
    key: 'admin.users_manage',
    modulo: 'Administración',
    label: 'Gestión de Usuarios y Permisos',
    descripcion: 'Crear usuarios, restablecer contraseñas y modificar permisos',
    rolesDefault: ['ADMINISTRADOR'],
  },
  {
    key: 'admin.tenant_edit',
    modulo: 'Administración',
    label: 'Configuración Fiscal de Empresa',
    descripcion: 'Editar razón social, NIT, bodegas y parámetros globales',
    rolesDefault: ['ADMINISTRADOR'],
  },
];

export const PermissionsMatrixSchema = z.record(
  z.string().min(3),
  z.boolean()
);

export type PermissionsMatrix = z.infer<typeof PermissionsMatrixSchema>;

export function validarPermissionsMatrix(input: unknown) {
  const result = PermissionsMatrixSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors.map((e) => e.message).join('. '),
    };
  }
  return { success: true, data: result.data };
}
