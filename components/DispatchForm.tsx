import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PROCESS_STAGES } from '../constants';
import { FormFieldComponent } from './FormField';
import { PlusIcon, TrashIcon } from './Icons';
import { db } from '../firebase/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

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
  const { submitStageData, getInModeVehicles } = useAuth() as any;

  const stageConfig = PROCESS_STAGES.find(stage => stage.id === 'dispatch');
  if (!stageConfig) {
    return <div className="text-red-500">Error: Dispatch stage configuration not found.</div>;
  }

  // Build initial form data (non-item fields)
  const initialFormData = stageConfig.formFields.reduce((acc: Record<string, any>, field) => {
    if (field.type !== 'heading' && !field.name.startsWith('item')) acc[field.name] = '';
    return acc;
  }, {});

  const [formData, setFormData] = useState<Record<string, any>>(initialFormData);
  const [items, setItems] = useState<ItemRow[]>([{ id: Date.now(), name: '', type: '', quantity: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // IN-mode vehicles
  const [inVehicles, setInVehicles] = useState<string[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setVehiclesLoading(true);

    const loadFromAuth = async () => {
      try {
        if (typeof getInModeVehicles === 'function') {
          const list = await getInModeVehicles();
          if (!mounted) return true;
          setInVehicles(Array.isArray(list) ? Array.from(new Set(list)).sort() : []);
          setVehiclesLoading(false);
          return true;
        }
      } catch (e) {
        console.warn('getInModeVehicles failed:', e);
      }
      return false;
    };

    const start = async () => {
      const used = await loadFromAuth();
      if (used) return;

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
            if (vehicleNum && typeof vehicleNum === 'string' && gateMode === 'in') list.push(vehicleNum.trim());
          });
          setInVehicles(Array.from(new Set(list)).sort((a, b) => a.localeCompare(b)));
          setVehiclesLoading(false);
        }, err => {
          console.error('arrival_records listen error', err);
          if (mounted) { setInVehicles([]); setVehiclesLoading(false); }
        });
        return unsub;
      } catch (err) {
        console.warn('arrival_records fallback failed', err);
        if (mounted) { setInVehicles([]); setVehiclesLoading(false); }
      }
    };

    let unsubFn: (() => void) | undefined;
    (async () => {
      const maybe = await start();
      if (typeof maybe === 'function') unsubFn = maybe;
    })();

    return () => {
      mounted = false;
      if (unsubFn) unsubFn();
    };
  }, [getInModeVehicles]);

  // helpers
  const setField = (name: string, value: any) => setFormData(prev => ({ ...prev, [name]: value }));

  const handleItemChange = (id: number, field: keyof ItemRow, value: string) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));

  const addItem = () => setItems(prev => [...prev, { id: Date.now(), name: '', type: '', quantity: '' }]);
  const removeItem = (id: number) => setItems(prev => prev.length > 1 ? prev.filter(it => it.id !== id) : prev);

  const sanitizeName = (s: string) => s.replace(/[^A-Za-z0-9\s.\-']/g, '').replace(/\s{2,}/g, ' ').trim();
  const sanitizeInteger = (s: string) => (s || '').toString().replace(/\D+/g, '');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // required fields
      const vehicle = String(formData.vehicle_number || '').trim();
      const destination = sanitizeName(String(formData.destination || ''));
      const client = sanitizeName(String(formData.client_name || ''));

      if (!vehicle) throw new Error('Vehicle Number required (select an IN vehicle).');
      if (!destination) throw new Error('Destination required.');
      if (!client) throw new Error('Client Name required.');

      // sanitize numeric fields to integers and convert to strings (to match DB sample)
      // gross_weight / tare_weight (DB currently stores strings)
      // prefer gross_weight/tare_weight from formData, but accept in_weight/out_weight if provided
      let gross = String(formData.gross_weight ?? formData.in_weight ?? '');
      let tare = String(formData.tare_weight ?? formData.out_weight ?? '');

      gross = sanitizeInteger(gross);
      tare = sanitizeInteger(tare);

      if (gross === '') throw new Error('Gross weight (In Weight) is required and must be an integer.');
      if (tare === '') throw new Error('Tare weight (Out Weight) is required and must be an integer.');

      // no_of_bags must be integer (store as string)
      const nBags = sanitizeInteger(String(formData.no_of_bags ?? ''));
      if (nBags === '') throw new Error('No of bags is required and must be an integer.');

      // items: map to item_1_name / item_1_quantity ... store strings
      const validItems = items
        .map(it => ({ name: String(it.name || '').trim(), quantity: sanitizeInteger(it.quantity || ''), type: String(it.type || '').trim() }))
        .filter(it => it.name && it.quantity);

      if (validItems.length === 0) throw new Error('Add at least one valid item (name + quantity).');

      // Build details map exactly like your DB sample
      const details: Record<string, any> = {
        client_name: client,
        destination: destination,
        gross_weight: gross, // string
        tare_weight: tare,   // string
        no_of_bags: nBags,
        note: String(formData.note ?? '').trim(),
        vehicle_number: vehicle.toLowerCase(),
        // other fields will be filled below (item_N_name / item_N_quantity)
      };

      // Add items in sequential item_1_name, item_1_quantity ... order
      validItems.forEach((it, idx) => {
        const i = idx + 1;
        details[`item_${i}_name`] = it.name;
        details[`item_${i}_quantity`] = it.quantity;
        // optionally include type as item_N_type
        if (it.type) details[`item_${i}_type`] = it.type;
      });

      // Submit via submitStageData (AuthContext will wrap into collection doc with timestamp/user)
      await submitStageData('dispatch', details);

      setSuccess('Dispatch record submitted successfully!');
      setFormData(initialFormData);
      setItems([{ id: Date.now(), name: '', type: '', quantity: '' }]);
      onSubmissionSuccess();
    } catch (err: any) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // compute net weight as integer difference, show Quintal as earlier if desired
  const grossInt = parseInt(sanitizeInteger(String(formData.gross_weight ?? formData.in_weight ?? '0')) || '0', 10);
  const tareInt = parseInt(sanitizeInteger(String(formData.tare_weight ?? formData.out_weight ?? '0')) || '0', 10);
  const netKg = Math.max(0, grossInt - tareInt);
  const netQuintal = (netKg / 100).toFixed(2);

  // render fields - vehicle_number rendered as dropdown
  const mainFields = stageConfig.formFields.filter(f => !f.name.startsWith('item'));

  const getInputProps = (name: string) => {
    if (name === 'destination' || name === 'client_name') {
      return { onChange: (e: React.ChangeEvent<HTMLInputElement>) => setField(name, sanitizeName(e.target.value)) };
    }
    if (['gross_weight', 'tare_weight', 'in_weight', 'out_weight', 'no_of_bags'].includes(name)) {
      return { inputMode: 'numeric', step: '1', onChange: (e: React.ChangeEvent<HTMLInputElement>) => setField(name, sanitizeInteger(e.target.value)) };
    }
    return {};
  };

  const renderField = (field: any) => {
    if (field.type === 'heading') {
      return (
        <div key={field.name} className="border-t pt-4 mt-6">
          <h3 className="text-lg font-semibold text-gray-700">{field.label}</h3>
        </div>
      );
    }

    if (field.name === 'vehicle_number') {
      return (
        <div key="vehicle_number" className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
          <select
            name="vehicle_number"
            value={formData.vehicle_number || ''}
            onChange={(e) => setField('vehicle_number', e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="">{vehiclesLoading ? 'Loading IN vehicles...' : 'Select Vehicle'}</option>
            {inVehicles.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      );
    }

    // show In Weight / Out Weight labels but keep underlying DB keys gross_weight/tare_weight
    if (field.name === 'gross_weight' || field.name === 'in_weight') {
      const name = field.name === 'in_weight' ? 'gross_weight' : field.name; // if config uses in_weight, map to gross_weight for DB
      return (
        <FormFieldComponent
          key={name}
          field={{ ...field, name: name, label: 'In Weight' }}
          value={String(formData[name] ?? '')}
          onChange={(n, v) => setField(n, v)}
          inputProps={getInputProps(name)}
        />
      );
    }

    if (field.name === 'tare_weight' || field.name === 'out_weight') {
      const name = field.name === 'out_weight' ? 'tare_weight' : field.name;
      return (
        <FormFieldComponent
          key={name}
          field={{ ...field, name: name, label: 'Out Weight' }}
          value={String(formData[name] ?? '')}
          onChange={(n, v) => setField(n, v)}
          inputProps={getInputProps(name)}
        />
      );
    }

    return (
      <FormFieldComponent
        key={field.name}
        field={field}
        value={String(formData[field.name] ?? '')}
        onChange={(n, v) => setField(n, v)}
        inputProps={getInputProps(field.name)}
      />
    );
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Dispatch Record</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mainFields.map(renderField)}

        {/* Item Details */}
        <div key="item_section">
          <div className='flex justify-between items-center mb-4'>
            <h3 className="text-lg font-semibold text-gray-700">{stageConfig.formFields.find(f => f.name === 'item_list_heading')?.label || 'Item Details'}</h3>
            <button type="button" onClick={addItem} className="flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-md hover:bg-red-700">
              <PlusIcon />
              <span className="ml-1">Add Item</span>
            </button>
          </div>

          <div className="space-y-4">
            {items.map(it => (
              <div key={it.id} className="p-4 border rounded-lg bg-slate-50/50 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Item Name</label>
                    <input type="text" value={it.name} onChange={(e) => handleItemChange(it.id, 'name', e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="e.g., Toor Dal" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Item Type</label>
                    <input type="text" value={it.type} onChange={(e) => handleItemChange(it.id, 'type', e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="e.g., Raw" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Quantity (Qtl)</label>
                    <input type="number" value={it.quantity} onChange={(e) => handleItemChange(it.id, 'quantity', sanitizeInteger(e.target.value))} className="w-full px-3 py-2 border rounded-md" placeholder="e.g., 12" min="0" step="1" required />
                  </div>
                </div>

                {items.length > 1 && (
                  <div className="absolute -top-2 -right-2">
                    <button type="button" onClick={() => removeItem(it.id)} className="p-1 bg-white text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full shadow-md border">
                      <TrashIcon />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Net weight (computed) */}
        <div className="bg-gray-50 p-4 rounded-lg mt-6">
          <h3 className="text-lg font-semibold text-gray-700">Calculated Net Weight</h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">{netQuintal} Quintal</p>
        </div>

        {error && <div className="text-red-500 font-medium mt-4">Error: {error}</div>}
        {success && <div className="text-green-500 font-medium mt-4">{success}</div>}

        <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 disabled:bg-red-400 transition-colors duration-300 mt-6">
          {isSubmitting ? 'Submitting...' : 'Submit Dispatch Record'}
        </button>
      </form>
    </div>
  );
};

export default DispatchForm;
