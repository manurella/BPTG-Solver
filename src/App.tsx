import { useMemo, useEffect, useState, useCallback } from 'react';
import BoardEditor, { type PaintMode } from './ui/components/BoardEditor';
import PhotocardPanel from './ui/components/PhotocardPanel';
import SolutionPlayer from './ui/components/SolutionPlayer';
import AlgorithmViz from './ui/components/AlgorithmViz';
import { usePuzzleStore } from './ui/store/puzzleStore';
import { useSolutionStore, selectCurrentSolution } from './ui/store/solutionStore';
import { useSolver } from './ui/hooks/useSolver';
import { useUrlState } from './ui/hooks/useUrlState';
import { PRESET_PUZZLES } from './data/puzzles';
import { analyzePuzzle } from './core/diagnostics';
import type { CardColor, Cell, Grid, Member, Puzzle } from './core/types';

type MobileTab = 'cards' | 'board' | 'solution';
type RightPanel = 'solution' | 'analysis' | 'data';

const MEMBERS: Member[] = ['jisoo', 'jennie', 'rose', 'lisa'];
const COLORS: CardColor[] = ['pink', 'yellow', 'blue', 'green', 'purple'];
const GRID_SIZES = [
  { label: '3x3', rows: 3, cols: 3 },
  { label: '4x4', rows: 4, cols: 4 },
  { label: '4x6', rows: 4, cols: 6 },
  { label: '5x5', rows: 5, cols: 5 },
  { label: '6x7', rows: 6, cols: 7 },
];

const MEMBER_COLORS: Record<Member, string> = {
  jisoo: 'var(--color-member-jisoo)',
  jennie: 'var(--color-member-jennie)',
  rose: 'var(--color-member-rose)',
  lisa: 'var(--color-member-lisa)',
};

const CARD_COLORS: Record<CardColor, string> = {
  pink: 'var(--color-card-pink)',
  yellow: 'var(--color-card-yellow)',
  blue: 'var(--color-card-blue)',
  green: 'var(--color-card-green)',
  purple: 'var(--color-card-purple)',
};

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

function reviveGrid(raw: unknown): Grid {
  if (!Array.isArray(raw)) throw new Error('grid must be an array');
  return raw.map((row) => {
    if (!Array.isArray(row)) throw new Error('grid rows must be arrays');
    return row.map((cell): Cell => {
      if (cell === null) return null;
      if (typeof cell !== 'object') throw new Error('grid cells must be objects or null');
      return cell as Cell;
    });
  });
}

function Metric({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-md border px-3 py-2" style={{ borderColor: 'var(--color-bp-border)', backgroundColor: 'rgba(255,255,255,0.025)' }}>
      <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-bp-muted)' }}>{label}</div>
      <div className="mt-1 text-lg font-black leading-none" style={{ color: 'var(--color-bp-text)' }}>{value}</div>
      {note && <div className="mt-1 text-[10px]" style={{ color: 'var(--color-bp-muted)' }}>{note}</div>}
    </div>
  );
}

interface BoardPanelProps {
  cleared: ReadonlySet<string>;
  active: ReadonlySet<string>;
  isSolving: boolean;
  isPlaying: boolean;
  onSolve: () => void;
  paintMode: PaintMode;
  setPaintMode: (mode: PaintMode) => void;
  paintMember: Member;
  setPaintMember: (member: Member) => void;
  paintColor: CardColor;
  setPaintColor: (color: CardColor) => void;
}

function BoardPanel({
  cleared,
  active,
  isSolving,
  isPlaying,
  onSolve,
  paintMode,
  setPaintMode,
  paintMember,
  setPaintMember,
  paintColor,
  setPaintColor,
}: BoardPanelProps) {
  const grid = usePuzzleStore((s) => s.grid);
  const photocards = usePuzzleStore((s) => s.photocards);
  const moveLimit = usePuzzleStore((s) => s.moveLimit);
  const setMoveLimit = usePuzzleStore((s) => s.setMoveLimit);
  const resizeGrid = usePuzzleStore((s) => s.resizeGrid);
  const fillGrid = usePuzzleStore((s) => s.fillGrid);
  const clearGrid = usePuzzleStore((s) => s.clearGrid);
  const reset = useSolutionStore((s) => s.reset);

  const diagnostics = useMemo(() => analyzePuzzle(grid, photocards), [grid, photocards]);
  const paintModes: { id: PaintMode; label: string }[] = [
    { id: 'standard', label: 'Block' },
    { id: 'member', label: 'Member' },
    { id: 'color', label: 'Color' },
    { id: 'memberColor', label: 'Both' },
    { id: 'empty', label: 'Erase' },
  ];

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-auto">
      <div className="border-b px-4 py-3 md:px-6" style={{ borderColor: 'var(--color-bp-border)' }}>
        <div className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-2">
          <select
            onChange={(e) => {
              const selected = GRID_SIZES.find((size) => size.label === e.target.value);
              if (selected) {
                reset();
                resizeGrid(selected.rows, selected.cols);
              }
            }}
            className="h-8 rounded-md border px-2 text-xs font-semibold"
            style={{ backgroundColor: 'var(--color-bp-surface)', borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-text)' }}
          >
            {GRID_SIZES.map(({ label }) => <option key={label} value={label}>{label}</option>)}
          </select>

          {paintModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setPaintMode(mode.id)}
              className="h-8 rounded-md border px-2 text-xs font-bold transition-colors md:px-3"
              style={{
                backgroundColor: paintMode === mode.id ? 'var(--color-bp-pink)' : 'var(--color-bp-surface)',
                borderColor: paintMode === mode.id ? 'var(--color-bp-pink)' : 'var(--color-bp-border)',
                color: paintMode === mode.id ? '#fff' : 'var(--color-bp-muted)',
              }}
            >
              {mode.label}
            </button>
          ))}

          <div className="flex items-center gap-1">
            {MEMBERS.map((member) => (
              <button
                key={member}
                onClick={() => setPaintMember(member)}
                className="h-8 w-7 rounded-md border text-xs font-black uppercase md:w-8"
                title={member}
                style={{
                  backgroundColor: paintMember === member ? MEMBER_COLORS[member] : 'var(--color-bp-surface)',
                  borderColor: MEMBER_COLORS[member],
                  color: paintMember === member ? '#050505' : MEMBER_COLORS[member],
                }}
              >
                {member[0]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setPaintColor(color)}
                className="h-8 w-7 rounded-md border md:w-8"
                title={color}
                style={{
                  backgroundColor: CARD_COLORS[color],
                  borderColor: paintColor === color ? '#fff' : 'var(--color-bp-border)',
                  boxShadow: paintColor === color ? '0 0 0 2px var(--color-bp-pink)' : 'none',
                }}
              />
            ))}
          </div>

          <button onClick={() => { reset(); fillGrid(); }} className="h-8 rounded-md border px-3 text-xs font-bold" style={{ borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-muted)' }}>
            Fill
          </button>
          <button onClick={() => { reset(); clearGrid(); }} className="h-8 rounded-md border px-3 text-xs font-bold" style={{ borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-muted)' }}>
            Clear
          </button>

          <label className="flex h-8 items-center gap-2 rounded-md border px-2 text-xs font-bold md:ml-auto" style={{ borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-muted)' }}>
            Moves
            <input
              type="number"
              min={1}
              max={20}
              value={moveLimit}
              onChange={(e) => setMoveLimit(Number(e.target.value))}
              className="w-12 bg-transparent text-center font-black outline-none"
              style={{ color: 'var(--color-bp-text)' }}
            />
          </label>

          <button
            onClick={onSolve}
            disabled={isSolving || photocards.length === 0 || diagnostics.blocks === 0}
            className="h-8 rounded-md px-5 text-xs font-black uppercase tracking-wide disabled:opacity-35"
            style={{ backgroundColor: 'var(--color-bp-pink)', color: '#fff' }}
          >
            {isSolving ? 'Solving...' : 'Solve'}
          </button>
        </div>
      </div>

      <div className="grid flex-1 gap-4 p-4 md:grid-cols-[1fr_190px] md:p-6">
        <section className="flex min-h-[420px] items-center justify-center">
          <BoardEditor
            activeCells={active}
            clearedCells={cleared}
            readonly={isSolving || isPlaying}
            paintMode={paintMode}
            paintMember={paintMember}
            paintColor={paintColor}
          />
        </section>

        <aside className="flex flex-col gap-2">
          <Metric label="Blocks" value={diagnostics.blocks} note={`${diagnostics.combinedBlocks} combined`} />
          <Metric label="Cards" value={diagnostics.selectedCards} note={`${diagnostics.totalCardArea} total area`} />
          <Metric label="Candidates" value={diagnostics.candidateMoves} note="valid placements" />
          <Metric label="Matrix" value={`${diagnostics.primaryColumns}+${diagnostics.secondaryColumns}`} note={`${(diagnostics.matrixDensity * 100).toFixed(1)}% dense`} />
          <div className="mt-2 rounded-md border p-3 text-xs" style={{ borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-muted)', backgroundColor: 'rgba(255,255,255,0.025)' }}>
            <div className="mb-2 font-bold uppercase tracking-wide" style={{ color: 'var(--color-bp-pink)' }}>Normal Mode Scope</div>
            <p>Fixed orientations. Exact cover. Member/color constraints per cell. No OCR or special blocks yet.</p>
            {diagnostics.warnings.length > 0 && (
              <ul className="mt-2 space-y-1">
                {diagnostics.warnings.map((warning) => <li key={warning}>- {warning}</li>)}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function DataPanel() {
  const grid = usePuzzleStore((s) => s.grid);
  const photocards = usePuzzleStore((s) => s.photocards);
  const moveLimit = usePuzzleStore((s) => s.moveLimit);
  const loadPuzzle = usePuzzleStore((s) => s.loadPuzzle);
  const reset = useSolutionStore((s) => s.reset);
  const [text, setText] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const exportJson = useMemo(
    () => JSON.stringify({ grid, photocards, moveLimit } satisfies Puzzle, null, 2),
    [grid, photocards, moveLimit],
  );

  function handleImport() {
    try {
      const parsed = JSON.parse(text) as Partial<Puzzle>;
      if (!parsed.grid || !parsed.photocards || !parsed.moveLimit) {
        throw new Error('JSON must include grid, photocards, and moveLimit.');
      }
      loadPuzzle({
        grid: reviveGrid(parsed.grid),
        photocards: parsed.photocards,
        moveLimit: parsed.moveLimit,
        threeStarThreshold: parsed.threeStarThreshold,
        twoStarThreshold: parsed.twoStarThreshold,
      });
      reset();
      setMessage('Imported puzzle JSON.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-bp-muted)' }}>Puzzle Data</h2>
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-bp-muted)' }}>Export current board</label>
        <textarea readOnly value={exportJson} className="mt-1 h-44 w-full resize-none rounded-md border p-2 font-mono text-[10px] outline-none" style={{ backgroundColor: 'var(--color-bp-surface)', borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-text)' }} />
      </div>
      <div className="min-h-0 flex-1">
        <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-bp-muted)' }}>Import captured puzzle JSON</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="mt-1 h-44 w-full resize-none rounded-md border p-2 font-mono text-[10px] outline-none" style={{ backgroundColor: 'var(--color-bp-surface)', borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-text)' }} />
      </div>
      <button onClick={handleImport} className="rounded-md px-3 py-2 text-xs font-black uppercase" style={{ backgroundColor: 'var(--color-bp-pink)', color: '#fff' }}>Import</button>
      {message && <p className="text-xs" style={{ color: message.includes('Imported') ? 'var(--color-card-green)' : 'var(--color-card-pink)' }}>{message}</p>}
    </div>
  );
}

export default function App() {
  const { solve } = useSolver();
  const { getShareUrl } = useUrlState();
  const [mobileTab, setMobileTab] = useState<MobileTab>('board');
  const [rightPanel, setRightPanel] = useState<RightPanel>('solution');
  const [copied, setCopied] = useState(false);
  const [paintMode, setPaintMode] = useState<PaintMode>('standard');
  const [paintMember, setPaintMember] = useState<Member>('jisoo');
  const [paintColor, setPaintColor] = useState<CardColor>('pink');

  const grid = usePuzzleStore((s) => s.grid);
  const photocards = usePuzzleStore((s) => s.photocards);
  const moveLimit = usePuzzleStore((s) => s.moveLimit);
  const loadPuzzle = usePuzzleStore((s) => s.loadPuzzle);

  const status = useSolutionStore((s) => s.status);
  const currentMoveIndex = useSolutionStore((s) => s.currentMoveIndex);
  const solution = useSolutionStore(selectCurrentSolution);
  const reset = useSolutionStore((s) => s.reset);
  const stepForward = useSolutionStore((s) => s.stepForward);
  const stepBack = useSolutionStore((s) => s.stepBack);
  const setMoveIndex = useSolutionStore((s) => s.setMoveIndex);

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
    await navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); stepForward(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepBack(); }
      if (e.key === 'Home') { e.preventDefault(); setMoveIndex(-1); }
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

  const boardProps: BoardPanelProps = {
    cleared,
    active,
    isSolving,
    isPlaying,
    onSolve: handleSolve,
    paintMode,
    setPaintMode,
    paintMember,
    setPaintMember,
    paintColor,
    setPaintColor,
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-bp-black)' }}>
      <header className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2 md:px-6" style={{ borderColor: 'var(--color-bp-border)', backgroundColor: '#070707' }}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-md font-black" style={{ backgroundColor: 'var(--color-bp-pink)', color: '#fff' }}>BP</div>
          <div className="min-w-0">
            <h1 className="truncate text-xs font-black sm:text-sm md:text-base" style={{ color: 'var(--color-bp-text)' }}>
              <span className="sm:hidden">BPTG Solver</span>
              <span className="hidden sm:inline">Schedule Solver Workbench</span>
            </h1>
            <p className="hidden text-[10px] uppercase tracking-wide md:block" style={{ color: 'var(--color-bp-muted)' }}>Normal mode exact-cover solver - fixed orientation baseline</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <select
            onChange={(e) => {
              const puzzle = PRESET_PUZZLES.find((x) => x.id === e.target.value);
              if (puzzle) {
                reset();
                loadPuzzle(puzzle);
                setMobileTab('board');
              }
            }}
            defaultValue=""
            className="h-8 w-20 rounded-md border px-2 text-xs font-semibold sm:w-28 md:w-auto"
            style={{ backgroundColor: 'var(--color-bp-surface)', borderColor: 'var(--color-bp-border)', color: 'var(--color-bp-text)' }}
          >
            <option value="" disabled>Preset</option>
            {PRESET_PUZZLES.map((puzzle) => <option key={puzzle.id} value={puzzle.id}>{puzzle.name}</option>)}
          </select>
          <button onClick={() => void handleShare()} className="hidden h-8 rounded-md border px-3 text-xs font-bold sm:block" style={{ borderColor: copied ? 'var(--color-card-green)' : 'var(--color-bp-border)', color: copied ? 'var(--color-card-green)' : 'var(--color-bp-muted)' }}>
            {copied ? 'Copied' : 'Share'}
          </button>
        </div>
      </header>

      <div className="hidden min-h-0 flex-1 md:flex">
        <aside className="w-64 shrink-0 overflow-y-auto border-r" style={{ borderColor: 'var(--color-bp-border)', backgroundColor: '#090909' }}>
          <PhotocardPanel />
        </aside>

        <BoardPanel {...boardProps} />

        <aside className="flex w-[360px] shrink-0 flex-col border-l" style={{ borderColor: 'var(--color-bp-border)', backgroundColor: '#090909' }}>
          <div className="flex shrink-0 border-b" style={{ borderColor: 'var(--color-bp-border)' }}>
            {(['solution', 'analysis', 'data'] as RightPanel[]).map((panel) => (
              <button
                key={panel}
                onClick={() => setRightPanel(panel)}
                className="flex-1 py-2 text-xs font-black uppercase tracking-wide"
                style={{
                  color: rightPanel === panel ? 'var(--color-bp-pink)' : 'var(--color-bp-muted)',
                  borderBottom: rightPanel === panel ? '2px solid var(--color-bp-pink)' : '2px solid transparent',
                }}
              >
                {panel}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {rightPanel === 'solution' && <SolutionPlayer />}
            {rightPanel === 'analysis' && <AlgorithmViz />}
            {rightPanel === 'data' && <DataPanel />}
          </div>
        </aside>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {mobileTab === 'cards' && <PhotocardPanel />}
          {mobileTab === 'board' && <BoardPanel {...boardProps} />}
          {mobileTab === 'solution' && <SolutionPlayer />}
        </div>
        <nav className="grid grid-cols-3 border-t" style={{ borderColor: 'var(--color-bp-border)' }}>
          {(['cards', 'board', 'solution'] as MobileTab[]).map((tab) => (
            <button key={tab} onClick={() => setMobileTab(tab)} className="py-3 text-xs font-black uppercase tracking-wide" style={{ color: mobileTab === tab ? 'var(--color-bp-pink)' : 'var(--color-bp-muted)' }}>
              {tab}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
