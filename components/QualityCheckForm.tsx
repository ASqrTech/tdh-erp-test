import React, { useState, useRef } from 'react';
import { PROCESS_STAGES } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { FormFieldComponent } from './FormField';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};


export const QualityCheckForm: React.FC = () => {
    const { currentUser, verifyPin, submitStageData } = useAuth();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const qualityStage = PROCESS_STAGES.find(stage => stage.id === 'quality_check_1');

    if (!qualityStage) return <p className="text-center text-red-500">Error: Quality Check stage configuration not found.</p>;

    const qualityFields = qualityStage.formFields;
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data: Record<string, any> = Object.fromEntries(formData.entries());

        const reportFile = formData.get('upload_report') as File;
        if (reportFile && reportFile.size > 0) {
            try {
                data.upload_report = await fileToBase64(reportFile);
            } catch (error) {
                console.error("Error converting file:", error);
                alert("There was an error processing the report file.");
                setIsSubmitting(false);
                return;
            }
        } else {
            data.upload_report = '';
        }
        
        setSubmittedData(data);
        setIsSubmitting(false);
        setIsPinModalOpen(true);
    };

    const handlePinConfirm = async () => {
        if (!currentUser || !submittedData) return;
        
        if (verifyPin(pin)) {
            try {
                await submitStageData(qualityStage, submittedData);
                alert('Quality check report submitted successfully!');
                handleCloseModal();
                setSubmittedData(null);
                formRef.current?.reset();
            } catch (error) {
                console.error("Error submitting quality check: ", error);
                alert('Failed to submit quality check report.');
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
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Create New Quality Check Record</h2>
                <p className="mt-1 text-md text-slate-600">Enter the vehicle number and the quality analysis details.</p>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-4">
                    <h3 className="text-xl font-semibold text-slate-700 border-b pb-2">{qualityFields[0].label}</h3>
                    {qualityFields.slice(1).map(field => (
                        <FormFieldComponent 
                            key={field.name} 
                            field={field} 
                            layout="horizontal"
                        />
                    ))}
                </div>
                 <div className="flex justify-center pt-4">
                    <button type="submit" className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700 transition text-lg disabled:bg-red-400" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Submit Quality Report'}
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
