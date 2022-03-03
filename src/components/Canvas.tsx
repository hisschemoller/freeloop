import React, { useEffect, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { usePopper } from 'react-popper';
import gsap from 'gsap';
import { MdClose } from 'react-icons/md';
import addWindowResizeCallback from '../util/windowresize';

interface Point {
  x: number;
  y: number;
  radius: number;
}

interface Vector2 {
  x: number;
  y: number;
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
  const [touchOffset, setTouchOffset] = useState<Vector2>({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout>>();
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [popperArrowElement, setPopperArrowElement] = useState<HTMLDivElement | null>(null);
  const [popperShow, setPopperShow] = useState<boolean>(false);

  // popper
  const { attributes, styles, update } = usePopper(virtualElement, popperElement, {
    modifiers: [{ name: 'arrow', options: { element: popperArrowElement } }],
    placement: 'top',
  });

  // touch events
  const dragHook = useDrag((state) => {
    const { distance, type, xy } = state;

    if (type === 'pointerdown' && rect) {
      const pointIndex = points.findIndex((point) => {
        const distToPoint = Math.sqrt(
          (point.x - xy[0] + rect.left) ** 2 + (point.y - xy[1] + rect.top) ** 2,
        );
        if (distToPoint <= POINT_RADIUS) {
          // the offset between the touch and the point
          setTouchOffset({
            x: point.x - xy[0] + rect.left,
            y: point.y - xy[1] + rect.top,
          });
          return true;
        }
        return false;
      });

      if (pointIndex !== selectedIndex) {
        setPopperShow(false);
      }

      setSelectedIndex(pointIndex);

      // grow animation
      if (pointIndex > -1) {
        gsap.to(points[pointIndex], {
          duration: 0.2,
          ease: 'power1.out',
          radius: POINT_RADIUS * 2,
          onUpdate: () => setIsAnimating(Math.random()),
        });
      }

      setTimeoutId(setTimeout(() => {
        if (pointIndex > -1) {
          // open popper toolbox
          const radius = POINT_RADIUS + 20;
          const size = radius * 2;
          const { x, y } = points[pointIndex];
          domRect = new DOMRect(
            x + rect.x - radius - touchOffset.x,
            y + rect.y - radius - touchOffset.y,
            size,
            size,
          );
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
          gsap.killTweensOf(point);
          gsap.from(point, {
            duration: 0.6,
            ease: 'power1.out',
            radius: POINT_RADIUS * 3,
            onUpdate: () => setIsAnimating(Math.random()),
          });
        }
      }, 250));
    }

    if (type === 'pointermove' && rect) {
      if (selectedIndex > -1) {
        if (timeoutId) {
          const eucliDist = Math.sqrt(distance[0] ** 2 + distance[1] ** 2);
          if (eucliDist > 5) {
            clearTimeout(timeoutId);
            setTimeoutId(undefined);
            setPopperShow(false);
          }
        }
        setIsAnimating(Math.random());
        const point = points[selectedIndex];
        // eslint-disable-next-line max-len
        point.x = Math.max(PADDING, Math.min(xy[0] - rect.left + touchOffset.x, rect.width - PADDING));
        // eslint-disable-next-line max-len
        point.y = Math.max(PADDING, Math.min(xy[1] - rect.top + touchOffset.y, rect.height - PADDING));
        setPoints(points);
      }
    }

    if (type === 'pointerup') {
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(undefined);
      }

      // shrink animation
      if (selectedIndex > -1) {
        gsap.killTweensOf(points[selectedIndex]);
        gsap.to(points[selectedIndex], {
          duration: 0.2,
          ease: 'power1.out',
          radius: POINT_RADIUS,
          onUpdate: () => setIsAnimating(Math.random()),
        });
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
  }, [isAnimating, points, rect, selectedIndex]);

  // handle resize
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
        className="touch-none"
        ref={canvasRef}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...dragHook(rect, points)}
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
          <MdClose className="text-4xl" />
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
