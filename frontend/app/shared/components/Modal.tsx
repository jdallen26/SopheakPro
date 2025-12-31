import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-card text-card-foreground rounded-lg shadow-lg w-1/2 max-w-4xl">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
            &times;
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
        <div className="p-4 border-t border-border flex justify-end space-x-2">
          {footer}
        </div>
      </div>
    </div>
  );
};

export default Modal;

