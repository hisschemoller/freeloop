import { useEffect, useRef, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

const drawPoints = (ctx: CanvasRenderingContext2D, points: Point[]) => {
  ctx.fillStyle = '#333333';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#666666';
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
    ctx.fill();
  });
};

export default () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [dimensions, setDimensions] = useState({ 
    height: window.innerHeight,
    width: window.innerWidth,
  });
  
  useEffect(() => drawCanvas(), [points]);

  useEffect(() => {
    function handleResize() {
      setDimensions({ height: window.innerHeight, width: window.innerWidth });
      
    }
    window.addEventListener('resize', handleResize);
  })

  const drawCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawPoints(ctx, points);
      }
    }
  };

  return <canvas
    ref={canvasRef}
    onClick={(e) => {
      setPoints([ ...points, { x: e.clientX, y: e.clientY }]);
      drawCanvas();
    }}
    />;
}
