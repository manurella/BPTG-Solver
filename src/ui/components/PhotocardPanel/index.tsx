import ShapePreview from '../ShapePreview';
import { PHOTOCARD_LIBRARY } from '../../../data/photocards';
import { usePuzzleStore } from '../../store/puzzleStore';
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

const MEMBERS: Member[] = ['jisoo', 'jennie', 'rose', 'lisa'];

export default function PhotocardPanel() {
  const photocards    = usePuzzleStore((s) => s.photocards);
  const toggleCard    = usePuzzleStore((s) => s.togglePhotocard);

  const selectedIds = new Set(photocards.map((c) => c.id));

  return (
    <div className="flex flex-col gap-1 p-3">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-bp-muted)' }}>
        Photocard Library
      </h2>

      {MEMBERS.map((member) => (
        <div key={member} className="mb-3">
          {/* Member header */}
          <div
            className="mb-1 rounded px-2 py-0.5 text-xs font-bold uppercase"
            style={{
              backgroundColor: `${MEMBER_COLORS[member]}22`,
              color: MEMBER_COLORS[member],
            }}
          >
            {member}
          </div>

          {/* Cards for this member */}
          <div className="flex flex-col gap-1">
            {PHOTOCARD_LIBRARY.filter((c) => c.member === member).map((card) => {
              const selected = selectedIds.has(card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => toggleCard(card)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors"
                  style={{
                    backgroundColor: selected
                      ? `${MEMBER_COLORS[member]}22`
                      : 'var(--color-bp-surface)',
                    border: `1.5px solid ${selected ? MEMBER_COLORS[member] : 'var(--color-bp-border)'}`,
                  }}
                >
                  {/* Shape preview */}
                  <div className="shrink-0">
                    <ShapePreview
                      shape={card.shape}
                      color={selected ? MEMBER_COLORS[member] : 'var(--color-bp-muted)'}
                      cellSize={9}
                    />
                  </div>

                  {/* Card info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-xs font-medium"
                      style={{ color: selected ? 'var(--color-bp-text)' : 'var(--color-bp-muted)' }}
                    >
                      {card.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {/* Color dot */}
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: CARD_COLORS[card.color] }}
                      />
                      <span className="text-xs" style={{ color: 'var(--color-bp-muted)' }}>
                        {card.points} pts
                      </span>
                    </div>
                  </div>

                  {/* Checkmark */}
                  {selected && (
                    <span className="text-xs" style={{ color: MEMBER_COLORS[member] }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
