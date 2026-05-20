import type { Grid, Photocard } from './types';
import { encodePuzzle } from './dlx/encoder';

export interface PuzzleDiagnostics {
  readonly rows: number;
  readonly cols: number;
  readonly blocks: number;
  readonly standardBlocks: number;
  readonly memberBlocks: number;
  readonly colorBlocks: number;
  readonly combinedBlocks: number;
  readonly selectedCards: number;
  readonly totalCardArea: number;
  readonly candidateMoves: number;
  readonly primaryColumns: number;
  readonly secondaryColumns: number;
  readonly matrixDensity: number;
  readonly warnings: readonly string[];
}

export function analyzePuzzle(grid: Grid, photocards: ReadonlyArray<Photocard>): PuzzleDiagnostics {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const cells = grid.flat();
  const blocks = cells.filter((cell) => cell !== null);
  const standardBlocks = blocks.filter((cell) => cell.member === undefined && cell.color === undefined).length;
  const memberBlocks = blocks.filter((cell) => cell.member !== undefined && cell.color === undefined).length;
  const colorBlocks = blocks.filter((cell) => cell.member === undefined && cell.color !== undefined).length;
  const combinedBlocks = blocks.filter((cell) => cell.member !== undefined && cell.color !== undefined).length;
  const totalCardArea = photocards.reduce((sum, card) => sum + card.shape.cells.length, 0);
  const warnings: string[] = [];

  if (blocks.length === 0) warnings.push('Board has no blocks to clear.');
  if (photocards.length === 0) warnings.push('No photocards selected.');
  if (totalCardArea < blocks.length) warnings.push('Selected cards do not cover enough total area.');
  if (grid.some((row) => row.length !== cols)) warnings.push('Grid is not rectangular.');

  let candidateMoves = 0;
  let primaryColumns = blocks.length;
  let secondaryColumns = photocards.length;
  let matrixDensity = 0;

  try {
    const encoded = encodePuzzle(grid, photocards);
    candidateMoves = encoded.rows.length;
    primaryColumns = encoded.numCellCols;
    secondaryColumns = encoded.numCols - encoded.numCellCols;
    const ones = encoded.rows.reduce((sum, row) => sum + row.cellCols.length + 1, 0);
    matrixDensity = encoded.rows.length > 0 && encoded.numCols > 0
      ? ones / (encoded.rows.length * encoded.numCols)
      : 0;
    if (candidateMoves === 0 && blocks.length > 0 && photocards.length > 0) {
      warnings.push('No legal placements exist for the current board and card set.');
    }
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : String(error));
  }

  return {
    rows,
    cols,
    blocks: blocks.length,
    standardBlocks,
    memberBlocks,
    colorBlocks,
    combinedBlocks,
    selectedCards: photocards.length,
    totalCardArea,
    candidateMoves,
    primaryColumns,
    secondaryColumns,
    matrixDensity,
    warnings,
  };
}
