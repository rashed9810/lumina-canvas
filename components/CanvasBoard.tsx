import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Tool, BroadcastEventType, BroadcastEvent } from '../types';
import { broadcastService } from '../services/broadcastService';
import { v4 as uuidv4 } from 'uuid';

// Fabric is loaded globally via index.html
declare const fabric: any;

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
  userName,
  userColor,
  onCursorMove,
  svgToInject,
  onSvgInjected,
  clearTrigger,
  undoTrigger,
  redoTrigger,
  exportTrigger
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const isDrawingLineRef = useRef(false);
  const lineStartRef = useRef<{ x: number; y: number } | null>(null);

  // Refs for active state to be accessible in event listeners
  const activeToolRef = useRef(activeTool);
  const activeColorRef = useRef(activeColor);
  const strokeWidthRef = useRef(strokeWidth);

  useEffect(() => {
    activeToolRef.current = activeTool;
    activeColorRef.current = activeColor;
    strokeWidthRef.current = strokeWidth;
  }, [activeTool, activeColor, strokeWidth]);

  // Refs for logic state to avoid closure issues in event listeners
  const isProcessingRemoteRef = useRef(false);
  const isUndoingRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // --- Helper: Save History (extracted for reuse) ---
  const saveHistory = useCallback(() => {
    if (!fabricRef.current || isProcessingRemoteRef.current || isUndoingRef.current) return;

    try {
      const json = JSON.stringify(fabricRef.current.toJSON(['id']));
      const currentHistory = historyRef.current;
      const currentIndex = historyIndexRef.current;

      const newHistory = currentHistory.slice(0, currentIndex + 1);
      newHistory.push(json);

      if (newHistory.length > 50) newHistory.shift();

      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }, []);

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#0f172a',
      selection: false,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
    });

    fabricRef.current = canvas;

    // Initial history state
    const initialState = JSON.stringify(canvas.toJSON(['id']));
    historyRef.current = [initialState];
    historyIndexRef.current = 0;

    const resizeCanvas = () => {
      canvas.setWidth(window.innerWidth);
      canvas.setHeight(window.innerHeight);
      canvas.renderAll();
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // --- Event Listeners ---

    canvas.on('path:created', (e: any) => {
      if (isProcessingRemoteRef.current) return;
      const path = e.path;
      path.set({ id: uuidv4(), perPixelTargetFind: true });

      broadcastService.broadcast({
        type: BroadcastEventType.OBJECT_ADDED,
        userId,
        payload: path.toJSON(['id'])
      });
      saveHistory();
    });

    canvas.on('object:modified', (e: any) => {
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
    });

    canvas.on('object:added', (e: any) => {
      // Ignore if remote, undoing, or if it's a path (handled by path:created)
      if (isProcessingRemoteRef.current || isUndoingRef.current) return;
      if (e.target.type !== 'path') {
        saveHistory();
      }
    });

    canvas.on('mouse:move', (e: any) => {
      const pointer = canvas.getPointer(e.e);
      onCursorMove(pointer.x, pointer.y);
    });

    canvas.on('mouse:down', (e: any) => {
      const tool = activeToolRef.current;
      const color = activeColorRef.current;
      const stroke = strokeWidthRef.current;

      // Skip if we are in drawing mode (PEN/ERASER) or processing remote updates
      if (canvas.isDrawingMode || isProcessingRemoteRef.current) return;

      const pointer = canvas.getPointer(e.e);

      if (tool === Tool.RECTANGLE) {
        const rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          fill: color,
          width: 100,
          height: 100,
          id: uuidv4()
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        canvas.renderAll();

        broadcastService.broadcast({
          type: BroadcastEventType.OBJECT_ADDED,
          userId,
          payload: rect.toJSON(['id'])
        });
        saveHistory();
      } else if (tool === Tool.CIRCLE) {
        const circle = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          fill: color,
          radius: 50,
          id: uuidv4()
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
        canvas.renderAll();

        broadcastService.broadcast({
          type: BroadcastEventType.OBJECT_ADDED,
          userId,
          payload: circle.toJSON(['id'])
        });
        saveHistory();
      } else if (tool === Tool.TEXT) {
        const text = new fabric.IText('Type text', {
          left: pointer.x,
          top: pointer.y,
          fill: color,
          fontSize: 20,
          fontFamily: 'Inter',
          id: uuidv4()
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        canvas.renderAll();

        broadcastService.broadcast({
          type: BroadcastEventType.OBJECT_ADDED,
          userId,
          payload: text.toJSON(['id'])
        });
        saveHistory();
      } else if (tool === Tool.LINE) {
        if (!isDrawingLineRef.current) {
          // Start point
          lineStartRef.current = { x: pointer.x, y: pointer.y };
          isDrawingLineRef.current = true;
        } else if (lineStartRef.current) {
          // End point - draw the line
          const line = new fabric.Line(
            [lineStartRef.current.x, lineStartRef.current.y, pointer.x, pointer.y],
            {
              stroke: color,
              strokeWidth: stroke,
              selectable: true,
              id: uuidv4()
            }
          );
          canvas.add(line);
          canvas.renderAll();

          broadcastService.broadcast({
            type: BroadcastEventType.OBJECT_ADDED,
            userId,
            payload: line.toJSON(['id'])
          });
          saveHistory();

          // Reset line drawing
          isDrawingLineRef.current = false;
          lineStartRef.current = null;
        }
      }
    });

    // Keyboard event handler for delete
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects && activeObjects.length > 0) {
          activeObjects.forEach(obj => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.renderAll();
          saveHistory();

          // Broadcast the deletion
          activeObjects.forEach(obj => {
            broadcastService.broadcast({
              type: BroadcastEventType.OBJECT_REMOVED,
              userId,
              payload: { id: obj.id }
            });
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [userId, onCursorMove, saveHistory]);

  // --- Sync Tool State ---
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    // Set Modes
    canvas.isDrawingMode = activeTool === Tool.PEN || activeTool === Tool.ERASER;
    canvas.selection = activeTool === Tool.SELECT;

    // Configure Brushes
    if (activeTool === Tool.PEN) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.decimate = 2; // Optimization
    } else if (activeTool === Tool.ERASER) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = '#0f172a'; // Background color
      canvas.freeDrawingBrush.width = strokeWidth * 8;
    }

    // Disable line drawing mode if switching away from LINE
    if (activeTool !== Tool.LINE) {
      isDrawingLineRef.current = false;
      lineStartRef.current = null;
    }

    // Update object interactability
    canvas.forEachObject((obj: any) => {
      obj.selectable = activeTool === Tool.SELECT;
      obj.evented = activeTool === Tool.SELECT;
    });

    canvas.requestRenderAll();
  }, [activeTool, activeColor, strokeWidth]);

  // --- Broadcast Handling ---
  useEffect(() => {
    const unsubscribe = broadcastService.subscribe((event: BroadcastEvent) => {
      if (event.userId === userId) return;
      if (!fabricRef.current) return;

      const canvas = fabricRef.current;

      if (event.type === BroadcastEventType.CLEAR) {
        isProcessingRemoteRef.current = true;
        canvas.clear();
        canvas.setBackgroundColor('#0f172a', () => canvas.renderAll());
        historyRef.current = [JSON.stringify(canvas.toJSON(['id']))];
        historyIndexRef.current = 0;
        isProcessingRemoteRef.current = false;
      }
      else if (event.type === BroadcastEventType.RESTORE_STATE) {
        isProcessingRemoteRef.current = true;
        isUndoingRef.current = true;
        canvas.loadFromJSON(event.payload, () => {
          canvas.setBackgroundColor('#0f172a', () => { });
          canvas.renderAll();
          isProcessingRemoteRef.current = false;
          isUndoingRef.current = false;
          // Sync local history ref so we can continue undoing locally if needed
          // Ideally, we just push this new state to the stack
          const json = JSON.stringify(canvas.toJSON(['id']));
          const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
          newHistory.push(json);
          historyRef.current = newHistory;
          historyIndexRef.current = newHistory.length - 1;
        });
      }
      else if (event.type === BroadcastEventType.OBJECT_ADDED) {
        isProcessingRemoteRef.current = true;
        fabric.util.enlivenObjects([event.payload], (objs: any[]) => {
          objs.forEach((obj) => {
            const exists = canvas.getObjects().find((o: any) => o.id === obj.id);
            if (!exists) canvas.add(obj);
          });
          canvas.renderAll();
          isProcessingRemoteRef.current = false;
        });
      }
      else if (event.type === BroadcastEventType.OBJECT_MODIFIED) {
        isProcessingRemoteRef.current = true;
        const { id, data } = event.payload;
        const existingObj = canvas.getObjects().find((o: any) => o.id === id);
        if (existingObj) {
          delete data.objects; // Prevent group issues
          existingObj.set(data);
          existingObj.setCoords();
          canvas.renderAll();
        }
        isProcessingRemoteRef.current = false;
      }
      else if (event.type === BroadcastEventType.OBJECT_REMOVED) {
        isProcessingRemoteRef.current = true;
        const { id } = event.payload;
        const objToRemove = canvas.getObjects().find((o: any) => o.id === id);
        if (objToRemove) {
          canvas.remove(objToRemove);
          canvas.renderAll();
        }
        isProcessingRemoteRef.current = false;
      }
    });

    return () => unsubscribe();
  }, [userId]);

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

      // Reset History
      const emptyState = JSON.stringify(fabricRef.current.toJSON(['id']));
      historyRef.current = [emptyState];
      historyIndexRef.current = 0;
    }
  }, [clearTrigger]);

  useEffect(() => {
    if (undoTrigger > 0 && historyIndexRef.current > 0) {
      const newIndex = historyIndexRef.current - 1;
      const prevState = historyRef.current[newIndex];
      historyIndexRef.current = newIndex;

      isUndoingRef.current = true;
      fabricRef.current.loadFromJSON(prevState, () => {
        fabricRef.current.setBackgroundColor('#0f172a', () => { });
        fabricRef.current.renderAll();
        isUndoingRef.current = false;

        broadcastService.broadcast({
          type: BroadcastEventType.RESTORE_STATE,
          userId,
          payload: prevState
        });
      });
    }
  }, [undoTrigger]);

  useEffect(() => {
    if (redoTrigger > 0 && historyIndexRef.current < historyRef.current.length - 1) {
      const newIndex = historyIndexRef.current + 1;
      const nextState = historyRef.current[newIndex];
      historyIndexRef.current = newIndex;

      isUndoingRef.current = true;
      fabricRef.current.loadFromJSON(nextState, () => {
        fabricRef.current.setBackgroundColor('#0f172a', () => { });
        fabricRef.current.renderAll();
        isUndoingRef.current = false;

        broadcastService.broadcast({
          type: BroadcastEventType.RESTORE_STATE,
          userId,
          payload: nextState
        });
      });
    }
  }, [redoTrigger]);

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
          try {
            if (!objects || objects.length === 0) {
              console.warn('No SVG objects were created from the provided SVG');
              onSvgInjected();
              return;
            }

            const obj = fabric.util.groupSVGElements(objects, options);

            if (!obj) {
              console.warn('Failed to group SVG elements');
              onSvgInjected();
              return;
            }

            // Center the object
            const canvasWidth = fabricRef.current?.width || 800;
            const canvasHeight = fabricRef.current?.height || 600;

            obj.set({
              left: canvasWidth / 2,
              top: canvasHeight / 2,
              originX: 'center',
              originY: 'center',
              id: uuidv4()
            });

            // Scale if too large
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
          } catch (innerError) {
            console.error('Error processing SVG objects:', innerError);
            onSvgInjected();
          }
        });
      } catch (error) {
        console.error('Error loading SVG:', error);
        onSvgInjected();
      }
    }
  }, [svgToInject]);



  // Helper function to save history - extracted for reuse (now defined as useCallback above)
  // This function is already available via the useCallback hook

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

          // Check if it's an image
          if (!file.type.startsWith('image/')) {
            alert('Please drop an image file');
            return;
          }

          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const imgData = event.target?.result as string;
              fabric.Image.fromURL(imgData, (img) => {
                if (!img) {
                  console.error('Failed to load image');
                  return;
                }

                const canvas = fabricRef.current;

                // Scale image to fit canvas
                const maxSize = Math.min(canvas.width, canvas.height) * 0.6;
                if (img.width! > maxSize || img.height! > maxSize) {
                  const scale = maxSize / Math.max(img.width!, img.height!);
                  img.scale(scale);
                }

                // Center on canvas
                img.set({
                  left: (canvas.width - img.getScaledWidth()) / 2,
                  top: (canvas.height - img.getScaledHeight()) / 2,
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
            } catch (error) {
              console.error('Error loading image:', error);
              alert('Failed to load image');
            }
          };

          reader.readAsDataURL(file);
        }
      }}
    >
      <canvas ref={canvasRef} className="block absolute inset-0" />
      {(activeTool === Tool.RECTANGLE || activeTool === Tool.CIRCLE) && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-slate-800/80 backdrop-blur px-4 py-2 rounded-full pointer-events-none border border-slate-600 z-30 shadow-lg">
          Click canvas to place shape
        </div>
      )}
      {activeTool === Tool.TEXT && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-slate-800/80 backdrop-blur px-4 py-2 rounded-full pointer-events-none border border-slate-600 z-30 shadow-lg">
          Click canvas to add text
        </div>
      )}
      {activeTool === Tool.LINE && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-slate-800/80 backdrop-blur px-4 py-2 rounded-full pointer-events-none border border-slate-600 z-30 shadow-lg">
          {isDrawingLineRef.current ? 'Click to set end point' : 'Click to set start point'}
        </div>
      )}
      <div className="absolute inset-0 pointer-events-none text-center text-slate-500/50 flex items-end justify-end p-4 text-xs">
        Drop images here to import them
      </div>
    </div>
  );
};