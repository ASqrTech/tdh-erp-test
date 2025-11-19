import React, { useEffect, useMemo } from 'react';
import type { LogEntry } from '../types';
import { PROCESS_STAGES } from '../constants';
import { useAuth } from '../hooks/useAuth';

interface WeighingDetailsModalProps {
    log: LogEntry;
    onClose: () => void;
}

export const WeighingDetailsModal: React.FC<WeighingDetailsModalProps> = ({ log, onClose }) => {
    const { logs } = useAuth();
    
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

    const weighingData = log.details.submittedData;
    const vehicleNumber = weighingData.vehicle_number;

    const arrivalLog = useMemo(() => {
        return logs
            .filter(l => {
                if (l.action !== 'SUBMIT_STAGE_DATA' || typeof l.details !== 'object' || !l.details) return false;
                const details = l.details as { stageId?: string, submittedData?: Record<string, any> };
                return details.stageId === 'arrival' && details.submittedData?.vehicle_number === vehicleNumber;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        [0]; // Get the most recent one
    }, [logs, vehicleNumber]);
    
    const arrivalData = arrivalLog && typeof arrivalLog.details === 'object' ? arrivalLog.details.submittedData : undefined;

    const weighingStage = PROCESS_STAGES.find(s => s.id === 'weighing');
    const fieldLabels = new Map(weighingStage?.formFields.map(f => [f.name, f.label]));

    const weighingFieldNames = weighingStage?.formFields.slice(1).map(f => f.name) || [];

    const DetailItem: React.FC<{ label: string; value: any }> = ({ label, value }) => (
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
                        <h2 className="text-2xl font-bold text-slate-800">Weighing Details</h2>
                        <p className="text-sm text-slate-500">
                            Vehicle <span className="font-semibold">{vehicleNumber}</span> on {new Date(log.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full p-2 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1: Weighing */}
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">Weighing Machine</h3>
                            <div className="space-y-3">
                                {weighingFieldNames.map(name => (
                                    <DetailItem key={name} label={fieldLabels.get(name) || name} value={weighingData[name]} />
                                ))}
                            </div>
                        </div>

                        {/* Column 2: Arrival Info */}
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">Arrival Info</h3>
                            {arrivalData ? (
                                <div className="space-y-3">
                                    <DetailItem label="Driver Name" value={arrivalData.driver_name} />
                                    <DetailItem label="Driver Licence" value={arrivalData.driver_licence} />
                                    <DetailItem label="Vehicle Owner" value={arrivalData.vehicle_owner} />
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">Arrival log not found.</p>
                            )}
                        </div>
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