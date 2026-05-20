import { useMemo, useState } from 'react';
import ShapePreview from '../ShapePreview';
import { PHOTOCARD_LIBRARY } from '../../../data/photocards';
import { usePuzzleStore } from '../../store/puzzleStore';
import type { CardColor, Member } from '../../../core/types';

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

const MEMBERS: Member[] = ['jisoo', 'jennie', 'rose', 'lisa'];

export default function PhotocardPanel() {
  const [memberFilter, setMemberFilter] = useState<Member | 'all'>('all');
  const photocards = usePuzzleStore((s) => s.photocards);
  const toggleCard = usePuzzleStore((s) => s.togglePhotocard);
  const selectedIds = new Set(photocards.map((card) => card.id));

  const visibleCards = useMemo(
    () => PHOTOCARD_LIBRARY.filter((card) => memberFilter === 'all' || card.member === memberFilter),
    [memberFilter],
  );

  const selectedArea = photocards.reduce((sum, card) => sum + card.shape.cells.length, 0);

  return (
    <div className="flex flex-col gap-3 p-3">
      <header>
        <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--color-bp-text)' }}>
          Photocard Deck
        </h2>
        <p className="mt-1 text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-bp-muted)' }}>
          {photocards.length} selected / {selectedArea} area
        </p>
      </header>

      <div className="grid grid-cols-5 gap-1">
        <button
          onClick={() => setMemberFilter('all')}
          className="h-7 rounded-md border text-[10px] font-black uppercase"
          style={{
            backgroundColor: memberFilter === 'all' ? 'var(--color-bp-pink)' : 'var(--color-bp-surface)',
            borderColor: memberFilter === 'all' ? 'var(--color-bp-pink)' : 'var(--color-bp-border)',
            color: memberFilter === 'all' ? '#fff' : 'var(--color-bp-muted)',
          }}
        >
          All
        </button>
        {MEMBERS.map((member) => (
          <button
            key={member}
            onClick={() => setMemberFilter(member)}
            className="h-7 rounded-md border text-[10px] font-black uppercase"
            title={member}
            style={{
              backgroundColor: memberFilter === member ? MEMBER_COLORS[member] : 'var(--color-bp-surface)',
              borderColor: MEMBER_COLORS[member],
              color: memberFilter === member ? '#050505' : MEMBER_COLORS[member],
            }}
          >
            {member[0]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {visibleCards.map((card) => {
          const selected = selectedIds.has(card.id);
          const memberColor = MEMBER_COLORS[card.member];
          return (
            <button
              key={card.id}
              onClick={() => toggleCard(card)}
              className="grid grid-cols-[34px_1fr_auto] items-center gap-2 rounded-md border px-2 py-2 text-left transition-colors"
              style={{
                backgroundColor: selected ? `${memberColor}20` : 'var(--color-bp-surface)',
                borderColor: selected ? memberColor : 'var(--color-bp-border)',
              }}
            >
              <div className="grid h-8 w-8 place-items-center rounded" style={{ backgroundColor: '#050505' }}>
                <ShapePreview shape={card.shape} color={selected ? memberColor : 'var(--color-bp-muted)'} cellSize={7} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-bold" style={{ color: selected ? 'var(--color-bp-text)' : 'var(--color-bp-muted)' }}>
                  {card.name}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: CARD_COLORS[card.color] }} />
                  <span className="text-[10px] uppercase" style={{ color: memberColor }}>{card.member}</span>
                  <span className="text-[10px]" style={{ color: 'var(--color-bp-muted)' }}>{card.points} pts</span>
                </div>
              </div>

              <span
                className="grid h-5 w-5 place-items-center rounded-sm text-xs font-black"
                style={{
                  backgroundColor: selected ? 'var(--color-bp-pink)' : 'var(--color-bp-surface-2)',
                  color: selected ? '#fff' : 'var(--color-bp-border)',
                }}
              >
                {selected ? '✓' : '+'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
