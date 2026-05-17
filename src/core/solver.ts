/**
 * Public solver API.
 *
 * Encodes the puzzle into a DLX exact-cover instance, runs Algorithm X,
 * filters solutions by move limit, attaches star ratings, and returns them
 * ranked best-first.
 */

import type { Puzzle, Solution, SolverOptions, SolverResult } from './types';
import type { SearchStats } from './dlx/dlx';
import { encodePuzzle, solveDlx } from './dlx/encoder';
import { computeStars, compareSolutions, pickOptimal } from './analyzer';

export function solve(puzzle: Puzzle, options: SolverOptions = {}): SolverResult {
  const {
    maxSolutions = Infinity,
    allowRotations = false,
    allowReflections = false,
  } = options;

  const startMs = performance.now();
  const stats: SearchStats = { nodesExplored: 0 };

  const encoded = encodePuzzle(
    puzzle.grid,
    puzzle.photocards,
    allowRotations,
    allowReflections,
  );

  const solutions: Solution[] = [];

  for (const moves of solveDlx(encoded, maxSolutions, stats)) {
    // Respect the move limit
    if (moves.length > puzzle.moveLimit) continue;

    const stars = computeStars(moves.length, puzzle);
    const totalPoints = moves.reduce((s, m) => s + m.photocard.points, 0);
    solutions.push({ moves, stars, totalPoints });
  }

  solutions.sort(compareSolutions);

  return {
    solutions,
    optimal: pickOptimal(solutions),
    stats: {
      nodesExplored: stats.nodesExplored,
      solutionsFound: solutions.length,
      elapsedMs: performance.now() - startMs,
    },
  };
}
