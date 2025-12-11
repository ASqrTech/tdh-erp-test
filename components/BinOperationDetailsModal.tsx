import React, { useEffect, useMemo } from 'react';
import type { LogEntry } from '../types';
import { PROCESS_STAGES } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface BinOperationDetailsModalProps {
    log: LogEntry;
    onClose: () => void;
}

export const BinOperationDetailsModal: React.FC<BinOperationDetailsModalProps> = ({ log, onClose }) => {
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

    const binData = log.details.submittedData;
    const vehicleNumber = binData.vehicle_number;

    // Find the related logs for this vehicle
    const arrivalLog = useMemo(() => logs.find(l => typeof l.details === 'object' && l.details?.stageId === 'arrival' && l.details.submittedData?.vehicle_number === vehicleNumber), [logs, vehicleNumber]);
    const weighingLog = useMemo(() => logs.find(l => typeof l.details === 'object' && l.details?.stageId === 'weighing' && l.details.submittedData?.vehicle_number === vehicleNumber), [logs, vehicleNumber]);
    const qualityLog = useMemo(() => logs.find(l => typeof l.details === 'object' && l.details?.stageId === 'quality_check_1' && l.details.submittedData?.vehicle_number === vehicleNumber), [logs, vehicleNumber]);
    
    // Safely extract submitted data from each log
    const arrivalData = arrivalLog && typeof arrivalLog.details === 'object' ? arrivalLog.details.submittedData : undefined;
    const weighingData = weighingLog && typeof weighingLog.details === 'object' ? weighingLog.details.submittedData : undefined;
    const qualityData = qualityLog && typeof qualityLog.details === 'object' ? qualityLog.details.submittedData : undefined;

    const binStage = PROCESS_STAGES.find(s => s.id === 'bin_operation');
    const fieldLabels = new Map(binStage?.formFields.map(f => [f.name, f.label]));
    
    const binFieldNames = binStage?.formFields.filter(f => f.type !== 'heading' && f.name !== 'vehicle_number') || [];

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
                        <h2 className="text-2xl font-bold text-slate-800">Bin Operation Details</h2>
                        <p className="text-sm text-slate-500">
                            Vehicle <span className="font-semibold">{vehicleNumber?.toUpperCase()}</span> on {new Date(log.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full p-2 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Column 1: Bin Operation */}
                        <div className="lg:col-span-1">
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">Bin Details</h3>
                            <div className="space-y-3">
                                {binFieldNames.map(field => (
                                    <DetailItem key={field.name} label={fieldLabels.get(field.name) || field.name} value={binData[field.name]} />
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
                                            <DetailItem 
                                                label="Net Weight (Qtl)" 
                                                value={(parseFloat(weighingData.in_weight || 0) - parseFloat(weighingData.out_weight || 0)).toFixed(2)} 
                                            />
                                        </div>
                                    </div>
                                ) : <p className="text-sm text-slate-500">Weighing log not found.</p>}
                             </div>
                        </div>

                        {/* Column 3: Quality Info */}
                        <div className="lg:col-span-1">
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-3">Quality Summary</h3>
                            {qualityData ? (
                                <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                                    <DetailItem label="Moisture %" value={qualityData.moisture_content_percent} />
                                    <DetailItem label="Small Mud %" value={qualityData.small_mud_percent} />
                                    <DetailItem label="Big Mud/Stones %" value={qualityData.big_mud_stones_percent} />
                                    <DetailItem label="Damage 1" value={qualityData.damage_1} />
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">Quality log not found.</p>
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