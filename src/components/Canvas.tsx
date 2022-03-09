import React, { useEffect, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import gsap from 'gsap';
import addWindowResizeCallback from '../util/windowresize';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { addNote, dragNote, selectNote } from '../features/notesSlice';
import { positionToolBox, showToolBox } from '../features/toolBoxSlice';

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
  const dispatch = useAppDispatch();
  const { notes, selectedIndex } = useAppSelector((state) => state.notes);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rect, setRect] = useState<DOMRect>();
  const [points, setPoints] = useState<Point[]>([]);
  const [touchOffset, setTouchOffset] = useState<Vector2>({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState<number>(0);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout>>();

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
        dispatch(showToolBox(false));
      }

      dispatch(selectNote(pointIndex));

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
          dispatch(positionToolBox({
            x: points[pointIndex].x + POINT_RADIUS,
            y: points[pointIndex].y - PADDING,
            size: (POINT_RADIUS + 20) * 2,
          }));
          dispatch(showToolBox(true));
        } else {
          // create new note
          dispatch(addNote({
            x: (xy[0] - rect.left - PADDING) / (rect.width - (PADDING * 2)),
            y: (xy[1] - rect.top - PADDING) / (rect.height - (PADDING * 2)),
          }));

          // an intro animation
          // gsap.killTweensOf(point);
          // gsap.from(point, {
          //   duration: 0.6,
          //   ease: 'power1.out',
          //   radius: POINT_RADIUS * 3,
          //   onUpdate: () => setIsAnimating(Math.random()),
          // });
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
            dispatch(showToolBox(false));
          }
        }
        const x = (xy[0] - rect.left + touchOffset.x - PADDING) / (rect.width - (PADDING * 2));
        const y = (xy[1] - rect.top + touchOffset.y - PADDING) / (rect.height - (PADDING * 2));
        dispatch(dragNote({
          x: Math.max(0, Math.min(x, 1)),
          y: Math.max(0, Math.min(y, 1)),
        }));
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
    if (canvasRef.current && rect) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const newPoints = notes.map((note) => ({
          radius: POINT_RADIUS,
          x: PADDING + (note.pitch * (rect.width - (PADDING * 2))),
          y: PADDING + (note.time * (rect.height - (PADDING * 2))),
        }));
        setPoints(newPoints);
        drawBackground(ctx);
        drawPoints(ctx, newPoints, selectedIndex);
      }
    }
  }, [isAnimating, notes, rect, selectedIndex]);

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
    <canvas
      className="touch-none"
      ref={canvasRef}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...dragHook(rect, points)}
    />
  );
}
