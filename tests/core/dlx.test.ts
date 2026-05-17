import { describe, it, expect } from 'vitest';
import { DancingLinks } from '../../src/core/dlx/dlx';

/**
 * Knuth's canonical exact cover example (Figure 3, "Dancing Links", 2000).
 *
 * Universe: {1, 2, 3, 4, 5, 6, 7}
 * Rows:
 *   A = {1, 4, 7}
 *   B = {1, 4}
 *   C = {4, 5, 7}
 *   D = {3, 5, 6}
 *   E = {2, 3, 6, 7}
 *   F = {2, 7}
 *
 * Unique exact cover: {B, D, F} = {1,4} ∪ {3,5,6} ∪ {2,7} = {1..7}
 */
describe('DancingLinks — Knuth Figure 3', () => {
  function buildKnuth(): DancingLinks {
    const dlx = new DancingLinks(['1', '2', '3', '4', '5', '6', '7']);
    dlx.addRow(0, [0, 3, 6]);       // A: cols 1,4,7
    dlx.addRow(1, [0, 3]);          // B: cols 1,4
    dlx.addRow(2, [3, 4, 6]);       // C: cols 4,5,7
    dlx.addRow(3, [2, 4, 5]);       // D: cols 3,5,6
    dlx.addRow(4, [1, 2, 5, 6]);    // E: cols 2,3,6,7
    dlx.addRow(5, [1, 6]);          // F: cols 2,7
    return dlx;
  }

  it('finds exactly one solution', () => {
    const solutions = [...buildKnuth().search()];
    expect(solutions).toHaveLength(1);
  });

  it('solution is rows B, D, F (indices 1, 3, 5)', () => {
    const [solution] = [...buildKnuth().search()];
    expect(solution?.slice().sort((a, b) => a - b)).toEqual([1, 3, 5]);
  });

  it('respects maxSolutions = 1 and still returns a valid solution', () => {
    const solutions = [...buildKnuth().search(1)];
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toEqual(expect.arrayContaining([1, 3, 5]));
  });
});

describe('DancingLinks — edge cases', () => {
  it('empty matrix (0 columns) yields one empty solution', () => {
    const dlx = new DancingLinks([]);
    const solutions = [...dlx.search()];
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toEqual([]);
  });

  it('unsatisfiable matrix yields no solutions', () => {
    // Column 0 exists but no rows cover it → impossible
    const dlx = new DancingLinks(['A', 'B']);
    dlx.addRow(0, [1]); // covers only B
    const solutions = [...dlx.search()];
    expect(solutions).toHaveLength(0);
  });

  it('multiple solutions are all returned', () => {
    // Universe {A, B}: rows [A], [B], [A,B]
    // Covers: {[A],[B]} and {[A,B]}
    const dlx = new DancingLinks(['A', 'B']);
    dlx.addRow(0, [0]);      // covers A
    dlx.addRow(1, [1]);      // covers B
    dlx.addRow(2, [0, 1]);   // covers A and B
    const solutions = [...dlx.search()];
    expect(solutions).toHaveLength(2);
  });

  it('nodesExplored counter increments', () => {
    const dlx = new DancingLinks(['A']);
    dlx.addRow(0, [0]);
    const stats = { nodesExplored: 0 };
    [...dlx.search(Infinity, stats)];
    expect(stats.nodesExplored).toBeGreaterThan(0);
  });
});
