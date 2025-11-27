import React, { useEffect } from 'react';
import { Tool, BroadcastEventType } from '../types';
import { broadcastService } from '../services/broadcastService';
import { v4 as uuidv4 } from 'uuid';
import { useCanvas } from './hooks/useCanvas';
import { useHistory } from './hooks/useHistory';
import { useSync } from './hooks/useSync';
import { useTools } from './hooks/useTools';

interface CanvasBoardProps {
  activeTool: Tool;
  activeColor: string;
  strokeWidth: number;
  userId: string;
  userName: string;
  userColor: string;
  onCursorMove: (x: number, y: number) => void;
  svgToInject: string | null;
  onSvgInjected: () => void;
  clearTrigger: number;
  undoTrigger: number;
  redoTrigger: number;
  exportTrigger: number;
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  activeTool,
  activeColor,
  strokeWidth,
  userId,
  onCursorMove,
  svgToInject,
  onSvgInjected,
  clearTrigger,
  undoTrigger,
  redoTrigger,
  exportTrigger
}) => {
  const { canvasRef, fabricRef, isReady } = useCanvas();
  const { saveHistory, undo, redo, clearHistory, isUndoingRef } = useHistory(fabricRef);
  const { isProcessingRemoteRef } = useSync(fabricRef, userId, saveHistory, isUndoingRef);
  const { lineMessage } = useTools(fabricRef, activeTool, activeColor, strokeWidth, userId, saveHistory, isProcessingRemoteRef);

  // --- Event Listeners for Object Modification ---
  useEffect(() => {
    if (!isReady || !fabricRef.current) return;
    const canvas = fabricRef.current;

    const handlePathCreated = (e: any) => {
      if (isProcessingRemoteRef.current) return;
      const path = e.path;
      path.set({ id: uuidv4(), perPixelTargetFind: true });

      broadcastService.broadcast({
        type: BroadcastEventType.OBJECT_ADDED,
        userId,
        payload: path.toJSON(['id'])
      });
      saveHistory();
    };

    const handleObjectModified = (e: any) => {
      if (isProcessingRemoteRef.current) return;
      const obj = e.target;
      if (!obj || !obj.id) return;

      broadcastService.broadcast({
        type: BroadcastEventType.OBJECT_MODIFIED,
        userId,
        payload: {
          id: obj.id,
          data: obj.toJSON(['id'])
        }
      });
      saveHistory();
    };

    const handleObjectAdded = (e: any) => {
      if (isProcessingRemoteRef.current || isUndoingRef.current) return;
      if (e.target.type !== 'path') {
        saveHistory();
      }
    };

    const handleMouseMove = (e: any) => {
      const pointer = canvas.getPointer(e.e);
      onCursorMove(pointer.x, pointer.y);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects && activeObjects.length > 0) {
          activeObjects.forEach((obj: any) => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.renderAll();
          saveHistory();

          activeObjects.forEach((obj: any) => {
            broadcastService.broadcast({
              type: BroadcastEventType.OBJECT_REMOVED,
              userId,
              payload: { id: obj.id }
            });
          });
        }
      }
    };

    canvas.on('path:created', handlePathCreated);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:added', handleObjectAdded);
    canvas.on('mouse:move', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.off('path:created', handlePathCreated);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:added', handleObjectAdded);
      canvas.off('mouse:move', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isReady, userId, saveHistory, onCursorMove]);

  // --- Action Triggers ---
  useEffect(() => {
    if (clearTrigger > 0 && fabricRef.current) {
      fabricRef.current.clear();
      fabricRef.current.setBackgroundColor('#0f172a', () => fabricRef.current.renderAll());
      
      broadcastService.broadcast({
        type: BroadcastEventType.CLEAR,
        userId,
        payload: null
      });
      // Instead of clearing history, we save the empty state so it can be undone
      saveHistory();
    }
  }, [clearTrigger]);

  useEffect(() => {
    if (undoTrigger > 0) {
      const state = undo();
      if (state) {
        broadcastService.broadcast({
          type: BroadcastEventType.RESTORE_STATE,
          userId,
          payload: state
        });
      }
    }
  }, [undoTrigger, undo]);

  useEffect(() => {
    if (redoTrigger > 0) {
      const state = redo();
      if (state) {
        broadcastService.broadcast({
          type: BroadcastEventType.RESTORE_STATE,
          userId,
          payload: state
        });
      }
    }
  }, [redoTrigger, redo]);

  useEffect(() => {
    if (exportTrigger > 0 && fabricRef.current) {
      const dataURL = fabricRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `lumina-canvas-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [exportTrigger]);

  // --- AI SVG Injection ---
  useEffect(() => {
    if (svgToInject && fabricRef.current) {
      try {
        fabric.loadSVGFromString(svgToInject, (objects: any[], options: any) => {
          if (!objects || objects.length === 0) {
            onSvgInjected();
            return;
          }
          const obj = fabric.util.groupSVGElements(objects, options);
          
          const canvasWidth = fabricRef.current?.width || 800;
          const canvasHeight = fabricRef.current?.height || 600;

          obj.set({
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            originX: 'center',
            originY: 'center',
            id: uuidv4()
          });

          const maxSize = Math.min(canvasWidth, canvasHeight) * 0.5;
          if (obj.width > maxSize || obj.height > maxSize) {
            obj.scaleToWidth(maxSize);
          }

          fabricRef.current?.add(obj);
          fabricRef.current?.setActiveObject(obj);
          fabricRef.current?.renderAll();

          broadcastService.broadcast({
            type: BroadcastEventType.OBJECT_ADDED,
            userId,
            payload: obj.toJSON(['id'])
          });

          saveHistory();
          onSvgInjected();
        });
      } catch (error) {
        console.error('Error loading SVG:', error);
        onSvgInjected();
      }
    }
  }, [svgToInject]);

  return (
    <div
      className="relative w-full h-full"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!fabricRef.current) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (!file.type.startsWith('image/')) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            const imgData = event.target?.result as string;
            fabric.Image.fromURL(imgData, (img: any) => {
              if (!img) return;
              const canvas = fabricRef.current;
              
              // Scale and Center
              const maxSize = Math.min(canvas.width, canvas.height) * 0.5;
              if (img.width > maxSize || img.height > maxSize) {
                img.scaleToWidth(maxSize);
              }
              
              img.set({
                left: e.clientX, // Drop at cursor
                top: e.clientY,
                originX: 'center',
                originY: 'center',
                id: uuidv4()
              });

              canvas.add(img);
              canvas.setActiveObject(img);
              canvas.renderAll();

              broadcastService.broadcast({
                type: BroadcastEventType.OBJECT_ADDED,
                userId,
                payload: img.toJSON(['id'])
              });
              saveHistory();
            });
          };
          reader.readAsDataURL(file);
        }
      }}
    >
      <canvas ref={canvasRef} className="block absolute inset-0" />
      
      {/* Tooltips / Messages */}
      {lineMessage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-slate-800/80 backdrop-blur px-4 py-2 rounded-full pointer-events-none border border-slate-600 z-30 shadow-lg animate-in fade-in slide-in-from-top-4">
          {lineMessage}
        </div>
      )}
      
      <div className="absolute inset-0 pointer-events-none text-center text-slate-500/50 flex items-end justify-end p-4 text-xs">
        Drop images here • Alt+Drag to Pan • Scroll to Zoom
      </div>
    </div>
  );
};