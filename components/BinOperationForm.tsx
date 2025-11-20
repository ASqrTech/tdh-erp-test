
import React, { useState, useRef, useMemo } from 'react';
import { PROCESS_STAGES } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { FormFieldComponent } from './FormField';

export const BinOperationForm: React.FC = () => {
    const { currentUser, verifyPin, submitStageData, logs } = useAuth();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const binStage = PROCESS_STAGES.find(stage => stage.id === 'bin_operation');
    
    const vehiclesPendingBinning = useMemo(() => {
        const qualityCheckedVehicles = new Set(
            logs
                .filter(log => (log.stageId) === 'quality_check_1')
                .map(log => (log.submittedData as any).vehicle_number)
        );

        const binnedVehicles = new Set(
            logs
                .filter(log => (log.stageId) === 'bin_operation')
                .map(log => (log.submittedData as any).vehicle_number)
        );

        qualityCheckedVehicles.forEach(vehicle => {
            if (binnedVehicles.has(vehicle)) {
                qualityCheckedVehicles.delete(vehicle);
            }
        });

        return Array.from(qualityCheckedVehicles);
    }, [logs]);

    if (!binStage) return <p className="text-center text-red-500">Error: Bin Operation stage configuration not found.</p>;

    const generalFields = binStage.formFields.filter(f => f.type !== 'heading' && f.name.includes('rm'));
    const binQuantityFields = binStage.formFields.filter(f => f.type === 'number');
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data: Record<string, any> = Object.fromEntries(formData.entries());
        
        setSubmittedData(data);
        setIsSubmitting(false);
        setIsPinModalOpen(true);
    };

    const handlePinConfirm = async () => {
        if (!currentUser || !submittedData || !binStage) return;
        
        if (verifyPin(pin)) {
            try {
                await submitStageData(binStage, submittedData);
                alert('Bin operation submitted successfully!');
                handleCloseModal();
                setSubmittedData(null);
                formRef.current?.reset();
            } catch (error) {
                console.error("Error submitting bin operation: ", error);
                alert('Failed to submit bin operation.');
            }
        } else {
            setPinError('Incorrect PIN. Please try again.');
            setPin('');
        }
    };
    
    const handleCloseModal = () => {
        setIsPinModalOpen(false);
        setPin('');
        setPinError('');
    };
    
    return (
        <div className="space-y-8">
             <div className="text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Create New Bin Operation Record</h2>
                <p className="mt-1 text-md text-slate-600">Select a vehicle and enter the binning details.</p>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-6">
                    <h3 className="text-xl font-semibold text-slate-700 border-b pb-2">{binStage.formFields[0].label}</h3>
                    
                    {/* Vehicle and Bin Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormFieldComponent 
                            field={{ name: 'vehicle_number', label: 'Vehicle Number', type: 'dropdown' }}
                            layout="horizontal"
                            options={vehiclesPendingBinning}
                        />
                         <FormFieldComponent 
                            field={binStage.formFields.find(f => f.name === 'bin_status')!}
                            layout="horizontal"
                        />
                    </div>

                    {/* RM Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {generalFields.map(field => <FormFieldComponent key={field.name} field={field} layout="horizontal" />)}
                    </div>
                    
                    <div className="pt-4">
                        <h3 className="text-xl font-semibold text-slate-700 border-b pb-2">{binStage.formFields.find(f => f.name === 'bins_heading')?.label}</h3>
                    </div>
                     {/* Bin Quantity Fields */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {binQuantityFields.map(field => <FormFieldComponent key={field.name} field={field} layout="horizontal" />)}
                    </div>
                </div>
                
                 <div className="flex justify-center pt-4">
                    <button type="submit" className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700 transition text-lg disabled:bg-red-400" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Submit Bin Details'}
                    </button>
                </div>
            </form>

            {isPinModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm animate-fade-in p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Confirm Entry</h3>
                        <p className="text-sm text-slate-600 mb-4">Please enter your security PIN to log this entry.</p>
                        <div>
                            <label htmlFor="pin-input" className="sr-only">Security PIN</label>
                            <input
                                id="pin-input"
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePinConfirm()}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-center text-2xl tracking-[.5em]"
                                maxLength={4}
                                placeholder="****"
                                autoFocus
                            />
                        </div>
                        {pinError && <p className="text-red-500 text-sm mt-2 text-center">{pinError}</p>}
                        <div className="mt-6 flex justify-end space-x-2">
                            <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 rounded-md font-medium hover:bg-gray-300">Cancel</button>
                            <button type="button" onClick={handlePinConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
