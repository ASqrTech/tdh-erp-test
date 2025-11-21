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

    if (log.action !== 'arrival_RECORDED' || typeof log.details !== 'object') {
        return null;
    }

    const data = log.details as any;
    const isOutMode = data.gate_mode === 'out';

    const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
        <div>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="text-sm text-slate-800">{value || 'N/A'}</p>
        </div>
    );
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            Gate Entry Details ({isOutMode ? 'OUT' : 'IN'})
                        </h2>
                        <p className="text-sm text-slate-500">
                            Logged by {log.userName} on {new Date(log.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full p-2 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">Common Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem label="Serial Number" value={data.serial_number} />
                                <DetailItem label="Vehicle Number" value={data.vehicle_number} />
                                <DetailItem label="Driver Name" value={data.driver_name} />
                                <DetailItem label="Driver Phone" value={data.phone_number} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">
                                {isOutMode ? 'Outgoing Details' : 'Incoming Details'}
                            </h3>
                            {isOutMode ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <DetailItem label="Quantity" value={data.quantity} />
                                    <DetailItem label="From" value={data.from_location} />
                                    <DetailItem label="Broker Name" value={data.broker_name} />
                                    <DetailItem label="Broker Phone" value={data.broker_phone} />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <DetailItem label="From Broker" value={data.from_broker} />
                                    <DetailItem label="To" value={data.to_location} />
                                </div>
                            )}
                        </div>
                    </div>
                     {data.note && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">Notes</h3>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md">{data.note}</p>
                        </div>
                    )}
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