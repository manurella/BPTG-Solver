import { describe, it, expect } from 'vitest';
import { isValidMove } from '../../src/core/validator';
import type { Grid, Move, Photocard } from '../../src/core/types';

const card = (overrides: Partial<Photocard> = {}): Photocard => ({
  id: 'test',
  member: 'jisoo',
  color: 'pink',
  shape: { cells: [[0, 0]] },
  points: 10,
  ...overrides,
});

const move = (photocard: Photocard, anchor: [number, number]): Move => ({
  photocard,
  anchor,
  orientationIndex: 0,
});

describe('isValidMove', () => {
  it('accepts a standard block with any card', () => {
    const grid: Grid = [[{ }]];
    expect(isValidMove(grid, move(card(), [0, 0]))).toBe(true);
  });

  it('rejects placement on an empty cell', () => {
    const grid: Grid = [[null]];
    expect(isValidMove(grid, move(card(), [0, 0]))).toBe(false);
  });

  it('rejects out-of-bounds anchor', () => {
    const grid: Grid = [[{ }]];
    expect(isValidMove(grid, move(card(), [1, 0]))).toBe(false);
    expect(isValidMove(grid, move(card(), [0, 1]))).toBe(false);
  });

  it('accepts member block when card member matches', () => {
    const grid: Grid = [[{ member: 'jisoo' }]];
    expect(isValidMove(grid, move(card({ member: 'jisoo' }), [0, 0]))).toBe(true);
  });

  it('rejects member block when card member does not match', () => {
    const grid: Grid = [[{ member: 'jennie' }]];
    expect(isValidMove(grid, move(card({ member: 'jisoo' }), [0, 0]))).toBe(false);
  });

  it('accepts color block when card color matches', () => {
    const grid: Grid = [[{ color: 'pink' }]];
    expect(isValidMove(grid, move(card({ color: 'pink' }), [0, 0]))).toBe(true);
  });

  it('rejects color block when card color does not match', () => {
    const grid: Grid = [[{ color: 'blue' }]];
    expect(isValidMove(grid, move(card({ color: 'pink' }), [0, 0]))).toBe(false);
  });

  it('requires both member and color to match when both are constrained', () => {
    const grid: Grid = [[{ member: 'lisa', color: 'green' }]];
    expect(isValidMove(grid, move(card({ member: 'lisa', color: 'green' }), [0, 0]))).toBe(true);
    expect(isValidMove(grid, move(card({ member: 'lisa', color: 'pink' }), [0, 0]))).toBe(false);
    expect(isValidMove(grid, move(card({ member: 'jisoo', color: 'green' }), [0, 0]))).toBe(false);
  });

  it('validates a multi-cell shape across the grid', () => {
    const grid: Grid = [
      [{ }, { }],
      [{ }, null],
    ];
    const domino = card({ shape: { cells: [[0, 0], [0, 1]] } });
    expect(isValidMove(grid, move(domino, [0, 0]))).toBe(true);
    expect(isValidMove(grid, move(domino, [1, 0]))).toBe(false); // [1,1] is null
  });
});
