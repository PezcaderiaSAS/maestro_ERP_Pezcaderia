/**
 * Contratos de Interfaces para la Suite de Benchmarks de Latencia (SPEC-053)
 * MaestroPescaderia ERP
 */

export interface BenchmarkMetric {
  name: string;
  value: number;
  unit: string;
  description: string;
  targetSla?: number;
}

export interface BenchmarkResult {
  suite: string;
  description: string;
  metrics: Record<string, number>;
  passed: boolean;
  details?: string;
  timestamp: string;
  environment?: {
    nodeVersion: string;
    platform: string;
    arch: string;
    cpus: number;
  };
}

export interface PercentileStats {
  min: number;
  max: number;
  mean: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  samples: number;
}
