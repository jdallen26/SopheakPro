import { useToastStore } from '@/app/store/toast-store';

/**
 * Shows a toast notification immediately.
 */
export const toast = (data: any) => {
  useToastStore.getState().showToast(data);
};

/**
 * Saves a toast message to be displayed after the next page load.
 * Useful for showing a toast after a redirect.
 */
export const toastOnNextLoad = (data: any) => {
  try {
    const message = JSON.stringify(data);
    sessionStorage.setItem('pendingToastMessage', message);
  } catch (e) {
    sessionStorage.setItem('pendingToastMessage', JSON.stringify({ error: "Could not serialize toast data." }));
  }
};
