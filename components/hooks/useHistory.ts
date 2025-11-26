import React, { useRef, useCallback } from 'react';

export const useHistory = (fabricRef: React.MutableRefObject<any>) => {
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isUndoingRef = useRef(false);

  const saveHistory = useCallback(() => {
    if (!fabricRef.current || isUndoingRef.current) return;

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
  }, [fabricRef]);

  const undo = useCallback(() => {
    if (!fabricRef.current || historyIndexRef.current <= 0) return;

    const newIndex = historyIndexRef.current - 1;
    const prevState = historyRef.current[newIndex];
    historyIndexRef.current = newIndex;

    isUndoingRef.current = true;
    fabricRef.current.loadFromJSON(prevState, () => {
      fabricRef.current.setBackgroundColor('#0f172a', () => { });
      fabricRef.current.renderAll();
      isUndoingRef.current = false;
    });
    return prevState; // Return state for broadcast
  }, [fabricRef]);

  const redo = useCallback(() => {
    if (!fabricRef.current || historyIndexRef.current >= historyRef.current.length - 1) return;

    const newIndex = historyIndexRef.current + 1;
    const nextState = historyRef.current[newIndex];
    historyIndexRef.current = newIndex;

    isUndoingRef.current = true;
    fabricRef.current.loadFromJSON(nextState, () => {
      fabricRef.current.setBackgroundColor('#0f172a', () => { });
      fabricRef.current.renderAll();
      isUndoingRef.current = false;
    });
    return nextState; // Return state for broadcast
  }, [fabricRef]);

  const clearHistory = useCallback(() => {
    if (!fabricRef.current) return;
    const emptyState = JSON.stringify(fabricRef.current.toJSON(['id']));
    historyRef.current = [emptyState];
    historyIndexRef.current = 0;
  }, [fabricRef]);

  return { saveHistory, undo, redo, clearHistory, isUndoingRef };
};
