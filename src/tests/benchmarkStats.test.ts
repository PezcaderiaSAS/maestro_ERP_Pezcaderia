import { describe, it, expect } from 'vitest';
import { calculatePercentile, summarizeStats, formatMs } from '../../scripts/benchmark/stats';

describe('Empirical Verification: scripts/benchmark/stats.ts', () => {
  it('handles empty arrays without NaN or crash', () => {
    const resP = calculatePercentile([], 50);
    expect(resP).toBe(0);

    const stats = summarizeStats([]);
    expect(stats).toEqual({
      min: 0,
      max: 0,
      mean: 0,
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      samples: 0,
    });
  });

  it('handles null and undefined safely', () => {
    expect(calculatePercentile(null as unknown as number[], 50)).toBe(0);
    expect(calculatePercentile(undefined as unknown as number[], 50)).toBe(0);
    expect(summarizeStats(null as unknown as number[])).toEqual({
      min: 0,
      max: 0,
      mean: 0,
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      samples: 0,
    });
  });

  it('handles single-element array correctly', () => {
    const val = 42.123456;
    expect(calculatePercentile([val], 50)).toBe(42.1235);
    expect(calculatePercentile([val], 99)).toBe(42.1235);

    const stats = summarizeStats([val]);
    expect(stats.min).toBe(42.1235);
    expect(stats.max).toBe(42.1235);
    expect(stats.mean).toBe(42.1235);
    expect(stats.p50).toBe(42.1235);
    expect(stats.p95).toBe(42.1235);
    expect(stats.samples).toBe(1);
  });

  it('handles multiple identical elements without division by zero or NaN', () => {
    const identical = [10, 10, 10, 10, 10];
    const stats = summarizeStats(identical);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(10);
    expect(stats.mean).toBe(10);
    expect(stats.p50).toBe(10);
    expect(stats.p90).toBe(10);
    expect(stats.p95).toBe(10);
    expect(stats.p99).toBe(10);
    expect(stats.samples).toBe(5);
  });

  it('handles zero values correctly', () => {
    const zeros = [0, 0, 0];
    const stats = summarizeStats(zeros);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
    expect(stats.mean).toBe(0);
    expect(stats.p50).toBe(0);
    expect(stats.samples).toBe(3);
  });

  it('handles extreme scales without overflow or NaN', () => {
    const large = [1e12, 2e12, 3e12];
    const stats = summarizeStats(large);
    expect(Number.isFinite(stats.mean)).toBe(true);
    expect(Number.isFinite(stats.p50)).toBe(true);

    const micro = [0.00001, 0.00005, 0.00009];
    const microStats = summarizeStats(micro);
    expect(Number.isFinite(microStats.mean)).toBe(true);
    expect(Number.isFinite(microStats.p50)).toBe(true);
  });

  it('formats milliseconds and microseconds appropriately', () => {
    expect(formatMs(0)).toBe('0.00 µs');
    expect(formatMs(0.00005)).toBe('0.05 µs');
    expect(formatMs(0.0009)).toBe('0.90 µs');
    expect(formatMs(0.001)).toBe('0.001 ms');
    expect(formatMs(12.3456)).toBe('12.346 ms');
  });

  it('guarantees deterministic monotonic percentiles: min <= p50 <= p90 <= p95 <= p99 <= max', () => {
    const samples = [15.2, 3.4, 8.9, 1.2, 45.6, 22.1, 7.8, 12.0, 9.5, 33.2];
    const stats = summarizeStats(samples);

    expect(stats.min).toBeLessThanOrEqual(stats.p50);
    expect(stats.p50).toBeLessThanOrEqual(stats.p90);
    expect(stats.p90).toBeLessThanOrEqual(stats.p95);
    expect(stats.p95).toBeLessThanOrEqual(stats.p99);
    expect(stats.p99).toBeLessThanOrEqual(stats.max);
  });
});
