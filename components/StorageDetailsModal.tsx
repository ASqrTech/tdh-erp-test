import React, { useEffect } from 'react';
import type { LogEntry } from '../types';
import { PROCESS_STAGES } from '../constants';

interface StorageDetailsModalProps {
    log: LogEntry;
    onClose: () => void;
}

export const StorageDetailsModal: React.FC<StorageDetailsModalProps> = ({ log, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (typeof log.details !== 'object' || !log.details.submittedData) {
        return null;
    }

    const storageData = log.details.submittedData;

    const storageStage = PROCESS_STAGES.find(s => s.id === 'storage');
    const fieldLabels = new Map(storageStage?.formFields.map(f => [f.name, f.label]));
    
    // Filter out internal fields
    const storageFieldNames = storageStage?.formFields
        .map(f => f.name)
        .filter(name => name !== 'storage_heading' && name !== 'location_sub') || [];

    const DetailItem: React.FC<{ label: string; value: any }> = ({ label, value }) => (
        <div>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="text-sm text-slate-800">{value || 'N/A'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Storage Details</h2>
                        <p className="text-sm text-slate-500">
                            Vehicle <span className="font-semibold">{storageData.entered_vehicle}</span> on {new Date(log.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full p-2 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">Storage Log</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {storageFieldNames.map(name => {
                            const label = name === 'location_main' ? 'Location' : fieldLabels.get(name) || name;
                            const value = name === 'location_main' ? storageData['location'] : storageData[name];
                             return <DetailItem key={name} label={label} value={value} />;
                        })}
                    </div>
                </div>

                 <div className="p-4 bg-slate-50 rounded-b-2xl flex justify-end">
                    <button onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};