/**
 * Encodes a BPTG Schedule puzzle as an Exact Cover instance.
 *
 * Column layout:
 *   [0 .. numCells-1]   — one column per non-null block that must be cleared
 *   [numCells .. end]   — one column per photocard (ensures each used ≤ once)
 *
 * Row layout:
 *   One row per valid (photocard × orientation × anchor) triple.
 *   Each row has 1s in the cells it clears + the photocard's own column.
 */

import type { Grid, Photocard, Move } from '../types';
import { getCell, inBounds } from '../board';
import { getShapeVariants, shapeHeight, shapeWidth } from '../shapes';
import { isValidMove } from '../validator';
import { DancingLinks, type SearchStats } from './dlx';

export interface EncodedRow {
  readonly move: Move;
  /** Indices of covered cell-columns. */
  readonly cellCols: readonly number[];
  /** Index of the photocard column. */
  readonly cardCol: number;
}

export interface EncodedPuzzle {
  readonly dlx: DancingLinks;
  readonly rows: readonly EncodedRow[];
  /** Number of cell-columns (= blocks to clear). */
  readonly numCellCols: number;
  /** Total number of DLX columns. */
  readonly numCols: number;
  /** Maps "row,col" → column index for cell-columns. */
  readonly cellColIndex: ReadonlyMap<string, number>;
}

export function encodePuzzle(
  grid: Grid,
  photocards: ReadonlyArray<Photocard>,
  allowRotations = false,
  allowReflections = false,
): EncodedPuzzle {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  // --- Build cell-columns (one per non-null block) ---
  const cellColNames: string[] = [];
  const cellColIndex = new Map<string, number>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (getCell(grid, r, c) !== null) {
        const key = `${r},${c}`;
        cellColIndex.set(key, cellColNames.length);
        cellColNames.push(key);
      }
    }
  }

  const numCellCols = cellColNames.length;

  // --- Build photocard-columns (one per card) ---
  const cardColNames = photocards.map(p => `card:${p.id}`);
  const cardColIndex = new Map(photocards.map((p, i) => [p.id, numCellCols + i]));

  const numCols = numCellCols + photocards.length;
  const colNames = [...cellColNames, ...cardColNames];

  // Cell-columns are primary (must all be cleared). Card-columns are secondary
  // (each card may be used at most once, but unused cards are fine).
  const dlx = new DancingLinks(colNames, numCellCols);
  const encodedRows: EncodedRow[] = [];

  // --- Build rows ---
  for (const photocard of photocards) {
    const cardCol = cardColIndex.get(photocard.id)!;
    const variants = getShapeVariants(photocard.shape, allowRotations, allowReflections);

    for (let oi = 0; oi < variants.length; oi++) {
      const variant = variants[oi]!;
      const h = shapeHeight(variant);
      const w = shapeWidth(variant);

      const orientedCard: Photocard = { ...photocard, shape: variant };

      for (let ar = 0; ar <= rows - h; ar++) {
        for (let ac = 0; ac <= cols - w; ac++) {
          const move: Move = {
            photocard: orientedCard,
            anchor: [ar, ac] as const,
            orientationIndex: oi,
          };

          if (!isValidMove(grid, move)) continue;

          // Determine which cell-columns this move covers
          const cellCols: number[] = [];
          let valid = true;

          for (const [dr, dc] of variant.cells) {
            const r = ar + dr;
            const c = ac + dc;
            if (!inBounds(grid, r, c)) { valid = false; break; }
            const idx = cellColIndex.get(`${r},${c}`);
            if (idx === undefined) { valid = false; break; }
            cellCols.push(idx);
          }

          if (!valid) continue;

          const rowIdx = encodedRows.length;
          encodedRows.push({ move, cellCols, cardCol });
          dlx.addRow(rowIdx, [...cellCols, cardCol]);
        }
      }
    }
  }

  return { dlx, rows: encodedRows, numCellCols, numCols, cellColIndex };
}

/** Run the DLX search and return all solutions (up to maxSolutions). */
export function* solveDlx(
  encoded: EncodedPuzzle,
  maxSolutions = Infinity,
  stats: SearchStats = { nodesExplored: 0 },
): Generator<readonly Move[]> {
  for (const rowIndices of encoded.dlx.search(maxSolutions, stats)) {
    yield rowIndices.map(i => encoded.rows[i]!.move);
  }
}
