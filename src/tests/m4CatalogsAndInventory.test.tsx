import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import * as fs from 'fs';
import * as path from 'path';

// Components under test
import ClientsView from '../views/ClientsView';
import { ProductTable } from '../views/inventory/components/ProductTable';
import { InventoryDataTable } from '../views/inventory/components/InventoryDataTable';
import { useClientStore } from '../store/useClientStore';
import { useARStore } from '../store/useARStore';
import { useInventoryStore } from '../stores/useInventoryStore';

describe('Milestone M4: Catálogos de Clientes e Inventario (F19–F25)', () => {
  const rootDir = path.resolve(__dirname, '../..');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('F19 & F20: Clientes Layout Responsivo y Header Wrap (ClientsView.tsx)', () => {
    const clientsViewPath = path.join(rootDir, 'src/views/ClientsView.tsx');
    const clientsContent = fs.readFileSync(clientsViewPath, 'utf-8');

    it('no debe contener el estilo rígido flex: 0 0 350px que causaba desbordamiento de 347px', () => {
      expect(clientsContent).not.toContain("flex: '0 0 350px'");
      expect(clientsContent).not.toContain('flex: "0 0 350px"');
      expect(clientsContent).not.toContain('flex: 0 0 350px');
    });

    it('debe utilizar clases responsivas de Tailwind para el layout de clientes y header wrap', () => {
      expect(clientsContent).toContain('flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch lg:items-start w-full min-w-0');
      expect(clientsContent).toContain('w-full lg:w-[350px] lg:shrink-0 flex flex-col gap-4 min-w-0');
      expect(clientsContent).toContain('p-3 sm:p-6 max-w-[1600px] mx-auto w-full overflow-hidden');
      expect(clientsContent).toContain('flex flex-wrap items-center justify-between gap-3 mb-6');
    });

    it('renderiza ClientsView con clases responsivas y sin overflow en el contenedor', () => {
      const { container } = render(<ClientsView />);
      const mainContainer = container.querySelector('.pos-container');
      expect(mainContainer).toBeTruthy();
      expect(mainContainer?.className).toContain('overflow-hidden');
      expect(mainContainer?.className).toContain('p-3 sm:p-6');
    });
  });

  describe('F21: Clientes Contraste WCAG AA+ y Tokens Semánticos (ClientsView.tsx)', () => {
    const clientsViewPath = path.join(rootDir, 'src/views/ClientsView.tsx');
    const clientsContent = fs.readFileSync(clientsViewPath, 'utf-8');

    it('debe haber erradicado completamente el color hardcodeado #0F172A de textos y títulos', () => {
      expect(clientsContent).not.toContain('#0F172A');
      expect(clientsContent).not.toContain('#0f172a');
    });

    it('los títulos y etiquetas de clientes deben usar la clase semántica text-primary', () => {
      render(<ClientsView />);
      const headerTitle = screen.getByText(/Directorio de Clientes/i);
      expect(headerTitle.className).toContain('text-primary');
    });
  });

  describe('F22: Clientes Doherty Debounce (200ms) y Memoización de Deuda (ClientsView.tsx)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('debe aplicar debouncing de 200ms a la búsqueda de clientes', () => {
      // Setup test clients in store
      useClientStore.setState({
        clientes: [
          {
            id: 'c1',
            nombre: 'Restaurante Pez Dorado',
            identificacion: '900111222',
            tipoIdentificacion: 'NIT',
            tipoPersona: 'JURIDICA',
            direccion: 'Calle 100',
            telefono: '3001234567',
            email: 'pez@dorado.com',
            ciudad: 'Bogotá',
            tipoPrecio: 'RESTAURANTE',
            encargadoCompras: 'Carlos Gomez',
            cupoCredito: 5000000,
            activo: true,
          },
          {
            id: 'c2',
            nombre: 'Marisquería del Pacífico',
            identificacion: '900333444',
            tipoIdentificacion: 'NIT',
            tipoPersona: 'JURIDICA',
            direccion: 'Carrera 15',
            telefono: '3007654321',
            email: 'mar@pacifico.com',
            ciudad: 'Bogotá',
            tipoPrecio: 'MAYORISTA',
            encargadoCompras: 'Laura Perez',
            cupoCredito: 10000000,
            activo: true,
          },
        ],
      });

      render(<ClientsView />);

      expect(screen.getByText('Restaurante Pez Dorado')).toBeTruthy();
      expect(screen.getByText('Marisquería del Pacífico')).toBeTruthy();

      const searchInput = screen.getByPlaceholderText('Buscar cliente...');
      fireEvent.change(searchInput, { target: { value: 'Pacífico' } });

      // Before 200ms debounce fires, both are still present
      expect(screen.getByText('Restaurante Pez Dorado')).toBeTruthy();

      // Advance timers by 200ms
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Now only the matched client is visible
      expect(screen.queryByText('Restaurante Pez Dorado')).toBeNull();
      expect(screen.getByText('Marisquería del Pacífico')).toBeTruthy();
    });

    it('calcula la cartera con mapa memoizado O(1) reflejando saldos pendientes con precisión', () => {
      useClientStore.setState({
        clientes: [
          {
            id: 'c-deuda-test',
            nombre: 'Cliente Con Cartera',
            identificacion: '123456789',
            tipoIdentificacion: 'NIT',
            tipoPersona: 'JURIDICA',
            direccion: 'Calle 1',
            telefono: '123',
            email: 'test@deuda.com',
            ciudad: 'Bogotá',
            tipoPrecio: 'POS',
            encargadoCompras: 'Ana',
            cupoCredito: 1000000,
            activo: true,
          },
        ],
      });

      useARStore.setState({
        cartera: [
          {
            id: 'inv-1',
            clienteId: 'c-deuda-test',
            clienteNombre: 'Cliente Con Cartera',
            fecha: new Date().toISOString(),
            total: 150000,
            saldo: 150000,
            items: [],
          } as any,
          {
            id: 'inv-2',
            clienteId: 'c-deuda-test',
            clienteNombre: 'Cliente Con Cartera',
            fecha: new Date().toISOString(),
            total: 200000,
            saldo: 50000,
            items: [],
          } as any,
        ],
      });

      render(<ClientsView />);

      // Total debt should be 150000 + 50000 = 200000
      expect(screen.getByText(/Deuda: \$200\.000/i)).toBeTruthy();
    });
  });

  describe('F23: Inventario Pestañas Chunks (Miller\'s Law) (InventoryView.tsx)', () => {
    const inventoryViewPath = path.join(rootDir, 'src/views/InventoryView.tsx');
    const inventoryContent = fs.readFileSync(inventoryViewPath, 'utf-8');

    it('debe proveer un selector dropdown para navegación móvil estructurada en 4 macro-grupos', () => {
      expect(inventoryContent).toContain('data-testid="inventory-mobile-tabs-selector"');
      expect(inventoryContent).toContain('<optgroup label="1. Operaciones & Almacén">');
      expect(inventoryContent).toContain('<optgroup label="2. Recepción & Abastecimiento">');
      expect(inventoryContent).toContain('<optgroup label="3. Producción & Analítica">');
      expect(inventoryContent).toContain('<optgroup label="4. Catálogos & Configuración">');
    });

    it('debe estructurar las pestañas de escritorio en bloques (chunks) legibles conforme a la Ley de Miller', () => {
      expect(inventoryContent).toContain('Chunk 1: Operaciones & Stock');
      expect(inventoryContent).toContain('Chunk 2: Recepción & Compras');
      expect(inventoryContent).toContain('Chunk 3: Producción & Analítica');
      expect(inventoryContent).toContain('Chunk 4: Catálogos & Configuración');
    });

    it('conserva todos los IDs requeridos para compatibilidad E2E y pruebas de navegación', () => {
      expect(inventoryContent).toContain('id="tab-compras-muelle"');
      expect(inventoryContent).toContain('id="tab-reportes-sucursales"');
      expect(inventoryContent).toContain('id="tab-configuracion-bodegas"');
    });
  });

  describe('F24: Inventario Tabla de Productos Móvil (ProductTable.tsx)', () => {
    const productTablePath = path.join(rootDir, 'src/views/inventory/components/ProductTable.tsx');
    const productTableContent = fs.readFileSync(productTablePath, 'utf-8');

    it('debe aplicar flex-wrap en los botones de cabecera para evitar desbordamiento en viewport 375px', () => {
      expect(productTableContent).toContain('flex flex-wrap items-center justify-between gap-3 mb-2');
      expect(productTableContent).toContain('flex flex-wrap gap-2');
    });

    it('debe envolver la tabla en overflow-x-auto con max-w-full', () => {
      expect(productTableContent).toContain('overflow-x-auto');
    });

    it('los botones de acción deben cumplir el touch target mínimo de 44x44px (Ley de Fitts)', () => {
      expect(productTableContent).toContain('min-h-[44px]');
    });

    it('renderiza la tabla de productos y sus botones de acción ergonómicos', () => {
      const mockProducts = [
        {
          id: 'p1',
          sku: 'SALM-001',
          nombre: 'Salmón Premium Chile',
          categoria: 'Pescados',
          unidadMedida: 'kg',
          precio_venta: 45000,
          precio_compra: 32000,
          buffer_seguridad: 10,
          categoriaABC: 'A',
          activo: true,
        },
      ];

      render(
        <ProductTable
          products={mockProducts}
          stock={{ 'Bodega Principal': { 'SALM-001': 25 } }}
          searchTerm=""
          setSearchTerm={vi.fn()}
          statusFilter="TODOS"
          setStatusFilter={vi.fn()}
        />
      );

      expect(screen.getByText('Salmón Premium Chile')).toBeTruthy();
      expect(screen.getByText('SALM-001')).toBeTruthy();
      expect(screen.getByText('Importar Excel/CSV')).toBeTruthy();
      expect(screen.getByText('Nuevo Producto')).toBeTruthy();
    });
  });

  describe('F25: Inventario WMS Hover Fix y Touch Targets (InventoryDataTable.tsx)', () => {
    const dataTablePath = path.join(rootDir, 'src/views/inventory/components/InventoryDataTable.tsx');
    const dataTableContent = fs.readFileSync(dataTablePath, 'utf-8');

    it('debe haber eliminado opacity-0 y group-hover:opacity-100 para que los botones sean siempre visibles en pantallas táctiles', () => {
      expect(dataTableContent).not.toContain('opacity-0 group-hover:opacity-100');
    });

    it('los botones Trasladar y Merma deben tener touch target de al menos 44px (min-h-[44px])', () => {
      expect(dataTableContent).toContain('min-h-[44px]');
      expect(dataTableContent).toContain('min-w-[44px]');
    });

    it('renderiza los botones de acción permanentemente accesibles y dispara callbacks al pulsarlos', () => {
      const onTransferMock = vi.fn();
      const onAdjustMock = vi.fn();

      useInventoryStore.setState({
        stock: [
          {
            id: 'item-1',
            sku: 'TRUCHA-001',
            quantity: 12.5,
            batch_id: 'LOT-2026-X',
          },
        ],
        isLoading: false,
      });

      render(
        <InventoryDataTable
          onTransfer={onTransferMock}
          onAdjust={onAdjustMock}
        />
      );

      const btnTrasladar = screen.getByTestId('btn-trasladar-TRUCHA-001');
      const btnMerma = screen.getByTestId('btn-merma-TRUCHA-001');

      expect(btnTrasladar).toBeTruthy();
      expect(btnMerma).toBeTruthy();

      // Botones tienen clases de altura mínima >= 44px
      expect(btnTrasladar.className).toContain('min-h-[44px]');
      expect(btnMerma.className).toContain('min-h-[44px]');

      // Clics disparan las acciones
      fireEvent.click(btnTrasladar);
      expect(onTransferMock).toHaveBeenCalledWith('TRUCHA-001', 'LOT-2026-X');

      fireEvent.click(btnMerma);
      expect(onAdjustMock).toHaveBeenCalledWith('TRUCHA-001', 'LOT-2026-X');
    });
  });
});
