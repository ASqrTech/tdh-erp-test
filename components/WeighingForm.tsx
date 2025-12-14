import React, { useEffect, useRef, useState } from 'react';
import { PROCESS_STAGES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { FormFieldComponent } from './FormField';
import { db } from '../firebase/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const WeighingForm: React.FC = () => {
    const { currentUser, verifyPin, submitStageData, getInModeVehicles } = useAuth() as any;
    const formRef = useRef<HTMLFormElement>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // vehicle list for dropdown
    const [inVehicles, setInVehicles] = useState<string[]>([]);
    const [vehiclesLoading, setVehiclesLoading] = useState(true);

    const weighingStage = PROCESS_STAGES.find(stage => stage.id === 'weighing');
    if (!weighingStage) return <p className="text-center text-red-500">Error: Weighing stage configuration not found.</p>;

    const weighingFields = weighingStage.formFields;

    // Fetch in-mode vehicle numbers (prefer auth context helper, otherwise query Firestore)
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
                    if (!mounted) return;
                    setInVehicles(Array.isArray(list) ? list : []);
                    setVehiclesLoading(false);
                    return true;
                }
            } catch (err) {
                console.warn('getInModeVehicles failed:', err);
            }
            return false;
        };

        const start = async () => {
            const usedHelper = await loadFromAuthHelper();
            if (usedHelper) return;

            // Fallback to Firestore: subscribe to arrival_records and collect vehicle numbers (excluding deleted)
            try {
                const q = query(collection(db, 'arrival_records'));
                const unsub = onSnapshot(q, snapshot => {
                    if (!mounted) return;
                    const vehicles: string[] = [];
                    snapshot.docs.forEach(doc => {
                        const data = doc.data();
                        // Defensive: details might be nested map or plain
                        const details = (data && (data.details || data)) as Record<string, any>;
                        const gateMode = details?.gate_mode ?? details?.gate_mode; // defensive
                        const vehicleNum = details?.vehicle_number;
                        const isDeleted = data?.deleted === true;
                        // include only if gate_mode indicates IN (string 'in' or 'IN'), vehicleNumber exists, and not deleted
                        if (vehicleNum && typeof vehicleNum === 'string' && String(gateMode).toLowerCase() === 'in' && !isDeleted) {
                            vehicles.push(vehicleNum.trim());
                        }
                    });

                    // dedupe and sort
                    const unique = Array.from(new Set(vehicles)).sort((a, b) => a.localeCompare(b));
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

                // cleanup uses unsub
                return () => unsub();
            } catch (err) {
                console.warn('Failed to query arrival_records fallback:', err);
                if (mounted) {
                    setInVehicles([]);
                    setVehiclesLoading(false);
                }
            }
        };

        // call start and keep a possible unsub function
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        // sanitize integer weight fields on submit in case JS was bypassed
        const formData = new FormData(e.currentTarget);

        // ensure integer-only values for in_weight and out_weight
        const inWeightRaw = formData.get('in_weight')?.toString() ?? '';
        const outWeightRaw = formData.get('out_weight')?.toString() ?? '';
        formData.set('in_weight', (inWeightRaw.match(/\d+/) || [''])[0]);
        formData.set('out_weight', (outWeightRaw.match(/\d+/) || [''])[0]);

        const data: Record<string, any> = Object.fromEntries(formData.entries());

        setSubmittedData(data);
        setIsSubmitting(false);
        setIsPinModalOpen(true);
    };

    const handlePinConfirm = async () => {
        if (!currentUser || !submittedData) return;

        if (verifyPin(pin)) {
            try {
                await submitStageData(weighingStage.id, submittedData);
                setSuccessMessage('Weighing record submitted successfully!');
                setTimeout(() => setSuccessMessage(''), 5000);
                handleCloseModal();
                setSubmittedData(null);
                formRef.current?.reset();
            } catch (error) {
                console.error("Error submitting weighing record: ", error);
                alert('Failed to submit weighing record.');
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

    // helper for integer-only inputs: sanitize typed value to digits only
    const handleIntegerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D+/g, ''); // remove non-digits
        e.target.value = digits;
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-center">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Create New Weighing Record</h2>
                <p className="mt-1 text-md text-slate-600">Enter the weighing details to log a new entry.</p>
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
                <div className="max-w-2xl mx-auto">
                    {/* Weighing Details */}
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                        <h3 className="text-xl font-semibold text-slate-700 border-b pb-2">{weighingFields[0].label}</h3>

                        {/* Render fields, but override specific ones: */}
                        {weighingFields.slice(1).map(field => {
                            // If the field in your form config is 'vehicle_number', replace with select
                            if (field.name === 'vehicle_number') {
                                return (
                                    <div key="vehicle_number" className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">{field.label}</label>
                                        <select
                                            name="vehicle_number"
                                            defaultValue=""
                                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            <option value="" disabled>{vehiclesLoading ? 'Loading vehicles...' : 'Select Vehicle Number'}</option>
                                            {inVehicles.map(v => (
                                                <option key={v} value={v}>{v}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            }

                            // Replace gross_weight -> in_weight (integer only)
                            if (field.name === 'gross_weight' || field.name === 'in_weight') {
                                return (
                                    <div key="in_weight" className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">In Weight (ql)</label>
                                        <input
                                            name="in_weight"
                                            type="number"
                                            inputMode="numeric"
                                            pattern="\d*"
                                            step={1}
                                            min={0}
                                            onChange={handleIntegerInputChange}
                                            onWheel={(e) => (e.target as HTMLElement).blur()} // prevent scroll-change
                                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Enter in weight"
                                        />
                                    </div>
                                );
                            }

                            // Replace tare_weight -> out_weight (integer only)
                            if (field.name === 'tare_weight' || field.name === 'out_weight') {
                                return (
                                    <div key="out_weight" className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">Out Weight (ql)</label>
                                        <input
                                            name="out_weight"
                                            type="number"
                                            inputMode="numeric"
                                            pattern="\d*"
                                            step={1}
                                            min={0}
                                            onChange={handleIntegerInputChange}
                                            onWheel={(e) => (e.target as HTMLElement).blur()}
                                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Enter out weight"
                                        />
                                    </div>
                                );
                            }

                            // otherwise render existing generic field component
                            return <FormFieldComponent key={field.name} field={field} isRequired={field.name === 'ticket_number'} />;
                        })}
                    </div>
                </div>

                <div className="flex justify-center pt-4">
                    <button type="submit" className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700 transition text-lg disabled:bg-red-400" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Submit Details'}
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
