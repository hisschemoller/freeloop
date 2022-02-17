import { useCallback, useEffect, useRef, useState } from 'react';
import addWindowResizeCallback from '../util/windowresize';

interface Point {
  x: number;
  y: number;
}

const POINT_RADIUS = 16;

const hasTouchEvents = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
      ctx.arc(point.x, point.y, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
};

export default () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [rect, setRect] = useState<DOMRect>();
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isOnPoint, setIsOnPoint] = useState<boolean>(false);

  const onCanvasDown = useCallback((x: number, y: number) => {
    if (rect) {
      const mousePoint = { x: x - rect.left, y: y - rect.top };
      const indexUnderMouse = points.findIndex((point) => (
        Math.sqrt((point.x - mousePoint.x) ** 2 + (point.y - mousePoint.y) ** 2) <= POINT_RADIUS));
      if (indexUnderMouse >= 0) {
        setSelectedIndex(indexUnderMouse);
      } else {
        setPoints([ mousePoint, ...points]);
        setSelectedIndex(0);
      }
    }
  }, [points, rect]);

  const onCanvasMove = useCallback((x: number, y: number) => {
    if (rect) {
      setPoints(points.map((point, index) => (
        index === selectedIndex ? { x: x - rect.left, y: y - rect.top } : point
      )));
    }
  }, [points, rect, selectedIndex]);
  
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

  return <canvas
    ref = {canvasRef}
    onMouseDown = {(e) => {
      if (!hasTouchEvents()) {
        onCanvasDown(e.clientX, e.clientY);
      }
    }}
    onMouseMove = {(e) => {
      if (!hasTouchEvents()) {
        onCanvasMove(e.clientX, e.clientY);
      }
    }}
    onTouchStart = {(e) => {
      onCanvasDown(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }}
    onTouchMove = {(e) => {
      onCanvasMove(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }}
    />;
}
