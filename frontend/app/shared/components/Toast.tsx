'use client';

import React, { useEffect } from 'react';
import { useToastStore, ToastVariant } from '@/app/store/toast-store';
import { X, Clipboard } from 'lucide-react';

const Toast: React.FC = () => {
  const { isOpen, message, variant, title, showToast, hideToast } = useToastStore();

  // Check for a pending toast message on component mount
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

  // Auto-hide logic
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        hideToast();
      }, 10000); // Auto-hide after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, hideToast]);

  if (!isOpen) {
    return null;
  }

  const getHeaderStyles = (variant: ToastVariant) => {
    const styles = {
        primary: { backgroundColor: '#0d6efd', color: '#fff' },
        secondary: { backgroundColor: '#6c757d', color: '#fff' },
        success: { backgroundColor: '#198754', color: '#fff' },
        danger: { backgroundColor: '#dc3545', color: '#fff' },
        warning: { backgroundColor: '#ffc107', color: '#000' },
        info: { backgroundColor: '#0dcaf0', color: '#000' },
        light: { backgroundColor: '#f8f9fa', color: '#000' },
        dark: { backgroundColor: '#212529', color: '#fff' },
    };
    return styles[variant] || styles.primary;
  };

  const handleCopyToClipboard = () => {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(message)
            .then(() => showToast('Copied to clipboard!', 'success', 'Success'))
            .catch(() => showToast('Failed to copy.', 'danger', 'Error'));
    } else {
        showToast('Clipboard access is not available.', 'warning', 'Warning');
    }
  };

  return (
    <div className="fixed top-5 right-5 z-[100] w-full max-w-[160px]">
        <div className="panel rounded-lg">
            <div 
                className="panel-heading flex justify-between items-center rounded-t-lg"
                style={getHeaderStyles(variant)}
            >
                <strong className="font-semibold" style={{ fontSize: '12px' }}>{title || 'Notification'}</strong>
                <div className="flex items-center">
                    {/* <button onClick={handleCopyToClipboard} className="opacity-75 hover:opacity-100 transition-opacity mr-2">
                        <Clipboard size={16} />
                    </button> */}
                    <button onClick={hideToast} className="opacity-75 hover:opacity-100 transition-opacity">
                        <X size={16} />
                    </button>
                </div>
            </div>
            <div className="panel-body">
                <div className="whitespace-pre-wrap break-words" style={{ fontSize: '10px', paddingLeft: '10px', paddingRight: '5px' }}>
                    {message}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Toast;
