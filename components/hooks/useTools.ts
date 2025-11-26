import React, { useEffect, useRef, useState } from 'react';
import { Tool, BroadcastEventType } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { broadcastService } from '../../services/broadcastService';

export const useTools = (
  fabricRef: React.MutableRefObject<any>,
  activeTool: Tool | null,
  activeColor: string,
  strokeWidth: number,
  userId: string,
  saveHistory: () => void,
  isProcessingRemoteRef: React.MutableRefObject<boolean>
) => {
  const isDrawingLineRef = useRef(false);
  const lineStartRef = useRef<{ x: number; y: number } | null>(null);
  const [lineMessage, setLineMessage] = useState<string | null>(null);

  // Update Canvas Mode based on Tool
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    // Set drawing mode for Pen and Eraser
    canvas.isDrawingMode = activeTool === Tool.PEN || activeTool === Tool.ERASER;
    canvas.selection = activeTool === Tool.SELECT || activeTool === Tool.MOVE;
    
    // Configure cursor based on active tool
    // Using CSS cursor with better visibility
    if (activeTool === Tool.PEN) {
      canvas.defaultCursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'2\'%3E%3Cpath d=\'M12 19l7-7 3 3-7 7-3-3z\'/%3E%3Cpath d=\'M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z\'/%3E%3Cpath d=\'M2 2l7.586 7.586\'/%3E%3Ccircle cx=\'11\' cy=\'11\' r=\'2\'/%3E%3C/svg%3E") 2 18, crosshair';
      canvas.freeDrawingCursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'2\'%3E%3Cpath d=\'M12 19l7-7 3 3-7 7-3-3z\'/%3E%3Cpath d=\'M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z\'/%3E%3Cpath d=\'M2 2l7.586 7.586\'/%3E%3Ccircle cx=\'11\' cy=\'11\' r=\'2\'/%3E%3C/svg%3E") 2 18, crosshair';
    } else if (activeTool === Tool.ERASER) {
      canvas.defaultCursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23ff6b6b\' stroke-width=\'2\'%3E%3Cpath d=\'M20 20H7L3 16l10-10 8 8-1 6z\'/%3E%3Cpath d=\'M7 20l-4-4\'/%3E%3C/svg%3E") 2 18, crosshair';
      canvas.freeDrawingCursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23ff6b6b\' stroke-width=\'2\'%3E%3Cpath d=\'M20 20H7L3 16l10-10 8 8-1 6z\'/%3E%3Cpath d=\'M7 20l-4-4\'/%3E%3C/svg%3E") 2 18, crosshair';
    } else if (activeTool === Tool.MOVE) {
      canvas.defaultCursor = 'grab';
      canvas.freeDrawingCursor = 'grab';
    } else if (activeTool === Tool.SELECT) {
      canvas.defaultCursor = 'default';
      canvas.freeDrawingCursor = 'default';
    } else if (activeTool === Tool.TEXT) {
      canvas.defaultCursor = 'text';
      canvas.freeDrawingCursor = 'text';
    } else {
      canvas.defaultCursor = 'crosshair';
      canvas.freeDrawingCursor = 'crosshair';
    }

    // Configure Brushes
    if (activeTool === Tool.PEN) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = strokeWidth;
    } else if (activeTool === Tool.ERASER) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = '#0f172a'; // Background color
      canvas.freeDrawingBrush.width = strokeWidth * 10; // Eraser is larger
    }

    // Reset Line/Arrow state
    if (activeTool !== Tool.LINE && activeTool !== Tool.ARROW) {
      isDrawingLineRef.current = false;
      lineStartRef.current = null;
      setLineMessage(null);
    }

    // Object Selectability
    canvas.forEachObject((obj: any) => {
      obj.selectable = activeTool === Tool.SELECT || activeTool === Tool.MOVE;
      obj.evented = activeTool === Tool.SELECT || activeTool === Tool.MOVE || activeTool === Tool.ERASER;
    });

    canvas.requestRenderAll();
  }, [activeTool, activeColor, strokeWidth, fabricRef]);

  // Handle Mouse Events
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    const handleMouseDown = (e: any) => {
      if (isProcessingRemoteRef.current) return;
      
      const pointer = canvas.getPointer(e.e);
      const isAltKey = e.e.altKey;

      // Pan (Move) Tool
      if (activeTool === Tool.MOVE || (isAltKey && activeTool !== Tool.TEXT)) {
        canvas.isDragging = true;
        canvas.selection = false;
        canvas.lastPosX = e.e.clientX;
        canvas.lastPosY = e.e.clientY;
        return;
      }

      // Shape Tools
      if (activeTool === Tool.RECTANGLE) {
        const rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          fill: activeColor,
          width: 100,
          height: 100,
          id: uuidv4()
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        broadcastAndSave(rect);
      } else if (activeTool === Tool.CIRCLE) {
        const circle = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          fill: activeColor,
          radius: 50,
          id: uuidv4()
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
        broadcastAndSave(circle);
      } else if (activeTool === Tool.TEXT) {
        const text = new fabric.IText('Type text', {
          left: pointer.x,
          top: pointer.y,
          fill: activeColor,
          fontSize: 20,
          fontFamily: 'Inter',
          id: uuidv4()
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        broadcastAndSave(text);
      } else if (activeTool === Tool.LINE || activeTool === Tool.ARROW) {
        if (!isDrawingLineRef.current) {
          lineStartRef.current = { x: pointer.x, y: pointer.y };
          isDrawingLineRef.current = true;
          setLineMessage('Click to set end point');
        } else if (lineStartRef.current) {
          const points = [lineStartRef.current.x, lineStartRef.current.y, pointer.x, pointer.y];
          let obj;
          
          if (activeTool === Tool.ARROW) {
             const angle = Math.atan2(pointer.y - lineStartRef.current.y, pointer.x - lineStartRef.current.x);
             const headLength = 20;
             
             const line = new fabric.Line(points, {
               stroke: activeColor,
               strokeWidth: strokeWidth,
               originX: 'center',
               originY: 'center'
             });

             const head = new fabric.Triangle({
               width: headLength,
               height: headLength,
               fill: activeColor,
               left: pointer.x,
               top: pointer.y,
               originX: 'center',
               originY: 'center',
               angle: (angle * 180 / Math.PI) + 90
             });

             obj = new fabric.Group([line, head], {
               id: uuidv4(),
               selectable: true
             });
          } else {
            obj = new fabric.Line(points, {
              stroke: activeColor,
              strokeWidth: strokeWidth,
              selectable: true,
              id: uuidv4()
            });
          }
          
          canvas.add(obj);
          broadcastAndSave(obj);
          
          isDrawingLineRef.current = false;
          lineStartRef.current = null;
          setLineMessage(null);
        }
      }
    };

    const handleMouseMove = (e: any) => {
      if (canvas.isDragging) {
        const vpt = canvas.viewportTransform;
        vpt[4] += e.e.clientX - canvas.lastPosX;
        vpt[5] += e.e.clientY - canvas.lastPosY;
        canvas.requestRenderAll();
        canvas.lastPosX = e.e.clientX;
        canvas.lastPosY = e.e.clientY;
      }
    };

    const handleMouseUp = (e: any) => {
      if (canvas.isDragging) {
        canvas.setViewportTransform(canvas.viewportTransform);
        canvas.isDragging = false;
        canvas.selection = true;
      }
    };

    const handleWheel = (opt: any) => {
      if (activeTool === Tool.ZOOM || opt.e.ctrlKey) {
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      }
    };

    const broadcastAndSave = (obj: any) => {
      broadcastService.broadcast({
        type: BroadcastEventType.OBJECT_ADDED,
        userId,
        payload: obj.toJSON(['id'])
      });
      saveHistory();
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('mouse:wheel', handleWheel);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('mouse:wheel', handleWheel);
    };
  }, [activeTool, activeColor, strokeWidth, userId, fabricRef, saveHistory]);

  return { lineMessage };
};
