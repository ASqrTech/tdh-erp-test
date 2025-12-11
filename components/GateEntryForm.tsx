import React, { useEffect, useRef, useState } from 'react';
import { PROCESS_STAGES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { FormFieldComponent } from './FormField';
import type { FormField } from '../types';

const generateSerialNumber = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const outFields: FormField[] = [
  { name: 'serial_number', label: 'Serial Number', type: 'text', placeholder: 'Enter 6-digit S/N from IN-slip' },
  { name: 'vehicle_number', label: 'Vehicle Number', type: 'text', placeholder: 'e.g., AP00XX0000' },
  { name: 'driver_name', label: 'Driver Name', type: 'text', placeholder: 'e.g., John Doe' },
  { name: 'phone_number', label: 'Phone No', type: 'tel', placeholder: 'e.g., 9876543210' },
  { name: 'quantity', label: 'QTY', type: 'number', placeholder: 'e.g., 250' },
  { name: 'from_location', label: 'From', type: 'text', placeholder: 'e.g., Tenal' },
  { name: 'broker_name', label: 'Broker Name', type: 'text', placeholder: 'e.g., XYZ' },
  { name: 'broker_phone', label: 'Broker Phone No', type: 'tel', placeholder: 'e.g., 9876543211' },
  { name: 'note', label: 'Note', type: 'textarea', placeholder: 'Add any relevant notes' },
];

export const GateEntryForm: React.FC = () => {
  const { currentUser, verifyPin, submitStageData } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [serialNumber, setSerialNumber] = useState<string>(generateSerialNumber());
  const [timestamp, setTimestamp] = useState<string>(new Date().toLocaleString());
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Central controlled form state
  const [formState, setFormState] = useState<Record<string, any>>({});

  const arrivalStage = PROCESS_STAGES.find(stage => stage.id === 'arrival');

  // Build IN-mode fields in requested order
  const inFields: FormField[] = [
    // Timestamp & Serial Number are auto fields (rendered separately)
    { name: 'loading_unloading', label: 'Loading / Unloading', type: 'dropdown', options: ['Loading', 'Unloading'] as any },
    { name: 'vehicle_number', label: 'Vehicle Number', type: 'text', placeholder: 'e.g., AP00XX0000' },
    { name: 'item', label: 'Item', type: 'text', placeholder: 'e.g., Toor Dal' },
    { name: 'from_location', label: 'From', type: 'text', placeholder: 'e.g., Tenali' },
    { name: 'party', label: 'Party', type: 'text', placeholder: 'e.g., Party Name' },
    { name: 'broker_name', label: 'Broker Name', type: 'text', placeholder: 'e.g., ABC Broker' },
    { name: 'bags', label: 'Bags', type: 'number', placeholder: 'e.g., 50' },
    { name: 'driver_name', label: 'Driver Name', type: 'text', placeholder: 'e.g., John Doe' },
    { name: 'phone_number', label: 'Phone Number', type: 'tel', placeholder: 'e.g., 9876543210' },
    { name: 'note', label: 'Note', type: 'textarea', placeholder: 'Add any relevant notes' },
  ];

  useEffect(() => {
    // when mode changes, reset or populate serial accordingly
    if (mode === 'in') {
      const sn = generateSerialNumber();
      setSerialNumber(sn);
      setFormState(prev => ({ ...prev, serial_number: '' }));
    } else {
      setSerialNumber('');
      setFormState(prev => ({ ...prev, serial_number: prev.serial_number ?? '' }));
    }
  }, [mode]);

  useEffect(() => {
    const timer = setInterval(() => setTimestamp(new Date().toLocaleString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // controlled setter
  const setField = (name: string, value: string | boolean) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  // inputProps for sanitization & behavior (vehicle_number remains text input with uppercase behavior)
  const getInputProps = (name: string) => {
    switch (name) {
      case 'vehicle_number':
        return {
          inputMode: 'text',
          maxLength: 10,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const sanitized = (e.currentTarget.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
            setField('vehicle_number', sanitized);
          },
          onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
            const v = String(e.currentTarget.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
            setField('vehicle_number', v);
          },
          onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
            const pasted = (e.clipboardData.getData('text') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
            e.preventDefault();
            setField('vehicle_number', pasted);
          },
        };
      case 'phone_number':
      case 'broker_phone':
        return {
          inputMode: 'numeric',
          maxLength: 10,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const sanitized = (e.currentTarget.value || '').replace(/\D/g, '').slice(0, 10);
            setField(name, sanitized);
          },
        };
      case 'serial_number':
        return {
          maxLength: 6,
          onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
            const v = (e.currentTarget.value || '').toUpperCase().slice(0, 6);
            setField('serial_number', v);
          },
        };
      case 'bags':
        return {
          inputMode: 'numeric',
          step: '1',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const sanitized = (e.currentTarget.value || '').replace(/\D/g, '');
            setField('bags', sanitized);
          },
        };
      case 'quantity':
        return {
          inputMode: 'numeric',
          step: '1',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const sanitized = (e.currentTarget.value || '').replace(/\D/g, '');
            setField('quantity', sanitized);
          },
        };
      default:
        return {};
    }
  };

  // render fields with overrides for loading_unloading dropdown; vehicle_number remains input via FormFieldComponent
  const renderFields = (fields: FormField[]) => {
    return fields.map(field => {
      if (field.name === 'loading_unloading') {
        return (
          <div key="loading_unloading">
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <select
              name="loading_unloading"
              value={formState.loading_unloading ?? ''}
              onChange={(e) => setField('loading_unloading', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="">Select</option>
              <option value="Loading">Loading</option>
              <option value="Unloading">Unloading</option>
            </select>
          </div>
        );
      }

      // default uses FormFieldComponent controlled pattern
      return (
        <FormFieldComponent
          key={field.name}
          field={field}
          value={formState[field.name] ?? ''}
          onChange={(name, value) => setField(name, value)}
          isRequired={false}
          inputProps={getInputProps(field.name)}
        />
      );
    });
  };

  // Final validation + show PIN modal
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data: Record<string, any> = { ...formState };
      data.gate_mode = mode;
      data.timestamp = new Date().toISOString();

      // SERIAL
      if (mode === 'in') {
        data.serial_number = serialNumber;
      } else {
        data.serial_number = String(data.serial_number || '').toUpperCase().slice(0, 6);
        if (data.serial_number.length !== 6) {
          alert('Serial Number must be exactly 6 characters (OUT mode).');
          setIsSubmitting(false);
          return;
        }
      }

      // VEHICLE NUMBER -> uppercase & max 10
      if (data.vehicle_number) {
        data.vehicle_number = String(data.vehicle_number).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      } else if (mode === 'in') {
        alert('Please enter vehicle number.');
        setIsSubmitting(false);
        return;
      }

      // PHONE NUMBERS -> digits only, must be 10 digits if present
      const phoneKeys = ['phone_number', 'broker_phone'];
      for (const k of phoneKeys) {
        if (data[k] !== undefined && data[k] !== null && String(data[k]).trim() !== '') {
          const digits = String(data[k]).replace(/\D/g, '').slice(0, 10);
          if (digits.length !== 10) {
            alert(`${k.replace('_', ' ')} must be 10 digits.`);
            setIsSubmitting(false);
            return;
          }
          data[k] = digits;
        }
      }

      // Bags integer
      if (data.bags !== undefined && data.bags !== null && String(data.bags).trim() !== '') {
        const only = String(data.bags).replace(/\D/g, '');
        const parsed = Number(only);
        if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
          alert('Bags must be an integer.');
          setIsSubmitting(false);
          return;
        }
        data.bags = parsed;
      }

      // Everything validated
      setSubmittedData(data);
      setIsSubmitting(false);
      setIsPinModalOpen(true);
    } catch (err) {
      console.error('Submit error', err);
      alert('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  const handlePinConfirm = () => {
    if (!currentUser || !submittedData) return;

    if (verifyPin(pin)) {
      if (!arrivalStage || !arrivalStage.id) {
        console.error('arrivalStage missing or malformed', arrivalStage);
        alert('Internal error: stage configuration missing.');
        return;
      }

      submitStageData(arrivalStage.id, submittedData);

      setSuccessMessage('Details submitted successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);

      handleCloseModal();
      setSubmittedData(null);
      formRef.current?.reset();
      setFormState({});
      if (mode === 'in') {
        const newSn = generateSerialNumber();
        setSerialNumber(newSn);
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

  if (!arrivalStage || !currentUser) {
    return <p className="text-center text-red-500">Error: Component failed to load. User or configuration missing.</p>;
  }

  const AutoGeneratedField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        readOnly
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-slate-100 text-slate-500 cursor-not-allowed"
      />
    </div>
  );

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Gate Entry Record</h2>
        <p className="mt-1 text-md text-slate-600">Log a new vehicle entry or exit.</p>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg shadow-md animate-fade-in">
          {successMessage}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center bg-slate-200 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode('in')}
              className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'in' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600'}`}
            >
              Vehicle IN
            </button>
            <button
              type="button"
              onClick={() => setMode('out')}
              className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'out' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600'}`}
            >
              Vehicle OUT
            </button>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {mode === 'in' ? (
            <>
              <AutoGeneratedField label="Timestamp" value={timestamp} />
              <AutoGeneratedField label="Serial Number" value={serialNumber} />
              {renderFields(inFields)}
            </>
          ) : (
            <>
              <AutoGeneratedField label="Timestamp" value={timestamp} />
              {renderFields(outFields)}
            </>
          )}

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700 transition text-lg disabled:bg-red-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Submit Details'}
            </button>
          </div>
        </form>
      </div>

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

export default GateEntryForm;
