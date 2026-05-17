/**
 * Dancing Links — Knuth's Algorithm X for Exact Cover
 *
 * Reference: D. Knuth, "Dancing Links" (2000), https://arxiv.org/abs/cs/0011047
 *
 * A sparse binary matrix is represented as a set of circular doubly-linked
 * lists. Each column has a header node; each row is a ring of data nodes.
 * cover()/uncover() remove and restore entire rows in O(rows-in-column) time,
 * enabling efficient backtracking without array copies.
 */

/** Every node in the Dancing Links structure — headers and data nodes alike. */
interface DlxNode {
  L: DlxNode;  // left neighbour in row
  R: DlxNode;  // right neighbour in row
  U: DlxNode;  // up neighbour in column
  D: DlxNode;  // down neighbour in column
  C: DlxNode;  // column header (self for headers)
  /** Row index into the problem's row list (-1 for headers). */
  rowIdx: number;
  /** Column size — meaningful only on header nodes. */
  size: number;
  /** Column name — meaningful only on header nodes. */
  name: string;
}

function makeNode(overrides: Partial<DlxNode> = {}): DlxNode {
  const n = {} as DlxNode;
  n.L = n; n.R = n; n.U = n; n.D = n; n.C = n;
  n.rowIdx = -1; n.size = 0; n.name = '';
  Object.assign(n, overrides);
  return n;
}

export interface SearchStats {
  nodesExplored: number;
}

export class DancingLinks {
  private readonly root: DlxNode;
  private readonly headers: DlxNode[];

  /**
   * @param colNames   Names for every column (primary + secondary).
   * @param numPrimary First N columns are primary (must be covered exactly once).
   *                   Remaining columns are secondary (covered at most once —
   *                   they participate in row links and block double-use, but
   *                   are never chosen by the MRV heuristic and need not be
   *                   covered for a solution to be valid).
   *                   Defaults to all columns being primary.
   */
  constructor(colNames: string[], numPrimary = colNames.length) {
    this.root = makeNode({ name: '__root__' });
    this.headers = colNames.map((name, i) => {
      const h = makeNode({ name, C: undefined! });
      h.C = h; // self-referential
      if (i < numPrimary) {
        // Primary column: link into root's doubly-linked header ring
        h.L = this.root.L;
        h.R = this.root;
        this.root.L.R = h;
        this.root.L = h;
      }
      // Secondary column: L = R = self (from makeNode). Never in root's ring,
      // so never chosen by minColumn(). cover()/uncover() on a self-linked
      // column are no-ops for the ring, but still correctly remove/restore rows.
      return h;
    });
  }

  /**
   * Appends one row to the matrix.
   * @param rowIdx  The caller-assigned row identifier returned in solutions.
   * @param colIndices  Sorted or unsorted indices of columns with a 1 in this row.
   */
  addRow(rowIdx: number, colIndices: number[]): void {
    if (colIndices.length === 0) return;

    const nodes = colIndices.map(ci => {
      const col = this.headers[ci]!;
      const node = makeNode({ C: col, rowIdx });
      // Insert above the column header (i.e., at the bottom of the column list)
      node.U = col.U;
      node.D = col;
      col.U.D = node;
      col.U = node;
      col.size++;
      return node;
    });

    // Link data nodes left↔right circularly
    for (let i = 0; i < nodes.length; i++) {
      nodes[i]!.L = nodes.at(i - 1)!;
      nodes[i]!.R = nodes[(i + 1) % nodes.length]!;
    }
  }

  /**
   * Generator that yields each solution as an array of row indices.
   * Implements Algorithm X with the S-heuristic (minimum column size first).
   *
   * @param maxSolutions  Stop early after this many solutions. Default: Infinity.
   */
  *search(maxSolutions = Infinity, stats?: SearchStats): Generator<number[]> {
    yield* this.algoX([], maxSolutions, { found: 0 }, stats ?? { nodesExplored: 0 });
  }

  private *algoX(
    partial: number[],
    maxSolutions: number,
    counter: { found: number },
    stats: SearchStats,
  ): Generator<number[]> {
    stats.nodesExplored++;

    // Base case: no columns left — solution found
    if (this.root.R === this.root) {
      counter.found++;
      yield [...partial];
      return;
    }

    // Choose column with minimum size (S-heuristic / MRV)
    const col = this.minColumn();

    // Dead end: required column has no rows
    if (col.size === 0) return;

    this.cover(col);

    for (let row = col.D; row !== col; row = row.D) {
      partial.push(row.rowIdx);

      // Cover all other columns that this row participates in
      for (let node = row.R; node !== row; node = node.R) {
        this.cover(node.C);
      }

      yield* this.algoX(partial, maxSolutions, counter, stats);
      if (counter.found >= maxSolutions) {
        // Unwind immediately — restore state for the caller
        for (let node = row.L; node !== row; node = node.L) {
          this.uncover(node.C);
        }
        partial.pop();
        break;
      }

      // Undo
      for (let node = row.L; node !== row; node = node.L) {
        this.uncover(node.C);
      }
      partial.pop();
    }

    this.uncover(col);
  }

  private minColumn(): DlxNode {
    let best = this.root.R;
    for (let h = best.R; h !== this.root; h = h.R) {
      if (h.size < best.size) best = h;
    }
    return best;
  }

  private cover(col: DlxNode): void {
    col.R.L = col.L;
    col.L.R = col.R;

    for (let row = col.D; row !== col; row = row.D) {
      for (let node = row.R; node !== row; node = node.R) {
        node.U.D = node.D;
        node.D.U = node.U;
        node.C.size--;
      }
    }
  }

  private uncover(col: DlxNode): void {
    // Traverse in reverse to undo cover in the exact reverse order
    for (let row = col.U; row !== col; row = row.U) {
      for (let node = row.L; node !== row; node = node.L) {
        node.C.size++;
        node.U.D = node;
        node.D.U = node;
      }
    }

    col.R.L = col;
    col.L.R = col;
  }
}
