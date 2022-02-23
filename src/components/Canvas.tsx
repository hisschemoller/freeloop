import React, { useEffect, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { usePopper } from 'react-popper';
import addWindowResizeCallback from '../util/windowresize';

interface Point {
  x: number;
  y: number;
}

const POINT_RADIUS = 20;
const PADDING = 40;

const drawBackground = (ctx: CanvasRenderingContext2D) => {
  const { width, height } = ctx.canvas;
  ctx.beginPath();
  ctx.fillStyle = '#333333';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#666666';
  ctx.strokeRect(PADDING, PADDING, width - (PADDING * 2), height - (PADDING * 2));
};

const drawPoints = (ctx: CanvasRenderingContext2D, points: Point[], selectedIndex: number) => {
  ctx.fillStyle = '#666666';
  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    if (index === selectedIndex) {
      ctx.beginPath();
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 3;
      ctx.arc(point.x, point.y, POINT_RADIUS + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
};

let domRect = new DOMRect();

const virtualElement = {
  getBoundingClientRect: () => domRect,
};

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rect, setRect] = useState<DOMRect>();
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout>>();
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [popperArrowElement, setPopperArrowElement] = useState<HTMLDivElement | null>(null);
  const [popperShow, setPopperShow] = useState<boolean>(false);

  const { attributes, styles, update } = usePopper(virtualElement, popperElement, {
    modifiers: [{ name: 'arrow', options: { element: popperArrowElement } }],
    placement: 'top',
  });

  const dragHook = useDrag((state) => {
    const {
      distance, elapsedTime, type, xy,
    } = state;

    if (type === 'pointerdown' && rect) {
      const pointIndex = points.findIndex((point) => (
        Math.sqrt(
          (point.x - xy[0] + rect.left) ** 2 + (point.y - xy[1] + rect.top) ** 2,
        ) <= POINT_RADIUS));

      if (pointIndex !== selectedIndex) {
        setPopperShow(false);
      }

      setSelectedIndex(pointIndex);

      setTimeoutId(setTimeout(() => {
        if (pointIndex > -1) {
          const radius = POINT_RADIUS + 20;
          const size = radius * 2;
          const { x, y } = points[pointIndex];
          domRect = new DOMRect(x + rect.x - radius, y + rect.y - radius, size, size);
          if (update) {
            update();
          }
          setPopperShow(true);
        }
      }, 250));
    }

    if (type === 'pointermove' && rect) {
      if (selectedIndex > -1) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          setTimeoutId(undefined);
        }
        setPopperShow(false);
        setPoints(points.map((point, index) => {
          if (index === selectedIndex) {
            const x = Math.max(PADDING, Math.min(xy[0] - rect.left, rect.width - PADDING));
            const y = Math.max(PADDING, Math.min(xy[1] - rect.top, rect.height - PADDING));
            return { x, y };
          }
          return point;
        }));
      }
    }

    if (type === 'pointerup' && rect) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(undefined);
      }
      const dist = Math.sqrt(distance[0] ** 2 + distance[1] ** 2);
      if (selectedIndex === -1 && elapsedTime > 250 && dist < 2) {
        setPoints([{ x: xy[0] - rect.left, y: xy[1] - rect.top }, ...points]);
        setSelectedIndex(0);
      }
    }
  }, {
    preventDefault: true,
  });

  // canvas redraw
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawBackground(ctx);
        drawPoints(ctx, points, selectedIndex);
      }
    }
  }, [points, rect, selectedIndex]);

  // window resize
  useEffect(() => {
    const onWindowResize = () => {
      const parentEl = canvasRef.current?.parentElement;
      if (parentEl) {
        const parentRect = parentEl.getBoundingClientRect();
        canvasRef.current.width = parentRect.width;
        canvasRef.current.height = parentRect.height;
        setRect(parentRect);
      }
    };
    addWindowResizeCallback(onWindowResize);
    onWindowResize();
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...dragHook(rect, 'arg')}
      />
      <div
        ref={setPopperElement}
        className={`popper ${popperShow ? 'show' : ''}`}
        style={styles.popper}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...attributes.popper}
      >
        <button
          type="button"
          onClick={() => {
            setPopperShow(false);
            setPoints(points.reduce((accumulator, point, index) => (
              selectedIndex === index ? accumulator : [...accumulator, point]
            ), [] as Point[]));
          }}
        >
          x
        </button>
        <div
          ref={setPopperArrowElement}
          className="popper-arrow"
          style={styles.arrow}
        />
      </div>
    </>
  );
}
