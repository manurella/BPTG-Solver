import type { Solution, Puzzle } from './types';

/** Compute the star rating for a given number of moves used. */
export function computeStars(movesUsed: number, puzzle: Puzzle): 1 | 2 | 3 {
  const three = puzzle.threeStarThreshold ?? puzzle.moveLimit - 2;
  const two = puzzle.twoStarThreshold ?? puzzle.moveLimit - 1;

  if (movesUsed <= three) return 3;
  if (movesUsed <= two) return 2;
  return 1;
}

/** Total points accumulated by a solution's photocards. */
export function totalPoints(solution: Solution): number {
  return solution.moves.reduce((sum, m) => sum + m.photocard.points, 0);
}

/**
 * Comparison function for sorting solutions best-first.
 * Priority: stars DESC → moves used ASC → total points DESC.
 */
export function compareSolutions(a: Solution, b: Solution): number {
  if (b.stars !== a.stars) return b.stars - a.stars;
  if (a.moves.length !== b.moves.length) return a.moves.length - b.moves.length;
  return b.totalPoints - a.totalPoints;
}

/** Pick the single best solution from a list. Returns null if empty. */
export function pickOptimal(solutions: ReadonlyArray<Solution>): Solution | null {
  if (solutions.length === 0) return null;
  return [...solutions].sort(compareSolutions)[0] ?? null;
}
