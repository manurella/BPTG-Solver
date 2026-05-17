import type { Grid, Move, Photocard } from './types';
import { inBounds, getCell } from './board';
import { getShapeVariants, shapeHeight, shapeWidth } from './shapes';

/** Returns true if placing this move on the grid is legal. */
export function isValidMove(grid: Grid, move: Move): boolean {
  const [ar, ac] = move.anchor;
  const { photocard } = move;

  for (const [dr, dc] of photocard.shape.cells) {
    const r = ar + dr;
    const c = ac + dc;

    if (!inBounds(grid, r, c)) return false;

    const cell = getCell(grid, r, c);

    // Cell must contain a block (non-null)
    if (cell === null) return false;

    // Member constraint: block requires a specific member
    if (cell.member !== undefined && cell.member !== photocard.member) return false;

    // Color constraint: block requires a specific color
    if (cell.color !== undefined && cell.color !== photocard.color) return false;
  }

  return true;
}

/**
 * Enumerates every valid (photocard × orientation × anchor) move for the
 * current grid state, excluding photocards listed in usedIds.
 */
export function enumerateMoves(
  grid: Grid,
  photocards: ReadonlyArray<Photocard>,
  usedIds: ReadonlySet<string>,
  allowRotations = false,
  allowReflections = false,
): Move[] {
  const moves: Move[] = [];
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  for (const photocard of photocards) {
    if (usedIds.has(photocard.id)) continue;

    const variants = getShapeVariants(photocard.shape, allowRotations, allowReflections);

    for (let oi = 0; oi < variants.length; oi++) {
      const variant = variants[oi]!;
      const h = shapeHeight(variant);
      const w = shapeWidth(variant);

      // Use variant's cells as the shape for this orientation
      const oriented: Photocard = { ...photocard, shape: variant };

      for (let ar = 0; ar <= rows - h; ar++) {
        for (let ac = 0; ac <= cols - w; ac++) {
          const move: Move = { photocard: oriented, anchor: [ar, ac], orientationIndex: oi };
          if (isValidMove(grid, move)) moves.push(move);
        }
      }
    }
  }

  return moves;
}
