import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const SPEEDS = [
  { label: '0.5×', ms: 2000 },
  { label: '1×',   ms: 1000 },
  { label: '2×',   ms: 500  },
  { label: '3×',   ms: 333  },
];

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
    idle:    { label: 'Ready',    color: 'var(--color-bp-muted)' },
    solving: { label: 'Solving…', color: 'var(--color-card-yellow)' },
    done:    { label: 'Done',     color: 'var(--color-card-green)' },
    error:   { label: 'Error',    color: 'var(--color-card-pink)' },
  };
  const { label, color } = map[status];
  return (
    <span className="text-xs font-semibold" style={{ color }}>
      {status === 'solving' ? (
        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}>
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

  const [isPlaying, setIsPlaying]   = useState(false);
  const [speedIdx,  setSpeedIdx]    = useState(1); // default 1×
  const activeRowRef = useRef<HTMLButtonElement | null>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalMoves = solution?.moves.length ?? 0;
  const atEnd      = currentMoveIndex >= totalMoves - 1;

  // Auto-play interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPlaying) return;

    intervalRef.current = setInterval(() => {
      const s = useSolutionStore.getState();
      const sol = selectCurrentSolution(s);
      if (!sol || s.currentMoveIndex >= sol.moves.length - 1) {
        setIsPlaying(false);
        return;
      }
      s.stepForward();
    }, SPEEDS[speedIdx]!.ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speedIdx]);

  // Stop playing when solution changes
  useEffect(() => { setIsPlaying(false); }, [currentSolutionIndex, solutions]);

  // Stop playing when we reach the end
  useEffect(() => { if (atEnd) setIsPlaying(false); }, [atEnd]);

  // Scroll active move into view
  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentMoveIndex]);

  function togglePlay() {
    if (atEnd) { setMoveIndex(-1); setIsPlaying(true); }
    else setIsPlaying((p) => !p);
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--color-bp-muted)' }}>
          Solution
        </h2>
        <StatusBadge status={status} />
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg px-3 py-2 text-xs"
          style={{ backgroundColor: '#ff007022', color: 'var(--color-card-pink)' }}>
          {error}
        </p>
      )}

      {status === 'done' && solutions.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--color-bp-muted)' }}>
          No solutions found within the move limit.
        </p>
      )}

      {/* Solution selector */}
      {solutions.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>Solution</span>
          {solutions.slice(0, 9).map((_, i) => (
            <button key={i} onClick={() => setSolutionIndex(i)}
              className="h-6 w-6 rounded text-xs font-bold transition-colors"
              style={{
                backgroundColor: i === currentSolutionIndex ? 'var(--color-bp-pink)' : 'var(--color-bp-surface-2)',
                color: i === currentSolutionIndex ? '#fff' : 'var(--color-bp-muted)',
              }}>
              {i + 1}
            </button>
          ))}
          {solutions.length > 9 && (
            <span className="text-xs self-center" style={{ color: 'var(--color-bp-muted)' }}>
              +{solutions.length - 9}
            </span>
          )}
        </div>
      )}

      {/* Solution info + controls */}
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-1.5">
              <button onClick={() => setMoveIndex(-1)} disabled={currentMoveIndex === -1}
                title="Jump to start"
                className="rounded px-2 py-1 text-xs disabled:opacity-30 transition-opacity"
                style={{ backgroundColor: 'var(--color-bp-surface-2)', color: 'var(--color-bp-text)' }}>
                ⏮
              </button>
              <button onClick={stepBack} disabled={currentMoveIndex === -1}
                className="rounded px-2 py-1 text-xs disabled:opacity-30 transition-opacity"
                style={{ backgroundColor: 'var(--color-bp-surface-2)', color: 'var(--color-bp-text)' }}>
                ◀
              </button>

              {/* Play / Pause */}
              <button onClick={togglePlay}
                className="rounded-lg px-4 py-1 text-sm font-bold transition-colors"
                style={{ backgroundColor: 'var(--color-bp-pink)', color: '#fff', minWidth: 56 }}>
                {isPlaying ? '⏸' : atEnd ? '↺' : '▶'}
              </button>

              <button onClick={stepForward} disabled={atEnd}
                className="rounded px-2 py-1 text-xs disabled:opacity-30 transition-opacity"
                style={{ backgroundColor: 'var(--color-bp-surface-2)', color: 'var(--color-bp-text)' }}>
                ▶
              </button>
              <button onClick={() => setMoveIndex(totalMoves - 1)} disabled={atEnd}
                title="Jump to end"
                className="rounded px-2 py-1 text-xs disabled:opacity-30 transition-opacity"
                style={{ backgroundColor: 'var(--color-bp-surface-2)', color: 'var(--color-bp-text)' }}>
                ⏭
              </button>
            </div>

            {/* Progress + speed */}
            <div className="flex items-center gap-2">
              {/* Progress bar */}
              <div className="relative flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--color-bp-border)' }}>
                <motion.div className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: 'var(--color-bp-pink)' }}
                  animate={{ width: `${((currentMoveIndex + 1) / totalMoves) * 100}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <span className="shrink-0 font-mono text-xs" style={{ color: 'var(--color-bp-muted)' }}>
                {Math.max(0, currentMoveIndex + 1)}/{totalMoves}
              </span>

              {/* Speed selector */}
              <div className="flex gap-0.5 shrink-0">
                {SPEEDS.map(({ label }, i) => (
                  <button key={i} onClick={() => setSpeedIdx(i)}
                    className="rounded px-1.5 py-0.5 text-xs transition-colors"
                    style={{
                      backgroundColor: i === speedIdx ? 'var(--color-bp-pink)' : 'var(--color-bp-surface-2)',
                      color: i === speedIdx ? '#fff' : 'var(--color-bp-muted)',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Move list */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence initial={false}>
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
                      ref={isActive ? (el) => { activeRowRef.current = el; } : undefined}
                      onClick={() => { setIsPlaying(false); setMoveIndex(i); }}
                      animate={{ opacity: isCleared ? 0.4 : 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-left w-full"
                      style={{
                        backgroundColor: isActive ? `${mColor}22` : 'var(--color-bp-surface)',
                        border: `1.5px solid ${isActive ? mColor : 'var(--color-bp-border)'}`,
                      }}>
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: isActive ? mColor : 'var(--color-bp-surface-2)',
                          color: isActive ? '#fff' : 'var(--color-bp-muted)',
                        }}>
                        {i + 1}
                      </span>

                      <ShapePreview
                        shape={move.photocard.shape}
                        color={isActive ? mColor : 'var(--color-bp-muted)'}
                        cellSize={8}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium" style={{ color: 'var(--color-bp-text)' }}>
                          {move.photocard.name ?? move.photocard.id}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>
                          ({ar},{ac}) · <span style={{ color: cColor }}>{move.photocard.color}</span>
                          {' · '}{move.photocard.points} pts
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Stats footer */}
      {stats && (
        <div className="rounded-lg px-3 py-2 text-xs shrink-0"
          style={{ backgroundColor: 'var(--color-bp-surface)', color: 'var(--color-bp-muted)' }}>
          <div className="flex justify-between"><span>Solutions</span>
            <span style={{ color: 'var(--color-bp-text)' }}>{solutions.length}</span></div>
          <div className="flex justify-between"><span>Nodes explored</span>
            <span style={{ color: 'var(--color-bp-text)' }}>{stats.nodesExplored.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Solve time</span>
            <span style={{ color: 'var(--color-bp-text)' }}>{stats.elapsedMs.toFixed(1)} ms</span></div>
          <p className="mt-1.5 text-center" style={{ color: 'var(--color-bp-border)' }}>
            Space · ← → · Home/End
          </p>
        </div>
      )}
    </div>
  );
}
