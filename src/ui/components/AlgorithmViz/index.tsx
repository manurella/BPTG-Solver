/**
 * AlgorithmViz — visualises the DLX exact-cover instance and solution space.
 *
 * Three tabs:
 *   Matrix   — sparse DLX cover matrix (rows = valid moves, cols = cells + cards)
 *   Solutions — scatter plot: moves used vs total points, coloured by star rating
 *   Complexity — search-tree stats and efficiency metrics
 */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { encodePuzzle } from '../../../core/dlx/encoder';
import { usePuzzleStore } from '../../store/puzzleStore';
import { useSolutionStore } from '../../store/solutionStore';
import type { Member, Solution } from '../../../core/types';

const MEMBER_COLORS: Record<Member, string> = {
  jisoo:  'var(--color-member-jisoo)',
  jennie: 'var(--color-member-jennie)',
  rose:   'var(--color-member-rose)',
  lisa:   'var(--color-member-lisa)',
};
const STAR_COLORS: Record<1 | 2 | 3, string> = {
  1: '#6b7280',
  2: '#60a5fa',
  3: '#fbbf24',
};

type Tab = 'matrix' | 'solutions' | 'complexity';

// ── Cover Matrix ────────────────────────────────────────────────────────────

function MatrixView() {
  const grid       = usePuzzleStore((s) => s.grid);
  const photocards = usePuzzleStore((s) => s.photocards);
  const status     = useSolutionStore((s) => s.status);
  const solutions  = useSolutionStore((s) => s.solutions);
  const curSolIdx  = useSolutionStore((s) => s.currentSolutionIndex);

  const encoded = useMemo(() => {
    if (status !== 'done') return null;
    try { return encodePuzzle(grid, photocards); }
    catch { return null; }
  }, [status, grid, photocards]);

  if (!encoded) {
    return <Empty>Run the solver to see the exact-cover matrix.</Empty>;
  }

  const { rows, numCellCols, numCols } = encoded;
  const displayRows = rows.slice(0, 40); // cap at 40 for legibility

  // Determine which row indices are in the current solution
  const solMoveIds = new Set(
    solutions[curSolIdx]?.moves.map((m) => m.photocard.id + JSON.stringify(m.anchor)) ?? [],
  );

  const CELL_PX = 10;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>
        Each row is a valid placement (card × position). Each column is a grid cell
        (left) or a photocard (right). A filled square means that move covers that item.
        {rows.length > 40 && ` Showing first 40 of ${rows.length} rows.`}
      </p>

      {/* Column legend */}
      <div className="flex gap-4 text-xs flex-wrap" style={{ color: 'var(--color-bp-muted)' }}>
        <span>
          <span style={{ display: 'inline-block', width: 8, height: 8, backgroundColor: '#3f3f46', borderRadius: 2, marginRight: 4 }} />
          Grid cell
        </span>
        {photocards.map((c) => (
          <span key={c.id}>
            <span style={{ display: 'inline-block', width: 8, height: 8, backgroundColor: MEMBER_COLORS[c.member], borderRadius: 2, marginRight: 4 }} />
            {c.name ?? c.id}
          </span>
        ))}
      </div>

      {/* Matrix grid */}
      <div className="overflow-auto">
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 1 }}>
          {/* Column header — show every 4th cell index */}
          <div style={{ display: 'flex', gap: 1, paddingLeft: 120 }}>
            {Array.from({ length: numCols }, (_, i) => (
              <div key={i} style={{
                width: CELL_PX, fontSize: 7,
                color: i < numCellCols ? 'var(--color-bp-muted)' : MEMBER_COLORS[photocards[i - numCellCols]?.member ?? 'jisoo'],
                textAlign: 'center', lineHeight: 1,
              }}>
                {i % 4 === 0 ? i : ''}
              </div>
            ))}
          </div>

          {displayRows.map((row, ri) => {
            const coveredSet = new Set([...row.cellCols, row.cardCol]);
            const card = row.move.photocard;
            const isSolutionRow = solMoveIds.has(card.id + JSON.stringify(row.move.anchor));

            return (
              <motion.div
                key={ri}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: ri * 0.012, duration: 0.15 }}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {/* Row label */}
                <div style={{
                  width: 116, fontSize: 8, textAlign: 'right', paddingRight: 4,
                  color: isSolutionRow ? MEMBER_COLORS[card.member] : 'var(--color-bp-muted)',
                  fontWeight: isSolutionRow ? 700 : 400,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {isSolutionRow ? '★ ' : ''}{card.name ?? card.id} @({row.move.anchor[0]},{row.move.anchor[1]})
                </div>

                {/* Matrix cells */}
                <div style={{ display: 'flex', gap: 1 }}>
                  {Array.from({ length: numCols }, (_, ci) => {
                    const filled = coveredSet.has(ci);
                    const isCardCol = ci >= numCellCols;
                    const bg = filled
                      ? isCardCol
                        ? MEMBER_COLORS[card.member]
                        : isSolutionRow ? 'var(--color-bp-pink)' : '#52525b'
                      : 'var(--color-bp-surface)';

                    return (
                      <div key={ci} style={{
                        width: CELL_PX, height: CELL_PX, borderRadius: 1,
                        backgroundColor: bg,
                        border: isSolutionRow && filled ? '1px solid var(--color-bp-pink)' : 'none',
                      }} />
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>
        {rows.length} total rows · {numCellCols} cell cols · {numCols - numCellCols} card cols
        {' · '}density {((rows.reduce((s, r) => s + r.cellCols.length + 1, 0) / (rows.length * numCols)) * 100).toFixed(1)}%
      </p>
    </div>
  );
}

// ── Solution Scatter ─────────────────────────────────────────────────────────

function SolutionsView() {
  const solutions = useSolutionStore((s) => s.solutions);
  const curIdx    = useSolutionStore((s) => s.currentSolutionIndex);
  const setSolIdx = useSolutionStore((s) => s.setSolutionIndex);
  const status    = useSolutionStore((s) => s.status);

  if (status !== 'done' || solutions.length === 0) {
    return <Empty>No solutions to display yet.</Empty>;
  }

  const minMoves = Math.min(...solutions.map((s) => s.moves.length));
  const maxMoves = Math.max(...solutions.map((s) => s.moves.length));
  const minPts   = Math.min(...solutions.map((s) => s.totalPoints));
  const maxPts   = Math.max(...solutions.map((s) => s.totalPoints));

  const W = 260, H = 160;
  const PAD = 24;

  function toXY(sol: Solution) {
    const xRange = maxMoves - minMoves || 1;
    const yRange = maxPts - minPts || 1;
    const x = PAD + ((sol.moves.length - minMoves) / xRange) * (W - PAD * 2);
    const y = H - PAD - ((sol.totalPoints - minPts) / yRange) * (H - PAD * 2);
    return { x, y };
  }

  // Group by star for legend
  const byStar = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>;
  for (const s of solutions) byStar[s.stars]++;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>
        Each dot is a solution. X = moves used, Y = total points. Click to select.
      </p>

      {/* Star legend */}
      <div className="flex gap-4 text-xs">
        {([3, 2, 1] as const).map((s) => byStar[s] > 0 && (
          <span key={s} style={{ color: STAR_COLORS[s] }}>
            {'★'.repeat(s)} × {byStar[s]}
          </span>
        ))}
      </div>

      {/* Scatter plot */}
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        {/* Axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--color-bp-border)" strokeWidth={1} />
        <line x1={PAD} y1={PAD}     x2={PAD}      y2={H - PAD} stroke="var(--color-bp-border)" strokeWidth={1} />

        {/* Axis labels */}
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={8} fill="var(--color-bp-muted)">moves</text>
        <text x={8} y={H / 2} textAnchor="middle" fontSize={8} fill="var(--color-bp-muted)"
          transform={`rotate(-90, 8, ${H / 2})`}>pts</text>

        {/* Dots */}
        {solutions.map((sol, i) => {
          const { x, y } = toXY(sol);
          const isCur = i === curIdx;
          return (
            <motion.circle
              key={i}
              cx={x} cy={y}
              initial={{ r: 0 }}
              animate={{ r: isCur ? 6 : 4 }}
              transition={{ duration: 0.2 }}
              fill={STAR_COLORS[sol.stars]}
              stroke={isCur ? '#fff' : 'none'}
              strokeWidth={isCur ? 1.5 : 0}
              style={{ cursor: 'pointer' }}
              onClick={() => setSolIdx(i)}
            />
          );
        })}
      </svg>

      <p className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>
        {solutions.length} solutions · best: {solutions[0]?.stars ?? 0}★
        · {solutions[0]?.moves.length ?? 0} moves · {solutions[0]?.totalPoints ?? 0} pts
      </p>
    </div>
  );
}

// ── Complexity Stats ─────────────────────────────────────────────────────────

function ComplexityView() {
  const status    = useSolutionStore((s) => s.status);
  const stats     = useSolutionStore((s) => s.stats);
  const solutions = useSolutionStore((s) => s.solutions);
  const grid      = usePuzzleStore((s) => s.grid);
  const photocards = usePuzzleStore((s) => s.photocards);

  const encoded = useMemo(() => {
    if (status !== 'done') return null;
    try { return encodePuzzle(grid, photocards); }
    catch { return null; }
  }, [status, grid, photocards]);

  if (!stats || !encoded) {
    return <Empty>Run the solver to see complexity metrics.</Empty>;
  }

  const blockCount = grid.flat().filter((c) => c !== null).length;
  const density = (encoded.rows.reduce((s, r) => s + r.cellCols.length + 1, 0)
    / (encoded.rows.length * encoded.numCols)) * 100;
  const pruningRate = stats.nodesExplored > 0
    ? (1 - solutions.length / stats.nodesExplored) * 100
    : 0;
  const solvingSpeed = stats.elapsedMs > 0
    ? (stats.nodesExplored / stats.elapsedMs).toFixed(0)
    : '∞';

  const rows: [string, string, string][] = [
    ['Problem', '', ''],
    ['Grid blocks to clear', blockCount.toString(), ''],
    ['Valid move candidates', encoded.rows.length.toString(), 'rows in DLX matrix'],
    ['Primary columns (cells)', encoded.numCellCols.toString(), 'must cover exactly once'],
    ['Secondary columns (cards)', (encoded.numCols - encoded.numCellCols).toString(), 'at most once'],
    ['Matrix density', `${density.toFixed(1)}%`, '1s / total entries'],
    ['', '', ''],
    ['Search', '', ''],
    ['Nodes explored', stats.nodesExplored.toLocaleString(), 'Algorithm X iterations'],
    ['Solutions found', solutions.length.toString(), ''],
    ['Pruning rate', `${pruningRate.toFixed(1)}%`, 'dead-ends avoided by MRV'],
    ['Throughput', `${solvingSpeed} nodes/ms`, ''],
    ['Elapsed', `${stats.elapsedMs.toFixed(2)} ms`, ''],
  ];

  return (
    <div className="flex flex-col gap-1">
      {rows.map(([label, value, note], i) => {
        if (!label) return <div key={i} className="h-2" />;
        if (!value) {
          return (
            <p key={i} className="mt-1 text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--color-bp-pink)' }}>
              {label}
            </p>
          );
        }
        return (
          <div key={i} className="flex items-baseline justify-between gap-4">
            <span className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>{label}</span>
            <div className="text-right">
              <span className="text-xs font-mono font-bold" style={{ color: 'var(--color-bp-text)' }}>
                {value}
              </span>
              {note && (
                <span className="ml-1 text-xs" style={{ color: 'var(--color-bp-border)' }}>
                  {note}
                </span>
              )}
            </div>
          </div>
        );
      })}

      <div className="mt-3 rounded-lg px-3 py-2 text-xs"
        style={{ backgroundColor: 'var(--color-bp-surface)', color: 'var(--color-bp-muted)' }}>
        Algorithm X with MRV S-heuristic (Dancing Links — Knuth, 2000).
        Card columns are secondary: they block reuse without requiring coverage.
      </div>
    </div>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────────

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center py-12 text-sm"
      style={{ color: 'var(--color-bp-muted)' }}>
      {children}
    </div>
  );
}

export default function AlgorithmViz() {
  const [tab, setTab] = useState<Tab>('matrix');

  const TABS: { id: Tab; label: string }[] = [
    { id: 'matrix',      label: 'Cover Matrix' },
    { id: 'solutions',   label: 'Solutions' },
    { id: 'complexity',  label: 'Complexity' },
  ];

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {/* Header */}
      <h2 className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--color-bp-muted)' }}>
        Algorithm
      </h2>

      {/* Tabs */}
      <div className="flex gap-1">
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: tab === id ? 'var(--color-bp-pink)' : 'var(--color-bp-surface-2)',
              color: tab === id ? '#fff' : 'var(--color-bp-muted)',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'matrix'     && <MatrixView />}
        {tab === 'solutions'  && <SolutionsView />}
        {tab === 'complexity' && <ComplexityView />}
      </div>
    </div>
  );
}
