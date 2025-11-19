import React, { useEffect } from 'react';
import type { ProcessStage } from '../types';
import { useAuth } from '../hooks/useAuth';
import { FormFieldComponent } from './FormField';

interface StageDetailsModalProps {
    stage: ProcessStage;
    onClose: () => void;
}

export const StageDetailsModal: React.FC<StageDetailsModalProps> = ({ stage, onClose }) => {
    const { submitStageData } = useAuth();
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const submittedData = Object.fromEntries(formData.entries());
        submitStageData(stage, submittedData);
        onClose();
    };


    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform scale-95 transition-transform duration-300 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`p-6 rounded-t-2xl border-b-4 ${stage.color.border} ${stage.color.bg}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 rounded-xl bg-white text-slate-700 shadow">
                                {stage.icon}
                            </div>
                            <div>
                                <h2 className={`text-2xl font-bold ${stage.color.text}`}>{stage.name}</h2>
                                <p className="text-sm font-medium text-slate-600">ERP Module: {stage.erpModule}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full p-2 transition"
                            aria-label="Close modal"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-100 p-3 rounded-lg">
                            <p className="font-semibold text-slate-700">Responsible Role</p>
                            <p className="text-slate-600">{stage.responsibleRole}</p>
                        </div>
                        <div className="bg-slate-100 p-3 rounded-lg">
                            <p className="font-semibold text-slate-700">Dependent On</p>
                            <p className="text-slate-600">{stage.dependentOn}</p>
                        </div>
                         <div className="bg-slate-100 p-3 rounded-lg">
                            <p className="font-semibold text-slate-700">Output</p>
                            <p className="text-slate-600">{stage.output}</p>
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Data Entry Form</h3>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {stage.formFields.map((field) => {
                             if (field.type === 'heading') {
                                return (
                                    <div key={field.name} className="pt-4 first:pt-0">
                                        <h4 className="text-lg font-semibold text-gray-900">{field.label}</h4>
                                        <hr className="mt-1"/>
                                    </div>
                                );
                            }
                            return <FormFieldComponent key={field.name} field={field} />
                        })}
                         <div className="flex justify-end pt-4">
                            <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 transition mr-2" onClick={onClose}>Cancel</button>
                            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-700 transition">Submit Data</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
