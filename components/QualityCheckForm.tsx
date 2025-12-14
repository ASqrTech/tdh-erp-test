import React, { useEffect, useRef, useState } from 'react';
import { PROCESS_STAGES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { FormFieldComponent } from './FormField';
import { db } from '../firebase/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const QualityCheckForm: React.FC = () => {
  const { currentUser, verifyPin, submitStageData, getInModeVehicles } = useAuth() as any;
  const formRef = useRef<HTMLFormElement>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Vehicles dropdown
  const [inVehicles, setInVehicles] = useState<string[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  // Stage & fields
  const qualityStage = PROCESS_STAGES.find(stage => stage.id === 'quality-check');
  if (!qualityStage) {
    return <p className="text-center text-red-500">Error: Quality Check stage configuration could not be found. Please contact an administrator.</p>;
  }
  const qualityFields = qualityStage.formFields;

  // Load IN-mode vehicles (prefer auth helper, fallback to Firestore subscription)
  useEffect(() => {
    let mounted = true;
    setVehiclesLoading(true);

    // Only attempt to load vehicles if user is authenticated
    if (!currentUser) {
      setInVehicles([]);
      setVehiclesLoading(false);
      return;
    }

    const loadFromAuthHelper = async () => {
      try {
        if (typeof getInModeVehicles === 'function') {
          const list = await getInModeVehicles();
          if (!mounted) return true;
          setInVehicles(Array.isArray(list) ? Array.from(new Set(list)).sort() : []);
          setVehiclesLoading(false);
          return true;
        }
      } catch (err) {
        console.warn('getInModeVehicles failed:', err);
      }
      return false;
    };

    const start = async () => {
      const used = await loadFromAuthHelper();
      if (used) return;

      // Fallback: subscribe to arrival_records and collect vehicle_numbers with gate_mode === 'in' (excluding deleted)
      try {
        const q = query(collection(db, 'arrival_records'));
        const unsub = onSnapshot(q, snapshot => {
          if (!mounted) return;
          const list: string[] = [];
          snapshot.docs.forEach(doc => {
            const d = doc.data();
            const details = (d && (d.details || d)) as Record<string, any>;
            const gateMode = String(details?.gate_mode ?? '').toLowerCase();
            const vehicleNum = details?.vehicle_number;
            const isDeleted = d?.deleted === true;
            if (vehicleNum && typeof vehicleNum === 'string' && gateMode === 'in' && !isDeleted) {
              list.push(vehicleNum.trim());
            }
          });
          const unique = Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
          setInVehicles(unique);
          setVehiclesLoading(false);
        }, err => {
          // Only log error if user is still authenticated (ignore logout errors)
          if (currentUser && mounted) {
            console.error('Error listening arrival_records:', err);
          }
          if (mounted) {
            setInVehicles([]);
            setVehiclesLoading(false);
          }
        });

        return unsub;
      } catch (err) {
        console.warn('Failed to query arrival_records fallback:', err);
        if (mounted) {
          setInVehicles([]);
          setVehiclesLoading(false);
        }
      }
    };

    let unsubFn: (() => void) | undefined;
    (async () => {
      const maybeUnsub = await start();
      if (typeof maybeUnsub === 'function') unsubFn = maybeUnsub;
    })();

    return () => {
      mounted = false;
      if (unsubFn) unsubFn();
    };
  }, [currentUser, getInModeVehicles]);

  // Helper: sanitize integer-only on typing (used in input onChange)
  const handleIntegerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // keep digits only (no decimals)
    const digits = (e.target.value || '').replace(/\D+/g, '');
    e.target.value = digits;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data: Record<string, any> = Object.fromEntries(formData.entries());

      // file handling
      const reportFile = formData.get('upload_report') as File;
      if (reportFile && reportFile.size > 0) {
        try {
          data.upload_report = await fileToBase64(reportFile);
        } catch (err) {
          console.error('Error converting file:', err);
          alert('There was an error processing the report file.');
          setIsSubmitting(false);
          return;
        }
      } else {
        data.upload_report = '';
      }

      // Defensive numeric sanitization:
      // - find numeric fields from qualityFields (type==='number')
      // - except moisture field names ('moisture', 'moisture_content') we coerce to integer
      const moistureNames = new Set(['moisture', 'moisture_content']);
      qualityFields.forEach(f => {
        if (f.type === 'number') {
          const name = f.name;
          const raw = data[name];
          if (raw === undefined || raw === null || String(raw).trim() === '') return;

          const rawStr = String(raw).trim();

          if (moistureNames.has(name)) {
            // allow decimals for moisture content
            const parsed = Number(rawStr);
            data[name] = Number.isFinite(parsed) ? parsed : rawStr;
          } else {
            // integer-only: strip non-digit (and optional leading minus not expected here), parseInt
            const digits = rawStr.replace(/[^\d\-]/g, ''); // keep digits and minus if any
            const parsed = parseInt(digits, 10);
            data[name] = Number.isFinite(parsed) ? parsed : 0;
          }
        }
      });

      setSubmittedData(data);
      setIsSubmitting(false);
      setIsPinModalOpen(true);
    } catch (err) {
      console.error('Submit error', err);
      alert('An unexpected error occurred while preparing the quality report.');
      setIsSubmitting(false);
    }
  };

  const handlePinConfirm = async () => {
    if (!currentUser || !submittedData || !qualityStage) return;

    if (verifyPin(pin)) {
      try {
        await submitStageData(qualityStage.id, submittedData);
        setSuccessMessage('Quality check report submitted successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
        handleCloseModal();
        setSubmittedData(null);
        formRef.current?.reset();
      } catch (err) {
        console.error('Error submitting quality check: ', err);
        alert('Failed to submit quality check report. Check console for details.');
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

  // Helper to render each field — overrides vehicle_number dropdown and integer-only numeric inputs
  const renderField = (field: any) => {
    // Vehicle number dropdown override
    if (field.name === 'vehicle_number') {
      return (
        <div key={field.name} className="grid grid-cols-2 items-center gap-2">
          <label className="block text-sm font-medium text-gray-700">{field.label}</label>
          <select
            name="vehicle_number"
            defaultValue=""
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="" disabled>{vehiclesLoading ? 'Loading IN vehicles...' : 'Select Vehicle Number'}</option>
            {inVehicles.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      );
    }

    // Numeric fields (enforce integer-only except moisture)
    if (field.type === 'number') {
        const isMoisture =
          field.name.toLowerCase() === 'moisture' ||
          field.name.toLowerCase() === 'moisture_content';
    
        return (
          <div key={field.name} className="grid grid-cols-2 items-center gap-2">
            <label className="block text-sm font-medium text-gray-700">{field.label}</label>
            <input
              name={field.name}
              type="number"
              inputMode={isMoisture ? 'decimal' : 'numeric'}
              step={isMoisture ? '0.01' : '1'}
              onChange={
                isMoisture
                  ? undefined
                  : (e) => {
                      e.target.value = e.target.value.replace(/\D+/g, ''); // integer only
                    }
              }
              onWheel={(e) => (e.target as HTMLElement).blur()}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={field.placeholder || ''}
            />
          </div>
        );
      }

    // Default fallthrough to your FormFieldComponent (horizontal layout)
    return (
      <FormFieldComponent
        key={field.name}
        field={field}
        layout="horizontal"
        isRequired={false}
      />
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Create New Quality Check Record</h2>
        <p className="mt-1 text-md text-slate-600">Enter the vehicle number and the quality analysis details.</p>
      </div>

      {/* Success Flash Message */}
      {successMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Success!</h3>
            <p className="text-slate-600 mb-4">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage('')}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-4">
          <h3 className="text-xl font-semibold text-slate-700 border-b pb-2">{qualityFields[0].label}</h3>

          {qualityFields.slice(1).map(renderField)}
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
