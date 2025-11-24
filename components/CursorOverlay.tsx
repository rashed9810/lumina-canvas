import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCursor } from '../types';

interface CursorOverlayProps {
  cursors: Record<string, UserCursor>;
  currentUserId: string;
}

export const CursorOverlay: React.FC<CursorOverlayProps> = ({ cursors, currentUserId }) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {(Object.values(cursors) as UserCursor[]).map((cursor) => {
          if (cursor.id === currentUserId) return null;
          
          return (
            <motion.div
              key={cursor.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                x: cursor.x, 
                y: cursor.y, 
                opacity: 1, 
                scale: 1 
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 200,
                mass: 0.5
              }}
              className="absolute top-0 left-0 flex flex-col items-start"
            >
              {/* Cursor SVG */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-md"
              >
                <path
                  d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L17.9169 12.3673H5.65376Z"
                  fill={cursor.color}
                  stroke="white"
                  strokeWidth="1"
                />
              </svg>
              
              {/* Name Label */}
              <div 
                className="ml-4 mt-1 px-2 py-1 rounded-md text-xs font-bold text-white shadow-md whitespace-nowrap"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.name}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};