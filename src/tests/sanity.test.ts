import { describe, it, expect } from 'vitest';

describe('Sanity Check', () => {
  it('debería sumar correctamente', () => {
    expect(1 + 1).toBe(2);
  });

  it('debería tener acceso al mock de localStorage', () => {
    localStorage.setItem('test-key', 'test-value');
    expect(localStorage.getItem('test-key')).toBe('test-value');
    localStorage.removeItem('test-key');
    expect(localStorage.getItem('test-key')).toBeNull();
  });
});
