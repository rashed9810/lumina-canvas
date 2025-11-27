import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export const toastEvent = new EventTarget();

export const showToast = (message: string, type: ToastType = 'info') => {
  const event = new CustomEvent('show-toast', { detail: { message, type } });
  toastEvent.dispatchEvent(event);
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { message, type } = customEvent.detail;
      const id = Date.now().toString();

      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    toastEvent.addEventListener('show-toast', handleShowToast);
    return () => toastEvent.removeEventListener('show-toast', handleShowToast);
  }, []);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`px-4 py-2 rounded-full shadow-lg backdrop-blur-md border flex items-center gap-2 ${
              toast.type === 'success' 
                ? 'bg-green-500/20 border-green-500/30 text-green-200' 
                : toast.type === 'error'
                ? 'bg-red-500/20 border-red-500/30 text-red-200'
                : 'bg-blue-500/20 border-blue-500/30 text-blue-200'
            }`}
          >
            <i className={`fa-solid ${
              toast.type === 'success' ? 'fa-check-circle' : 
              toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'
            }`}></i>
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
