import type { Photocard } from '../core/types';
import { SHAPE_DEFS } from '../core/shapes';

export const PHOTOCARD_LIBRARY: readonly Photocard[] = [
  // ── JISOO ──────────────────────────────────────────────────────────────
  { id: 'ji-01', name: 'Jisoo · Flower',   member: 'jisoo', color: 'pink',   shape: SHAPE_DEFS.O,        points: 400 },
  { id: 'ji-02', name: 'Jisoo · Hanbok',   member: 'jisoo', color: 'purple', shape: SHAPE_DEFS.T,        points: 350 },
  { id: 'ji-03', name: 'Jisoo · Studio',   member: 'jisoo', color: 'blue',   shape: SHAPE_DEFS.I4,       points: 300 },
  { id: 'ji-04', name: 'Jisoo · Garden',   member: 'jisoo', color: 'yellow', shape: SHAPE_DEFS.L3,       points: 200 },
  { id: 'ji-05', name: 'Jisoo · Snowdrop', member: 'jisoo', color: 'pink',   shape: SHAPE_DEFS.DOMINO_H, points: 150 },

  // ── JENNIE ─────────────────────────────────────────────────────────────
  { id: 'je-01', name: 'Jennie · Solo',   member: 'jennie', color: 'yellow', shape: SHAPE_DEFS.O,        points: 400 },
  { id: 'je-02', name: 'Jennie · Paris',  member: 'jennie', color: 'pink',   shape: SHAPE_DEFS.S,        points: 350 },
  { id: 'je-03', name: 'Jennie · Studio', member: 'jennie', color: 'blue',   shape: SHAPE_DEFS.L4,       points: 300 },
  { id: 'je-04', name: 'Jennie · Dark',   member: 'jennie', color: 'purple', shape: SHAPE_DEFS.I3,       points: 200 },
  { id: 'je-05', name: 'Jennie · Spring', member: 'jennie', color: 'green',  shape: SHAPE_DEFS.DOMINO_H, points: 150 },

  // ── ROSÉ ───────────────────────────────────────────────────────────────
  { id: 'ro-01', name: 'Rosé · On the Ground', member: 'rose', color: 'pink',   shape: SHAPE_DEFS.O,        points: 400 },
  { id: 'ro-02', name: 'Rosé · Gone',          member: 'rose', color: 'blue',   shape: SHAPE_DEFS.Z,        points: 350 },
  { id: 'ro-03', name: 'Rosé · Studio',        member: 'rose', color: 'green',  shape: SHAPE_DEFS.I4,       points: 300 },
  { id: 'ro-04', name: 'Rosé · Forest',        member: 'rose', color: 'yellow', shape: SHAPE_DEFS.J4,       points: 250 },
  { id: 'ro-05', name: 'Rosé · Night',         member: 'rose', color: 'purple', shape: SHAPE_DEFS.DOMINO_V, points: 150 },

  // ── LISA ───────────────────────────────────────────────────────────────
  { id: 'li-01', name: 'Lisa · Money',   member: 'lisa', color: 'green',  shape: SHAPE_DEFS.O,        points: 400 },
  { id: 'li-02', name: 'Lisa · Lalisa',  member: 'lisa', color: 'yellow', shape: SHAPE_DEFS.T,        points: 350 },
  { id: 'li-03', name: 'Lisa · Studio',  member: 'lisa', color: 'blue',   shape: SHAPE_DEFS.I4,       points: 300 },
  { id: 'li-04', name: 'Lisa · Bangkok', member: 'lisa', color: 'pink',   shape: SHAPE_DEFS.I3,       points: 200 },
  { id: 'li-05', name: 'Lisa · Night',   member: 'lisa', color: 'purple', shape: SHAPE_DEFS.DOMINO_V, points: 150 },
];

export function findCard(id: string): Photocard | undefined {
  return PHOTOCARD_LIBRARY.find(c => c.id === id);
}
