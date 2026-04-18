import { useRef } from 'react';

interface NestingItem {
  id: string;
  part: string;
  w: number;
  h: number;
  x: number;
  y: number;
  displayW: number;
  displayH: number;
  thick?: number;
}

interface NestingBoardProps {
  items: NestingItem[];
  onChange: (items: NestingItem[]) => void;
  sheetWidth: number;
  sheetHeight: number;
  sawKerf: number;
  colorMap: Record<string, string>;
}

export function NestingBoard({
  items,
  onChange,
  sheetWidth,
  sheetHeight,
  sawKerf,
  colorMap,
}: NestingBoardProps) {
  const draggingRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lastClickRef = useRef<{ id: string; time: number }>({
    id: '',
    time: 0,
  });

  const clearDragging = () => {
    draggingRef.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const now = Date.now();
    const lastClick = lastClickRef.current;

    // Duplo Clique: Rotação
    if (lastClick.id === id && now - lastClick.time < 300) {
      const newItems = items.map((i) =>
        i.id === id
          ? { ...i, w: i.h, h: i.w, displayW: i.displayH, displayH: i.displayW }
          : i
      );
      onChange(newItems);
      lastClickRef.current = { id: '', time: 0 };
      draggingRef.current = null;
      return;
    }

    lastClickRef.current = { id, time: now };

    if (!svgRef.current) {
      return;
    }
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const matrix = svgRef.current.getScreenCTM();
    if (!matrix) {
      return;
    }
    const loc = pt.matrixTransform(matrix.inverse());
    const item = items.find((i) => i.id === id);
    if (item) {
      draggingRef.current = {
        id,
        offsetX: loc.x - item.x,
        offsetY: loc.y - item.y,
      };
    }
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: lógica de drag com snap magnetismo
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!(draggingRef.current && svgRef.current)) {
      return;
    }
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const matrix = svgRef.current.getScreenCTM();
    if (!matrix) {
      return;
    }
    const loc = pt.matrixTransform(matrix.inverse());

    let newX = loc.x - draggingRef.current.offsetX;
    let newY = loc.y - draggingRef.current.offsetY;

    const snapThreshold = 25;
    const draggingId = draggingRef.current.id;
    const currentItem = items.find((i) => i.id === draggingId);
    if (!currentItem) {
      return;
    }

    // Magnetismo (Snap)
    if (newX < snapThreshold) {
      newX = 0;
    }
    if (newY < snapThreshold) {
      newY = 0;
    }
    if (sheetWidth - (newX + currentItem.w) < snapThreshold) {
      newX = sheetWidth - currentItem.w;
    }
    if (sheetHeight - (newY + currentItem.h) < snapThreshold) {
      newY = sheetHeight - currentItem.h;
    }

    for (const other of items) {
      if (other.id === draggingId) {
        continue;
      }
      if (Math.abs(newX - other.x) < snapThreshold) {
        newX = other.x;
      }
      if (Math.abs(newX + currentItem.w - other.x) < snapThreshold) {
        newX = other.x - currentItem.w;
      }
      if (Math.abs(newX - (other.x + other.w)) < snapThreshold) {
        newX = other.x + other.w;
      }
      if (Math.abs(newY - other.y) < snapThreshold) {
        newY = other.y;
      }
      if (Math.abs(newY + currentItem.h - other.y) < snapThreshold) {
        newY = other.y - currentItem.h;
      }
      if (Math.abs(newY - (other.y + other.h)) < snapThreshold) {
        newY = other.y + other.h;
      }
    }

    onChange(
      items.map((i) => (i.id === draggingId ? { ...i, x: newX, y: newY } : i))
    );
  };

  return (
    <div
      className="relative w-full rounded-sm border-2 border-amber-900 bg-[#f4ece1] shadow-inner"
      style={{ aspectRatio: `${sheetWidth} / ${sheetHeight}` }}
    >
      <svg
        aria-label="Plano de corte interativo"
        className="h-full w-full touch-none"
        onPointerLeave={clearDragging}
        onPointerMove={handlePointerMove}
        onPointerUp={clearDragging}
        ref={svgRef}
        role="img"
        viewBox={`0 0 ${sheetWidth} ${sheetHeight}`}
      >
        <title>Plano de corte interativo</title>
        <rect
          fill="none"
          height={sheetHeight}
          stroke="#dcb68a"
          strokeDasharray="10 10"
          strokeWidth="2"
          width={sheetWidth}
          x="0"
          y="0"
        />
        {items.map((item) => {
          const isDragging = draggingRef.current?.id === item.id;
          const w = item.w - sawKerf,
            h = item.h - sawKerf;
          const cx = w / 2,
            cy = h / 2,
            isVertical = h > w;
          const shortSide = Math.min(w, h);
          const titleSize = Math.max(8, Math.min(16, shortSide * 0.2)),
            dimsSize = Math.max(10, Math.min(28, shortSide * 0.35));
          const lineGap = shortSide > 80 ? 15 : shortSide * 0.2;

          return (
            <g
              className={
                isDragging ? 'cursor-grabbing opacity-90' : 'cursor-grab'
              }
              key={item.id}
              onPointerDown={(e) => handlePointerDown(e, item.id)}
              transform={`translate(${item.x}, ${item.y})`}
            >
              <rect
                fill={isDragging ? '#fff' : colorMap[item.part]}
                height={h}
                stroke={isDragging ? '#3b82f6' : '#4a2e12'}
                strokeWidth={isDragging ? '4' : '1.5'}
                width={w}
              />
              <g
                style={{ pointerEvents: 'none' }}
                transform={isVertical ? `rotate(-90 ${cx} ${cy})` : undefined}
              >
                <text
                  dominantBaseline="central"
                  fill="#4a2e12"
                  fontSize={titleSize}
                  fontWeight="bold"
                  textAnchor="middle"
                  x={cx}
                  y={cy - lineGap}
                >
                  {item.part}
                </text>
                <text
                  dominantBaseline="central"
                  fill="#2d1c0a"
                  fontFamily="monospace"
                  fontSize={dimsSize}
                  textAnchor="middle"
                  x={cx}
                  y={cy + lineGap}
                >
                  {item.displayW.toFixed(0)} x {item.displayH.toFixed(0)} mm
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
