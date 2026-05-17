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

self.addEventListener('message', (event: MessageEvent<SolveRequest>) => {
  const { puzzle, options } = event.data;
  try {
    const result = solve(puzzle, options);
    self.postMessage({ type: 'result', result } satisfies ResultMessage);
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) } satisfies ErrorMessage);
  }
});
