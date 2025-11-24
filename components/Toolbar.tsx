import React, { useState } from 'react';
import { COLORS } from '../constants';
import { Tool as ToolEnum } from '../types';
import { motion } from 'framer-motion';

interface ToolbarProps {
  activeTool: ToolEnum;
  setActiveTool: (tool: ToolEnum) => void;
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
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPrompt = aiPrompt.trim();
    
    if (!trimmedPrompt) {
      alert('Please enter a description for the image');
      return;
    }
    
    if (trimmedPrompt.length > 500) {
      alert('Description must be less than 500 characters');
      return;
    }
    
    setIsGenerating(true);
    try {
      await onAIRequest(trimmedPrompt);
      setAiPrompt('');
      setIsAIOpen(false);
    } catch (error) {
      console.error('Error in AI request:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const tools = [
    { id: ToolEnum.SELECT, icon: 'fa-arrow-pointer', label: 'Select' },
    { id: ToolEnum.PEN, icon: 'fa-pen', label: 'Pen' },
    { id: ToolEnum.RECTANGLE, icon: 'fa-square', label: 'Rectangle' },
    { id: ToolEnum.CIRCLE, icon: 'fa-circle', label: 'Circle' },
    { id: ToolEnum.LINE, icon: 'fa-slash', label: 'Line' },
    { id: ToolEnum.TEXT, icon: 'fa-text', label: 'Text' },
    { id: ToolEnum.ERASER, icon: 'fa-eraser', label: 'Eraser' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-4 items-center z-50 pointer-events-none">
      
      {/* AI Popup */}
      {isAIOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="bg-slate-800/90 backdrop-blur-lg p-4 rounded-2xl shadow-2xl border border-slate-700 pointer-events-auto w-80 mb-2"
        >
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-purple-400"></i> 
            AI Generator
          </h3>
          <form onSubmit={handleAISubmit}>
            <input 
              type="text" 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value.slice(0, 500))}
              placeholder="E.g., A glowing futuristic tree..."
              maxLength={500}
              className="w-full bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm mb-2"
              disabled={isGenerating}
              autoFocus
            />
            <div className="text-xs text-slate-500 mb-3">
              {aiPrompt.length}/500 characters
            </div>
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsAIOpen(false)}
                disabled={isGenerating}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isGenerating || !aiPrompt.trim()}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    Generating...
                  </>
                ) : 'Generate'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Main Toolbar */}
      <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-2 flex items-center gap-3 pointer-events-auto">
        
        {/* Tools */}
        <div className="flex bg-slate-900/50 rounded-xl p-1 gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all relative group ${
                activeTool === tool.id 
                  ? 'bg-slate-700 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              title={tool.label}
            >
              <i className={`fa-solid ${tool.icon}`}></i>
              {activeTool === tool.id && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute bottom-1 w-1 h-1 bg-white rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        <div className="w-px h-8 bg-slate-700 mx-1"></div>

        {/* Stroke Width */}
        <div className="flex flex-col justify-center w-24 px-2">
          <label className="text-[10px] text-slate-400 font-medium mb-1">Size: {strokeWidth}px</label>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>

        <div className="w-px h-8 bg-slate-700 mx-1"></div>

        {/* Colors */}
        <div className="flex gap-1.5 items-center">
          {COLORS.slice(0, 5).map((color) => (
            <button
              key={color}
              onClick={() => setActiveColor(color)}
              className={`w-6 h-6 rounded-full transition-transform border border-slate-600 ${
                activeColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-800' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <div className="relative group">
            <button className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center text-[10px] text-white border border-slate-600">
              <i className="fa-solid fa-plus"></i>
            </button>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 p-2 rounded-lg shadow-xl grid grid-cols-3 gap-1 hidden group-hover:grid w-max border border-slate-700">
              {COLORS.slice(5).map((color) => (
                <button
                  key={color}
                  onClick={() => setActiveColor(color)}
                  className="w-6 h-6 rounded-full border border-slate-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-700 mx-1"></div>

        {/* Actions */}
        <div className="flex gap-1">
          <button onClick={onUndo} className="w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 flex items-center justify-center transition-colors" title="Undo">
            <i className="fa-solid fa-rotate-left"></i>
          </button>
          <button onClick={onRedo} className="w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 flex items-center justify-center transition-colors" title="Redo">
            <i className="fa-solid fa-rotate-right"></i>
          </button>
          <button onClick={onExport} className="w-9 h-9 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 flex items-center justify-center transition-colors" title="Export">
            <i className="fa-solid fa-download"></i>
          </button>
          <button onClick={onClear} className="w-9 h-9 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 flex items-center justify-center transition-colors" title="Clear Canvas">
            <i className="fa-solid fa-trash"></i>
          </button>
          <button 
            onClick={() => setIsAIOpen(!isAIOpen)} 
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isAIOpen ? 'bg-purple-600 text-white' : 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/20'}`} 
            title="AI Generation"
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </button>
        </div>

      </div>
    </div>
  );
};