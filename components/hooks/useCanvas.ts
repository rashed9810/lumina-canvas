import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    console.log('Initializing Fabric Canvas...');
    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#0f172a',
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
    });

    fabricRef.current = canvas;

    const resizeCanvas = () => {
      canvas.setWidth(window.innerWidth);
      canvas.setHeight(window.innerHeight);
      canvas.renderAll();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    setIsReady(true);

    return () => {
      console.log('Disposing Fabric Canvas...');
      window.removeEventListener('resize', resizeCanvas);
      canvas.dispose();
      fabricRef.current = null;
      setIsReady(false);
    };
  }, []);

  return { canvasRef, fabricRef, isReady };
};
