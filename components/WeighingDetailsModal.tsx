import React, { useEffect } from 'react';
import type { LogEntry } from '../types';

interface WeighingDetailsModalProps {
  record: LogEntry;
  onClose: () => void;
}

export const WeighingDetailsModal: React.FC<WeighingDetailsModalProps> = ({ record, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (typeof record.details !== 'object' || record.details === null) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-bold text-red-600">Error</h2>
          <p className="mt-2 text-slate-600">The details for this log entry are invalid or corrupted.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">Close</button>
        </div>
      </div>
    );
  }

  const details = record.details as Record<string, any>;
  const inWeight = parseFloat(details.in_weight) || 0;
  const outWeight = parseFloat(details.out_weight) || 0;
  const netWeight = Math.abs(inWeight - outWeight);
  const netWeightQuintals = netWeight / 100;

  const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-base text-slate-800 font-semibold">{value ?? 'N/A'}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto" onClick={onClose}>
      <div className="min-h-[100vh] flex items-start justify-center p-4">
        <div
          className="relative bg-slate-50 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-2xl
                     flex flex-col max-h-[90vh] sm:max-h-[85vh] md:max-h-[75vh] overflow-hidden mx-auto my-8"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="p-5 border-b bg-white">
            <div className="flex items-start justify-between gap-3">
              {/* Title */}
              <h2 className="text-2xl font-bold text-slate-800 leading-tight flex-shrink">Weighing Ticket</h2>
              
              {/* User/Ticket card */}
              <div className="bg-slate-200 px-4 py-3 rounded-xl shadow-md flex-shrink-0">
                <div>
                  User: <span className="font-semibold">{record.userName ?? record.userId}</span>
                </div>
                {details.ticket_no && (
                  <p className="mt-1">
                    Ticket: <span className="font-semibold">{String(details.ticket_no)}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Body: scrollable area */}
          <div className="p-6 overflow-y-auto flex-1 min-h-0">
            <div className="flex flex-col gap-6">
              {/* Vehicle & Weight */}
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-red-700 border-b-2 border-red-200 pb-2 mb-4">Vehicle & Weight</h3>

                <div className="grid grid-cols-2 gap-6">
                  <DetailItem label="Vehicle Number" value={details.vehicle_number?.toUpperCase()} />
                  <DetailItem label="Sample Collector" value={details.sample_collector} />
                  <DetailItem label="InWeight (ql)" value={inWeight > 0 ? inWeight.toLocaleString() : 'N/A'} />
                  <DetailItem label="OutWeight (ql)" value={outWeight > 0 ? outWeight.toLocaleString() : 'N/A'} />
                </div>

                <div className="mt-6 p-4 bg-red-50 rounded-lg text-center">
                  <p className="text-sm font-medium text-red-800">Net Weight</p>
                  <p className="text-2xl font-bold text-red-900">{netWeight.toLocaleString()} kg</p>
                </div>
              </div>

              {/* Recorded: full-width card, will wrap (no horizontal overflow) */}
              <div className="w-full">
                <p className="text-base text-slate-700 bg-white p-4 rounded-xl shadow-md break-words">
                  Recorded: {new Date(record.timestamp).toLocaleString('en-US', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              {/* Additional Notes */}
              {details.note && (
                <div className="w-full">
                  <h3 className="text-xl font-bold text-red-700 border-b-2 border-red-200 pb-2 mb-3">
                    Additional Notes
                  </h3>
                  <p className="text-base text-slate-700 bg-white p-4 rounded-xl shadow-md">
                    {details.note}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-100 rounded-b-2xl flex items-center justify-between gap-3 border-t">
            {details.loading_unloading ? (
              <div className="text-violet-600 font-semibold text-lg">{details.loading_unloading} Vehicle</div>
            ) : <div />}

            <div>
              <button onClick={onClose} className="bg-slate-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-slate-700 transition-colors shadow-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeighingDetailsModal;
