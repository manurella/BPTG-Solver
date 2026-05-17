import type { Puzzle } from '../core/types';
import { findCard } from './photocards';

function card(id: string) {
  const c = findCard(id);
  if (!c) throw new Error(`Unknown card: ${id}`);
  return c;
}

/**
 * Puzzle 1 — "First Schedule"
 * 2×4 grid, all standard blocks. Cleared by two I4-shaped cards.
 * Introduces: basic shape placement.
 */
const firstSchedule: Puzzle = {
  id: 'p1',
  name: 'First Schedule',
  grid: [
    [{}, {}, {}, {}],
    [{}, {}, {}, {}],
  ],
  photocards: [card('ji-03'), card('ro-03')],
  moveLimit: 2,
  threeStarThreshold: 2,
  twoStarThreshold: 2,
};

/**
 * Puzzle 2 — "Member Match"
 * 4×4 grid with member-constrained corners. Teaches member constraint routing.
 *
 * Layout:
 *   [jisoo][jisoo][  std][  std]
 *   [jisoo][jisoo][  std][  std]
 *   [  std][  std][ lisa][ lisa]
 *   [  std][  std][ lisa][ lisa]
 */
const memberMatch: Puzzle = {
  id: 'p2',
  name: 'Member Match',
  grid: [
    [{ member: 'jisoo' }, { member: 'jisoo' }, {}, {}],
    [{ member: 'jisoo' }, { member: 'jisoo' }, {}, {}],
    [{}, {}, { member: 'lisa' }, { member: 'lisa' }],
    [{}, {}, { member: 'lisa' }, { member: 'lisa' }],
  ],
  photocards: [card('ji-01'), card('je-01'), card('ro-01'), card('li-01')],
  moveLimit: 4,
  threeStarThreshold: 4,
  twoStarThreshold: 4,
};

/**
 * Puzzle 3 — "Color Challenge"
 * 4×4 grid with color-constrained zones. Teaches color constraint routing.
 *
 * Layout:
 *   [ pink][ pink][  std][  std]
 *   [ pink][ pink][  std][  std]
 *   [  std][  std][green][green]
 *   [  std][  std][green][green]
 */
const colorChallenge: Puzzle = {
  id: 'p3',
  name: 'Color Challenge',
  grid: [
    [{ color: 'pink' }, { color: 'pink' }, {}, {}],
    [{ color: 'pink' }, { color: 'pink' }, {}, {}],
    [{}, {}, { color: 'green' }, { color: 'green' }],
    [{}, {}, { color: 'green' }, { color: 'green' }],
  ],
  photocards: [card('ji-01'), card('je-01'), card('ro-01'), card('li-01')],
  moveLimit: 4,
  threeStarThreshold: 4,
  twoStarThreshold: 4,
};

/**
 * Puzzle 4 — "Double Trouble"
 * 4×4 grid with both member AND color constraints on the same cells.
 *
 * Layout:
 *   [ji+pink][ji+pink][  std  ][  std  ]
 *   [ji+pink][ji+pink][  std  ][  std  ]
 *   [  std  ][  std  ][li+grn ][li+grn ]
 *   [  std  ][  std  ][li+grn ][li+grn ]
 */
const doubleTrouble: Puzzle = {
  id: 'p4',
  name: 'Double Trouble',
  grid: [
    [{ member: 'jisoo', color: 'pink' }, { member: 'jisoo', color: 'pink' }, {}, {}],
    [{ member: 'jisoo', color: 'pink' }, { member: 'jisoo', color: 'pink' }, {}, {}],
    [{}, {}, { member: 'lisa', color: 'green' }, { member: 'lisa', color: 'green' }],
    [{}, {}, { member: 'lisa', color: 'green' }, { member: 'lisa', color: 'green' }],
  ],
  photocards: [card('ji-01'), card('je-01'), card('ro-01'), card('li-01')],
  moveLimit: 4,
  threeStarThreshold: 4,
  twoStarThreshold: 4,
};

export const PRESET_PUZZLES: readonly Puzzle[] = [
  firstSchedule,
  memberMatch,
  colorChallenge,
  doubleTrouble,
];
