
import React, { useState, useRef } from 'react';
import { PROCESS_STAGES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { FormFieldComponent } from './FormField';
import { Modal } from './Modal';

export const StorageForm: React.FC = () => {
    const { currentUser, verifyPin, submitStageData } = useAuth();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedLocationArea, setSelectedLocationArea] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const locationSubOptions: Record<string, string[]> = {
        Kallam: ['1', '2', '3', '4', '5'],
        Baddi: ['1', '2', '3', '4', '5'],
        Godown: ['A', 'B'],
    };

    const storageStage = PROCESS_STAGES.find(stage => stage.id === 'storage');
    if (!storageStage) return <p className="text-center text-red-500">Error: Storage stage configuration not found.</p>;

    const storageFields = storageStage.formFields;
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data: Record<string, any> = Object.fromEntries(formData.entries());

        // Combine location fields
        const locationMain = data.location_main;
        const locationSub = data.location_sub;
        if (locationMain && locationSub) {
            data.location = `${locationMain}-${locationSub}`;
        }
        delete data.location_main;
        delete data.location_sub;
        
        setSubmittedData(data);
        setIsSubmitting(false);
        setIsPinModalOpen(true);
    };

    const handlePinConfirm = async () => {
        if (!currentUser || !submittedData || !storageStage) return;
        
        if (verifyPin(pin)) {
            try {
                await submitStageData(storageStage, submittedData);
                setSuccessMessage('Storage record submitted successfully!');
                setTimeout(() => setSuccessMessage(''), 5000);
                handleCloseModal();
                setSubmittedData(null);
                formRef.current?.reset();
                setSelectedLocationArea('');
            } catch (error) {
                console.error("Error submitting storage record: ", error);
                alert('Failed to submit storage record.');
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
             <div className="flex flex-col items-center">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Create New Storage Record</h2>
                <p className="mt-1 text-md text-slate-600">Enter the storage details for the received material.</p>
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
                        <h3 className="text-xl font-semibold text-slate-700 border-b pb-2">{storageFields[0].label}</h3>
                        {storageFields.slice(1).map(field => {
                            if (field.name === 'location_main') {
                                return (
                                    <div key={field.name}>
                                        <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                        <select id={field.name} name={field.name} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500" defaultValue="" onChange={e => setSelectedLocationArea(e.target.value)}>
                                            <option value="" disabled>Select an area</option>
                                            {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
                                        </select>
                                    </div>
                                );
                            }
                            if (field.name === 'location_sub') {
                                return (
                                     <FormFieldComponent 
                                        key={field.name} 
                                        field={field} 
                                        options={locationSubOptions[selectedLocationArea] || []}
                                        disabled={!selectedLocationArea}
                                    />
                                );
                            }
                            return <FormFieldComponent key={field.name} field={field} isRequired={false} />;
                        })}
                    </div>
                </div>
                 <div className="flex justify-center pt-4">
                    <button type="submit" className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700 transition text-lg disabled:bg-red-400" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Submit Details'}
                    </button>
                </div>
            </form>

            <Modal isOpen={isPinModalOpen} onClose={handleCloseModal} containerClassName="max-w-sm">
                <div className="p-6">
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
            </Modal>
        </div>
    );
};