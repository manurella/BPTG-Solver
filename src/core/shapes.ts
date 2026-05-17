import type { Shape } from './types';

type RawCells = [number, number][];

function normalizeRaw(cells: RawCells): RawCells {
  const minRow = Math.min(...cells.map(([r]) => r));
  const minCol = Math.min(...cells.map(([, c]) => c));
  return cells
    .map(([r, c]) => [r - minRow, c - minCol] as [number, number])
    .sort(([r1, c1], [r2, c2]) => r1 - r2 || c1 - c2);
}

function rotateCW(cells: RawCells): RawCells {
  return normalizeRaw(cells.map(([r, c]) => [c, -r]));
}

function flipHorizontal(cells: RawCells): RawCells {
  return normalizeRaw(cells.map(([r, c]) => [r, -c]));
}

function cellsKey(cells: RawCells): string {
  return cells.map(([r, c]) => `${r},${c}`).join('|');
}

/**
 * Returns all unique orientations for a shape (rotations × reflections).
 * With both flags false, returns only the canonical orientation.
 */
export function getShapeVariants(
  shape: Shape,
  allowRotations = false,
  allowReflections = false,
): Shape[] {
  const seen = new Set<string>();
  const result: Shape[] = [];

  const mutable = shape.cells.map(([r, c]) => [r, c] as [number, number]);
  let current: RawCells = normalizeRaw(mutable);
  const orientationCount = allowRotations ? 4 : 1;

  for (let i = 0; i < orientationCount; i++) {
    const norm = normalizeRaw([...current]);
    const key = cellsKey(norm);
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ cells: norm });
    }

    if (allowReflections) {
      const flipped = flipHorizontal([...current]);
      const flippedKey = cellsKey(flipped);
      if (!seen.has(flippedKey)) {
        seen.add(flippedKey);
        result.push({ cells: flipped });
      }
    }

    current = rotateCW([...current]);
  }

  return result;
}

export function shapeHeight(shape: Shape): number {
  return Math.max(...shape.cells.map(([r]) => r)) + 1;
}

export function shapeWidth(shape: Shape): number {
  return Math.max(...shape.cells.map(([, c]) => c)) + 1;
}

/**
 * Canonical shape library.
 * Cells are defined in their natural orientation (top-left origin, row-major order).
 */
export const SHAPE_DEFS = {
  // 1-cell
  DOT: { cells: [[0, 0]] },

  // 2-cell
  DOMINO_H: { cells: [[0, 0], [0, 1]] },
  DOMINO_V: { cells: [[0, 0], [1, 0]] },

  // 3-cell (triominoes)
  I3: { cells: [[0, 0], [0, 1], [0, 2]] },
  L3: { cells: [[0, 0], [1, 0], [1, 1]] },

  // 4-cell (tetrominoes)
  I4: { cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  O:  { cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  T:  { cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  S:  { cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
  Z:  { cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
  L4: { cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  J4: { cells: [[0, 1], [1, 1], [2, 0], [2, 1]] },

  // 5-cell (pentominoes — harder levels)
  I5: { cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
  L5: { cells: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]] },
  P5: { cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
  N5: { cells: [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1]] },
  U5: { cells: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]] },
} satisfies Record<string, Shape>;

export type ShapeName = keyof typeof SHAPE_DEFS;
