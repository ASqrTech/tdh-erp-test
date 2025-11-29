
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
        if (field.type !== 'heading' && field.name !== 'item_details') {
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

    const handleInputChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (id: number, field: keyof ItemRow, value: string) => {
        setItems(prevItems => prevItems.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addItemRow = () => {
        setItems(prevItems => [...prevItems, { id: Date.now(), name: '', type: '', quantity: '' }]);
    };

    const removeItemRow = (id: number) => {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
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
            
            const dispatchData = {
                ...formData,
                items: items.filter(item => item.name || item.type || item.quantity)
            };

            await submitStageData('dispatch', dispatchData);
            setSuccess('Dispatch record submitted successfully!');
            setFormData(initialFormData);
            setItems([{ id: Date.now(), name: '', type: '', quantity: '' }]);
            
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
                    stageConfig.formFields.map(field => {
                        if (field.name === 'item_details') {
                            return (
                                <div key="item_details_section">
                                    <div className='flex justify-between items-center mb-3'>
                                        <h3 className="text-lg font-semibold text-gray-700">{field.label}</h3>
                                        <button type="button" onClick={addItemRow} className="flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-md hover:bg-red-700">
                                            <PlusIcon />
                                            <span className="ml-1">Add Item</span>
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                <tr>
                                                    <th className="p-3">Item Name</th>
                                                    <th className="p-3">Item Type</th>
                                                    <th className="p-3">Quantity</th>
                                                    <th className="p-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className='bg-white'>
                                                {items.length > 0 ? items.map((item) => (
                                                    <tr key={item.id} className="border-b border-slate-200 last:border-b-0">
                                                        <td className="p-2">
                                                            <input type="text" value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500" placeholder="e.g., Basmati Rice" />
                                                        </td>
                                                        <td className="p-2">
                                                            <input type="text" value={item.type} onChange={(e) => handleItemChange(item.id, 'type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500" placeholder="e.g., Raw" />
                                                        </td>
                                                        <td className="p-2">
                                                            <input type="text" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500" placeholder="e.g., 100 Quintal"/>
                                                        </td>
                                                        <td className="p-2 text-right">
                                                            {items.length > 1 && (
                                                                <button type="button" onClick={() => removeItemRow(item.id)} className="p-2 text-slate-400 hover:text-red-600">
                                                                    <TrashIcon />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={4} className="text-center p-8 text-slate-500">
                                                            No items added yet. Click "Add Item" to start.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        }
                        
                        return field.type === 'heading' ? (
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
                    })
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
