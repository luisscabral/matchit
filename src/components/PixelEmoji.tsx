// Renders an emoji to a canvas with retro color treatment
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
    ctx.font = `${resolution * 0.75}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, resolution / 2, resolution / 2 + 1);

    // Apply retro color reduction: posterize the image data
    const imageData = ctx.getImageData(0, 0, resolution, resolution);
    const data = imageData.data;
    const levels = 8; // reduce to N color levels per channel for retro palette
    const step = 255 / levels;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 10) continue; // skip transparent
      data[i]     = Math.round(data[i] / step) * step;     // R
      data[i + 1] = Math.round(data[i + 1] / step) * step; // G
      data[i + 2] = Math.round(data[i + 2] / step) * step; // B
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
