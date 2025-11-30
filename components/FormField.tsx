// FormField.tsx
import React from 'react';
import type { FormField } from '../types';

interface FormFieldProps {
  field: FormField;
  value: string | number | readonly string[] | undefined;
  onChange: (name: string, value: string | boolean) => void;
  layout?: 'stacked' | 'horizontal';
  options?: string[];
  disabled?: boolean;
  isRequired?: boolean;
  // Optional extra props the parent may want forwarded (e.g., maxLength, inputMode, onBlur)
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> | React.TextareaHTMLAttributes<HTMLTextAreaElement> | React.SelectHTMLAttributes<HTMLSelectElement>;
}

export const FormFieldComponent: React.FC<FormFieldProps> = ({
  field,
  value,
  onChange,
  layout = 'stacked',
  options,
  disabled,
  isRequired: isRequiredProp,
  inputProps = {},
}) => {
  const commonClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition disabled:bg-gray-100 text-sm";
  const isRequired = isRequiredProp ?? (field.name !== 'alt_phone_number');
  const finalOptions = options || field.options;

  if (field.type === 'heading') return null;

  // Helper sanitizers
  const onlyDigits = (s: string) => s.replace(/\D/g, '');
  const toUpper = (s: string) => s.toUpperCase();

  // Central change handler (sanitizes based on field.name), then calls parent onChange(name, sanitizedValue)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value: rawValue, type } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    if (type === 'checkbox') {
      onChange(name, (e.target as HTMLInputElement).checked);
      return;
    }

    let newValue = String(rawValue);

    // Per-field sanitization rules
    switch (name) {
      case 'vehicle_number':
        newValue = toUpper(newValue).slice(0, 10); // keep a safe max length
        break;

      case 'phone_number':
      case 'broker_phone':
      case 'alt_phone_number':
        newValue = onlyDigits(newValue).slice(0, 10);
        break;

      case 'serial_number':
        newValue = toUpper(newValue).slice(0, 6);
        break;

      case 'quantity':
        // remove non-digits, prevent decimals, allow negative? (we'll disallow negatives here)
        newValue = onlyDigits(newValue);
        break;

      default:
        // no special sanitization
        break;
    }

    onChange(name, newValue);
  };

  // Provide sensible onBlur handlers for paste/cleanup (also call parent if needed)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value: rawValue } = e.target;
    let newValue = String(rawValue);

    if (name === 'vehicle_number') {
      newValue = toUpper(newValue).slice(0, 32);
    } else if (name === 'serial_number') {
      newValue = toUpper(newValue).slice(0, 6);
    } else if (name === 'phone_number' || name === 'broker_phone' || name === 'alt_phone_number') {
      newValue = onlyDigits(newValue).slice(0, 10);
    } else if (name === 'quantity') {
      newValue = onlyDigits(newValue);
    }

    // If sanitized value differs from current value, update parent
    if (String(newValue) !== String(value)) {
      onChange(name, newValue);
    }

    // If parent passed an onBlur in inputProps, call it as well
    const ip = inputProps as any;
    if (typeof ip.onBlur === 'function') {
      ip.onBlur(e);
    }
  };

  // Handle paste to sanitize before it lands in the controlled input
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text') || '';
    const name = (e.target as HTMLInputElement).name;
    let sanitized = text;

    if (name === 'vehicle_number' || name === 'serial_number') {
      sanitized = toUpper(text);
    } else if (name === 'phone_number' || name === 'broker_phone' || name === 'alt_phone_number') {
      sanitized = onlyDigits(text).slice(0, 10);
    } else if (name === 'quantity') {
      sanitized = onlyDigits(text);
    }

    // Prevent default paste and set sanitized value via onChange
    e.preventDefault();
    onChange(name, sanitized);
    // If inputProps.onPaste exists, call it too (optional)
    const ip: any = inputProps;
    if (typeof ip.onPaste === 'function') ip.onPaste(e);
  };

  // Build element-specific props merging inputProps but ensuring id/name/required/className/value/onChange are present
  const sharedPropsBase = {
    id: field.name,
    name: field.name,
    placeholder: field.placeholder,
    required: isRequired,
    disabled,
    className: `${commonClasses} ${(inputProps as any).className || ''}`.trim(),
    onChange: handleChange,
    onBlur: handleBlur,
    onPaste: handlePaste,
    ...inputProps, // keep parent's inputProps; note onChange/onBlur/onPaste may be overridden above intentionally
  } as React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement> & React.SelectHTMLAttributes<HTMLSelectElement>;

  // Render actual input types
  const renderField = () => {
    switch (field.type) {
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              {...(sharedPropsBase as React.InputHTMLAttributes<HTMLInputElement>)}
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(field.name, (e.target as HTMLInputElement).checked)}
              className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor={field.name} className="ml-3 block text-sm font-medium text-gray-700">
              {field.label}
            </label>
          </div>
        );

      case 'textarea':
        return (
          <textarea
            {...(sharedPropsBase as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            value={value as string | undefined}
            rows={2}
          />
        );

      case 'dropdown':
        return (
          <select
            {...(sharedPropsBase as React.SelectHTMLAttributes<HTMLSelectElement>)}
            value={value as string | undefined}
          >
            <option value="" disabled>
              Select an option
            </option>
            {finalOptions?.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'file':
        // file inputs are inherently uncontrolled — we don't wire value for them
        return (
          <input
            {...(sharedPropsBase as React.InputHTMLAttributes<HTMLInputElement>)}
            type="file"
            multiple={!!(field as any).multiple}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
          />
        );

      default:
        return (
          <input
            {...(sharedPropsBase as React.InputHTMLAttributes<HTMLInputElement>)}
            type={field.type || 'text'}
            value={value as string | number | undefined}
          />
        );
    }
  };

  // Layout
  if (field.type === 'checkbox') return renderField();

  if (layout === 'horizontal') {
    return (
      <div className="grid grid-cols-2 items-center gap-2">
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

export default FormFieldComponent;
