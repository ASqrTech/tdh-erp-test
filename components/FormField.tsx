import React from 'react';
import type { FormField } from '../types';

// Define the props for the component, including value and onChange for controlled component behavior.
interface FormFieldProps {
    field: FormField;
    value: string | number | readonly string[] | undefined;
    onChange: (name: string, value: string | boolean) => void;
    layout?: 'stacked' | 'horizontal';
    options?: string[];
    disabled?: boolean;
    isRequired?: boolean;
}

export const FormFieldComponent: React.FC<FormFieldProps> = ({ 
    field, 
    value, 
    onChange, 
    layout = 'stacked', 
    options, 
    disabled, 
    isRequired: isRequiredProp 
}) => {
    // Define common classes for form inputs for a consistent look and feel.
    const commonClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition disabled:bg-gray-100";
    
    // Determine if the field is required. Default to true unless it's an optional field like 'alt_phone_number'.
    const isRequired = isRequiredProp ?? (field.name !== 'alt_phone_number');
    
    // Use provided options, or fall back to options defined in the field configuration.
    const finalOptions = options || field.options;

    // This component does not render headings; they are handled by the parent form.
    if (field.type === 'heading') {
        return null;
    }

    // Main change event handler for all input types.
    // It calls the `onChange` prop passed from the parent form.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            onChange(name, (e.target as HTMLInputElement).checked);
        } else {
            onChange(name, value);
        }
    };

    // Renders the correct input field based on the field type.
    const renderField = () => {
        switch (field.type) {
            case 'checkbox':
                return (
                    <div className="flex items-center">
                        <input
                            id={field.name}
                            name={field.name}
                            type="checkbox"
                            checked={!!value} // Control the checked state.
                            onChange={handleChange} // Handle state changes.
                            className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <label htmlFor={field.name} className="ml-3 block text-sm font-medium text-gray-700">
                            {field.label}
                        </label>
                    </div>
                );
            case 'textarea':
                return <textarea id={field.name} name={field.name} placeholder={field.placeholder} rows={2} value={value} onChange={handleChange} className={commonClasses} required={isRequired} />;
            case 'dropdown':
                return (
                    <select id={field.name} name={field.name} value={value} onChange={handleChange} className={commonClasses} required={isRequired} disabled={disabled}>
                        <option value="" disabled>Select an option</option>
                        {finalOptions?.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                );
            case 'file':
                return <input id={field.name} name={field.name} type="file" multiple={field.multiple} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" required={isRequired && !field.multiple} />;
            default:
                return <input id={field.name} name={field.name} type={field.type} placeholder={field.placeholder} value={value} onChange={handleChange} className={commonClasses} required={isRequired} />;
        }
    };
    
    // Checkbox has a different layout, so it's returned directly.
    if (field.type === 'checkbox') {
        return renderField();
    }

    // Handle horizontal layout for other fields.
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
    
    // Default stacked layout.
    return (
        <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
            </label>
            {renderField()}
        </div>
    );
};