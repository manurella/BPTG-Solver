import { solve } from '../core/solver';
import type { Puzzle, SolverOptions, SolverResult } from '../core/types';

interface SolveRequest {
  puzzle: Puzzle;
  options: SolverOptions;
}

interface ResultMessage {
  type: 'result';
  result: SolverResult;
}

interface ErrorMessage {
  type: 'error';
  message: string;
}

/**
 * Maximum number of solutions sent back via postMessage.
 * Structured-clone serialises the full solution graph; beyond ~100 entries
 * on complex boards the payload size causes a DataCloneError (OOM).
 * The solver itself is already capped at 200 by default; here we keep only
 * the best 100 (already sorted best-first) for the UI.
 */
const POST_MESSAGE_SOLUTION_CAP = 100;

self.addEventListener('message', (event: MessageEvent<SolveRequest>) => {
  const { puzzle, options } = event.data;
  try {
    const result = solve(puzzle, options);

    const trimmed: SolverResult = {
      ...result,
      solutions: result.solutions.slice(0, POST_MESSAGE_SOLUTION_CAP),
    };

    self.postMessage({ type: 'result', result: trimmed } satisfies ResultMessage);
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) } satisfies ErrorMessage);
  }
});
