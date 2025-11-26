import React, { useState } from 'react';
import { Tool } from '../types';
import { COLORS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface ToolbarProps {
  activeTool: Tool | null;
  setActiveTool: (tool: Tool) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  onAIRequest: (prompt: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  activeColor,
  setActiveColor,
  strokeWidth,
  setStrokeWidth,
  onUndo,
  onRedo,
  onClear,
  onExport,
  onAIRequest
}) => {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    await onAIRequest(aiPrompt);
    setIsGenerating(false);
    setIsAIModalOpen(false);
    setAiPrompt('');
  };

  const handleClearConfirm = () => {
    onClear();
    setIsClearModalOpen(false);
  };

  const tools = [
    { id: Tool.SELECT, icon: 'fa-arrow-pointer', label: 'Select' },
    { id: Tool.MOVE, icon: 'fa-hand', label: 'Pan' },
    { id: Tool.PEN, icon: 'fa-pen', label: 'Pen' },
    { id: Tool.ERASER, icon: 'fa-eraser', label: 'Eraser' },
    { id: Tool.RECTANGLE, icon: 'fa-square', label: 'Rectangle' },
    { id: Tool.CIRCLE, icon: 'fa-circle', label: 'Circle' },
    { id: Tool.LINE, icon: 'fa-slash', label: 'Line' },
    { id: Tool.ARROW, icon: 'fa-arrow-right', label: 'Arrow' },
    { id: Tool.TEXT, icon: 'fa-font', label: 'Text' },
  ];

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 w-full max-w-4xl px-4 pointer-events-none">
        
        {/* Main Toolbar */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-2 flex items-center gap-2 pointer-events-auto ring-1 ring-white/10 overflow-x-auto max-w-[calc(100vw-2rem)] scrollbar-hide">
          
          {/* History Controls */}
          <div className="flex items-center gap-1 pr-2 border-r border-slate-700/50">
            <button onClick={onUndo} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Undo (Ctrl+Z)">
              <i className="fa-solid fa-rotate-left"></i>
            </button>
            <button onClick={onRedo} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Redo (Ctrl+Y)">
              <i className="fa-solid fa-rotate-right"></i>
            </button>
          </div>

          {/* Tools */}
          <div className="flex items-center gap-1 px-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`p-2.5 rounded-xl transition-all duration-200 relative group ${
                  activeTool === tool.id
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={tool.label}
              >
                <i className={`fa-solid ${tool.icon}`}></i>
                {activeTool === tool.id && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
                )}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="w-px h-8 bg-slate-700/50 mx-1"></div>

          {/* Properties */}
          <div className="flex items-center gap-3 px-2">
            {/* Color Picker */}
            <div className="flex items-center gap-1 flex-wrap max-w-xs">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setActiveColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    activeColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Stroke Width */}
            <div className="w-24 px-2">
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                title={`Size: ${strokeWidth}px`}
              />
            </div>
          </div>

          {/* Separator */}
          <div className="w-px h-8 bg-slate-700/50 mx-1"></div>

          {/* Actions */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-700/50">
             <button 
              onClick={() => setIsAIModalOpen(true)}
              className="p-2 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 rounded-lg transition-colors relative group"
              title="Generate with AI"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </button>
            
            <button 
              onClick={onExport}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Export Image"
            >
              <i className="fa-solid fa-download"></i>
            </button>
            
            <button 
              onClick={() => setIsClearModalOpen(true)}
              className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors"
              title="Clear Canvas"
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>

        {/* AI Modal */}
        <AnimatePresence>
          {isAIModalOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-24 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 w-96 pointer-events-auto"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <i className="fa-solid fa-wand-magic-sparkles text-purple-400"></i>
                  Generate SVG
                </h3>
                <button onClick={() => setIsAIModalOpen(false)} className="text-slate-400 hover:text-white">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <form onSubmit={handleAISubmit}>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what you want to draw... (e.g., 'A cute cat sitting on a cloud')"
                  className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24 mb-3"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i> Generating...
                    </>
                  ) : (
                    'Generate'
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isClearModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsClearModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-md relative z-10 mx-4"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
                  <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Clear Canvas?</h3>
                <p className="text-slate-400 mb-6">
                  Are you sure you want to delete everything? This action cannot be undone and will clear the board for all users.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setIsClearModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearConfirm}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-500 transition-colors font-medium shadow-lg shadow-red-900/20"
                  >
                    Delete Everything
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};