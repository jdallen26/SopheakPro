import { create } from 'zustand';

export type ToastVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

interface ToastState {
  isOpen: boolean;
  message: string;
  variant: ToastVariant;
  title?: string;
  showToast: (data: any, variant?: ToastVariant, title?: string) => void;
  hideToast: () => void;
}

const formatMessage = (data: any): string => {
  if (typeof data === 'string') {
    return data;
  }
  // If data has an error property, use that
  if (data && typeof data === 'object' && 'error' in data) {
      return String(data.error);
  }
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return 'Could not display the data.';
  }
};

export const useToastStore = create<ToastState>((set) => ({
  isOpen: false,
  message: '',
  variant: 'primary',
  title: 'Notification',
  showToast: (data: any, variant: ToastVariant = 'primary', title: string = 'Notification') => {
      // Auto-detect error variant if data is an object with an error property
      let finalVariant = variant;
      if (variant === 'primary' && data && typeof data === 'object' && 'error' in data) {
          finalVariant = 'danger';
          title = 'Error';
      }
      
      set({ 
          isOpen: true, 
          message: formatMessage(data), 
          variant: finalVariant,
          title: title
      });
  },
  hideToast: () => set({ isOpen: false, message: '' }),
}));
