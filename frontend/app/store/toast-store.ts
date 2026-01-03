import { create } from 'zustand';

interface ToastState {
  isOpen: boolean;
  message: string;
  showToast: (data: any) => void;
  hideToast: () => void;
}

const formatMessage = (data: any): string => {
  if (typeof data === 'string') {
    return data;
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
  showToast: (data: any) => set({ isOpen: true, message: formatMessage(data) }),
  hideToast: () => set({ isOpen: false, message: '' }),
}));
