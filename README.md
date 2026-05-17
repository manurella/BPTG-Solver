# BPTG Schedule Solver

> An optimal, fully-visualised puzzle solver for the **Schedule mode** of [Blackpink the Game](https://www.takeonecompany.com/games/bptg/) by TakeOne Company.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-3-6e9f18?style=flat-square&logo=vitest&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## What it does

The Schedule mode presents a grid of blocks. Players place **photocard shapes** — tetromino-like patterns — onto the grid to clear blocks. Constraints add depth: some blocks require a specific BLACKPINK member's card, others require a matching colour. The solver finds the **optimal sequence of moves** within the move limit and animates every placement on the board.

## Algorithm

The puzzle is an instance of the **Exact Cover** problem:

- **Universe** = the set of grid blocks that must be cleared
- **Options** = every valid `(photocard × position)` placement
- **Constraints** = member and colour matching on constrained blocks; each photocard used at most once

This is solved with **Knuth's Algorithm X + Dancing Links (DLX)**, the canonical algorithm for exact cover. Dancing Links represents the sparse binary matrix as circular doubly-linked lists, achieving **O(1) cover and uncover** operations. The S-heuristic (choose the column with fewest 1s) dramatically prunes the search tree.

Card columns are modelled as **secondary columns** (optional in the DLX sense) — they prevent a card from being used twice without requiring every card to be used, which is crucial because puzzles are solved with fewer cards than the full library.

> Reference: D. Knuth, ["Dancing Links"](https://arxiv.org/abs/cs/0011047) (2000).

## Features

| Feature | Detail |
|---------|--------|
| **DLX solver** | Exact cover with optional secondary columns; sub-millisecond on typical puzzles |
| **Web Worker** | Solver runs off the main thread — UI stays responsive during search |
| **Animated playback** | Step through each move with Framer Motion board overlay |
| **Auto-play** | Configurable speed (0.5× – 3×) with progress bar and loop |
| **Board editor** | Click-to-cycle cell types (standard, member, colour); right-click erases |
| **Photocard panel** | 20 cards across all 4 members; toggle to include in puzzle |
| **Multiple solutions** | All solutions found, ranked stars → moves → points |
| **URL sharing** | Puzzle state encoded in URL hash; one-click copy |
| **Keyboard shortcuts** | `← →` step · `Home / End` jump |
| **Preset puzzles** | 4 built-in puzzles from tutorial to dual member+colour constraints |
| **PWA** | Installable, works offline |
| **Responsive** | Three-column desktop; tabbed mobile layout |

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Language | TypeScript 5 (strict) | End-to-end type safety |
| Framework | React 18 | Concurrent rendering |
| Build | Vite 6 | Sub-second HMR; native ESM Web Workers |
| Styling | Tailwind CSS v4 | CSS-native design tokens |
| Animation | Framer Motion | Declarative board overlays |
| State | Zustand | Lightweight, no boilerplate |
| Off-thread | Web Workers (native Vite) | Non-blocking solve |
| Testing | Vitest + Testing Library | Fast, ESM-native |
| CI / CD | GitHub Actions → GitHub Pages | Always-on live demo |

## Project structure

```
src/
├── core/                  # Pure solver engine — zero UI dependencies
│   ├── types.ts           # Domain model: Board, Photocard, Move, Solution
│   ├── shapes.ts          # Shape library + rotation/reflection utilities
│   ├── board.ts           # Immutable grid operations
│   ├── validator.ts       # Constraint validation + move enumeration
│   ├── dlx/
│   │   ├── dlx.ts         # Dancing Links — Algorithm X with secondary columns
│   │   └── encoder.ts     # Puzzle → DLX matrix + lazy solution generator
│   ├── solver.ts          # Public API: encode → search → rank
│   └── analyzer.ts        # Star rating and solution comparison
├── worker/
│   └── solver.worker.ts   # Web Worker wrapper (separate Vite chunk)
├── data/
│   ├── photocards.ts      # 20 canonical photocards (all 4 members)
│   └── puzzles.ts         # 4 preset puzzles
└── ui/
    ├── store/             # Zustand: puzzleStore + solutionStore
    ├── hooks/             # useSolver (worker bridge), useUrlState
    └── components/        # BoardEditor, PhotocardPanel, SolutionPlayer, ShapePreview
tests/
└── core/                  # dlx.test.ts · validator.test.ts · solver.test.ts
```

## Quickstart

```bash
git clone https://github.com/manurella/BPTG-Solver.git
cd BPTG-Solver
npm install
npm run dev        # → http://localhost:5173
npm test           # 27 tests (DLX · validator · solver)
npm run build      # production build with worker chunk
```

## How to use

1. **Load a preset** — use the header dropdown (e.g., *Member Match*)
2. **Or build manually** — click grid cells to cycle type, toggle photocards in the left panel
3. **Set move limit** — the maximum number of photocards allowed
4. **Click Solve** — DLX finds all solutions in a Web Worker, typically < 1 ms
5. **Animate the solution** — `▶` auto-plays, `← →` keys step manually

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `→` | Step forward one move |
| `←` | Step back one move |
| `Home` | Jump to initial board state |
| `End` | Jump to final board state |

## Running tests

```bash
npm test           # watch mode
npm test -- --run  # CI / single pass
```

DLX is verified against Knuth's original Figure 3 example (unique exact cover: rows B, D, F). Solver tests cover member and colour constraints, move-limit enforcement, full-coverage assertions, and star-rating thresholds.

## Licence

MIT © 2026 Rey
