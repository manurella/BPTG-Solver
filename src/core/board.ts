import type { Grid, Cell, Move } from './types';

export function createGrid(rows: number, cols: number, fill: Cell = null): Grid {
  return Array.from({ length: rows }, () => Array.from<Cell>({ length: cols }).fill(fill));
}

export function gridRows(grid: Grid): number {
  return grid.length;
}

export function gridCols(grid: Grid): number {
  return grid[0]?.length ?? 0;
}

export function getCell(grid: Grid, row: number, col: number): Cell {
  return grid[row]?.[col] ?? null;
}

export function inBounds(grid: Grid, row: number, col: number): boolean {
  return row >= 0 && row < gridRows(grid) && col >= 0 && col < gridCols(grid);
}

export function countBlocks(grid: Grid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== null) count++;
    }
  }
  return count;
}

export function isSolved(grid: Grid): boolean {
  return countBlocks(grid) === 0;
}

/** Returns a new grid with the cells cleared by the move set to null. */
export function applyMove(grid: Grid, move: Move): Grid {
  const next: Cell[][] = grid.map(row => [...row]);
  const [ar, ac] = move.anchor;

  for (const [dr, dc] of move.photocard.shape.cells) {
    const r = ar + dr;
    const c = ac + dc;
    if (next[r]) next[r]![c] = null;
  }

  return next;
}

/** Returns a new grid with the given cell replaced. */
export function setCell(grid: Grid, row: number, col: number, cell: Cell): Grid {
  const next: Cell[][] = grid.map(r => [...r]);
  if (next[row]) next[row]![col] = cell;
  return next;
}

/** Serialise a grid to a compact string for hashing / equality checks. */
export function gridKey(grid: Grid): string {
  return grid
    .map(row =>
      row
        .map(cell => {
          if (cell === null) return '.';
          const m = cell.member?.[0] ?? '_';
          const c = cell.color?.[0] ?? '_';
          return `${m}${c}`;
        })
        .join(''),
    )
    .join('/');
}
