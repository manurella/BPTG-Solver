import type { Shape } from '../../core/types';
import { shapeHeight, shapeWidth } from '../../core/shapes';

interface Props {
  shape: Shape;
  color: string;
  cellSize?: number;
}

export default function ShapePreview({ shape, color, cellSize = 10 }: Props) {
  const h = shapeHeight(shape);
  const w = shapeWidth(shape);
  const occupied = new Set(shape.cells.map(([r, c]) => `${r},${c}`));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${w}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${h}, ${cellSize}px)`,
        gap: 1,
      }}
    >
      {Array.from({ length: h }, (_, r) =>
        Array.from({ length: w }, (_, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: 2,
              backgroundColor: occupied.has(`${r},${c}`) ? color : 'transparent',
            }}
          />
        )),
      )}
    </div>
  );
}
