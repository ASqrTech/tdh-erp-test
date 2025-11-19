import React from 'react';
import type { FormField } from '../types';

interface FormFieldProps {
    field: FormField;
    layout?: 'stacked' | 'horizontal';
    options?: string[]; 
    disabled?: boolean;
    isRequired?: boolean;
}

export const FormFieldComponent: React.FC<FormFieldProps> = ({ field, layout = 'stacked', options, disabled, isRequired: isRequiredProp }) => {
    const commonClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition";
    const isRequired = isRequiredProp ?? (field.name !== 'alt_phone_number');
    const finalOptions = options || field.options;
    
    if (field.type === 'heading') {
        return null;
    }

    const renderField = () => {
        switch (field.type) {
            case 'checkbox':
                return (
                    <div className="flex items-center">
                        <input
                            id={field.name}
                            name={field.name}
                            type="checkbox"
                            className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <label htmlFor={field.name} className="ml-3 block text-sm font-medium text-gray-700">
                            {field.label}
                        </label>
                    </div>
                );
            case 'textarea':
                return <textarea id={field.name} name={field.name} placeholder={field.placeholder} rows={2} className={commonClasses} required={isRequired} />;
            case 'dropdown':
                return (
                    <select id={field.name} name={field.name} className={commonClasses} defaultValue="" required={isRequired} disabled={disabled}>
                        <option value="" disabled>Select an option</option>
                        {finalOptions?.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                );
            case 'file':
                return <input id={field.name} name={field.name} type="file" multiple={field.multiple} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" required={isRequired && !field.multiple} />;
            default:
                return <input id={field.name} name={field.name} type={field.type} placeholder={field.placeholder} className={commonClasses} required={isRequired} />;
        }
    };
    
    if (field.type === 'checkbox') {
        return renderField();
    }

    if (layout === 'horizontal') {
        return (
            <div className="grid grid-cols-2 items-center">
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                    {field.label}
                </label>
                {renderField()}
            </div>
        );
    }
    
    return (
        <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
            </label>
            {renderField()}
        </div>
    );
};