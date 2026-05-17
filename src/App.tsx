import { useMemo } from 'react';
import BoardEditor from './ui/components/BoardEditor';
import PhotocardPanel from './ui/components/PhotocardPanel';
import SolutionPlayer from './ui/components/SolutionPlayer';
import { usePuzzleStore } from './ui/store/puzzleStore';
import { useSolutionStore, selectCurrentSolution } from './ui/store/solutionStore';
import { useSolver } from './ui/hooks/useSolver';
import { PRESET_PUZZLES } from './data/puzzles';

const GRID_SIZES = [
  { label: '3×3', rows: 3, cols: 3 },
  { label: '4×4', rows: 4, cols: 4 },
  { label: '4×6', rows: 4, cols: 6 },
  { label: '5×5', rows: 5, cols: 5 },
  { label: '6×7', rows: 6, cols: 7 },
];

function getClearedAndActiveCells(
  solution: ReturnType<typeof selectCurrentSolution>,
  currentMoveIndex: number,
): { cleared: ReadonlySet<string>; active: ReadonlySet<string> } {
  if (!solution) return { cleared: new Set(), active: new Set() };

  const cleared = new Set<string>();
  for (let i = 0; i < currentMoveIndex; i++) {
    const move = solution.moves[i];
    if (!move) continue;
    const [ar, ac] = move.anchor;
    for (const [dr, dc] of move.photocard.shape.cells) {
      cleared.add(`${ar + dr},${ac + dc}`);
    }
  }

  const active = new Set<string>();
  const cur = solution.moves[currentMoveIndex];
  if (cur) {
    const [ar, ac] = cur.anchor;
    for (const [dr, dc] of cur.photocard.shape.cells) {
      active.add(`${ar + dr},${ac + dc}`);
    }
  }

  return { cleared, active };
}

export default function App() {
  const { solve }          = useSolver();
  const grid               = usePuzzleStore((s) => s.grid);
  const photocards         = usePuzzleStore((s) => s.photocards);
  const moveLimit          = usePuzzleStore((s) => s.moveLimit);
  const setMoveLimit       = usePuzzleStore((s) => s.setMoveLimit);
  const loadPuzzle         = usePuzzleStore((s) => s.loadPuzzle);
  const resizeGrid         = usePuzzleStore((s) => s.resizeGrid);
  const fillGrid           = usePuzzleStore((s) => s.fillGrid);
  const clearGrid          = usePuzzleStore((s) => s.clearGrid);
  const status             = useSolutionStore((s) => s.status);
  const currentMoveIndex   = useSolutionStore((s) => s.currentMoveIndex);
  const solution           = useSolutionStore(selectCurrentSolution);
  const reset              = useSolutionStore((s) => s.reset);

  const { cleared, active } = useMemo(
    () => getClearedAndActiveCells(solution, currentMoveIndex),
    [solution, currentMoveIndex],
  );

  const isSolving   = status === 'solving';
  const hasSolution = status === 'done';
  const isPlaying   = hasSolution && currentMoveIndex >= 0;

  function handleSolve() {
    reset();
    solve({ grid, photocards, moveLimit });
  }

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--color-bp-black)' }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        className="flex shrink-0 items-center justify-between border-b px-6 py-3"
        style={{ borderColor: 'var(--color-bp-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-10 rounded-full" style={{ backgroundColor: 'var(--color-bp-pink)' }} />
          <h1 className="text-lg font-black tracking-tight" style={{ color: 'var(--color-bp-text)' }}>
            BPTG <span style={{ color: 'var(--color-bp-pink)' }}>Schedule</span> Solver
          </h1>
        </div>

        {/* Preset selector */}
        <select
          onChange={(e) => {
            const p = PRESET_PUZZLES.find((x) => x.id === e.target.value);
            if (p) { reset(); loadPuzzle(p); }
          }}
          defaultValue=""
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{
            backgroundColor: 'var(--color-bp-surface)',
            borderColor: 'var(--color-bp-border)',
            color: 'var(--color-bp-text)',
          }}
        >
          <option value="" disabled>Load preset…</option>
          {PRESET_PUZZLES.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* Left: Photocard panel */}
        <aside
          className="w-56 shrink-0 overflow-y-auto border-r"
          style={{ borderColor: 'var(--color-bp-border)' }}
        >
          <PhotocardPanel />
        </aside>

        {/* Center: Board + controls */}
        <main className="flex flex-1 flex-col items-center justify-center gap-5 overflow-auto p-6">
          <BoardEditor
            activeCells={active}
            clearedCells={cleared}
            readonly={isSolving || isPlaying}
          />

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Grid size */}
            <select
              onChange={(e) => {
                const [r, c] = e.target.value.split('×').map(Number);
                if (r && c) { reset(); resizeGrid(r, c); }
              }}
              className="rounded-lg border px-2 py-1.5 text-xs"
              style={{
                backgroundColor: 'var(--color-bp-surface)',
                borderColor: 'var(--color-bp-border)',
                color: 'var(--color-bp-text)',
              }}
            >
              {GRID_SIZES.map(({ label, rows, cols }) => (
                <option key={label} value={`${rows}×${cols}`}>{label}</option>
              ))}
            </select>

            {/* Fill / Clear */}
            <button
              onClick={() => { reset(); fillGrid(); }}
              className="rounded-lg border px-3 py-1.5 text-xs"
              style={{ borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-muted)' }}
            >
              Fill all
            </button>
            <button
              onClick={() => { reset(); clearGrid(); }}
              className="rounded-lg border px-3 py-1.5 text-xs"
              style={{ borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-muted)' }}
            >
              Clear board
            </button>

            {/* Move limit */}
            <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-bp-muted)' }}>
              Moves
              <input
                type="number"
                min={1}
                max={20}
                value={moveLimit}
                onChange={(e) => setMoveLimit(Number(e.target.value))}
                className="w-12 rounded border px-1.5 py-1 text-center text-xs"
                style={{
                  backgroundColor: 'var(--color-bp-surface)',
                  borderColor: 'var(--color-bp-border)',
                  color: 'var(--color-bp-text)',
                }}
              />
            </label>

            {/* Solve */}
            <button
              onClick={handleSolve}
              disabled={isSolving || photocards.length === 0}
              className="rounded-lg px-5 py-1.5 text-sm font-bold disabled:opacity-40 transition-opacity"
              style={{ backgroundColor: 'var(--color-bp-pink)', color: '#fff' }}
            >
              {isSolving ? 'Solving…' : 'Solve ▶'}
            </button>
          </div>

          {/* Card count hint */}
          {photocards.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>
              Select photocards from the left panel, or load a preset puzzle above.
            </p>
          )}
        </main>

        {/* Right: Solution player */}
        <aside
          className="w-72 shrink-0 overflow-y-auto border-l"
          style={{ borderColor: 'var(--color-bp-border)' }}
        >
          <SolutionPlayer />
        </aside>
      </div>
    </div>
  );
}
