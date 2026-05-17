import { create } from 'zustand';
import type { Solution, SolverStats } from '../../core/types';

export type SolverStatus = 'idle' | 'solving' | 'done' | 'error';

interface SolutionState {
  status: SolverStatus;
  solutions: Solution[];
  currentSolutionIndex: number;
  /** -1 = initial board state (before any moves applied). */
  currentMoveIndex: number;
  stats: SolverStats | null;
  error: string | null;

  setStatus: (s: SolverStatus) => void;
  setResult: (solutions: Solution[], stats: SolverStats) => void;
  setError: (message: string) => void;
  setSolutionIndex: (i: number) => void;
  setMoveIndex: (i: number) => void;
  stepForward: () => void;
  stepBack: () => void;
  reset: () => void;
}

export const useSolutionStore = create<SolutionState>()((set, get) => ({
  status: 'idle',
  solutions: [],
  currentSolutionIndex: 0,
  currentMoveIndex: -1,
  stats: null,
  error: null,

  setStatus: (status) => set({ status }),

  setResult: (solutions, stats) =>
    set({
      status: 'done',
      solutions,
      stats,
      currentSolutionIndex: 0,
      currentMoveIndex: -1,
      error: null,
    }),

  setError: (message) => set({ status: 'error', error: message }),

  setSolutionIndex: (i) => {
    const { solutions } = get();
    if (i >= 0 && i < solutions.length) {
      set({ currentSolutionIndex: i, currentMoveIndex: -1 });
    }
  },

  setMoveIndex: (i) => {
    const { solutions, currentSolutionIndex } = get();
    const sol = solutions[currentSolutionIndex];
    if (!sol) return;
    const clamped = Math.max(-1, Math.min(i, sol.moves.length - 1));
    set({ currentMoveIndex: clamped });
  },

  stepForward: () => {
    const { solutions, currentSolutionIndex, currentMoveIndex } = get();
    const sol = solutions[currentSolutionIndex];
    if (!sol) return;
    if (currentMoveIndex < sol.moves.length - 1) {
      set({ currentMoveIndex: currentMoveIndex + 1 });
    }
  },

  stepBack: () => {
    const { currentMoveIndex } = get();
    if (currentMoveIndex > -1) {
      set({ currentMoveIndex: currentMoveIndex - 1 });
    }
  },

  reset: () =>
    set({
      status: 'idle',
      solutions: [],
      currentSolutionIndex: 0,
      currentMoveIndex: -1,
      stats: null,
      error: null,
    }),
}));

/** Derived: the solution currently being viewed. */
export const selectCurrentSolution = (s: SolutionState): Solution | null =>
  s.solutions[s.currentSolutionIndex] ?? null;
