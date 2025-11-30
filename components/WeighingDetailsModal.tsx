import React, { useEffect } from 'react';
import type { LogEntry } from '../types';

interface WeighingDetailsModalProps {
    record: LogEntry;
    onClose: () => void;
}

export const WeighingDetailsModal: React.FC<WeighingDetailsModalProps> = ({ record, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (typeof record.details !== 'object' || record.details === null) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-white rounded-lg p-6 shadow-xl">
                    <h2 class="text-xl font-bold text-red-600">Error</h2>
                    <p className="mt-2 text-slate-600">The details for this log entry are invalid or corrupted.</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">Close</button>
                </div>
            </div>
        );
    }

    const details = record.details as Record<string, any>;
    const inWeight = parseFloat(details.in_weight) || 0;
    const outWeight = parseFloat(details.out_weight) || 0;
    const netWeight = Math.abs(inWeight - outWeight);
    const netWeightQuintals = netWeight / 100;

    const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
        <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-base text-slate-800 font-semibold">{value || 'N/A'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div
                className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl transform transition-transform duration-300 scale-95 hover:scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b flex justify-between items-center bg-white rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            Weighing Ticket: <span className="font-extrabold text-red-600">{details.ticket_number}</span>
                        </h2>
                        <p className="text-sm text-slate-500">
                            Recorded on {new Date(record.timestamp).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full p-2 transition-all duration-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-8">
                        <div className="md:col-span-2 grid grid-cols-2 gap-x-8 gap-y-6 bg-white p-6 rounded-xl shadow-md">
                            <h3 className="col-span-2 text-xl font-bold text-red-700 border-b-2 border-red-200 pb-2 mb-2">Vehicle & Weight</h3>
                            <DetailItem label="Vehicle Number" value={details.vehicle_number} />
                            <DetailItem label="Sample Collector" value={details.sample_collector} />
                            <DetailItem label="InWeight (kg)" value={inWeight > 0 ? inWeight.toLocaleString() : 'N/A'} />
                            <DetailItem label="OutWeight (kg)" value={outWeight > 0 ? outWeight.toLocaleString() : 'N/A'} />
                             <div className="col-span-2 mt-2 p-4 bg-red-50 rounded-lg text-center">
                                <p className="text-sm font-medium text-red-800">Net Weight</p>
                                <p className="text-2xl font-bold text-red-900">{netWeight.toLocaleString()} kg</p>
                            </div>
                        </div>

                        
                    </div>

                     {details.note && (
                        <div className="mt-8">
                            <h3 className="text-xl font-bold text-red-700 border-b-2 border-red-200 pb-2 mb-2">Additional Notes</h3>
                            <p className="text-base text-slate-700 bg-white p-4 rounded-xl shadow-md">{details.note}</p>
                        </div>
                    )}
                </div>

                 <div className="p-4 bg-slate-100 rounded-b-2xl flex justify-end border-t">
                    <button onClick={onClose} className="bg-slate-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-slate-700 transition-colors shadow-sm">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};