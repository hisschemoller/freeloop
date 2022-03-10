import React, { useEffect, useRef, useState } from 'react';
import addWindowResizeCallback from '../util/windowresize';

const PADDING = 40;

const drawBackground = (ctx: CanvasRenderingContext2D) => {
  const { width, height } = ctx.canvas;
  ctx.beginPath();
  ctx.fillStyle = '#333333';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#666666';
  ctx.strokeRect(PADDING, PADDING, width - (PADDING * 2), height - (PADDING * 2));
};

export default function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rect, setRect] = useState<DOMRect>();

  // canvas redraw
  useEffect(() => {
    if (canvasRef.current && rect) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawBackground(ctx);
      }
    }
  }, [rect]);

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
      ref={canvasRef}
      className="absolute touch-none z-0"
    />
  );
}
