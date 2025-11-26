import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { User, LogEntry } from '../types';
import { GateEntryDetailsModal } from './GateEntryDetailsModal';

type TimeFilter = '24h' | 'week' | 'month' | 'custom';

export const GateEntryActivityTable: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [gateRecords, setGateRecords] = useState<LogEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<LogEntry | null>(null);

    useEffect(() => {
        const q = query(collection(db, "arrival_records"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const records: LogEntry[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    timestamp: data.timestamp.toDate().toISOString(),
                    userId: data.userId || '',
                    userName: data.userName || '',
                    action: 'arrival_RECORDED',
                    details: data
                };
            });
            setGateRecords(records);
        }, (error) => {
            console.error("Error fetching arrival records: ", error);
        });

        return () => unsubscribe();
    }, []);

    const filteredRecords = useMemo(() => {
        const now = new Date();
        return (gateRecords || []).filter(record => {
            const recordDate = new Date(record.timestamp);
            let timeMatch = false;
            switch (timeFilter) {
                case '24h':
                    timeMatch = now.getTime() - recordDate.getTime() < 24 * 60 * 60 * 1000;
                    break;
                case 'week':
                    timeMatch = now.getTime() - recordDate.getTime() < 7 * 24 * 60 * 60 * 1000;
                    break;
                case 'month':
                    timeMatch = now.getTime() - recordDate.getTime() < 30 * 24 * 60 * 60 * 1000;
                    break;
                case 'custom':
                    if (!customStartDate && !customEndDate) {
                        timeMatch = true;
                        break;
                    }
                    const start = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null;
                    const end = customEndDate ? new Date(`${customEndDate}T23:59:59.999`) : null;

                    if (start && end) {
                        timeMatch = recordDate >= start && recordDate <= end;
                    } else if (start) {
                        timeMatch = recordDate >= start;
                    } else if (end) {
                        timeMatch = recordDate <= end;
                    }
                    break;
            }
            if (!timeMatch) return false;

            if (searchTerm.trim() === '') return true;
            const lowercasedSearch = searchTerm.toLowerCase();
            const data = record.details as any;
            
            return (
                data.vehicle_number?.toLowerCase().includes(lowercasedSearch) ||
                data.driver_name?.toLowerCase().includes(lowercasedSearch) ||
                data.challan_number?.toLowerCase().includes(lowercasedSearch)
            );
        });

    }, [gateRecords, searchTerm, timeFilter, customStartDate, customEndDate]);

    const formatTimestamp = (isoString: string) => {
        return new Date(isoString).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    }

    const FilterButton: React.FC<{ filter: TimeFilter; label: string }> = ({ filter, label }) => (
        <button
            onClick={() => setTimeFilter(filter)}
            className={`flex-1 text-center px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${timeFilter === filter ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full">
            <h3 className="text-xl font-semibold text-slate-700 mb-4">Recent Gate Activity</h3>
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-4 md:space-y-0">
                <div className="relative w-full md:max-w-xs">
                    <input
                        type="text"
                        placeholder="Search by vehicle, driver..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
                    <FilterButton filter="24h" label="Last 24h" />
                    <FilterButton filter="week" label="This Week" />
                    <FilterButton filter="month" label="This Month" />
                    <FilterButton filter="custom" label="Custom" />
                </div>
            </div>

            {timeFilter === 'custom' && (
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-4 p-2 bg-slate-50 rounded-lg justify-center">
                    <label htmlFor="start-date" className="text-sm font-medium text-slate-600">From:</label>
                    <input
                        id="start-date"
                        type="date"
                        value={customStartDate}
                        onChange={e => setCustomStartDate(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <label htmlFor="end-date" className="text-sm font-medium text-slate-600">To:</label>
                    <input
                        id="end-date"
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
                            <th className="p-3">Mode</th>
                            <th className="p-3">Vehicle No.</th>
                            <th className="p-3">Driver</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.length > 0 ? filteredRecords.map(record => {
                            const data = record.details as any;
                            const isOut = data.gate_mode === 'out';
                            return (
                                <tr key={record.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 text-slate-500 whitespace-nowrap">{formatTimestamp(record.timestamp)}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase ${
                                            isOut ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {data.gate_mode}
                                        </span>
                                    </td>
                                    <td className="p-3 font-medium text-slate-800">{data.vehicle_number}</td>
                                    <td className="p-3">{data.driver_name}</td>
                                    <td className="p-3">
                                        <button 
                                            onClick={() => setSelectedRecord(record)}
                                            className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full hover:bg-red-200 transition"
                                        >
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            )
                        }) : (
                            <tr>
                                <td colSpan={5} className="text-center p-8 text-slate-500">
                                    No entries found for the selected criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedRecord && (
                <GateEntryDetailsModal 
                    log={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                />
            )}
        </div>
    );
};
