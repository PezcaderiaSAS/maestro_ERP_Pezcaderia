import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBalanza } from '../hooks/useBalanza';

describe('useBalanza Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debería inicializar con reading=false y error=null', () => {
    const { result } = renderHook(() => useBalanza());
    expect(result.current.reading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('debería retornar error en ambiente sin Web Serial API', async () => {
    const { result } = renderHook(() => useBalanza());
    
    let caughtError: any = null;
    const promise = act(async () => {
      try {
        await result.current.leerPeso();
      } catch (err) {
        caughtError = err;
      }
    });

    vi.advanceTimersByTime(3000);
    await promise;

    expect(result.current.reading).toBe(false);
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toContain('Web Serial API no soportada');
  });

  it('debería simular peso correctamente', async () => {
    const { result } = renderHook(() => useBalanza());

    let pesoPromise: Promise<number> | null = null;
    
    act(() => {
      pesoPromise = result.current.simularLeerPeso();
    });

    expect(result.current.reading).toBe(true);

    let peso = 0;
    await act(async () => {
      vi.advanceTimersByTime(1000);
      peso = await pesoPromise!;
    });

    expect(result.current.reading).toBe(false);
    expect(peso).toBeGreaterThanOrEqual(0.5);
    expect(peso).toBeLessThanOrEqual(5.0);
  });
});
