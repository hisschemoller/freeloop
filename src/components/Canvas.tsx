import { useCallback, useEffect, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { usePopper } from 'react-popper';
import { VirtualElement } from '@popperjs/core';
import addWindowResizeCallback from '../util/windowresize';

interface Point {
  x: number;
  y: number;
}

const POINT_RADIUS = 20;

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

export default () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rect, setRect] = useState<DOMRect>();
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [popperArrowElement, setPopperArrowElement] = useState<HTMLDivElement | null>(null);
  const [popperShow, setPopperShow] = useState<boolean>(false);

  const { attributes, styles, update } = usePopper(virtualElement, popperElement, {
    modifiers: [{ name: 'arrow', options: { element: popperArrowElement } }],
    placement: 'top',
  });

  const dragHook = useDrag((state) => {
    const { args: [ rect ], distance, elapsedTime, type, xy } = state;
    // console.log(state.type);

    if (type === 'pointerdown') {
      const pointIndex = points.findIndex((point) => (
        Math.sqrt((point.x - xy[0] + rect.left) ** 2 + (point.y - xy[1] + rect.top) ** 2) <= POINT_RADIUS));
      if (pointIndex !== selectedIndex) {
        setPopperShow(false);
      }
      setSelectedIndex(pointIndex);
    }

    if (type === 'pointermove') {
      if (selectedIndex > -1) {
        setPopperShow(false);
        setPoints(points.map((point, index) => (
          index === selectedIndex ? { x: xy[0] - rect.left, y: xy[1] - rect.top } : point
        )));
      }
    }

    if (type === 'pointerup') {
      const dist = Math.sqrt(distance[0] ** 2 + distance[1] ** 2);
      if (selectedIndex === -1 && elapsedTime > 250 && dist < 2) {
        setPoints([{ x: xy[0] - rect.left, y: xy[1] - rect.top }, ...points]);
        setSelectedIndex(0);
      }   

      if (selectedIndex > -1 && elapsedTime > 250 && dist < 2 && rect) {
        const radius = POINT_RADIUS + 20;
        const distance = radius * 2;
        const { x, y } = points[selectedIndex];
        domRect = new DOMRect(x + rect.x - radius, y + rect.y - radius, distance, distance);
        update && update();
        setPopperShow(true);
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
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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

  return <>
    <canvas
    ref = {canvasRef}
    { ...dragHook(rect, 'arg') }
    />
    <div
      ref={setPopperElement}
      className={`popper ${popperShow ? 'show' : ''}`}
      style={styles.popper}
      { ...attributes.popper }>
      <button
        onClick={() => {
          setPopperShow(false);
          setPoints(points.reduce((accumulator, point, index) => (
            selectedIndex === index ? accumulator : [ ...accumulator, point ]
          ), [] as Point[]));
        }}
        >x</button>
      <div
        ref={setPopperArrowElement}
        className="popper-arrow"
        style={styles.arrow} />
    </div>
  </>;
}
