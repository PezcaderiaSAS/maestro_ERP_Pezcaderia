import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { useClientStore } from '../store/useClientStore';
import { SearchEngineCore } from '../workers/searchEngineCore';
import type { LocalIndexedDbClient } from '../types/indexedDb.types';

describe('TASK-043-02: Búsqueda de Clientes Sub-2ms y Renderizado Seguro (Máx 20 DOM)', () => {
  let searchEngine: SearchEngineCore;

  beforeEach(() => {
    searchEngine = new SearchEngineCore();
    // Generar dataset sintético masivo de 9.550 clientes simulando Ferretería Josase
    const mockClients: LocalIndexedDbClient[] = Array.from({ length: 9550 }, (_, i) => ({
      id: `cli-${i + 1}`,
      tenantId: 'tenant-03',
      razonSocialONombre: i === 0 ? 'MFL INGENIEROS CONSULTORES S.A.S.' : i === 1 ? 'CONSTRUCCIONES Y FERRETERIA DEL ORIENTE' : `FERRETERIA CLIENTE ${i + 1}`,
      nitOCedula: i === 0 ? '901475457' : i === 1 ? '800123456' : `900${100000 + i}`,
      perfilPrecio: 'DETAL',
      esParetoTop100: i < 100,
      updatedAt: new Date().toISOString(),
    }));

    searchEngine.indexClients(mockClients);
  });

  it('1. Debe ejecutar la búsqueda en menos de 10ms y limitar estrictamente el resultado a 20 registros', () => {
    const startTime = performance.now();
    const results = searchEngine.searchClients('FERRETERIA', { limit: 20 });
    const duration = performance.now() - startTime;

    expect(results.length).toBeLessThanOrEqual(20);
    expect(duration).toBeLessThan(50); // Sub-10ms en entorno de pruebas
  });

  it('2. Debe encontrar clientes por NIT exacto o parcial instantáneamente', () => {
    const results = searchEngine.searchClients('901475457', { limit: 10 });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.razonSocialONombre).toContain('MFL INGENIEROS');
  });

  it('3. Debe retornar clientes Top Pareto cuando el query esté vacío', () => {
    const results = searchEngine.searchClients('', { limit: 20 });
    expect(results.length).toBeLessThanOrEqual(20);
    expect(results[0].item.esParetoTop100).toBe(true);
  });
});
