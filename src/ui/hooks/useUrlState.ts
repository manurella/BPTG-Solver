/**
 * Synchronises puzzle state with the URL hash so puzzles can be shared.
 * Format: /#puzzle=<base64(JSON)>
 */
import { useEffect, useCallback } from 'react';
import type { Grid, Cell, Member, CardColor } from '../../core/types';
import { usePuzzleStore } from '../store/puzzleStore';
import { findCard } from '../../data/photocards';

interface EncodedState {
  grid: (null | { m?: Member; c?: CardColor })[][];
  cardIds: string[];
  moveLimit: number;
}

function cellToEncoded(cell: Cell): null | { m?: Member; c?: CardColor } {
  if (cell === null) return null;
  const out: { m?: Member; c?: CardColor } = {};
  if (cell.member) out.m = cell.member;
  if (cell.color)  out.c = cell.color;
  return out;
}

function encodedToCell(enc: null | { m?: Member; c?: CardColor }): Cell {
  if (enc === null) return null;
  return { member: enc.m, color: enc.c };
}

export function useUrlState() {
  const setGrid       = usePuzzleStore((s) => s.setGrid);
  const addPhotocard  = usePuzzleStore((s) => s.addPhotocard);
  const setMoveLimit  = usePuzzleStore((s) => s.setMoveLimit);
  const grid          = usePuzzleStore((s) => s.grid);
  const photocards    = usePuzzleStore((s) => s.photocards);
  const moveLimit     = usePuzzleStore((s) => s.moveLimit);

  // On mount, decode URL hash and restore state
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith('puzzle=')) return;

    try {
      const encoded = decodeURIComponent(hash.slice('puzzle='.length));
      const state = JSON.parse(atob(encoded)) as EncodedState;

      const restoredGrid: Grid = state.grid.map((row) =>
        row.map((cell) => encodedToCell(cell as null | { m?: Member; c?: CardColor })),
      );
      setGrid(restoredGrid);

      for (const id of state.cardIds) {
        const card = findCard(id);
        if (card) addPhotocard(card);
      }

      setMoveLimit(state.moveLimit);
    } catch {
      // silently ignore malformed hashes
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Returns the shareable URL for the current puzzle state. */
  const getShareUrl = useCallback((): string => {
    const state: EncodedState = {
      grid: (grid as Cell[][]).map((row) => row.map(cellToEncoded)),
      cardIds: photocards.map((c) => c.id),
      moveLimit,
    };
    const encoded = encodeURIComponent(btoa(JSON.stringify(state)));
    const url = new URL(window.location.href);
    url.hash = `puzzle=${encoded}`;
    return url.toString();
  }, [grid, photocards, moveLimit]);

  return { getShareUrl };
}
