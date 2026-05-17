import { describe, it, expect } from 'vitest';
import { solve } from '../../src/core/solver';
import type { Puzzle } from '../../src/core/types';

/** 2×2 board fully filled with standard blocks. Two I-domino cards clear it in 2 moves. */
const simplePuzzle: Puzzle = {
  grid: [
    [{ }, { }],
    [{ }, { }],
  ],
  photocards: [
    { id: 'h1', member: 'jisoo', color: 'pink', points: 10, shape: { cells: [[0,0],[0,1]] } },
    { id: 'h2', member: 'jennie', color: 'yellow', points: 10, shape: { cells: [[0,0],[0,1]] } },
  ],
  moveLimit: 2,
};

describe('solve — simple 2×2 board', () => {
  it('finds at least one solution', () => {
    const result = solve(simplePuzzle);
    expect(result.solutions.length).toBeGreaterThan(0);
  });

  it('each solution uses exactly 2 moves', () => {
    const result = solve(simplePuzzle);
    for (const sol of result.solutions) {
      expect(sol.moves).toHaveLength(2);
    }
  });

  it('optimal solution is defined', () => {
    expect(solve(simplePuzzle).optimal).not.toBeNull();
  });

  it('solution moves cover all 4 blocks (no overlap, full coverage)', () => {
    const result = solve(simplePuzzle);
    const sol = result.optimal!;
    const covered = new Set<string>();
    for (const m of sol.moves) {
      for (const [dr, dc] of m.photocard.shape.cells) {
        const [ar, ac] = m.anchor;
        covered.add(`${ar + dr},${ac + dc}`);
      }
    }
    expect(covered.size).toBe(4);
    expect(covered).toContain('0,0');
    expect(covered).toContain('0,1');
    expect(covered).toContain('1,0');
    expect(covered).toContain('1,1');
  });
});

describe('solve — member constraint', () => {
  it('only uses the correct member card on a member-constrained block', () => {
    const puzzle: Puzzle = {
      grid: [[{ member: 'lisa' }]],
      photocards: [
        { id: 'wrong', member: 'jisoo', color: 'pink', points: 5, shape: { cells: [[0,0]] } },
        { id: 'right', member: 'lisa',  color: 'green', points: 5, shape: { cells: [[0,0]] } },
      ],
      moveLimit: 1,
    };
    const result = solve(puzzle);
    expect(result.solutions).toHaveLength(1);
    expect(result.optimal?.moves[0]?.photocard.id).toBe('right');
  });
});

describe('solve — unsolvable puzzle', () => {
  it('returns no solutions when board cannot be cleared', () => {
    const puzzle: Puzzle = {
      grid: [[{ member: 'rose' }]],
      photocards: [
        { id: 'bad', member: 'jisoo', color: 'pink', points: 5, shape: { cells: [[0,0]] } },
      ],
      moveLimit: 1,
    };
    expect(solve(puzzle).solutions).toHaveLength(0);
    expect(solve(puzzle).optimal).toBeNull();
  });
});

describe('solve — move limit respected', () => {
  it('returns no solutions when all valid solutions exceed moveLimit', () => {
    // Board needs 2 moves but limit is 1
    const puzzle: Puzzle = {
      grid: [[{ }, { }], [{ }, { }]],
      photocards: [
        { id: 'a', member: 'jisoo', color: 'pink', points: 5, shape: { cells: [[0,0],[0,1]] } },
        { id: 'b', member: 'jennie', color: 'yellow', points: 5, shape: { cells: [[0,0],[0,1]] } },
      ],
      moveLimit: 1,
    };
    expect(solve(puzzle).solutions).toHaveLength(0);
  });
});

describe('solve — star rating', () => {
  it('awards 3 stars when moves used ≤ threeStarThreshold', () => {
    const puzzle: Puzzle = { ...simplePuzzle, threeStarThreshold: 2, twoStarThreshold: 3, moveLimit: 4 };
    const result = solve(puzzle);
    expect(result.optimal?.stars).toBe(3);
  });

  it('awards 1 star when moves used equals moveLimit', () => {
    const puzzle: Puzzle = { ...simplePuzzle, threeStarThreshold: 0, twoStarThreshold: 1, moveLimit: 2 };
    const result = solve(puzzle);
    expect(result.optimal?.stars).toBe(1);
  });
});

describe('solve — stats', () => {
  it('reports nodesExplored > 0', () => {
    expect(solve(simplePuzzle).stats.nodesExplored).toBeGreaterThan(0);
  });

  it('reports elapsedMs as a non-negative number', () => {
    expect(solve(simplePuzzle).stats.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
