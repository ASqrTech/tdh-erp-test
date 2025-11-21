import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { User, LogEntry } from '../types';
import { StorageDetailsModal } from './StorageDetailsModal';

type TimeFilter = '24h' | 'week' | 'month' | 'custom';

export const StorageActivityTable: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const { logs } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

    const filteredLogs = useMemo(() => {
        const now = new Date();
        const storageLogs = logs
            .filter(log =>
                log.userId === currentUser.id &&
                log.action === 'SUBMIT_STAGE_DATA' &&
                typeof log.details === 'object' &&
                log.details.stageId === 'storage'
            )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return storageLogs.filter(log => {
            // Time Filter
            const logDate = new Date(log.timestamp);
            let timeMatch = false;
            switch (timeFilter) {
                case '24h':
                    timeMatch = now.getTime() - logDate.getTime() < 24 * 60 * 60 * 1000;
                    break;
                case 'week':
                    timeMatch = now.getTime() - logDate.getTime() < 7 * 24 * 60 * 60 * 1000;
                    break;
                case 'month':
                    timeMatch = now.getTime() - logDate.getTime() < 30 * 24 * 60 * 60 * 1000;
                    break;
                case 'custom':
                    if (!customStartDate && !customEndDate) {
                        timeMatch = true;
                        break;
                    }
                    const start = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null;
                    const end = customEndDate ? new Date(`${customEndDate}T23:59:59.999`) : null;

                    if (start && end) {
                        timeMatch = logDate >= start && logDate <= end;
                    } else if (start) {
                        timeMatch = logDate >= start;
                    } else if (end) {
                        timeMatch = logDate <= end;
                    }
                    break;
            }
            if (!timeMatch) return false;

            // Search Filter
            if (searchTerm.trim() === '') return true;
            const lowercasedSearch = searchTerm.toLowerCase();
            const data = (log.details as any).submittedData;
            
            return (
                data.entered_vehicle?.toLowerCase().includes(lowercasedSearch) ||
                data.material_content?.toLowerCase().includes(lowercasedSearch) ||
                data.location?.toLowerCase().includes(lowercasedSearch)
            );
        });

    }, [logs, currentUser.id, searchTerm, timeFilter, customStartDate, customEndDate]);

    const formatTimestamp = (isoString: string) => {
        return new Date(isoString).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    }

    const FilterButton: React.FC<{ filter: TimeFilter; label: string }> = ({ filter, label }) => (
        <button
            onClick={() => setTimeFilter(filter)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${timeFilter === filter ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full">
            <h3 className="text-xl font-semibold text-slate-700 mb-4">Storage Activity</h3>
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-4 md:space-y-0">
                <div className="relative w-full md:max-w-xs">
                    <input
                        type="text"
                        placeholder="Search by vehicle, material..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
                <div className="flex items-center space-x-2 p-1 bg-slate-100 rounded-lg">
                    <FilterButton filter="24h" label="Last 24h" />
                    <FilterButton filter="week" label="This Week" />
                    <FilterButton filter="month" label="This Month" />
                    <FilterButton filter="custom" label="Custom" />
                </div>
            </div>

            {timeFilter === 'custom' && (
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-4 p-2 bg-slate-50 rounded-lg justify-center">
                    <label htmlFor="start-date-storage" className="text-sm font-medium text-slate-600">From:</label>
                    <input
                        id="start-date-storage"
                        type="date"
                        value={customStartDate}
                        onChange={e => setCustomStartDate(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <label htmlFor="end-date-storage" className="text-sm font-medium text-slate-600">To:</label>
                    <input
                        id="end-date-storage"
                        type="date"
                        value={customEndDate}
                        onChange={e => setCustomEndDate(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <button 
                        onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-md hover:bg-gray-300 transition"
                    >
                        Clear
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                        <tr>
                            <th className="p-3">Timestamp</th>
                            <th className="p-3">Vehicle No.</th>
                            <th className="p-3">Quantity (Qtl)</th>
                            <th className="p-3">Material</th>
                            <th className="p-3">Location</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length > 0 ? filteredLogs.map(log => {
                            const data = (log.details as any).submittedData;
                            return (
                                <tr key={log.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 text-slate-500 whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                                    <td className="p-3 font-medium text-slate-800">{data.entered_vehicle}</td>
                                    <td className="p-3">{data.quantity}</td>
                                    <td className="p-3">{data.material_content}</td>
                                    <td className="p-3">{data.location}</td>
                                    <td className="p-3">
                                        <button 
                                            onClick={() => setSelectedLog(log)}
                                            className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full hover:bg-red-200 transition"
                                        >
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            )
                        }) : (
                            <tr>
                                <td colSpan={6} className="text-center p-8 text-slate-500">
                                    No entries found for the selected criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedLog && (
                <StorageDetailsModal 
                    log={selectedLog}
                    onClose={() => setSelectedLog(null)}
                />
            )}
        </div>
    );
};