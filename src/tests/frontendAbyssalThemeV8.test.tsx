import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('SPEC-033 / TASK-033-01: Suite TDD Dark Mode Abisal Linear/Raycast (Erradicación de Franjas Grises)', () => {
  const indexPath = path.resolve(__dirname, '../index.css');
  const appPath = path.resolve(__dirname, '../App.tsx');
  const posViewPath = path.resolve(__dirname, '../views/POSView.tsx');
  const productSearchPath = path.resolve(__dirname, '../views/pos/components/ProductSearchPanel.tsx');
  const sidebarPath = path.resolve(__dirname, '../components/layout/EnterpriseSidebar.tsx');
  const topbarPath = path.resolve(__dirname, '../components/layout/EnterpriseTopbar.tsx');

  it('1. src/index.css debe definir el fondo abisal #070A10 y scrollbars translúcidos sin pistas grises', () => {
    const cssContent = fs.readFileSync(indexPath, 'utf-8');

    // Debe contener el token de fondo abisal #070A10
    expect(cssContent).toMatch(/#070A10|--bg-color:\s*#070A10/i);

    // Scrollbar no debe tener pistas grises sólidas
    expect(cssContent).not.toContain('scrollbar-track-slate');
    expect(cssContent).toMatch(/::-webkit-scrollbar-thumb/);
  });

  it('2. App.tsx debe unificar el contenedor raíz en el canvas abisal #070A10 sin franjas intermedias', () => {
    const appContent = fs.readFileSync(appPath, 'utf-8');

    // Debe tener el fondo abisal
    expect(appContent).toMatch(/bg-\[#070A10\]|#070A10/);
    // No debe tener bordes grises de contenedor
    expect(appContent).not.toContain('border-slate-200');
  });

  it('3. POSView.tsx debe erradicar por completo las clases de franja gris (border-slate-200, bg-slate-100)', () => {
    const posContent = fs.readFileSync(posViewPath, 'utf-8');

    // El badge de vendedor no debe tener fondo claro ni borde gris
    expect(posContent).not.toContain('id="pos-seller-badge" className="flex items-center gap-2 bg-slate-100');
    expect(posContent).not.toContain('border-slate-200/90');

    // La barra de control de subvistas no debe ser bg-white ni border-slate-200
    expect(posContent).not.toMatch(/className="flex flex-wrap items-center justify-between gap-2 py-1\.5 px-3 bg-white/);

    // Banner de caja cerrada debe ser translúcido moderno, no bg-red-600 sólido
    expect(posContent).toMatch(/bg-rose-500\/1[0-5]|bg-red-500\/20/);
  });

  it('4. ProductSearchPanel.tsx debe utilizar inputs abisales y chips oscuros sin fondos blancos', () => {
    const searchContent = fs.readFileSync(productSearchPath, 'utf-8');

    // El input de búsqueda de productos no debe tener clases de fondo blanco o borde gris claro
    expect(searchContent).toMatch(/bg-slate-950\/[6-9]0|bg-slate-900\/80/);

    // No debe contener etiquetas <img> (Regla de Zero-Cost Graphics)
    expect(searchContent).not.toMatch(/<img\s/i);
  });

  it('5. EnterpriseSidebar.tsx y EnterpriseTopbar.tsx deben mantener micro-bordes luminosos border-white/10 sin grises opacos', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
    const topbarContent = fs.readFileSync(topbarPath, 'utf-8');

    // Sidebar debe tener micro-borde derecho translúcido
    expect(sidebarContent).toContain('border-white/10');
    expect(sidebarContent).not.toContain('border-slate-200');

    // Topbar debe tener micro-borde inferior o perimetral translúcido
    expect(topbarContent).toContain('border-white/12');
    expect(topbarContent).not.toContain('border-slate-200');
  });
});
