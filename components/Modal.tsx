import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    containerClassName?: string;
    bgClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, containerClassName = 'max-w-lg', bgClassName = 'bg-white' }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-fade-in"
            onClick={onClose}
        >
            <div
                className={`${bgClassName} rounded-2xl shadow-2xl w-full ${containerClassName} max-h-[90vh] overflow-y-auto transform scale-95 transition-transform duration-300 animate-fade-in`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};
