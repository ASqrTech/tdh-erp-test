
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PROCESS_STAGES } from '../constants';
import { FormFieldComponent } from './FormField';
import { PlusIcon, TrashIcon } from './Icons';

interface DispatchFormProps {
    onSubmissionSuccess: () => void;
}

interface ItemRow {
    id: number;
    name: string;
    type: string;
    quantity: string;
}

export const DispatchForm: React.FC<DispatchFormProps> = ({ onSubmissionSuccess }) => {
    const { submitStageData } = useAuth();
    
    const stageConfig = PROCESS_STAGES.find(stage => stage.id === 'dispatch');

    const initialFormData = stageConfig?.formFields.reduce((acc, field) => {
        if (field.type !== 'heading' && !field.name.startsWith('item')) {
            acc[field.name] = '';
        }
        return acc;
    }, {} as Record<string, any>) || {};

    const [formData, setFormData] = useState(initialFormData);
    const [items, setItems] = useState<ItemRow[]>([{ id: Date.now(), name: '', type: '', quantity: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    if (!stageConfig) {
        return <div className="text-red-500">Error: Dispatch stage configuration not found.</div>;
    }

    const mainFormFields = stageConfig.formFields.filter(field => !field.name.startsWith('item'));

    const handleInputChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (id: number, field: keyof ItemRow, value: string) => {
        setItems(prevItems => prevItems.map(item => (item.id === id ? { ...item, [field]: value } : item)));
    };

    const addItemRow = () => {
        setItems(prevItems => [...prevItems, { id: Date.now(), name: '', type: '', quantity: '' }]);
    };

    const removeItemRow = (id: number) => {
        if (items.length > 1) {
            setItems(prevItems => prevItems.filter(item => item.id !== id));
        }
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
            
            const validItems = items.filter(item => item.name && item.type && item.quantity);

            if (validItems.length === 0) {
                throw new Error('At least one valid item must be added.');
            }

            const dispatchData = {
                ...formData,
                items: validItems,
            };

            await submitStageData('dispatch', dispatchData);
            setSuccess('Dispatch record submitted successfully!');
            setFormData(initialFormData);
            setItems([{ id: Date.now(), name: '', type: '', quantity: '' }]);
            
            setTimeout(() => onSubmissionSuccess(), 1000);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const grossWeight = parseFloat(formData.gross_weight) || 0;
    const tareWeight = parseFloat(formData.tare_weight) || 0;
    const netWeight = grossWeight > 0 && tareWeight > 0 ? (grossWeight - tareWeight).toFixed(2) : 'N/A';

    const itemDetailsHeading = stageConfig.formFields.find(f => f.name === 'item_list_heading');

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Dispatch Record</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {
                    mainFormFields.map(field => (
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
                
                <div key="item_details_section">
                    <div className='flex justify-between items-center mb-4'>
                        <h3 className="text-lg font-semibold text-gray-700">{itemDetailsHeading?.label || 'Item Details'}</h3>
                        <button type="button" onClick={addItemRow} className="flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-md hover:bg-red-700">
                            <PlusIcon />
                            <span className="ml-1">Add Item</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="p-4 border rounded-lg bg-slate-50/50 relative">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Item Name</label>
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                                            placeholder="e.g., Toor Dal"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Item Type</label>
                                        <input
                                            type="text"
                                            value={item.type}
                                            onChange={(e) => handleItemChange(item.id, 'type', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                                            placeholder="e.g., Raw"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Quantity (Qtl)</label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                                            placeholder="e.g., 100"
                                            min="0.01"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>
                                {items.length > 1 && (
                                    <div className="absolute -top-2 -right-2">
                                        <button type="button" onClick={() => removeItemRow(item.id)} className="p-1 bg-white text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full shadow-md border">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                
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
