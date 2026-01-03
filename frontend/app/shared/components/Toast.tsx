'use client';

import React, { useEffect } from 'react';
import { useToastStore } from '@/app/store/toast-store';

const Toast: React.FC = () => {
  const { isOpen, message, showToast, hideToast } = useToastStore();

  // Check for a pending toast message on component mount (i.e., on every page load)
  useEffect(() => {
    const pendingMessage = sessionStorage.getItem('pendingToastMessage');
    if (pendingMessage) {
      try {
        const data = JSON.parse(pendingMessage);
        showToast(data);
      } catch (e) {
        showToast({ error: "Could not parse pending toast message." });
      } finally {
        sessionStorage.removeItem('pendingToastMessage');
      }
    }
  }, [showToast]);

  // Auto-hide logic for any toast that becomes visible
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        hideToast();
      }, 5000); // Auto-hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, hideToast]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed top-5 right-5 z-[100] bg-[var(--card-bg)] text-[var(--foreground)] rounded-lg shadow-lg p-4 border border-[var(--border-color)] w-full max-w-md">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-2">Toast Notification</h3>
          {/* Added 'break-words' to handle long strings and 'overflow-x-auto' as a fallback */}
          <pre className="text-xs whitespace-pre-wrap bg-[var(--background-secondary)] p-2 rounded break-words overflow-x-auto">
            <code>{message}</code>
          </pre>
        </div>
        <button onClick={hideToast} className="ml-4 text-lg font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)]">&times;</button>
      </div>
    </div>
  );
};

export default Toast;
