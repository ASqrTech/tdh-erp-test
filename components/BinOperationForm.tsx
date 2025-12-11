import React, { useState, useRef, useMemo } from 'react';
import { PROCESS_STAGES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { FormFieldComponent } from './FormField';

export const BinOperationForm: React.FC = () => {
    const { currentUser, verifyPin, submitStageData, logs } = useAuth();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const binOpStage = PROCESS_STAGES.find(stage => stage.id === 'bin_operation');
    if (!binOpStage) return <p className="text-center text-red-500">Error: Bin Operation stage configuration not found.</p>;

    const binOpFields = binOpStage.formFields;

    const latestWeighingTicket = useMemo(() => {
        const weighingLogs = logs
            .filter(log => (log.details as any)?.stageId === 'weighing' && (log.details as any).submittedData?.ticket_number)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        if (weighingLogs.length > 0) {
            return (weighingLogs[0].details as any).submittedData.ticket_number;
        }
        return '';
    }, [logs]);

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
        if (!currentUser || !submittedData || !binOpStage) return;
        
        if (verifyPin(pin)) {
            try {
                await submitStageData(binOpStage, submittedData);
                setSuccessMessage('Bin operation record submitted successfully!');
                setTimeout(() => setSuccessMessage(''), 5000);
                handleCloseModal();
                setSubmittedData(null);
                formRef.current?.reset();
            } catch (error) {
                console.error("Error submitting bin operation record: ", error);
                alert('Failed to submit bin operation record.');
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
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Manage Bin Operations</h2>
                <p className="mt-1 text-md text-slate-600">Update the status of bins and manage material flow.</p>
            </div>

            {/* Success Flash Message */}
            {successMessage && (
                <div className="max-w-2xl mx-auto mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg shadow-md animate-fade-in">
                    <p className="text-center font-medium">{successMessage}</p>
                </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                        {binOpFields.map(field => (
                            <FormFieldComponent 
                                key={field.name} 
                                field={field} 
                                defaultValue={field.name === 'ticket_number' ? latestWeighingTicket : undefined}
                            />
                        ))}
                    </div>
                </div>
                 <div className="flex justify-center pt-4">
                    <button type="submit" className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700 transition text-lg disabled:bg-red-400" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Operation'}
                    </button>
                </div>
            </form>

            {isPinModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm animate-fade-in p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Confirm Operation</h3>
                        <p className="text-sm text-slate-600 mb-4">Enter your PIN to confirm this bin operation.</p>
                        <div>
                            <input
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