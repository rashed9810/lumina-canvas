import React, { useEffect, useRef } from 'react';
import { broadcastService } from '../../services/broadcastService';
import { BroadcastEventType, BroadcastEvent } from '../../types';

export const useSync = (
  fabricRef: React.MutableRefObject<any>,
  userId: string,
  saveHistory: () => void,
  isUndoingRef: React.MutableRefObject<boolean>
) => {
  const isProcessingRemoteRef = useRef(false);

  useEffect(() => {
    const unsubscribe = broadcastService.subscribe((event: BroadcastEvent) => {
      if (event.userId === userId) return;
      if (!fabricRef.current) return;

      const canvas = fabricRef.current;

      if (event.type === BroadcastEventType.CLEAR) {
        isProcessingRemoteRef.current = true;
        canvas.clear();
        canvas.setBackgroundColor('#0f172a', () => canvas.renderAll());
        saveHistory();
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
          saveHistory();
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
          saveHistory();
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
        saveHistory();
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
        saveHistory();
      }
    });

    return () => unsubscribe();
  }, [userId, fabricRef, saveHistory, isUndoingRef]);

  return { isProcessingRemoteRef };
};
