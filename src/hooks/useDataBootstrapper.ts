import { useEffect } from 'react';
import * as localDb from '../services/localDb';
import { toTitleCase } from '../lib/utils';
import { INITIAL_CLIENTS, INITIAL_PROVEEDORES, INITIAL_PRODUCTS, migrateProductsToCatalogAndPricing } from '../data/appSeedData';
import type { ProductCatalog, ProductPricing } from '../types/erp.types';

import { useAppStore } from '../store/useAppStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useOrderStore } from '../store/useOrderStore';
import { useWarehouseStore } from '../store/useWarehouseStore';
import { useClientStore } from '../store/useClientStore';
import { useSupplierStore } from '../store/useSupplierStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useDriverStore } from '../store/useDriverStore';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { useDynamicFieldStore } from '../store/useDynamicFieldStore';
import { useARStore } from '../store/useARStore';
import { useReturnStore } from '../store/useReturnStore';
import { useIntegrationStore } from '../store/useIntegrationStore';
import { usePurchaseStore } from '../store/usePurchaseStore';
import { useMovementStore } from '../store/useMovementStore';
import { useEventStore } from '../store/useEventStore';

/**
 * Hook orquestador de inicialización, hidratación de almacenes y migraciones de datos en frío/caliente.
 */
export function useDataBootstrapper() {
  const userRole = useAppStore((s) => s.userRole);

  const { setProductsCatalog, setProductPricings, productsCatalog, products, loadInventory, stock, setStock, loadStock } = useInventoryStore();
  const { loadOrders } = useOrderStore();
  const { bodegas, loadBodegas } = useWarehouseStore();
  const { clientes, setClientes, loadClientes, loadLastClientPrices } = useClientStore();
  const { proveedores, setProveedores, loadProveedores } = useSupplierStore();
  const { loadCategorias } = useCategoryStore();
  const { loadConductores } = useDriverStore();
  const { empleados, setEmpleados, loadEmpleados, loadNominas } = useEmployeeStore();
  const { loadGastos } = useExpenseStore();
  const { loadDynamicFields } = useDynamicFieldStore();
  const { loadCartera } = useARStore();
  const { loadDevoluciones } = useReturnStore();
  const { loadLogIntegracion, loadParametros } = useIntegrationStore();
  const { loadOrdenesCompra } = usePurchaseStore();
  const { loadMovimientos } = useMovementStore();
  const { loadEvents, loadSyncQueue } = useEventStore();

  // 1. Carga inicial y migración del catálogo de productos
  useEffect(() => {
    const savedCat = localDb.load('productsCatalog', null as ProductCatalog[] | null);
    if (!savedCat || savedCat.length === 0) {
      const oldSaved = localStorage.getItem('pezcaderia_products');
      let sourceProducts = INITIAL_PRODUCTS;
      if (oldSaved) {
        try { sourceProducts = JSON.parse(oldSaved); } catch (e) {}
      } else {
        sourceProducts = INITIAL_PRODUCTS.map(p => {
          let grp = 'General';
          if (p.categoria === 'MATERIA PRIMA') grp = 'Materia Prima';
          else if (p.categoria === 'PESCADOS') grp = 'Pescado Blanco';
          else if (p.categoria === 'MARISCOS') grp = 'Camarones';
          else if (p.categoria === 'BATIDOS') grp = 'Batidos Saludables';
          else if (p.categoria === 'BEBIDAS') grp = 'Jugos Naturales';
          else if (p.categoria === 'ENSALADAS') grp = 'Ensaladas Frescas';
          else if (p.categoria === 'ENTRADAS') grp = 'Entradas';
          return { ...p, metadata: p.metadata || { categoria_descriptiva: grp } };
        });
      }
      
      const { catalog, pricings } = migrateProductsToCatalogAndPricing(sourceProducts, userRole);
      setProductsCatalog(catalog);
      setProductPricings(pricings);
      localDb.removeRaw('pezcaderia_products');
    } else {
      // Sincronizar productos de INITIAL_PRODUCTS que no existan aún en el catálogo local
      const existingSkus = new Set(savedCat.map(p => p.sku));
      const missingProducts = INITIAL_PRODUCTS.filter(p => !existingSkus.has(p.sku));
      if (missingProducts.length > 0) {
        const { catalog: newItems, pricings: newPrcs } = migrateProductsToCatalogAndPricing(missingProducts, userRole);
        const updatedCat = [...savedCat, ...newItems];
        const savedPricings = localDb.load('productPricings', [] as ProductPricing[]);
        const updatedPrcs = [...savedPricings, ...newPrcs];
        setProductsCatalog(updatedCat);
        setProductPricings(updatedPrcs);
      }
    }
  }, [userRole, setProductsCatalog, setProductPricings]);

  // 2. Invocación coordinada de métodos de carga de los 16 Zustand stores
  useEffect(() => {
    loadOrders();
    loadBodegas();
    loadInventory();
    loadClientes(INITIAL_CLIENTS);
    loadProveedores(INITIAL_PROVEEDORES);
    loadCategorias();
    loadConductores();
    loadEmpleados();
    loadNominas();
    loadGastos();
    loadDynamicFields();
    loadCartera();
    loadDevoluciones();
    loadLogIntegracion();
    loadParametros();
    loadStock();
    loadOrdenesCompra();
    loadMovimientos();
    loadEvents();
    loadSyncQueue();
    loadLastClientPrices();
  }, [
    loadOrders,
    loadBodegas,
    loadInventory,
    loadClientes,
    loadProveedores,
    loadCategorias,
    loadConductores,
    loadEmpleados,
    loadNominas,
    loadGastos,
    loadDynamicFields,
    loadCartera,
    loadDevoluciones,
    loadLogIntegracion,
    loadParametros,
    loadStock,
    loadOrdenesCompra,
    loadMovimientos,
    loadEvents,
    loadSyncQueue,
    loadLastClientPrices,
  ]);

  // 3. Garantizar existencia de stock inicial de prueba para nuevos productos
  useEffect(() => {
    if (stock && Object.keys(stock).length > 0) {
      const primaryWarehouseKey = bodegas[0]?.id || '1';
      const secondaryWarehouseKey = bodegas[0]?.nombre || 'Bodega Principal';
      const targetKey = stock[primaryWarehouseKey] ? primaryWarehouseKey : (stock[secondaryWarehouseKey] ? secondaryWarehouseKey : Object.keys(stock)[0]);
      
      if (targetKey && stock[targetKey]) {
        const currentWhStock = stock[targetKey];
        if (currentWhStock['CAM-CRU-41-50'] === undefined || currentWhStock['CAM-CRU-41-50-500G'] === undefined) {
          setStock((prev: any) => ({
            ...prev,
            [targetKey]: {
              ...(prev[targetKey] || {}),
              'CAM-CRU-41-50': prev[targetKey]?.['CAM-CRU-41-50'] ?? 50,
              'CAM-CRU-41-50-500G': prev[targetKey]?.['CAM-CRU-41-50-500G'] ?? 30,
            }
          }));
        }
      }
    }
  }, [stock, bodegas, setStock]);

  // 4. Migración idempotente a Title Case y saneamiento de campos heredados
  useEffect(() => {
    let migrated = false;

    // Migrar Clientes
    const migratedClientes = clientes.map(c => {
      const newNombre = toTitleCase(c.nombre);
      const newCiudad = toTitleCase(c.ciudad);
      const newDireccion = toTitleCase(c.direccion);
      const newContacto = toTitleCase(c.encargadoCompras || '');
      if (c.nombre !== newNombre || c.ciudad !== newCiudad || c.direccion !== newDireccion || c.encargadoCompras !== newContacto) {
        migrated = true;
        return { ...c, nombre: newNombre, ciudad: newCiudad, direccion: newDireccion, encargadoCompras: newContacto };
      }
      return c;
    });

    // Migrar Proveedores
    const migratedProveedores = proveedores.map(p => {
      const newNombre = toTitleCase(p.nombre);
      const newCiudad = toTitleCase(p.ciudad);
      const newDireccion = toTitleCase(p.direccion);
      const newContacto = toTitleCase(p.contactoCompras || '');
      if (p.nombre !== newNombre || p.ciudad !== newCiudad || p.direccion !== newDireccion || p.contactoCompras !== newContacto) {
        migrated = true;
        return { ...p, nombre: newNombre, ciudad: newCiudad, direccion: newDireccion, contactoCompras: newContacto };
      }
      return p;
    });

    // Migrar Products
    const migratedProducts = productsCatalog.map((p: any) => {
      const newNombre = toTitleCase(p.nombre);
      if (p.nombre !== newNombre) {
        migrated = true;
        return { ...p, nombre: newNombre };
      }
      return p;
    });

    // Migrar Empleados (legacy salario a salarioBase, y asegurar campos por defecto)
    const migratedEmpleados = empleados.map((e: any) => {
      let changed = false;
      const legacyEmp = e as any;
      if (legacyEmp.salario !== undefined && e.salarioBase === undefined) {
        e.salarioBase = legacyEmp.salario;
        changed = true;
      }
      if (e.salarioBase === undefined) { e.salarioBase = 1300000; changed = true; }
      if (e.prestamosActivos === undefined) { e.prestamosActivos = 0; changed = true; }
      if (e.auxilioTransporte === undefined) { e.auxilioTransporte = 162000; changed = true; }
      if (e.telefono === undefined) { e.telefono = ''; changed = true; }
      if (e.email === undefined) { e.email = ''; changed = true; }
      if (e.rolAcceso === undefined) { e.rolAcceso = (legacyEmp.rolERP || 'VENDEDOR') as any; changed = true; }
      if (e.tipoContrato === undefined) { e.tipoContrato = 'INDEFINIDO'; changed = true; }
      if (e.riesgoARL === undefined) { e.riesgoARL = 'I'; changed = true; }
      if (e.aplicaExoneracion === undefined) { e.aplicaExoneracion = true; changed = true; }

      if (changed) migrated = true;
      return e;
    });

    if (migrated) {
      console.log('Migración de datos ejecutada.');
      setClientes(migratedClientes);
      setProveedores(migratedProveedores);
      setProductsCatalog(migratedProducts);
      setEmpleados(migratedEmpleados);
    }
  }, [clientes, proveedores, productsCatalog, empleados, setClientes, setProveedores, setProductsCatalog, setEmpleados]);

  // 5. Sincronizar stock según catálogo actual y bodegas activas
  useEffect(() => {
    setStock((prev: Record<string, Record<string, number>>) => {
      const newStock = { ...prev };
      const activeBodegas = bodegas.filter(b => b.activa).map(b => b.nombre);
      
      activeBodegas.forEach((bodega: string) => {
        if (!newStock[bodega]) {
          newStock[bodega] = {};
        }
        
        products.forEach((p: any) => {
          if (newStock[bodega][p.sku] === undefined) {
            let qty = 0;
            if (bodega === 'Bodega Principal') {
              if (p.sku === 'PES-ENT-001') qty = 500;
              else if (p.sku === 'FIL-LIM-002') qty = 120;
              else if (p.sku === 'CAM-TIG-003') qty = 85;
            } else if (bodega === 'Bodega de Tránsito' || bodega === 'Bodega Secundaria') {
              if (p.sku === 'PES-ENT-001') qty = 200;
              else if (p.sku === 'FIL-LIM-002') qty = 45;
            } else if (bodega === 'Bodega Averías') {
              if (p.sku === 'FIL-LIM-002') qty = 12;
            }
            newStock[bodega][p.sku] = qty;
          }
        });

        // Filtrar productos obsoletos (que ya no están en el catálogo)
        const productSkus = new Set(products.map((p: any) => p.sku));
        for (const sku in newStock[bodega]) {
          if (!productSkus.has(sku)) {
            delete newStock[bodega][sku];
          }
        }
      });

      return newStock;
    });
  }, [products, bodegas, setStock]);
}
