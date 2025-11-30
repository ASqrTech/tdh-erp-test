// FormField.tsx
import React from 'react';
import type { FormField } from '../types';

interface FormFieldProps {
  field: FormField;
  value?: string | number | readonly string[] | undefined;
  onChange?: (name: string, value: string | boolean) => void; // now optional
  layout?: 'stacked' | 'horizontal';
  options?: string[];
  disabled?: boolean;
  isRequired?: boolean;
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
  const commonClasses =
    "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition disabled:bg-gray-100 text-sm";
  const isRequired = isRequiredProp ?? (field.name !== 'alt_phone_number');
  const finalOptions = options || field.options;

  if (field.type === 'heading') return null;

  // Helpers
  const onlyDigits = (s: string) => s.replace(/\D/g, '');
  const toUpper = (s: string) => s.toUpperCase();

  // Controlled vs uncontrolled
  const isControlled = typeof onChange === 'function';

  // Internal sanitized change handler (only calls parent if isControlled)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value: rawValue, type } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    if (type === 'checkbox') {
      if (isControlled) onChange!(name, (e.target as HTMLInputElement).checked);
      return;
    }

    let newValue = String(rawValue);

    switch (name) {
      case 'vehicle_number':
        newValue = toUpper(newValue).slice(0, 32);
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
        newValue = onlyDigits(newValue);
        break;
      default:
        break;
    }

    if (isControlled) {
      onChange!(name, newValue);
    } else {
      // uncontrolled — write sanitized value back into the DOM input
      // (only possible for inputs, not selects/textareas in all cases)
      try {
        (e.target as HTMLInputElement).value = newValue;
      } catch {
        // ignore
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value: rawValue } = e.target;
    let newValue = String(rawValue);

    if (name === 'vehicle_number') newValue = toUpper(newValue).slice(0, 32);
    else if (name === 'serial_number') newValue = toUpper(newValue).slice(0, 6);
    else if (name === 'phone_number' || name === 'broker_phone' || name === 'alt_phone_number') newValue = onlyDigits(newValue).slice(0, 10);
    else if (name === 'quantity') newValue = onlyDigits(newValue);

    if (isControlled) {
      if (String(newValue) !== String(value)) onChange!(name, newValue);
    } else {
      try {
        (e.target as HTMLInputElement).value = newValue;
      } catch {}
    }

    const ip = inputProps as any;
    if (typeof ip.onBlur === 'function') ip.onBlur(e);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text') || '';
    const name = (e.target as HTMLInputElement).name;
    let sanitized = text;

    if (name === 'vehicle_number' || name === 'serial_number') sanitized = toUpper(text);
    else if (name === 'phone_number' || name === 'broker_phone' || name === 'alt_phone_number') sanitized = onlyDigits(text).slice(0, 10);
    else if (name === 'quantity') sanitized = onlyDigits(text);

    e.preventDefault();

    if (isControlled) {
      onChange!(name, sanitized);
    } else {
      // For uncontrolled, set DOM value
      try {
        (e.target as HTMLInputElement).value = sanitized;
      } catch {}
    }

    const ip: any = inputProps;
    if (typeof ip.onPaste === 'function') ip.onPaste(e);
  };

  // Build shared props but only include value/onChange when controlled
  const sharedPropsBase: any = {
    id: field.name,
    name: field.name,
    placeholder: field.placeholder,
    required: isRequired,
    disabled,
    className: `${commonClasses} ${(inputProps as any).className || ''}`.trim(),
    onBlur: handleBlur,
    onPaste: handlePaste,
    ...inputProps,
  };

  if (isControlled) {
    sharedPropsBase.onChange = handleChange;
    // for selects/textareas/inputs we pass value when controlled
    sharedPropsBase.value = value as any ?? '';
  } else {
    // uncontrolled: attach a light-weight change handler to sanitize during typing
    sharedPropsBase.onChange = handleChange;
    // do not pass value prop (keeps input uncontrolled)
    delete sharedPropsBase.value;
  }

  const renderField = () => {
    switch (field.type) {
      case 'checkbox':
        if (isControlled) {
          return (
            <div className="flex items-center">
              <input
                {...(sharedPropsBase as React.InputHTMLAttributes<HTMLInputElement>)}
                type="checkbox"
                checked={!!value}
                onChange={(e) => onChange && onChange(field.name, (e.target as HTMLInputElement).checked)}
                className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor={field.name} className="ml-3 block text-sm font-medium text-gray-700">
                {field.label}
              </label>
            </div>
          );
        } else {
          return (
            <div className="flex items-center">
              <input
                {...(sharedPropsBase as React.InputHTMLAttributes<HTMLInputElement>)}
                type="checkbox"
                defaultChecked={!!value}
                className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor={field.name} className="ml-3 block text-sm font-medium text-gray-700">
                {field.label}
              </label>
            </div>
          );
        }

      case 'textarea':
        return (
          <textarea
            {...(sharedPropsBase as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            rows={2}
            // controlled: value provided via sharedPropsBase.value; uncontrolled: defaultValue not set here
            {...(isControlled ? {} : { defaultValue: value as any ?? '' })}
          />
        );

      case 'dropdown':
        return (
          <select
            {...(sharedPropsBase as React.SelectHTMLAttributes<HTMLSelectElement>)}
            {...(isControlled ? {} : { defaultValue: value as any ?? '' })}
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
            {...(isControlled ? {} : { defaultValue: value as any ?? '' })}
          />
        );
    }
  };

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
