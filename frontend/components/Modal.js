/**
 * Modal Component
 * Reusable modal for forms and dialogs
 */

import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-slate-800 rounded-xl shadow-xl max-w-3xl w-full max-h-96 overflow-y-auto border border-slate-700">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-slate-700 rounded transition-colors"
                        >
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">{children}</div>
                </div>
            </div>
        </>
    );
};

export default Modal;
