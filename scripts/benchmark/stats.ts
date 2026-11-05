/**
 * Utilidades Estadísticas Deterministas para Benchmarking de Alta Resolución (SPEC-053)
 * Mide muestras temporales y calcula p50, p90, p95, p99 de forma reproducible.
 */

import type { PercentileStats } from './types';

/**
 * Calcula un percentil específico (0..100) sobre un arreglo de números
 */
export function calculatePercentile(values: number[], p: number): number {
  if (!values || values.length === 0) return 0;
  if (values.length === 1) return Number(values[0].toFixed(4));

  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  const weight = rank - lowerIndex;

  if (lowerIndex === upperIndex) {
    return Number(sorted[lowerIndex].toFixed(4));
  }

  const interpolated = sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
  return Number(interpolated.toFixed(4));
}

/**
 * Genera un resumen estadístico completo (min, max, mean, p50, p90, p95, p99)
 */
export function summarizeStats(samples: number[]): PercentileStats {
  if (!samples || samples.length === 0) {
    return { min: 0, max: 0, mean: 0, p50: 0, p90: 0, p95: 0, p99: 0, samples: 0 };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = Number((sum / sorted.length).toFixed(4));
  const min = Number(sorted[0].toFixed(4));
  const max = Number(sorted[sorted.length - 1].toFixed(4));

  return {
    min,
    max,
    mean,
    p50: calculatePercentile(sorted, 50),
    p90: calculatePercentile(sorted, 90),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99),
    samples: sorted.length,
  };
}

/**
 * Formatea un número con decimales fijos para presentación tabular
 */
export function formatMs(val: number): string {
  if (val < 0.001) {
    return `${(val * 1000).toFixed(2)} µs`;
  }
  return `${val.toFixed(3)} ms`;
}
