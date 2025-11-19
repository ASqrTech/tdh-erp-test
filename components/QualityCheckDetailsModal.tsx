import React, { useEffect, useMemo } from 'react';
import type { LogEntry } from '../types';
import { PROCESS_STAGES } from '../constants';
import { useAuth } from '../hooks/useAuth';

interface QualityCheckDetailsModalProps {
    log: LogEntry;
    onClose: () => void;
}

export const QualityCheckDetailsModal: React.FC<QualityCheckDetailsModalProps> = ({ log, onClose }) => {
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

    const qualityData = log.details.submittedData;
    const vehicleNumber = qualityData.vehicle_number;

    const arrivalLog = useMemo(() => logs.find(l => 
        typeof l.details === 'object' && l.details?.stageId === 'arrival' && l.details.submittedData?.vehicle_number === vehicleNumber
    ), [logs, vehicleNumber]);
    const weighingLog = useMemo(() => logs.find(l => 
        typeof l.details === 'object' && l.details?.stageId === 'weighing' && l.details.submittedData?.vehicle_number === vehicleNumber
    ), [logs, vehicleNumber]);
    
    const arrivalData = arrivalLog && typeof arrivalLog.details === 'object' ? arrivalLog.details.submittedData : undefined;
    const weighingData = weighingLog && typeof weighingLog.details === 'object' ? weighingLog.details.submittedData : undefined;

    const qualityStage = PROCESS_STAGES.find(s => s.id === 'quality_check_1');
    const fieldLabels = new Map(qualityStage?.formFields.map(f => [f.name, f.label]));
    
    const qualityFieldNames = qualityStage?.formFields.slice(1).filter(f => f.type !== 'file' && f.name !== 'vehicle_number') || [];
    const reportImage = qualityData.upload_report;

    const DetailItem: React.FC<{ label: string; value: any; className?: string }> = ({ label, value, className }) => (
        <div className={className}>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="text-sm text-slate-800">{value || 'N/A'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Quality Check Details</h2>
                        <p className="text-sm text-slate-500">
                            Vehicle <span className="font-semibold">{vehicleNumber}</span> on {new Date(log.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full p-2 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Column 1: Quality Check */}
                        <div className="lg:col-span-1">
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">Quality Analysis</h3>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                                {qualityFieldNames.map(field => (
                                    <DetailItem key={field.name} label={fieldLabels.get(field.name) || field.name} value={qualityData[field.name]} />
                                ))}
                            </div>
                        </div>

                        {/* Column 2: Context Info */}
                        <div className="lg:col-span-1">
                             <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">Related Info</h3>
                             <div className="space-y-4">
                                {arrivalData ? (
                                    <div>
                                        <h4 className="font-semibold text-slate-600 text-sm mb-2">Arrival Details</h4>
                                        <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                                            <DetailItem label="Driver Name" value={arrivalData.driver_name} />
                                            <DetailItem label="Vehicle Owner" value={arrivalData.vehicle_owner} />
                                        </div>
                                    </div>
                                ) : <p className="text-sm text-slate-500">Arrival log not found.</p>}
                                
                                {weighingData ? (
                                     <div>
                                        <h4 className="font-semibold text-slate-600 text-sm mb-2">Weighing Details</h4>
                                        <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                                            <DetailItem label="In Weight (Qtl)" value={weighingData.in_weight} />
                                            <DetailItem label="Out Weight (Qtl)" value={weighingData.out_weight} />
                                            <DetailItem label="Ticket No." value={weighingData.ticket_number} />
                                        </div>
                                    </div>
                                ) : <p className="text-sm text-slate-500">Weighing log not found.</p>}
                             </div>
                        </div>

                        {/* Column 3: Report */}
                        <div className="lg:col-span-1">
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">Uploaded Report</h3>
                            {reportImage ? (
                                <a href={reportImage} target="_blank" rel="noopener noreferrer">
                                    <img src={reportImage} alt="Quality Report" className="rounded-lg object-cover w-full h-auto border hover:shadow-lg transition" />
                                </a>
                            ) : (
                                <div className="rounded-lg w-full h-48 border bg-slate-100 flex items-center justify-center text-slate-500">
                                    No Report Uploaded
                                </div>
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