import { motion } from 'framer-motion';
import ShapePreview from '../ShapePreview';
import {
  useSolutionStore,
  selectCurrentSolution,
  type SolverStatus,
} from '../../store/solutionStore';
import type { Member, CardColor } from '../../../core/types';

const MEMBER_COLORS: Record<Member, string> = {
  jisoo:  'var(--color-member-jisoo)',
  jennie: 'var(--color-member-jennie)',
  rose:   'var(--color-member-rose)',
  lisa:   'var(--color-member-lisa)',
};

const CARD_COLORS: Record<CardColor, string> = {
  pink:   'var(--color-card-pink)',
  yellow: 'var(--color-card-yellow)',
  blue:   'var(--color-card-blue)',
  green:  'var(--color-card-green)',
  purple: 'var(--color-card-purple)',
};

function Stars({ count }: { count: 1 | 2 | 3 }) {
  return (
    <span className="text-base">
      {Array.from({ length: 3 }, (_, i) => (
        <span key={i} style={{ color: i < count ? '#fbbf24' : 'var(--color-bp-border)' }}>★</span>
      ))}
    </span>
  );
}

function StatusBadge({ status }: { status: SolverStatus }) {
  const map: Record<SolverStatus, { label: string; color: string }> = {
    idle:    { label: 'Ready',   color: 'var(--color-bp-muted)' },
    solving: { label: 'Solving…', color: 'var(--color-card-yellow)' },
    done:    { label: 'Done',    color: 'var(--color-card-green)' },
    error:   { label: 'Error',   color: 'var(--color-card-pink)' },
  };
  const { label, color } = map[status];
  return (
    <span className="text-xs font-semibold" style={{ color }}>
      {status === 'solving' ? (
        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
          {label}
        </motion.span>
      ) : label}
    </span>
  );
}

export default function SolutionPlayer() {
  const status               = useSolutionStore((s) => s.status);
  const solutions            = useSolutionStore((s) => s.solutions);
  const currentSolutionIndex = useSolutionStore((s) => s.currentSolutionIndex);
  const currentMoveIndex     = useSolutionStore((s) => s.currentMoveIndex);
  const stats                = useSolutionStore((s) => s.stats);
  const error                = useSolutionStore((s) => s.error);
  const solution             = useSolutionStore(selectCurrentSolution);
  const stepForward          = useSolutionStore((s) => s.stepForward);
  const stepBack             = useSolutionStore((s) => s.stepBack);
  const setSolutionIndex     = useSolutionStore((s) => s.setSolutionIndex);
  const setMoveIndex         = useSolutionStore((s) => s.setMoveIndex);

  const totalMoves = solution?.moves.length ?? 0;
  const atStart    = currentMoveIndex === -1;
  const atEnd      = currentMoveIndex === totalMoves - 1;

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-bp-muted)' }}>
          Solution
        </h2>
        <StatusBadge status={status} />
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: '#ff007022', color: 'var(--color-card-pink)' }}>
          {error}
        </p>
      )}

      {/* No solutions */}
      {status === 'done' && solutions.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--color-bp-muted)' }}>
          No solutions found within the move limit.
        </p>
      )}

      {/* Solution selector */}
      {solutions.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>
            Solution
          </span>
          <div className="flex gap-1">
            {solutions.slice(0, 8).map((_, i) => (
              <button
                key={i}
                onClick={() => setSolutionIndex(i)}
                className="h-6 w-6 rounded text-xs font-bold transition-colors"
                style={{
                  backgroundColor: i === currentSolutionIndex
                    ? 'var(--color-bp-pink)'
                    : 'var(--color-bp-surface-2)',
                  color: i === currentSolutionIndex ? '#fff' : 'var(--color-bp-muted)',
                }}
              >
                {i + 1}
              </button>
            ))}
            {solutions.length > 8 && (
              <span className="text-xs self-center" style={{ color: 'var(--color-bp-muted)' }}>
                +{solutions.length - 8}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Current solution info */}
      {solution && (
        <>
          <div className="flex items-center justify-between rounded-lg px-3 py-2"
            style={{ backgroundColor: 'var(--color-bp-surface)' }}>
            <Stars count={solution.stars} />
            <span className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>
              {solution.moves.length} moves · {solution.totalPoints} pts
            </span>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setMoveIndex(-1)}
              disabled={atStart}
              className="rounded px-2 py-1 text-xs disabled:opacity-30"
              style={{ backgroundColor: 'var(--color-bp-surface-2)', color: 'var(--color-bp-text)' }}
              title="Jump to start"
            >
              ⏮
            </button>
            <button
              onClick={stepBack}
              disabled={atStart}
              className="rounded px-2 py-1 text-xs disabled:opacity-30"
              style={{ backgroundColor: 'var(--color-bp-surface-2)', color: 'var(--color-bp-text)' }}
            >
              ◀
            </button>
            <span className="min-w-[4rem] text-center text-xs font-mono"
              style={{ color: 'var(--color-bp-text)' }}>
              {currentMoveIndex + 1} / {totalMoves}
            </span>
            <button
              onClick={stepForward}
              disabled={atEnd}
              className="rounded px-3 py-1 text-xs font-bold disabled:opacity-30"
              style={{ backgroundColor: 'var(--color-bp-pink)', color: '#fff' }}
            >
              ▶
            </button>
            <button
              onClick={() => setMoveIndex(totalMoves - 1)}
              disabled={atEnd}
              className="rounded px-2 py-1 text-xs disabled:opacity-30"
              style={{ backgroundColor: 'var(--color-bp-surface-2)', color: 'var(--color-bp-text)' }}
              title="Jump to end"
            >
              ⏭
            </button>
          </div>

          {/* Move list */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-1.5">
              {solution.moves.map((move, i) => {
                const isActive  = i === currentMoveIndex;
                const isCleared = i < currentMoveIndex;
                const mColor    = MEMBER_COLORS[move.photocard.member];
                const cColor    = CARD_COLORS[move.photocard.color];
                const [ar, ac]  = move.anchor;

                return (
                  <motion.button
                    key={i}
                    onClick={() => setMoveIndex(i)}
                    animate={{ opacity: isCleared ? 0.4 : 1 }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
                    style={{
                      backgroundColor: isActive
                        ? `${mColor}22`
                        : 'var(--color-bp-surface)',
                      border: `1.5px solid ${isActive ? mColor : 'var(--color-bp-border)'}`,
                    }}
                  >
                    {/* Step number */}
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: isActive ? mColor : 'var(--color-bp-surface-2)',
                        color: isActive ? '#fff' : 'var(--color-bp-muted)',
                      }}
                    >
                      {i + 1}
                    </span>

                    {/* Shape preview */}
                    <ShapePreview shape={move.photocard.shape} color={isActive ? mColor : 'var(--color-bp-muted)'} cellSize={8} />

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium" style={{ color: 'var(--color-bp-text)' }}>
                        {move.photocard.name ?? move.photocard.id}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>
                        ({ar},{ac}) ·{' '}
                        <span style={{ color: cColor }}>{move.photocard.color}</span>
                        {' · '}{move.photocard.points} pts
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Stats footer */}
      {stats && (
        <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: 'var(--color-bp-surface)', color: 'var(--color-bp-muted)' }}>
          <div className="flex justify-between">
            <span>Solutions</span>
            <span style={{ color: 'var(--color-bp-text)' }}>{solutions.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Nodes explored</span>
            <span style={{ color: 'var(--color-bp-text)' }}>{stats.nodesExplored.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Solve time</span>
            <span style={{ color: 'var(--color-bp-text)' }}>{stats.elapsedMs.toFixed(1)} ms</span>
          </div>
        </div>
      )}
    </div>
  );
}
