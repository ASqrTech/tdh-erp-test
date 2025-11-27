import React from 'react';
import type { LogEntry } from '../types';
import { Modal } from './Modal';
import { TruckIcon, LocationMarkerIcon, UserIcon, DocumentTextIcon, ScaleIcon, ClockIcon, HashtagIcon } from './Icons';

interface DispatchDetailsModalProps {
    log: LogEntry;
    onClose: () => void;
}

const DetailItem = ({ icon, label, value }: { icon: JSX.Element, label: string, value: string | number | null | undefined }) => (
    <div className="flex items-start py-2">
        <div className="text-slate-500 mr-3 mt-1">{icon}</div>
        <div>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="text-sm text-slate-800 font-semibold">{value || 'N/A'}</p>
        </div>
    </div>
);

export const DispatchDetailsModal: React.FC<DispatchDetailsModalProps> = ({ log, onClose }) => {
    const details = log.details.submittedData as Record<string, any> || {};

    // Calculate Net Weight
    const grossWeight = parseFloat(details.gross_weight) || 0;
    const tareWeight = parseFloat(details.tare_weight) || 0;
    const netWeight = grossWeight > 0 && tareWeight > 0 ? (grossWeight - tareWeight).toFixed(2) : '0';

    // Extract item details
    const items = [];
    for (let i = 1; i <= 6; i++) {
        if (details[`item_${i}_name`]) {
            items.push({
                name: details[`item_${i}_name`],
                quantity: details[`item_${i}_quantity`] || 0,
            });
        }
    }

    return (
        <Modal isOpen={true} onClose={onClose} bgClassName="bg-white" containerClassName="max-w-2xl rounded-xl">
            <div className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800">Dispatch Record Details</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mt-4">
                    <DetailItem icon={<TruckIcon />} label="Vehicle Number" value={details.vehicle_number} />
                    <DetailItem icon={<LocationMarkerIcon />} label="Destination" value={details.destination} />
                    <DetailItem icon={<UserIcon />} label="Client Name" value={details.client_name} />
                    <DetailItem icon={<HashtagIcon />} label="Number of Bags" value={details.no_of_bags} />
                    <DetailItem icon={<ClockIcon />} label="Timestamp" value={new Date(log.timestamp).toLocaleString()} />
                    <DetailItem icon={<UserIcon />} label="Operator" value={log.userName} />
                </div>

                {/* Item Details Card */}
                <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-slate-700 mb-3">Item Details</h4>
                    {items.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead className="text-left text-slate-500">
                                <tr>
                                    <th className="pb-2 font-medium">Item Name</th>
                                    <th className="pb-2 font-medium text-right">Quantity (Quintal)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="py-2 font-semibold text-slate-800">{item.name}</td>
                                        <td className="py-2 text-right text-slate-700">{item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-slate-500 text-sm">No items were recorded for this dispatch.</p>
                    )}
                </div>

                {/* Weight Details Card */}
                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-slate-700 mb-3">Weight Details</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs text-slate-500">Gross Weight</p>
                            <p className="text-lg font-bold text-slate-800">{grossWeight} <span className="text-sm font-normal">Qtl</span></p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Tare Weight</p>
                            <p className="text-lg font-bold text-slate-800">{tareWeight} <span className="text-sm font-normal">Qtl</span></p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2">
                            <p className="text-xs text-red-700">Net Weight</p>
                            <p className="text-lg font-bold text-red-800">{netWeight} <span className="text-sm font-normal">Qtl</span></p>
                        </div>
                    </div>
                </div>

                {details.note && (
                    <div className="mt-4">
                        <h4 className="text-md font-semibold text-slate-700">Notes</h4>
                        <p className="text-sm text-slate-600 mt-1 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">{details.note}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};