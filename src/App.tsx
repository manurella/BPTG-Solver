import { useMemo, useEffect, useState, useCallback } from 'react';
import BoardEditor from './ui/components/BoardEditor';
import PhotocardPanel from './ui/components/PhotocardPanel';
import SolutionPlayer from './ui/components/SolutionPlayer';
import AlgorithmViz from './ui/components/AlgorithmViz';
import { usePuzzleStore } from './ui/store/puzzleStore';
import { useSolutionStore, selectCurrentSolution } from './ui/store/solutionStore';
import { useSolver } from './ui/hooks/useSolver';
import { useUrlState } from './ui/hooks/useUrlState';
import { PRESET_PUZZLES } from './data/puzzles';

// ── Types ────────────────────────────────────────────────────────────────────

type MobileTab   = 'cards' | 'board' | 'solution';
type RightPanel  = 'solution' | 'algorithm';

const GRID_SIZES = [
  { label: '3×3', rows: 3, cols: 3 },
  { label: '4×4', rows: 4, cols: 4 },
  { label: '4×6', rows: 4, cols: 6 },
  { label: '5×5', rows: 5, cols: 5 },
  { label: '6×7', rows: 6, cols: 7 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getClearedAndActiveCells(
  solution: ReturnType<typeof selectCurrentSolution>,
  currentMoveIndex: number,
) {
  if (!solution) return { cleared: new Set<string>(), active: new Set<string>() };

  const cleared = new Set<string>();
  for (let i = 0; i < currentMoveIndex; i++) {
    const move = solution.moves[i];
    if (!move) continue;
    const [ar, ac] = move.anchor;
    for (const [dr, dc] of move.photocard.shape.cells) cleared.add(`${ar + dr},${ac + dc}`);
  }

  const active = new Set<string>();
  const cur = solution.moves[currentMoveIndex];
  if (cur) {
    const [ar, ac] = cur.anchor;
    for (const [dr, dc] of cur.photocard.shape.cells) active.add(`${ar + dr},${ac + dc}`);
  }

  return { cleared, active };
}

// ── BoardPanel (separate component to avoid JSX-variable-in-two-trees issue) ─

interface BoardPanelProps {
  cleared:   ReadonlySet<string>;
  active:    ReadonlySet<string>;
  isSolving: boolean;
  isPlaying: boolean;
  onSolve:   () => void;
}

function BoardPanel({ cleared, active, isSolving, isPlaying, onSolve }: BoardPanelProps) {
  const photocards  = usePuzzleStore((s) => s.photocards);
  const moveLimit   = usePuzzleStore((s) => s.moveLimit);
  const setMoveLimit = usePuzzleStore((s) => s.setMoveLimit);
  const resizeGrid  = usePuzzleStore((s) => s.resizeGrid);
  const fillGrid    = usePuzzleStore((s) => s.fillGrid);
  const clearGrid   = usePuzzleStore((s) => s.clearGrid);
  const reset       = useSolutionStore((s) => s.reset);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 overflow-auto p-4 md:p-6">
      <BoardEditor
        activeCells={active}
        clearedCells={cleared}
        readonly={isSolving || isPlaying}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <select
          onChange={(e) => {
            const [r, c] = e.target.value.split('×').map(Number);
            if (r && c) { reset(); resizeGrid(r, c); }
          }}
          className="rounded-lg border px-2 py-1.5 text-xs"
          style={{ backgroundColor: 'var(--color-bp-surface)', borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-text)' }}>
          {GRID_SIZES.map(({ label, rows, cols }) => (
            <option key={label} value={`${rows}×${cols}`}>{label}</option>
          ))}
        </select>

        <button onClick={() => { reset(); fillGrid(); }}
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{ borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-muted)' }}>
          Fill all
        </button>
        <button onClick={() => { reset(); clearGrid(); }}
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{ borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-muted)' }}>
          Clear board
        </button>

        <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-bp-muted)' }}>
          Moves
          <input type="number" min={1} max={20} value={moveLimit}
            onChange={(e) => setMoveLimit(Number(e.target.value))}
            className="w-12 rounded border px-1.5 py-1 text-center text-xs"
            style={{ backgroundColor: 'var(--color-bp-surface)', borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-text)' }} />
        </label>

        <button onClick={onSolve} disabled={isSolving || photocards.length === 0}
          className="rounded-lg px-5 py-1.5 text-sm font-bold disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: 'var(--color-bp-pink)', color: '#fff' }}>
          {isSolving ? 'Solving…' : 'Solve ▶'}
        </button>
      </div>

      {photocards.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>
          Select photocards from the panel, or load a preset above.
        </p>
      )}
    </main>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { solve }        = useSolver();
  const { getShareUrl }  = useUrlState();

  const [mobileTab,   setMobileTab]   = useState<MobileTab>('board');
  const [rightPanel,  setRightPanel]  = useState<RightPanel>('solution');
  const [copied,      setCopied]      = useState(false);

  const grid       = usePuzzleStore((s) => s.grid);
  const photocards = usePuzzleStore((s) => s.photocards);
  const moveLimit  = usePuzzleStore((s) => s.moveLimit);
  const loadPuzzle = usePuzzleStore((s) => s.loadPuzzle);

  const status           = useSolutionStore((s) => s.status);
  const currentMoveIndex = useSolutionStore((s) => s.currentMoveIndex);
  const solution         = useSolutionStore(selectCurrentSolution);
  const reset            = useSolutionStore((s) => s.reset);
  const stepForward      = useSolutionStore((s) => s.stepForward);
  const stepBack         = useSolutionStore((s) => s.stepBack);
  const setMoveIndex     = useSolutionStore((s) => s.setMoveIndex);

  const { cleared, active } = useMemo(
    () => getClearedAndActiveCells(solution, currentMoveIndex),
    [solution, currentMoveIndex],
  );

  const isSolving = status === 'solving';
  const isPlaying = status === 'done' && currentMoveIndex >= 0;

  function handleSolve() {
    reset();
    solve({ grid, photocards, moveLimit });
    setMobileTab('solution');
    setRightPanel('solution');
  }

  async function handleShare() {
    const url = getShareUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); stepForward(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); stepBack(); }
      if (e.key === 'Home')       { e.preventDefault(); setMoveIndex(-1); }
      if (e.key === 'End' && solution) {
        e.preventDefault();
        setMoveIndex(solution.moves.length - 1);
      }
    },
    [stepForward, stepBack, setMoveIndex, solution],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // ── Shared board props ────────────────────────────────────────────────────
  const boardProps: BoardPanelProps = {
    cleared, active, isSolving, isPlaying, onSolve: handleSolve,
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--color-bp-black)' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-2 md:px-6 md:py-3"
        style={{ borderColor: 'var(--color-bp-border)' }}>
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-10 rounded-full" style={{ backgroundColor: 'var(--color-bp-pink)' }} />
          <h1 className="text-base font-black tracking-tight md:text-lg"
            style={{ color: 'var(--color-bp-text)' }}>
            BPTG{' '}
            <span style={{ color: 'var(--color-bp-pink)' }}>Schedule</span>{' '}
            <span className="hidden sm:inline">Solver</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              const p = PRESET_PUZZLES.find((x) => x.id === e.target.value);
              if (p) { reset(); loadPuzzle(p); setMobileTab('board'); }
            }}
            defaultValue=""
            className="rounded-lg border px-2 py-1.5 text-xs md:text-sm"
            style={{ backgroundColor: 'var(--color-bp-surface)', borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-text)' }}>
            <option value="" disabled>Preset…</option>
            {PRESET_PUZZLES.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button onClick={() => void handleShare()}
            className="rounded-lg border px-3 py-1.5 text-xs transition-colors"
            style={{
              borderColor: copied ? 'var(--color-card-green)' : 'var(--color-bp-border)',
              color: copied ? 'var(--color-card-green)' : 'var(--color-bp-muted)',
            }}>
            {copied ? '✓ Copied!' : '⇪ Share'}
          </button>
        </div>
      </header>

      {/* ── Desktop: 3-column ───────────────────────────────────────────── */}
      <div className="hidden md:flex min-h-0 flex-1">
        {/* Left: cards */}
        <aside className="w-56 shrink-0 overflow-y-auto border-r"
          style={{ borderColor: 'var(--color-bp-border)' }}>
          <PhotocardPanel />
        </aside>

        {/* Center: board */}
        <BoardPanel {...boardProps} />

        {/* Right: solution / algorithm (toggled) */}
        <aside className="flex w-72 shrink-0 flex-col border-l"
          style={{ borderColor: 'var(--color-bp-border)' }}>
          {/* Right panel tabs */}
          <div className="flex shrink-0 border-b" style={{ borderColor: 'var(--color-bp-border)' }}>
            {(['solution', 'algorithm'] as RightPanel[]).map((p) => (
              <button key={p} onClick={() => setRightPanel(p)}
                className="flex-1 py-2 text-xs font-semibold uppercase tracking-wide transition-colors"
                style={{
                  color: rightPanel === p ? 'var(--color-bp-pink)' : 'var(--color-bp-muted)',
                  borderBottom: rightPanel === p
                    ? '2px solid var(--color-bp-pink)'
                    : '2px solid transparent',
                }}>
                {p === 'solution' ? '★ Solution' : '⎇ Algorithm'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {rightPanel === 'solution'  && <SolutionPlayer />}
            {rightPanel === 'algorithm' && <AlgorithmViz />}
          </div>
        </aside>
      </div>

      {/* ── Mobile: tabbed ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        <div className="flex-1 overflow-y-auto">
          {mobileTab === 'cards'    && <PhotocardPanel />}
          {mobileTab === 'board'    && <BoardPanel {...boardProps} />}
          {mobileTab === 'solution' && <SolutionPlayer />}
        </div>

        <nav className="flex shrink-0 border-t" style={{ borderColor: 'var(--color-bp-border)' }}>
          {(['cards', 'board', 'solution'] as MobileTab[]).map((tab) => (
            <button key={tab} onClick={() => setMobileTab(tab)}
              className="flex-1 py-3 text-xs font-semibold uppercase tracking-wide transition-colors"
              style={{
                color: mobileTab === tab ? 'var(--color-bp-pink)' : 'var(--color-bp-muted)',
                borderTop: mobileTab === tab
                  ? '2px solid var(--color-bp-pink)'
                  : '2px solid transparent',
              }}>
              {tab === 'cards' ? '🃏 Cards' : tab === 'board' ? '🗂 Board' : '★ Solution'}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
