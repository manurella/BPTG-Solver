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

/**
 * Hard cap on solutions explored. Symmetric boards (e.g. identical cards on
 * an unconstrained grid) can have factorial-many solutions; without a cap the
 * DLX search runs forever and the postMessage payload becomes enormous.
 */
const MAX_SOLUTIONS_DEFAULT = 200;

export function solve(puzzle: Puzzle, options: SolverOptions = {}): SolverResult {
  const {
    maxSolutions = MAX_SOLUTIONS_DEFAULT,
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
  let rawSolutionsVisited = 0;

  for (const moves of solveDlx(encoded, maxSolutions, stats)) {
    rawSolutionsVisited++;
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
      candidateMoves: encoded.rows.length,
      primaryColumns: encoded.numCellCols,
      secondaryColumns: encoded.numCols - encoded.numCellCols,
      resultCap: maxSolutions,
      resultCapReached: rawSolutionsVisited >= maxSolutions,
    },
  };
}
