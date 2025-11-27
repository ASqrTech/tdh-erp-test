import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PROCESS_STAGES } from '../constants';
import { FormFieldComponent } from './FormField';

interface DispatchFormProps {
    onSubmissionSuccess: () => void;
}

export const DispatchForm: React.FC<DispatchFormProps> = ({ onSubmissionSuccess }) => {
    const { submitStageData } = useAuth();
    
    const stageConfig = PROCESS_STAGES.find(stage => stage.id === 'dispatch');

    const initialFormData = stageConfig?.formFields.reduce((acc, field) => {
        if (field.type !== 'heading') {
            acc[field.name] = '';
        }
        return acc;
    }, {} as Record<string, any>) || {};

    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    if (!stageConfig) {
        return <div className="text-red-500">Error: Dispatch stage configuration not found.</div>;
    }

    const handleInputChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            if (!formData.vehicle_number || !formData.destination || !formData.client_name) {
                throw new Error('Vehicle Number, Destination, and Client Name are required.');
            }
            await submitStageData('dispatch', formData);
            setSuccess('Dispatch record submitted successfully!');
            setFormData(initialFormData); // Reset form to initial state
            
            // Redirect after a short delay to allow the user to see the success message
            setTimeout(() => {
                onSubmissionSuccess();
            }, 1000);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const grossWeight = parseFloat(formData.gross_weight) || 0;
    const tareWeight = parseFloat(formData.tare_weight) || 0;
    const netWeight = grossWeight > 0 && tareWeight > 0 ? (grossWeight - tareWeight).toFixed(2) : 'N/A';

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Dispatch Record</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {
                    stageConfig.formFields.map(field => (
                        field.type === 'heading' ? (
                             <div key={field.name} className="border-t pt-4 mt-6">
                                <h3 className="text-lg font-semibold text-gray-700">{field.label}</h3>
                             </div>
                        ) : (
                            <FormFieldComponent
                                key={field.name}
                                field={field}
                                value={formData[field.name] || ''}
                                onChange={handleInputChange}
                            />
                        )
                    ))
                }
                
                 <div className="bg-gray-50 p-4 rounded-lg mt-6">
                    <h3 className="text-lg font-semibold text-gray-700">Calculated Net Weight</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{netWeight} Quintal</p>
                 </div>

                {error && <div className="text-red-500 font-medium mt-4">Error: {error}</div>}
                {success && <div className="text-green-500 font-medium mt-4">{success}</div>}

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 disabled:bg-red-400 transition-colors duration-300 mt-6"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Dispatch Record'}
                </button>
            </form>
        </div>
    );
};
