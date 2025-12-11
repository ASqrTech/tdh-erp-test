import React, { useEffect } from 'react';
import type { LogEntry } from '../types';

interface GateEntryDetailsModalProps {
  log: LogEntry;
  onClose: () => void;
}

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="text-base text-slate-800 font-semibold">{value ?? 'N/A'}</p>
  </div>
);

export const GateEntryDetailsModal: React.FC<GateEntryDetailsModalProps> = ({ log, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!log) return null;

  if (typeof log.details !== 'object' || log.details === null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-bold text-red-600">Error</h2>
          <p className="mt-2 text-slate-600">The details for this log entry are invalid or corrupted.</p>
          <div className="mt-4 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const details = log.details as Record<string, any>;
  const isOutMode = String(details.gate_mode || '').toLowerCase() === 'out';

  // Format timestamp safely (log.timestamp may be ISO string or Date)
  const formatTimestamp = (t: any) => {
    try {
      const d = typeof t === 'string' ? new Date(t) : t instanceof Date ? t : new Date(String(t));
      if (isNaN(d.getTime())) return String(t ?? 'N/A');
      return d.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
    } catch {
      return String(t ?? 'N/A');
    }
  };

return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        // make the panel a vertical flex container with responsive max-heights
        className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl transform transition-transform duration-200
                   flex flex-col
                   max-h-[90vh] sm:max-h-[85vh] md:max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
        aria-modal="true"
        role="dialog"
      >
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-start bg-white rounded-t-2xl">
            <div className="pr-4">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Gate Entry {" "}
                <span
                    className={`uppercase font-extrabold ${
                    isOutMode ? "text-red-600" : "text-green-600"
                    }`}
                >
                    {String(details.gate_mode || "IN").toUpperCase()}
                </span>
                </h2>
            </div>

            {/* RIGHT SIDE CARD */}
            <div className="bg-slate-200 px-4 py-3 rounded-xl shadow-md min-w-[140px]">
                <div>
                User: <span className="font-semibold">{log.userName ?? log.userId}</span>
                </div>

                {details.serial_number && (
                <p className="mt-1">
                    Serial:{" "}
                    <span className="font-semibold">
                    {String(details.serial_number)}
                    </span>
                </p>
                )}
            </div>
            </div>

  
        {/* Body (scrollable) - allow this area to shrink and scroll */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-1 gap-6">
            {/* Top grid: Vehicle & Driver */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl shadow-md space-y-4">
                <h3 className="text-lg font-bold text-red-700 border-b pb-2">Vehicle & Driver Information</h3>
                <DetailItem label="Vehicle Number" value={details.vehicle_number?.toUpperCase()} />
                <DetailItem label="Driver Name" value={details.driver_name} />
                <DetailItem label="Driver Phone" value={details.phone_number} />
                <DetailItem label="Bags" value={details.bags ?? details.no_of_bags ?? 'N/A'} />
              </div>
  
              <div className="bg-white p-5 rounded-xl shadow-md space-y-4">
                <h3 className="text-lg font-bold text-red-700 border-b pb-2">Transaction / Movement</h3>
  
                {!isOutMode && (
                  <>
                    <DetailItem label="Item" value={details.item} />
                    <DetailItem label="From" value={details.from_location ?? details.from_broker} />
                    <DetailItem label="Party" value={details.party} />
                    <DetailItem label="Broker Name" value={details.broker_name} />
                  </>
                )}
  
                {isOutMode && (
                  <>
                    <DetailItem label="Quantity" value={details.quantity} />
                    <DetailItem label="From Location" value={details.from_location} />
                    <DetailItem label="Broker Name" value={details.broker_name} />
                  </>
                )}
              </div>
            </div>
            <p className="text-base text-slate-700 bg-white p-4 rounded-xl shadow-md">Recorded: {formatTimestamp(log.timestamp)}</p>
            <div>
              <h3 className="text-xl font-bold text-red-700 border-b-2 border-red-200 pb-2 mb-2">Additional Notes</h3>
              <p className="text-base text-slate-700 bg-white p-4 rounded-xl shadow-md">{details.note}</p>
            </div>
          </div>
        </div>
  
        {/* Footer (always visible) */}
        <div className="p-4 bg-slate-100 rounded-b-2xl flex justify-between items-center gap-3 border-t">
            {details.loading_unloading && (
            <p className="ml-2 text-xl font-bold text-blue-600">
                {details.loading_unloading} Vehicle
            </p>
            )}
            <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors shadow-sm"
            >
            Close
            </button>
            </div>
      </div>
    </div>
  );
  
};

export default GateEntryDetailsModal;
