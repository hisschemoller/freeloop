import { useCallback, useEffect, useRef, useState } from 'react';
import addWindowResizeCallback from '../util/windowresize';

interface Point {
  x: number;
  y: number;
}

const drawPoints = (ctx: CanvasRenderingContext2D, points: Point[]) => {
  ctx.fillStyle = '#666666';
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 16, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawCanvas = (canvas: HTMLCanvasElement | null, points: Point[]) => {
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawPoints(ctx, points);
    }
  }
};

export default () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [rect, setRect] = useState<DOMRect>();

  const onCanvasMousedown = useCallback((e: MouseEvent) => {
    if (rect) {
      setPoints([ ...points, { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      drawCanvas(canvasRef.current, points);
    }
  }, [rect]);
  
  useEffect(() => drawCanvas(canvasRef.current, points), [points]);

  useEffect(() => {
    const onWindowResize = () => {
      const parentEl = canvasRef.current?.parentElement;
      if (parentEl) {
        const parentRect = parentEl.getBoundingClientRect();
        canvasRef.current.width = parentRect.width;
        canvasRef.current.height = parentRect.height;
        setRect(parentRect);
        drawCanvas(canvasRef.current, points);
      }
    };
    addWindowResizeCallback(onWindowResize);
    onWindowResize();
  }, []);

  return <canvas
    ref = {canvasRef}
    onMouseDown = {(e) => onCanvasMousedown(e.nativeEvent)}
    />;
}
