'use client';

import { createContext, useContext, ReactNode } from 'react';
import { toast as sonnerToast, Toaster } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = (message: string, type: ToastType = 'info') => {
    switch (type) {
      case 'success':
        sonnerToast.success(message);
        break;
      case 'error':
        sonnerToast.error(message);
        break;
      case 'warning':
        sonnerToast.warning(message);
        break;
      default:
        sonnerToast(message);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster position="top-right" richColors />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
