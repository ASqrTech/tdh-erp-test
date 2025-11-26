import React, { useEffect } from 'react';
import type { LogEntry } from '../types';

interface GateEntryDetailsModalProps {
    log: LogEntry;
    onClose: () => void;
}

export const GateEntryDetailsModal: React.FC<GateEntryDetailsModalProps> = ({ log, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // CRITICAL FIX: Check if log.details is a valid object before using it.
    if (typeof log.details !== 'object' || log.details === null) {
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

    // It's now safe to cast and use the details object.
    const details = log.details as Record<string, any>;
    const isOutMode = details.gate_mode === 'out';

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
                            Gate Entry: <span className={`uppercase font-extrabold ${isOutMode ? 'text-red-600' : 'text-green-600'}`}>{details.gate_mode}</span>
                        </h2>
                        <p className="text-sm text-slate-500">
                            Recorded on {new Date(log.timestamp).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full p-2 transition-all duration-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 grid grid-cols-2 gap-x-8 gap-y-6 bg-white p-6 rounded-xl shadow-md">
                            <h3 className="col-span-2 text-xl font-bold text-red-700 border-b-2 border-red-200 pb-2 mb-2">Vehicle & Driver Information</h3>
                            <DetailItem label="Vehicle Number" value={details.vehicle_number} />
                            <DetailItem label="Serial Number" value={details.serial_number} />
                            <DetailItem label="Driver Name" value={details.driver_name} />
                            <DetailItem label="Driver Phone" value={details.phone_number} />
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md">
                             <h3 className="text-xl font-bold text-red-700 border-b-2 border-red-200 pb-2 mb-2">Transaction</h3>
                            {isOutMode ? (
                                <div className="space-y-4">
                                    <DetailItem label="Quantity" value={details.quantity} />
                                    <DetailItem label="From Location" value={details.from_location} />
                                    <DetailItem label="Broker Name" value={details.broker_name} />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <DetailItem label="Challan Number" value={details.challan_number} />
                                    <DetailItem label="From (Broker)" value={details.from_broker} />
                                    <DetailItem label="To Location" value={details.to_location} />
                                </div>
                            )}
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