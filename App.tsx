import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { uniqueNamesGenerator, adjectives, colors as nameColors, animals } from 'unique-names-generator';
import { CanvasBoard } from './components/CanvasBoard';
import { Toolbar } from './components/Toolbar';
import { CursorOverlay } from './components/CursorOverlay';
import { Tool, UserCursor, BroadcastEventType, BroadcastEvent } from './types';
import { COLORS } from './constants';
import { broadcastService } from './services/broadcastService';
import { generateSVGFromPrompt } from './services/geminiService';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [activeColor, setActiveColor] = useState<string>(COLORS[4]); // Default blue
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, UserCursor>>({});
  
  // Action Triggers
  const [clearTrigger, setClearTrigger] = useState(0);
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [redoTrigger, setRedoTrigger] = useState(0);
  const [exportTrigger, setExportTrigger] = useState(0);
  
  const [svgToInject, setSvgToInject] = useState<string | null>(null);

  // User Identity
  const userId = useMemo(() => uuidv4(), []);
  const userName = useMemo(() => uniqueNamesGenerator({ dictionaries: [adjectives, animals], separator: ' ' }), []);
  const userColor = useMemo(() => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  useEffect(() => {
    const handleBroadcast = (event: BroadcastEvent) => {
      if (event.type === BroadcastEventType.CURSOR_MOVE) {
        setRemoteCursors(prev => ({
          ...prev,
          [event.userId]: {
            ...event.payload,
            id: event.userId,
            lastUpdate: Date.now()
          }
        }));
      }
    };

    const unsubscribe = broadcastService.subscribe(handleBroadcast);

    // Cleanup old cursors
    const interval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(key => {
          if (now - next[key].lastUpdate > 5000) {
            delete next[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          setUndoTrigger(prev => prev + 1);
        } else if (e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          setRedoTrigger(prev => prev + 1);
        } else if (e.key === 'y') {
          e.preventDefault();
          setRedoTrigger(prev => prev + 1);
        } else if (e.key === 's') {
          e.preventDefault();
          setExportTrigger(prev => prev + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCursorMove = (x: number, y: number) => {
    broadcastService.broadcast({
      type: BroadcastEventType.CURSOR_MOVE,
      userId,
      payload: { x, y, name: userName, color: userColor }
    });
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the canvas for everyone?')) {
      setClearTrigger(prev => prev + 1);
    }
  };

  const handleAIRequest = async (prompt: string) => {
    try {
      if (!prompt || prompt.trim().length === 0) return;
      const svg = await generateSVGFromPrompt(prompt);
      if (svg) {
        setSvgToInject(svg);
      } else {
        alert("Could not generate image. Please check your Gemini API key is set in .env.local and try again.");
      }
    } catch (error) {
      console.error('Error in AI request:', error);
      alert("Error generating image. Please try again later.");
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-900 overflow-hidden relative text-slate-200 select-none font-sans">
      
      {/* Header / Status */}
      <div className="absolute top-6 left-6 z-40 pointer-events-none">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3 drop-shadow-lg">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-x">
            Lumina
          </span>
          <span className="text-slate-400 text-xs font-medium border border-slate-600/50 bg-slate-800/50 px-2 py-0.5 rounded-full backdrop-blur-sm">Beta 2.0</span>
        </h1>
        <div className="mt-2 flex items-center gap-2 opacity-80 text-sm bg-slate-800/40 backdrop-blur-md px-3 py-1.5 rounded-full w-max border border-slate-700/30">
           <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
           <span>Online as <strong style={{color: userColor}}>{userName}</strong></span>
           <span className="text-slate-600 mx-1">•</span>
           <span className="text-slate-400 text-xs">{Object.keys(remoteCursors).length} active</span>
        </div>
      </div>
      
      {/* Collaboration Hint */}
      <div className="absolute top-6 right-6 z-40 max-w-xs text-right pointer-events-none opacity-60 hover:opacity-100 transition-opacity">
         <p className="text-xs text-slate-400 bg-slate-800/40 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700/30">
           Open in new tab to test sync <i className="fa-solid fa-arrow-up-right-from-square ml-1"></i>
         </p>
      </div>

      <CanvasBoard 
        activeTool={activeTool}
        activeColor={activeColor}
        strokeWidth={strokeWidth}
        userId={userId}
        userName={userName}
        userColor={userColor}
        onCursorMove={handleCursorMove}
        svgToInject={svgToInject}
        onSvgInjected={() => setSvgToInject(null)}
        clearTrigger={clearTrigger}
        undoTrigger={undoTrigger}
        redoTrigger={redoTrigger}
        exportTrigger={exportTrigger}
      />

      <CursorOverlay 
        cursors={remoteCursors} 
        currentUserId={userId} 
      />

      <Toolbar 
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        onUndo={() => setUndoTrigger(p => p + 1)} 
        onRedo={() => setRedoTrigger(p => p + 1)} 
        onClear={handleClear}
        onExport={() => setExportTrigger(p => p + 1)}
        onAIRequest={handleAIRequest}
      />
    </div>
  );
};

export default App;