import { useEffect, useRef, useCallback } from 'react';
import type { Puzzle, SolverOptions, SolverResult, SolverStats } from '../../core/types';
import { useSolutionStore } from '../store/solutionStore';

interface ResultMessage { type: 'result'; result: SolverResult }
interface ErrorMessage  { type: 'error';  message: string }
type WorkerMessage = ResultMessage | ErrorMessage;

export function useSolver() {
  const workerRef = useRef<Worker | null>(null);
  const setStatus  = useSolutionStore((s) => s.setStatus);
  const setResult  = useSolutionStore((s) => s.setResult);
  const setError   = useSolutionStore((s) => s.setError);

  useEffect(() => {
    const worker = new Worker(
      new URL('../../worker/solver.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      if (e.data.type === 'result') {
        const { solutions, stats } = e.data.result;
        setResult([...solutions], stats as SolverStats);
      } else {
        setError(e.data.message);
      }
    };

    worker.onerror = (e) => setError(e.message);
    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = useCallback(
    (puzzle: Puzzle, options: SolverOptions = {}) => {
      setStatus('solving');
      workerRef.current?.postMessage({ puzzle, options } satisfies { puzzle: Puzzle; options: SolverOptions });
    },
    [setStatus],
  );

  return { solve: run };
}
