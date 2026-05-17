import { create } from 'zustand';
import type { Grid, Cell, Photocard, Puzzle } from '../../core/types';
import { createGrid, setCell as boardSetCell } from '../../core/board';

interface PuzzleState {
  grid: Grid;
  photocards: Photocard[];
  moveLimit: number;

  setGrid: (grid: Grid) => void;
  setCell: (row: number, col: number, cell: Cell) => void;
  addPhotocard: (card: Photocard) => void;
  removePhotocard: (id: string) => void;
  togglePhotocard: (card: Photocard) => void;
  setMoveLimit: (n: number) => void;
  loadPuzzle: (puzzle: Puzzle) => void;
  resizeGrid: (rows: number, cols: number) => void;
  fillGrid: () => void;
  clearGrid: () => void;
}

export const usePuzzleStore = create<PuzzleState>()((set, get) => ({
  grid: createGrid(4, 4, {}),
  photocards: [],
  moveLimit: 4,

  setGrid: (grid) => set({ grid }),

  setCell: (row, col, cell) =>
    set({ grid: boardSetCell(get().grid, row, col, cell) }),

  addPhotocard: (card) =>
    set((s) => ({
      photocards: s.photocards.some((c) => c.id === card.id)
        ? s.photocards
        : [...s.photocards, card],
    })),

  removePhotocard: (id) =>
    set((s) => ({ photocards: s.photocards.filter((c) => c.id !== id) })),

  togglePhotocard: (card) => {
    const { photocards } = get();
    if (photocards.some((c) => c.id === card.id)) {
      set({ photocards: photocards.filter((c) => c.id !== card.id) });
    } else {
      set({ photocards: [...photocards, card] });
    }
  },

  setMoveLimit: (moveLimit) => set({ moveLimit }),

  loadPuzzle: (puzzle) =>
    set({
      grid: puzzle.grid,
      photocards: [...puzzle.photocards],
      moveLimit: puzzle.moveLimit,
    }),

  resizeGrid: (rows, cols) => set({ grid: createGrid(rows, cols) }),

  fillGrid: () => {
    const { grid } = get();
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    set({ grid: createGrid(rows, cols, {}) });
  },

  clearGrid: () => {
    const { grid } = get();
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    set({ grid: createGrid(rows, cols, null) });
  },
}));
