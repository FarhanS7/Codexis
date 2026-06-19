'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  showToast: (type: Toast['type'], message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Overlay Stack */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[9999] max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const colors = {
    success: 'bg-emerald-950/90 border-emerald-500/25 text-emerald-200 shadow-emerald-500/10',
    error: 'bg-red-950/90 border-red-500/25 text-red-200 shadow-red-500/10',
    info: 'bg-zinc-900/95 border-white/10 text-zinc-200 shadow-black/40',
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg
        pointer-events-auto transition-all duration-300 animate-in slide-in-from-right-8 fade-in-20
        ${colors[toast.type]}
      `}
    >
      <span className="text-base leading-none select-none mt-0.5">
        {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
      </span>
      <p className="text-xs font-medium leading-relaxed flex-1">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="text-current opacity-40 hover:opacity-100 font-bold transition-opacity text-sm leading-none shrink-0"
      >
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
