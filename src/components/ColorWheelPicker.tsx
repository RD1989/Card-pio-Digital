import { useRef, useEffect, useState, useCallback } from 'react';

interface ColorWheelPickerProps {
  value: string;
  onChange: (color: string) => void;
  size?: number;
}

export const ColorWheelPicker = ({ value, onChange, size = 200 }: ColorWheelPickerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [markerPos, setMarkerPos] = useState({ x: size / 2, y: size / 2 });

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 4;

    // Limpa
    ctx.clearRect(0, 0, size, size);

    // Desenha o círculo de cor (roda HSL)
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = (angle + 1) * Math.PI / 180;

      // Gradiente do centro (branco) para a borda (cor saturada)
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      );
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.65, `hsl(${angle}, 100%, 50%)`);
      gradient.addColorStop(1, `hsl(${angle}, 100%, 25%)`);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Borda circular suave
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [size]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  // Posicionar o marker inicialmente com base na cor atual
  useEffect(() => {
    if (!isDragging) {
      // Tenta encontrar a posição na roda para a cor atual
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Busca pixel a pixel (otimizado: procura em espiral do centro)
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 4;
      
      // Parse hex to RGB
      const r = parseInt(value.slice(1, 3), 16);
      const g = parseInt(value.slice(3, 5), 16);
      const b = parseInt(value.slice(5, 7), 16);
      
      // Convert to HSL to find position
      const rn = r / 255, gn = g / 255, bn = b / 255;
      const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
      let h = 0;
      const l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        const s = l > 0.5 ? d / (2 - max - min) : d / (max - min);
        switch (max) {
          case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
          case gn: h = ((bn - rn) / d + 2) / 6; break;
          case bn: h = ((rn - gn) / d + 4) / 6; break;
        }
        
        const angle = h * 360 * Math.PI / 180;
        const dist = Math.min(s * 0.7 + (1 - l) * 0.3, 1) * radius;
        
        setMarkerPos({
          x: centerX + Math.cos(angle) * dist,
          y: centerY + Math.sin(angle) * dist
        });
      }
    }
  }, [value, size, isDragging]);

  const getColorAtPosition = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return value;
    const ctx = canvas.getContext('2d');
    if (!ctx) return value;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 4;
    
    // Verifica se está dentro do círculo
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > radius) {
      // Clamp para a borda
      const clampedX = centerX + (dx / dist) * radius;
      const clampedY = centerY + (dy / dist) * radius;
      x = clampedX;
      y = clampedY;
    }

    const pixel = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(c => c.toString(16).padStart(2, '0')).join('');
    return hex;
  };

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = size / rect.width;
    const scaleY = size / rect.height;
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    let x = (clientX - rect.left) * scaleX;
    let y = (clientY - rect.top) * scaleY;

    // Clamp dentro do círculo
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 4;
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > radius) {
      x = centerX + (dx / dist) * radius;
      y = centerY + (dy / dist) * radius;
    }

    setMarkerPos({ x, y });
    const color = getColorAtPosition(x, y);
    onChange(color);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleInteraction(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleInteraction(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleInteraction(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isDragging) handleInteraction(e);
  };

  return (
    <div 
      className="relative select-none touch-none"
      style={{ width: size, height: size }}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full cursor-crosshair w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      />
      {/* Marker */}
      <div
        className="absolute w-6 h-6 rounded-full border-[3px] border-white shadow-[0_0_0_2px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.4)] pointer-events-none transition-[left,top] duration-75"
        style={{
          left: `${(markerPos.x / size) * 100}%`,
          top: `${(markerPos.y / size) * 100}%`,
          transform: 'translate(-50%, -50%)',
          backgroundColor: value,
        }}
      />
    </div>
  );
};
