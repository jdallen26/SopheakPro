'use client';
import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({isOpen, onClose, title, children, footer}) => {
    const [isBrowser, setIsBrowser] = useState(false);

    useEffect(() => {
        setIsBrowser(true);
    }, []);

    if (!isOpen) {
        return null;
    }

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className="bg-[var(--card-bg)] text-[var(--foreground)] rounded-lg shadow-lg w-full max-w-[400px] border border-[var(--border-color)]">
                <div
                    className="px-6 border-b border-[var(--border-color)] flex justify-between items-center popup-shell">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button onClick={onClose} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                        &times;
                    </button>
                </div>
                <hr className="border-[var(--border-color)]"/>
                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto popup-shell">
                    {children}
                </div>
                <hr className="border-[var(--border-color)]"/>
                <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end space-x-2 popup-shell">
                    {footer}
                </div>
            </div>
        </div>
    );

    if (isBrowser) {
        const modalRoot = document.getElementById('modal-root');
        if (modalRoot) {
            return ReactDOM.createPortal(modalContent, modalRoot);
        }
    }

    return null;
};

export default Modal;
