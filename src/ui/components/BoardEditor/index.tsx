import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Cell, Member, CardColor } from '../../../core/types';
import { usePuzzleStore } from '../../store/puzzleStore';

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

export type PaintMode = 'empty' | 'standard' | 'member' | 'color' | 'memberColor';

function cellBg(cell: Cell): string {
  if (cell === null) return 'var(--color-bp-surface-2)';
  if (cell.member !== undefined && cell.color !== undefined) {
    return `linear-gradient(135deg, ${MEMBER_COLORS[cell.member]} 0 50%, ${CARD_COLORS[cell.color]} 50% 100%)`;
  }
  if (cell.member !== undefined) return MEMBER_COLORS[cell.member];
  if (cell.color !== undefined) return CARD_COLORS[cell.color];
  return '#3f3f46';
}

function cellLabel(cell: Cell): string {
  if (cell === null) return '';
  if (cell.member !== undefined && cell.color !== undefined) {
    return `${cell.member[0]?.toUpperCase() ?? ''}${cell.color[0]?.toUpperCase() ?? ''}`;
  }
  if (cell.member !== undefined) return cell.member[0]?.toUpperCase() ?? '';
  if (cell.color !== undefined) return cell.color[0]?.toUpperCase() ?? '';
  return '';
}

interface Props {
  activeCells?: ReadonlySet<string>;
  clearedCells?: ReadonlySet<string>;
  readonly?: boolean;
  paintMode: PaintMode;
  paintMember: Member;
  paintColor: CardColor;
}

export default function BoardEditor({
  activeCells,
  clearedCells,
  readonly = false,
  paintMode,
  paintMember,
  paintColor,
}: Props) {
  const grid = usePuzzleStore((s) => s.grid);
  const setCell = usePuzzleStore((s) => s.setCell);

  const paintedCell: Cell =
    paintMode === 'empty' ? null :
    paintMode === 'standard' ? {} :
    paintMode === 'member' ? { member: paintMember } :
    paintMode === 'color' ? { color: paintColor } :
    { member: paintMember, color: paintColor };

  const handleClick = useCallback(
    (row: number, col: number) => {
      if (readonly) return;
      setCell(row, col, paintedCell);
    },
    [readonly, paintedCell, setCell],
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
  const cellSize = Math.min(72, Math.floor(Math.min(520 / rows, 520 / cols)));

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-xl border p-2"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          gap: 4,
          backgroundColor: '#050505',
          borderColor: 'var(--color-bp-border)',
          boxShadow: '0 28px 80px rgba(0,0,0,0.42)',
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r},${c}`;
            const isActive = activeCells?.has(key) ?? false;
            const isCleared = clearedCells?.has(key) ?? false;

            return (
              <motion.button
                key={key}
                onClick={() => handleClick(r, c)}
                onContextMenu={(e) => handleContextMenu(e, r, c)}
                title={!readonly ? 'Paint selected type. Right-click clears.' : undefined}
                animate={{
                  opacity: isCleared ? 0.16 : 1,
                  scale: isActive ? 1.06 : 1,
                  boxShadow: isActive
                    ? '0 0 0 2px var(--color-bp-pink), 0 0 18px rgba(255,0,112,0.75)'
                    : '0 0 0 0 transparent',
                }}
                transition={{ duration: 0.16 }}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 6,
                  background: isActive ? 'var(--color-bp-pink)' : cellBg(cell),
                  border: `1.5px solid ${isActive ? 'var(--color-bp-pink)' : 'var(--color-bp-border)'}`,
                  cursor: readonly ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: Math.max(12, cellSize * 0.28),
                  fontWeight: 800,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.72)',
                  userSelect: 'none',
                  boxShadow: cell === null
                    ? 'inset 0 0 0 1px rgba(255,255,255,0.03)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.24)',
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
                    {isActive ? '*' : cellLabel(cell)}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            );
          }),
        )}
      </div>

      {!readonly && (
        <p className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>
          Paint selected cell type. Right-click always clears.
        </p>
      )}
    </div>
  );
}
