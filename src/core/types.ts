export type Member = 'jisoo' | 'jennie' | 'rose' | 'lisa';
export type CardColor = 'pink' | 'yellow' | 'blue' | 'green' | 'purple';

/** A block occupying one grid cell. Constraints are optional — absent means "any". */
export interface Block {
  readonly member?: Member;
  readonly color?: CardColor;
}

/** null = empty cell */
export type Cell = Block | null;
export type Grid = ReadonlyArray<ReadonlyArray<Cell>>;

/** A set of [row, col] offsets relative to an anchor at (0, 0). */
export interface Shape {
  readonly cells: ReadonlyArray<readonly [number, number]>;
}

export interface Photocard {
  readonly id: string;
  readonly name?: string;
  readonly member: Member;
  readonly color: CardColor;
  readonly shape: Shape;
  readonly points: number;
}

/** One placement of a photocard on the grid. */
export interface Move {
  readonly photocard: Photocard;
  /** Top-left anchor position [row, col] on the grid. */
  readonly anchor: readonly [number, number];
  /** Index into the variants array produced by getShapeVariants (0 = canonical). */
  readonly orientationIndex: number;
}

export interface Solution {
  readonly moves: ReadonlyArray<Move>;
  readonly stars: 1 | 2 | 3;
  readonly totalPoints: number;
}

export interface Puzzle {
  readonly id?: string;
  readonly name?: string;
  readonly grid: Grid;
  readonly photocards: ReadonlyArray<Photocard>;
  /** Maximum number of photocards that may be used. */
  readonly moveLimit: number;
  /** Moves used ≤ this → 3 stars (defaults to moveLimit - 2 if omitted). */
  readonly threeStarThreshold?: number;
  /** Moves used ≤ this → 2 stars (defaults to moveLimit - 1 if omitted). */
  readonly twoStarThreshold?: number;
}

export interface SolverStats {
  readonly nodesExplored: number;
  readonly solutionsFound: number;
  readonly elapsedMs: number;
  readonly candidateMoves: number;
  readonly primaryColumns: number;
  readonly secondaryColumns: number;
  readonly resultCap: number;
  readonly resultCapReached: boolean;
}

export interface SolverResult {
  readonly solutions: ReadonlyArray<Solution>;
  readonly optimal: Solution | null;
  readonly stats: SolverStats;
}

export interface SolverOptions {
  /** Stop after this many solutions (default: find all). */
  readonly maxSolutions?: number;
  /** Whether to try all shape rotations (default: false — BPTG uses fixed orientations). */
  readonly allowRotations?: boolean;
  /** Whether to try shape reflections (default: false). */
  readonly allowReflections?: boolean;
}
