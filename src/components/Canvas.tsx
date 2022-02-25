import React, { useEffect, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { usePopper } from 'react-popper';
import gsap from 'gsap';
import addWindowResizeCallback from '../util/windowresize';

interface Point {
  x: number;
  y: number;
  radius: number;
}

const POINT_RADIUS = 20;
const PADDING = 40;

let domRect = new DOMRect();

const virtualElement = {
  getBoundingClientRect: () => domRect,
};

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
    ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    ctx.fill();
    if (index === selectedIndex) {
      ctx.beginPath();
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 3;
      ctx.arc(point.x, point.y, point.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
};

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rect, setRect] = useState<DOMRect>();
  const [points, setPoints] = useState<Point[]>([]);
  const [isAnimating, setIsAnimating] = useState<number>(0);
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
    const { type, xy } = state;

    if (type === 'pointerdown' && rect) {
      const pointIndex = points.findIndex((point) => (
        Math.sqrt(
          (point.x - xy[0] + rect.left) ** 2 + (point.y - xy[1] + rect.top) ** 2,
        ) <= POINT_RADIUS));

      if (pointIndex !== selectedIndex) {
        setPopperShow(false);
      }

      setSelectedIndex(pointIndex);

      // grow animation
      gsap.to(points[pointIndex], {
        duration: 0.2,
        ease: 'power1.out',
        radius: POINT_RADIUS * 2,
        onUpdate: () => setIsAnimating(Math.random()),
      });

      setTimeoutId(setTimeout(() => {
        if (pointIndex > -1) {
          // select touched dot
          const radius = POINT_RADIUS + 20;
          const size = radius * 2;
          const { x, y } = points[pointIndex];
          domRect = new DOMRect(x + rect.x - radius, y + rect.y - radius, size, size);
          if (update) {
            update();
          }
          setPopperShow(true);
        } else {
          // create new dot
          const point = {
            x: xy[0] - rect.left,
            y: xy[1] - rect.top,
            radius: POINT_RADIUS,
          };
          setPoints([...points, point]);
          setSelectedIndex(points.length);

          // an intro animation
          gsap.from(point, {
            duration: 0.6,
            ease: 'power1.out',
            radius: POINT_RADIUS * 3,
            onUpdate: () => setIsAnimating(Math.random()),
          });
        }
      }, 300));
    }

    if (type === 'pointermove' && rect) {
      if (selectedIndex > -1) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          setTimeoutId(undefined);
        }
        setPopperShow(false);
        setIsAnimating(Math.random());
        const point = points[selectedIndex];
        point.x = Math.max(PADDING, Math.min(xy[0] - rect.left, rect.width - PADDING));
        point.y = Math.max(PADDING, Math.min(xy[1] - rect.top, rect.height - PADDING));
        setPoints(points);
      }
    }

    if (type === 'pointerup') {
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(undefined);
      }

      // shrink animation
      gsap.to(points[selectedIndex], {
        duration: 0.2,
        ease: 'power1.out',
        radius: POINT_RADIUS,
        onUpdate: () => setIsAnimating(Math.random()),
      });
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
  }, [isAnimating, points, rect, selectedIndex]);

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