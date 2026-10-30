import { describe, it, expect } from 'vitest';
import path from 'path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Importamos el motor del Master Architect
const {
  checkDomainPurity,
  checkViewSeparation,
  checkSingleResponsibility,
  checkRouteTypeSafety,
  countUsefulLines,
  auditCodebase,
} = require('../../scripts/architecture/audit-solid-boundaries.cjs');

describe('Master Architect Architecture Audit Engine (SPEC-017 / TASK-017-04)', () => {
  describe('1. Regla: Aislamiento del Dominio (checkDomainPurity)', () => {
    it('debe detectar como CRÍTICO cualquier import de infraestructura dentro de src/types/', () => {
      const pollutedDomainContent = `
        import { createClient } from '@supabase/supabase-js';
        export interface Usuario { id: string; }
      `;
      const relativePath = path.join('types', 'usuario.types.ts');
      const violations = checkDomainPurity('dummy/path', pollutedDomainContent, relativePath);

      expect(violations.length).toBe(1);
      expect(violations[0].severity).toBe('CRITICAL');
      expect(violations[0].code).toBe('BOUND-01-DOMAIN-POLLUTION');
      expect(violations[0].message).toContain('@supabase/supabase-js');
    });

    it('debe permitir imports puros de tipos y contratos entre archivos de dominio', () => {
      const pureDomainContent = `
        import { LineaPedido } from './orders.types';
        export interface Cotizacion { id: string; lineas: LineaPedido[]; }
      `;
      const relativePath = path.join('types', 'cotizacion.types.ts');
      const violations = checkDomainPurity('dummy/path', pureDomainContent, relativePath);

      expect(violations.length).toBe(0);
    });

    it('no debe aplicar la regla de tipos fuera del directorio types/', () => {
      const serviceContent = `import axios from 'axios';`;
      const relativePath = path.join('services', 'externalApiService.ts');
      const violations = checkDomainPurity('dummy/path', serviceContent, relativePath);

      expect(violations.length).toBe(0);
    });
  });

  describe('2. Regla: Anti-Patrón Controlador/Vista Gorda (checkViewSeparation)', () => {
    it('debe detectar como CRÍTICO el acceso directo a clientes de base de datos en vistas React', () => {
      const thickViewContent = `
        import React from 'react';
        import { getSupabaseClient } from '../lib/supabase';
        export const VentasView = () => { return <div>Ventas</div>; };
      `;
      const relativePath = path.join('views', 'VentasView.tsx');
      const violations = checkViewSeparation('dummy/path', thickViewContent, relativePath);

      expect(violations.length).toBe(1);
      expect(violations[0].severity).toBe('CRITICAL');
      expect(violations[0].code).toBe('ARCH-02-THICK-VIEW-CONTROLLER');
      expect(violations[0].message).toContain('getSupabaseClient');
    });

    it('debe permitir vistas React que consuman stores y servicios desacoplados', () => {
      const cleanViewContent = `
        import React from 'react';
        import { useOrderStore } from '../store/useOrderStore';
        import { b2bIntegrationService } from '../services/b2bIntegrationService';
        export const VentasView = () => { return <div>Ventas</div>; };
      `;
      const relativePath = path.join('views', 'VentasView.tsx');
      const violations = checkViewSeparation('dummy/path', cleanViewContent, relativePath);

      expect(violations.length).toBe(0);
    });
  });

  describe('3. Regla: Responsabilidad Única y Conteo de Líneas (SRP)', () => {
    it('debe calcular correctamente las líneas útiles descartando comentarios y líneas vacías', () => {
      const codeSnippet = `
        // Comentario de una línea
        /*
         * Comentario de bloque
         */
        const x = 10;

        const y = 20;
      `;
      const count = countUsefulLines(codeSnippet);
      expect(count).toBe(2); // Solo const x y const y
    });

    it('debe emitir ADVERTENCIA cuando un archivo supere el umbral de 600 líneas útiles', () => {
      const lines = [];
      for (let i = 0; i < 650; i++) {
        lines.push(`const variable_${i} = ${i};`);
      }
      const largeContent = lines.join('\n');
      const relativePath = path.join('views', 'LargeView.tsx');
      const violations = checkSingleResponsibility('dummy/path', largeContent, relativePath);

      expect(violations.length).toBe(1);
      expect(violations[0].severity).toBe('WARNING');
      expect(violations[0].code).toBe('SOLID-01-SRP-FILE-LENGTH');
      expect(violations[0].meta.usefulLines).toBe(650);
    });
  });

  describe('4. Regla: Type-Safety de Navegación (checkRouteTypeSafety)', () => {
    it('debe alertar ante el uso de magic strings en setCurrentView() en vistas', () => {
      const viewWithMagicString = `
        const handleClick = () => {
          setCurrentView('inventario');
        };
      `;
      const relativePath = path.join('views', 'NavButton.tsx');
      const violations = checkRouteTypeSafety('dummy/path', viewWithMagicString, relativePath);

      expect(violations.length).toBe(1);
      expect(violations[0].severity).toBe('WARNING');
      expect(violations[0].code).toBe('CLEAN-04-MAGIC-ROUTE-STRING');
      expect(violations[0].message).toContain("'inventario'");
    });
  });

  describe('5. Auditoría Real Integral del Repositorio (auditCodebase)', () => {
    it('debe auditar el código base actual del ERP y verificar CERO violaciones críticas', () => {
      const results = auditCodebase();

      expect(results.totalFiles).toBeGreaterThan(250);
      expect(results.criticalCount).toBe(0); // CERO violaciones críticas
      expect(results.passed).toBe(true); // Pipeline 100% aprobado
      expect(results.durationMs).toBeLessThan(5000); // Rápido y determinista (tolerante a I/O concurrente)
    });
  });
});
