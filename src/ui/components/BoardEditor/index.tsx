import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Cell, Member, CardColor } from '../../../core/types';
import { usePuzzleStore } from '../../store/puzzleStore';

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

const MEMBER_ORDER: Member[]    = ['jisoo', 'jennie', 'rose', 'lisa'];
const COLOR_ORDER:  CardColor[] = ['pink', 'yellow', 'blue', 'green', 'purple'];

function nextCell(cell: Cell): Cell {
  if (cell === null)                       return {};
  if (cell.color !== undefined) {
    const idx = COLOR_ORDER.indexOf(cell.color);
    return idx < COLOR_ORDER.length - 1
      ? { color: COLOR_ORDER[idx + 1] }
      : null;
  }
  if (cell.member !== undefined) {
    const idx = MEMBER_ORDER.indexOf(cell.member);
    return idx < MEMBER_ORDER.length - 1
      ? { member: MEMBER_ORDER[idx + 1] }
      : { color: COLOR_ORDER[0] };
  }
  return { member: MEMBER_ORDER[0] };
}

function cellBg(cell: Cell): string {
  if (cell === null)                          return 'var(--color-bp-surface-2)';
  if (cell.member !== undefined)              return MEMBER_COLORS[cell.member];
  if (cell.color  !== undefined)              return CARD_COLORS[cell.color];
  return '#3f3f46'; // standard block — zinc-700
}

function cellLabel(cell: Cell): string {
  if (cell === null)          return '';
  if (cell.member !== undefined) return cell.member[0]!.toUpperCase();
  if (cell.color  !== undefined) return cell.color[0]!.toUpperCase();
  return '■';
}

interface Props {
  /** Cells highlighted by the currently shown solution move. */
  activeCells?:  ReadonlySet<string>;
  /** Cells already cleared by previous moves in the playback. */
  clearedCells?: ReadonlySet<string>;
  /** Disable editing (during solve / playback). */
  readonly?: boolean;
}

export default function BoardEditor({ activeCells, clearedCells, readonly = false }: Props) {
  const grid    = usePuzzleStore((s) => s.grid);
  const setCell = usePuzzleStore((s) => s.setCell);

  const handleClick = useCallback(
    (row: number, col: number) => {
      if (readonly) return;
      setCell(row, col, nextCell(grid[row]![col]!));
    },
    [readonly, grid, setCell],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      e.preventDefault();
      if (readonly) return;
      setCell(row, col, null);
    },
    [readonly, setCell],
  );

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const CELL = Math.min(64, Math.floor(Math.min(440 / rows, 440 / cols)));

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
          gridTemplateRows: `repeat(${rows}, ${CELL}px)`,
          gap: 3,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r},${c}`;
            const isActive  = activeCells?.has(key)  ?? false;
            const isCleared = clearedCells?.has(key) ?? false;

            return (
              <motion.button
                key={key}
                onClick={() => handleClick(r, c)}
                onContextMenu={(e) => handleContextMenu(e, r, c)}
                title={!readonly ? 'Left-click: cycle type · Right-click: clear' : undefined}
                animate={{
                  opacity:   isCleared ? 0.15 : 1,
                  scale:     isActive  ? 1.06 : 1,
                  boxShadow: isActive
                    ? '0 0 0 2px var(--color-bp-pink), 0 0 12px var(--color-bp-pink)'
                    : '0 0 0 0px transparent',
                }}
                transition={{ duration: 0.2 }}
                style={{
                  width:           CELL,
                  height:          CELL,
                  borderRadius:    6,
                  backgroundColor: isActive ? 'var(--color-bp-pink)' : cellBg(cell),
                  border: `1.5px solid ${isActive ? 'var(--color-bp-pink)' : 'var(--color-bp-border)'}`,
                  cursor: readonly ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: CELL * 0.3,
                  fontWeight: 700,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                  userSelect: 'none',
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={JSON.stringify(cell)}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.12 }}
                  >
                    {isActive ? '★' : cellLabel(cell)}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            );
          }),
        )}
      </div>

      {!readonly && (
        <p className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>
          Left-click to cycle cell type · Right-click to clear
        </p>
      )}
    </div>
  );
}
