import { describe, it, expect } from 'vitest';
import { benchmarkSearchScale, benchmarkCartOperations } from '../../scripts/benchmark/benchmark-pos-latency';
import {
  generateSyntheticKardex,
  benchmarkKardexQueries,
  benchmarkMassBalanceCalculations,
} from '../../scripts/benchmark/benchmark-wms-queries';
import {
  benchmarkOutboxInsertion,
  benchmarkOccResolution,
} from '../../scripts/benchmark/benchmark-outbox-sync';
import { calculatePercentile } from '../../scripts/benchmark/stats';

describe('Empirical Verification: Multi-Round Stability & Repeatability', () => {
  const searchQueries = ['salmon', 'camaron', 'trucha', 'robalo', 'filete'];

  it('maintains numerical stability across 3 rounds of POS search benchmarks', () => {
    const rounds: { naiveP50: number; indexedP50: number; speedup: number }[] = [];

    for (let r = 0; r < 3; r++) {
      const bench = benchmarkSearchScale(1000, searchQueries);
      const naiveP50 = calculatePercentile(bench.naiveSamplesMs, 50);
      const indexedP50 = calculatePercentile(bench.indexedSamplesMs, 50);
      const speedup = naiveP50 / Math.max(0.001, indexedP50);

      expect(Number.isFinite(naiveP50)).toBe(true);
      expect(Number.isFinite(indexedP50)).toBe(true);
      expect(Number.isNaN(naiveP50)).toBe(false);
      expect(Number.isNaN(indexedP50)).toBe(false);
      expect(naiveP50).toBeGreaterThan(0);
      expect(indexedP50).toBeGreaterThan(0);

      rounds.push({ naiveP50, indexedP50, speedup });
    }

    // Verify consistency: all 3 rounds completed with non-zero finite values
    expect(rounds.length).toBe(3);
    for (const r of rounds) {
      expect(r.naiveP50).toBeLessThan(100); // Sanity upper bound
      expect(r.indexedP50).toBeLessThan(50);
    }
  });

  it('maintains stability and positive speedup across rounds of Cart operations', () => {
    for (let r = 0; r < 3; r++) {
      const cartBench = benchmarkCartOperations(30);
      const rerenderP50 = calculatePercentile(cartBench.rerenderSamplesMs, 50);
      const atomicP50 = calculatePercentile(cartBench.atomicSamplesMs, 50);

      expect(Number.isFinite(rerenderP50)).toBe(true);
      expect(Number.isFinite(atomicP50)).toBe(true);
      expect(rerenderP50).toBeGreaterThan(atomicP50); // Atomic is strictly faster than monolithic re-render
    }
  });

  it('maintains stability and positive speedup in Kardex indexing over 3 rounds', () => {
    const kardex = generateSyntheticKardex(1000, 50);

    for (let r = 0; r < 3; r++) {
      const bench = benchmarkKardexQueries(kardex, 30);
      const scanP50 = calculatePercentile(bench.scanSamplesMs, 50);
      const idxP50 = calculatePercentile(bench.indexedSamplesMs, 50);

      expect(Number.isFinite(scanP50)).toBe(true);
      expect(Number.isFinite(idxP50)).toBe(true);
      expect(scanP50).toBeGreaterThan(idxP50); // Indexed lookup is strictly faster than full array scan
    }
  });

  it('produces zero NaN/Infinity and stable throughput in Outbox and OCC', () => {
    for (let r = 0; r < 3; r++) {
      const outbox = benchmarkOutboxInsertion(300);
      expect(outbox.opsPerSec).toBeGreaterThan(1000);
      expect(Number.isFinite(outbox.durationTotalMs)).toBe(true);

      const occ = benchmarkOccResolution(500);
      expect(occ.opsPerSec).toBeGreaterThan(10000);
      expect(occ.clientWinsCount).toBe(250);
      expect(occ.deltaMergeCount).toBe(250);
    }
  });
});
