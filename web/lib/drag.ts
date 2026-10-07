import { useRef, type KeyboardEvent, type PointerEvent } from 'react';

/** Pointer position in the SVG's own viewBox units. */
function svgPoint(svg: SVGSVGElement, e: PointerEvent): [number, number] {
  const m = svg.getScreenCTM();
  if (!m) return [0, 0];
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  return [p.x, p.y];
}

/**
 * Drag a point on an SVG with the pointer, or with the arrow keys once the handle has focus.
 * `fromSvg` maps viewBox units to the value (already snapped and clamped); `nudge` applies one arrow-key move.
 * `onEnd` fires once per drag (pointer up or key press), so the log gets one event, not one per frame.
 */
export function useSvgDrag<T>({ fromSvg, value, onChange, onEnd, nudge }: {
  fromSvg: (x: number, y: number) => T;
  value: T;
  onChange: (v: T) => void;
  onEnd?: (v: T) => void;
  nudge: (v: T, dx: number, dy: number) => T;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const last = useRef<T | null>(null);

  function move(e: PointerEvent) {
    if (!dragging.current || !svgRef.current) return;
    const v = fromSvg(...svgPoint(svgRef.current, e));
    last.current = v;
    onChange(v);
  }

  function end() {
    if (!dragging.current) return;
    dragging.current = false;
    if (last.current !== null) onEnd?.(last.current);
  }

  const svgProps = {
    ref: svgRef,
    onPointerMove: move,
    onPointerUp: end,
    onPointerCancel: end,
  };

  const handleProps = {
    tabIndex: 0,
    // A 2D point is not a slider (which has one value and a range); "application" hands the arrow keys to us.
    role: 'application' as const,
    'aria-roledescription': 'draggable point',
    // Only the handle blocks scrolling, so a phone can still scroll past the plot.
    style: { touchAction: 'none' as const, cursor: 'grab' },
    onPointerDown: (e: PointerEvent) => {
      e.preventDefault();
      // Capture on the whole SVG: the drag goes on even when the pointer slips off the handle.
      svgRef.current?.setPointerCapture(e.pointerId);
      dragging.current = true;
      last.current = null;
      move(e);
    },
    onKeyDown: (e: KeyboardEvent) => {
      const d: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
      const step = d[e.key];
      if (!step) return;
      e.preventDefault();
      const v = nudge(value, ...step);
      onChange(v);
      onEnd?.(v);
    },
  };

  return { svgProps, handleProps };
}
