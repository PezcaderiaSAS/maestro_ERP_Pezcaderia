import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Auditoría Automatizada: Tridecálogo Canónico del CSS Moderno', () => {

  const rootDir = path.resolve(__dirname, '../..');
  const indexCssPath = path.join(rootDir, 'src/index.css');
  const indexCssContent = fs.readFileSync(indexCssPath, 'utf-8');

  it('1. src/index.css debe contener control de especificidad @layer', () => {
    expect(indexCssContent).toMatch(/@layer\s+(base|components|utilities)/i);
  });

  it('2. src/index.css debe activar @view-transition para navegación fluida', () => {
    expect(indexCssContent).toMatch(/@view-transition\s*\{/i);
  });

  it('3. src/index.css debe incluir text-wrap: balance para títulos y text-wrap: pretty para párrafos', () => {
    expect(indexCssContent).toMatch(/text-wrap:\s*balance/i);
    expect(indexCssContent).toMatch(/text-wrap:\s*pretty/i);
  });

  it('4. src/index.css no debe contener z-index: 999 o números de escalación artificial', () => {
    expect(indexCssContent).not.toMatch(/z-index:\s*(999|9999|99999)\s*;/i);
  });

  it('5. Los modales rápidos de inventario no deben usar z-[999], sino isolate y z-50', () => {
    const proveedorModalPath = path.join(rootDir, 'src/views/inventory/components/CrearProveedorRapidoModal.tsx');
    const productoModalPath = path.join(rootDir, 'src/views/inventory/components/CrearProductoRapidoModal.tsx');

    if (fs.existsSync(proveedorModalPath)) {
      const content = fs.readFileSync(proveedorModalPath, 'utf-8');
      expect(content).not.toMatch(/z-\[999\]/);
      expect(content).toMatch(/isolate/);
    }

    if (fs.existsSync(productoModalPath)) {
      const content = fs.readFileSync(productoModalPath, 'utf-8');
      expect(content).not.toMatch(/z-\[999\]/);
      expect(content).toMatch(/isolate/);
    }
  });

  it('6. FluidResponsiveCard debe implementar Container Queries (@container)', () => {
    const cardPath = path.join(rootDir, 'src/components/ui/FluidResponsiveCard.tsx');
    if (fs.existsSync(cardPath)) {
      const content = fs.readFileSync(cardPath, 'utf-8');
      expect(content).toMatch(/@container/);
    }
  });

  it('7. Modales clave deben tener isolation: isolate para crear un stacking context limpio', () => {
    const modalPath = path.join(rootDir, 'src/components/ui/Modal.tsx');
    const consentModalPath = path.join(rootDir, 'src/components/legal/ConsentGateModal.tsx');

    if (fs.existsSync(modalPath)) {
      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toMatch(/isolate/);
    }

    if (fs.existsSync(consentModalPath)) {
      const content = fs.readFileSync(consentModalPath, 'utf-8');
      expect(content).toMatch(/isolate/);
    }
  });

});
