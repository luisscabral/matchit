// Renders an emoji to a canvas with retro color treatment and black pixel outline
// Higher resolution than pure pixel art, but with retro color palette feel

import { useRef, useEffect } from 'react';

interface PixelEmojiProps {
  emoji: string;
  size?: number | string;
  resolution?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function PixelEmoji({ emoji, size = 64, resolution = 32, className = '', style = {} }: PixelEmojiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = resolution;
    canvas.height = resolution;

    ctx.clearRect(0, 0, resolution, resolution);
    ctx.font = `${resolution * 0.65}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, resolution / 2, resolution / 2 + 1);

    // Read pixel data
    const imageData = ctx.getImageData(0, 0, resolution, resolution);
    const data = imageData.data;
    const w = resolution;
    const h = resolution;

    // Build alpha mask: true if pixel is non-transparent
    const isOpaque = (x: number, y: number) => {
      if (x < 0 || x >= w || y < 0 || y >= h) return false;
      return data[(y * w + x) * 4 + 3] > 20;
    };

    // Find outline pixels: transparent pixels adjacent to opaque ones
    const outlinePixels: [number, number][] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (isOpaque(x, y)) continue; // skip filled pixels
        // Check 4-connected neighbors
        if (isOpaque(x - 1, y) || isOpaque(x + 1, y) || isOpaque(x, y - 1) || isOpaque(x, y + 1)) {
          outlinePixels.push([x, y]);
        }
      }
    }

    // Posterize colors for retro palette
    const levels = 8;
    const step = 255 / levels;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 10) continue;
      data[i]     = Math.round(data[i] / step) * step;
      data[i + 1] = Math.round(data[i + 1] / step) * step;
      data[i + 2] = Math.round(data[i + 2] / step) * step;
    }

    // Draw black outline pixels
    for (const [x, y] of outlinePixels) {
      const idx = (y * w + x) * 4;
      data[idx]     = 0;   // R
      data[idx + 1] = 0;   // G
      data[idx + 2] = 0;   // B
      data[idx + 3] = 220; // A (slightly transparent for softer look)
    }

    ctx.putImageData(imageData, 0, 0);
  }, [emoji, resolution]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        ...style,
      }}
    />
  );
}
