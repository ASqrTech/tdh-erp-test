import React, { useEffect } from 'react';
import type { LogEntry } from '../types';

interface DispatchDetailsModalProps {
    log: LogEntry;
    onClose: () => void;
}

export const DispatchDetailsModal: React.FC<DispatchDetailsModalProps> = ({ log, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (typeof log.details !== 'object' || log.details === null) {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-white rounded-lg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-xl font-bold text-red-600">Error</h2>
                    <p className="mt-2 text-slate-600">The details for this log entry are invalid or corrupted.</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">Close</button>
                </div>
            </div>
        );
    }

    // Handle different data structures - check for submittedData or use details directly
    let details: Record<string, any>;
    if (typeof log.details === 'object' && log.details !== null) {
        if ('submittedData' in log.details && typeof log.details.submittedData === 'object') {
            details = log.details.submittedData as Record<string, any>;
        } else {
            details = log.details as Record<string, any>;
        }
    } else {
        details = {};
    }
    
    // Calculate Net Weight
    const grossWeight = parseFloat(details.gross_weight) || 0;
    const tareWeight = parseFloat(details.tare_weight) || 0;
    const netWeight = Math.abs(grossWeight - tareWeight);
    const netWeightQuintals = netWeight;

    // Extract item details - include type, weight, and total
    const items = [];
    for (let i = 1; i <= 10; i++) {
        if (details[`item_${i}_name`]) {
            items.push({
                name: details[`item_${i}_name`],
                type: details[`item_${i}_type`] || '-',
                quantity: details[`item_${i}_quantity`] || 0,
                weight: details[`item_${i}_weight`] || 0,
                total: details[`item_${i}_total`] || 0,
            });
        }
    }

    const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
        <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-base text-slate-800 font-semibold">{value ?? 'N/A'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto" onClick={onClose}>
            <div className="min-h-[100vh] flex items-start justify-center p-4">
                <div
                    className="relative bg-slate-50 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-2xl
                               flex flex-col max-h-[90vh] sm:max-h-[85vh] md:max-h-[75vh] overflow-hidden mx-auto my-8"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                >
                    {/* Header */}
                    <div className="p-4 sm:p-5 border-b bg-white rounded-t-2xl">
                        <div className="flex items-start justify-between gap-3">
                            {/* Title */}
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight flex-shrink">Dispatch Note</h2>
                            
                            {/* User card */}
                            <div className="bg-slate-200 px-3 py-2 sm:px-4 sm:py-3 rounded-xl shadow-md flex-shrink-0">
                                <div className="text-xs sm:text-sm whitespace-nowrap">
                                    User: <span className="font-semibold">{log.userName ?? log.userId}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Body: scrollable area */}
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
                        <div className="flex flex-col gap-4 sm:gap-6">
                            {/* Vehicle & Client Details */}
                            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                                <h3 className="text-lg sm:text-xl font-bold text-red-700 border-b-2 border-red-200 pb-2 mb-3 sm:mb-4">Dispatch Details</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <DetailItem label="Vehicle Number" value={details.vehicle_number?.toUpperCase()} />
                                    <DetailItem label="Driver Name" value={details.driver_name} />
                                    <DetailItem label="Client Name" value={details.client_name} />
                                    <DetailItem label="Destination" value={details.destination} />
                                </div>
                            </div>

                            {/* Timestamp */}
                            <div className="w-full">
                                <p className="text-base text-slate-700 bg-white p-4 rounded-xl shadow-md break-words">
                                    Recorded: {new Date(log.timestamp).toLocaleString('en-US', {
                                        dateStyle: 'full',
                                        timeStyle: 'short',
                                    })}
                                </p>
                            </div>

                            {/* Item Details */}
                            {items.length > 0 && (
                                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                                    <h3 className="text-lg sm:text-xl font-bold text-red-700 border-b-2 border-red-200 pb-2 mb-3 sm:mb-4">Item Details</h3>
                                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                                        <div className="inline-block min-w-full align-middle">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                    <tr>
                                                        <th className="p-2 text-left">Item Name</th>
                                                        <th className="p-2 text-left">Type</th>
                                                        <th className="p-2 text-right">Qty</th>
                                                        <th className="p-2 text-right">Wt (ql)</th>
                                                        <th className="p-2 text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {items.map((item, index) => (
                                                        <tr key={index} className="hover:bg-slate-50">
                                                            <td className="p-2 font-semibold text-slate-800">{item.name}</td>
                                                            <td className="p-2 text-slate-600">{item.type}</td>
                                                            <td className="p-2 text-right text-slate-700">{item.quantity}</td>
                                                            <td className="p-2 text-right text-slate-700">{item.weight}</td>
                                                            <td className="p-2 text-right font-bold text-slate-800">{item.total}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Weight Details */}
                            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                                <h3 className="text-lg sm:text-xl font-bold text-red-700 border-b-2 border-red-200 pb-2 mb-3 sm:mb-4">Weight Details</h3>

                                <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                                    <DetailItem label="In weight (ql)" value={grossWeight > 0 ? grossWeight.toLocaleString() : 'N/A'} />
                                    <DetailItem label="Out weight (ql)" value={tareWeight > 0 ? tareWeight.toLocaleString() : 'N/A'} />
                                </div>

                                {/* Net Weight Highlight */}
                                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 sm:p-4 text-center">
                                    <p className="text-xs sm:text-sm font-medium text-red-700 mb-1">Net Weight</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-red-800">{netWeightQuintals} <span className="text-base sm:text-lg">Quintals</span></p>
                                </div>
                            </div>

                            {/* Notes */}
                            {details.note && (
                                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                                    <h3 className="text-lg sm:text-xl font-bold text-red-700 border-b-2 border-red-200 pb-2 mb-3 sm:mb-4">Notes / Remarks</h3>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{details.note}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer with Close Button */}
                    <div className="p-4 border-t bg-white rounded-b-2xl">
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 sm:py-3 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors shadow-md"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};