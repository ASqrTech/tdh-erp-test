import React, { useMemo, useState } from 'react';
import type { LogEntry, ProcessStage } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from './Modal';

// --- START: Chart Components ---
interface BarChartProps {
    data: { label: string; value: number }[];
    title: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    return (
        <div className="p-4 border rounded-lg bg-white h-full flex flex-col">
            <h4 className="text-sm font-semibold text-slate-600 mb-2">{title}</h4>
            <div className="flex-grow flex justify-around items-end space-x-2 pt-2">
                {data.map(item => (
                    <div key={item.label} className="flex flex-col items-center flex-1 text-center group">
                        <div className="text-xs font-bold text-slate-700 h-4">{item.value.toLocaleString()}</div>
                        <div 
                            className="w-full bg-red-400 hover:bg-red-600 transition-colors rounded-t-sm" 
                            style={{ height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }} 
                        />
                        <span className="text-xs text-slate-500 mt-1 truncate">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface PieChartProps {
    data: { label: string; value: number; color: string }[];
    title: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, title }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulative = 0;
    const gradientParts = data.map(item => {
        const start = total > 0 ? (cumulative / total) * 100 : 0;
        cumulative += item.value;
        const end = total > 0 ? (cumulative / total) * 100 : 0;
        return `${item.color} ${start}% ${end}%`;
    });
    const gradient = `conic-gradient(${gradientParts.join(', ')})`;
    
    return (
         <div className="p-4 border rounded-lg bg-white h-full">
             <h4 className="text-sm font-semibold text-slate-600 mb-2">{title}</h4>
             <div className="flex items-center justify-around h-full">
                <div className="w-28 h-28 rounded-full shadow-inner" style={{ background: gradient }} />
                <div className="space-y-1">
                    {data.map(item => (
                        <div key={item.label} className="flex items-center text-sm">
                            <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: item.color }}></span>
                            <span className="text-slate-700 font-medium">{item.label}:</span>
                            <span className="text-slate-500 ml-1.5">{item.value} ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)</span>
                        </div>
                    ))}
                </div>
             </div>
        </div>
    );
};
// --- END: Chart Components ---

// --- START: Activity Table Component ---
interface ActivityLogTableProps {
    logs: LogEntry[];
    stageId: string;
}

type TimeFilter = '24h' | 'week' | 'month' | 'custom';

const ActivityLogTable: React.FC<ActivityLogTableProps> = ({ logs, stageId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const getHeaders = () => {
        switch (stageId) {
            case 'arrival': return ['Timestamp', 'Vehicle No.', 'Driver', 'Purpose', 'Operator'];
            case 'weighing': return ['Timestamp', 'Vehicle No.', 'Ticket No.', 'In Weight', 'Out Weight', 'Net Weight', 'Operator'];
            case 'quality_check_1': return ['Timestamp', 'Vehicle No.', 'Moisture %', 'Transaction ID', 'Supervisor'];
            case 'bin_operation': return ['Timestamp', 'Vehicle No.', 'Bin Status', 'Total Qty', 'Operator'];
            case 'storage': return ['Timestamp', 'Entered Vehicle', 'Quantity (Qtl)', 'Location Area', 'Location Unit', 'Operator'];
            default: return ['Timestamp', 'Operator', 'Action'];
        }
    };

    const getRow = (log: LogEntry): (string | number)[] | null => {
        if (typeof log.details !== 'object' || !log.details?.submittedData) return null;
        const data = log.details.submittedData;
        const timestamp = new Date(log.timestamp).toLocaleString();
        switch (stageId) {
            case 'arrival': return [timestamp, data.vehicle_number, data.driver_name, data.purpose, log.userName];
            case 'weighing':
                const netWeight = (parseFloat(data.in_weight || 0) - parseFloat(data.out_weight || 0)).toFixed(2);
                return [timestamp, data.vehicle_number, data.ticket_number, data.in_weight, data.out_weight, netWeight, log.userName];
            case 'quality_check_1': return [timestamp, data.vehicle_number, data.moisture_content_percent, data.transaction_id, log.userName];
            case 'bin_operation':
                const totalQty = ['ob_quantity', 'cb_quantity', 'wb_quantity', 'pb_quantity', 'sr_in_quantity', 'hub_quantity']
                    .reduce((sum, key) => sum + (parseFloat(data[key]) || 0), 0);
                return [timestamp, data.vehicle_number, data.bin_status, totalQty.toLocaleString(), log.userName];
            case 'storage': {
                const locationParts = (data.location || '').split('-');
                const locationArea = locationParts[0] || 'N/A';
                const locationUnit = locationParts[1] || 'N/A';
                return [timestamp, data.entered_vehicle, data.quantity, locationArea, locationUnit, log.userName];
            }
            default: return [timestamp, log.userName, log.action];
        }
    };
    
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const now = new Date();
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

            if (!searchTerm) return true;
            const lowerSearch = searchTerm.toLowerCase();
            const rowData = getRow(log);
            if (!rowData) return false;
            return rowData.some(cell => String(cell).toLowerCase().includes(lowerSearch));
        });
    }, [logs, searchTerm, stageId, timeFilter, customStartDate, customEndDate]);
    
    const FilterButton: React.FC<{ filter: TimeFilter; label: string }> = ({ filter, label }) => (
        <button
            onClick={() => setTimeFilter(filter)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${timeFilter === filter ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="mt-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-4 md:space-y-0">
                <input
                    type="text"
                    placeholder="Search activity log..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-lg">
                    <FilterButton filter="24h" label="Last 24h" />
                    <FilterButton filter="week" label="This Week" />
                    <FilterButton filter="month" label="This Month" />
                    <FilterButton filter="custom" label="Custom" />
                </div>
            </div>
             {timeFilter === 'custom' && (
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-4 p-2 bg-slate-50 rounded-lg justify-center">
                    <label htmlFor="start-date-modal" className="text-sm font-medium text-slate-600">From:</label>
                    <input
                        id="start-date-modal"
                        type="date"
                        value={customStartDate}
                        onChange={e => setCustomStartDate(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <label htmlFor="end-date-modal" className="text-sm font-medium text-slate-600">To:</label>
                    <input
                        id="end-date-modal"
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
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left bg-white">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                        <tr>{getHeaders().map(h => <th key={h} className="p-3">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredLogs.length > 0 ? filteredLogs.map(log => {
                            const rowData = getRow(log);
                            if (!rowData) {
                                return (
                                    <tr key={log.id}>
                                        <td colSpan={getHeaders().length} className="p-3 text-red-500 italic">Invalid log data</td>
                                    </tr>
                                );
                            }
                            return (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    {rowData.map((cell, i) => <td key={i} className="p-3 text-slate-700 whitespace-nowrap">{cell}</td>)}
                                </tr>
                            );
                        }) : (
                             <tr><td colSpan={getHeaders().length} className="text-center p-8 text-slate-500">No activity found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
// --- END: Activity Table Component ---

// --- START: Main Analytics Modal ---
interface AnalyticsModalProps {
    stage: ProcessStage;
    onClose: () => void;
}

const KpiCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="p-4 border rounded-lg bg-white text-center">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
);

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ stage, onClose }) => {
    const { logs } = useAuth();

    const stageLogs = useMemo(() => logs
        .filter(log =>
            typeof log.details === 'object' &&
            log.details !== null &&
            (log.details as any).stageId === stage.id
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [logs, stage.id]);

    const analyticsContent = useMemo(() => {
        const data = stageLogs
            .map(log => typeof log.details === 'object' ? log.details.submittedData : null)
            .filter(Boolean);
            
        switch (stage.id) {
            case 'arrival': {
                const dailyCounts = stageLogs.reduce((acc, log) => {
                    const date = new Date(log.timestamp).toISOString().split('T')[0];
                    acc[date] = (acc[date] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);
                
                const barData = Object.entries(dailyCounts)
                    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                    .slice(-7)
                    .map(([label, value]) => ({
                        label: new Date(label + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        value: value as number
                    }));
                
                const typeCounts = data.reduce((acc, d) => {
                    acc[d.vehicle_type] = (acc[d.vehicle_type] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const pieData = [
                    { label: 'Vendor', value: typeCounts['Vendor'] || 0, color: '#f87171' },
                    { label: 'Visitor', value: typeCounts['Visitor'] || 0, color: '#fbbf24' }
                ];

                const totalCapacity = data.reduce((sum, d) => sum + (parseFloat(d.capacity) || 0), 0);
                
                return {
                    kpis: [
                        { title: "Total Entries", value: data.length },
                        { title: "Avg. Capacity (Tons)", value: (data.length > 0 ? totalCapacity / data.length : 0).toFixed(2) }
                    ],
                    charts: [
                        <BarChart key="bar" title="Entries (Last 7 Days)" data={barData} />,
                        <PieChart key="pie" title="Visitor/Vendor" data={pieData} />
                    ]
                };
            }
             case 'weighing': {
                const totalNetWeight = data.reduce((sum, d) => {
                    const inWeight = parseFloat(d.in_weight) || 0;
                    const outWeight = parseFloat(d.out_weight) || 0;
                    return sum + (inWeight - outWeight);
                }, 0);

                return {
                    kpis: [
                        { title: "Vehicles Weighed", value: data.length },
                        { title: "Total Net Weight (Qtl)", value: totalNetWeight.toFixed(2) },
                        { title: "Avg. Net Weight / Vehicle", value: (data.length > 0 ? totalNetWeight / data.length : 0).toFixed(2) }
                    ],
                    charts: []
                };
            }
            case 'quality_check_1': {
                const totalInspections = data.length;
                const totalMoisture = data.reduce((sum, d) => sum + (parseFloat(d.moisture_content_percent) || 0), 0);
                const avgMoisture = totalInspections > 0 ? totalMoisture / totalInspections : 0;

                const dailyCounts = stageLogs.reduce((acc, log) => {
                    const date = new Date(log.timestamp).toISOString().split('T')[0];
                    acc[date] = (acc[date] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const barData = Object.entries(dailyCounts)
                    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                    .slice(-7)
                    .map(([label, value]) => ({
                        label: new Date(label + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        value: value as number
                    }));
                
                const moistureBuckets = { '< 12%': 0, '12-13%': 0, '13-14%': 0, '> 14%': 0 };
                data.forEach(d => {
                    const moisture = parseFloat(d.moisture_content_percent);
                    if (moisture < 12) moistureBuckets['< 12%']++;
                    else if (moisture >= 12 && moisture < 13) moistureBuckets['12-13%']++;
                    else if (moisture >= 13 && moisture < 14) moistureBuckets['13-14%']++;
                    else if (moisture >= 14) moistureBuckets['> 14%']++;
                });

                const pieData = [
                    { label: '< 12%', value: moistureBuckets['< 12%'], color: '#34d399' },
                    { label: '12-13%', value: moistureBuckets['12-13%'], color: '#fbbf24' },
                    { label: '13-14%', value: moistureBuckets['13-14%'], color: '#f87171' },
                    { label: '> 14%', value: moistureBuckets['> 14%'], color: '#ef4444' },
                ];

                return {
                    kpis: [
                        { title: "Total Inspections", value: totalInspections },
                        { title: "Avg. Moisture", value: `${avgMoisture.toFixed(2)}%` }
                    ],
                    charts: [
                        <BarChart key="bar" title="Inspections (Last 7 Days)" data={barData} />,
                        <PieChart key="pie" title="Moisture Content Distribution" data={pieData} />
                    ]
                };
            }
            case 'bin_operation': {
                const totalOperations = data.length;
                
                const statusCounts = data.reduce((acc, d) => {
                    acc[d.bin_status] = (acc[d.bin_status] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const pieData = [
                    { label: 'Fill', value: statusCounts['Fill'] || 0, color: '#34d399' },
                    { label: 'Discharge', value: statusCounts['Discharge'] || 0, color: '#f87171' },
                    { label: 'Maintenance', value: statusCounts['Maintenance'] || 0, color: '#fbbf24' }
                ];
                
                const binTypes = ['ob_quantity', 'cb_quantity', 'wb_quantity', 'pb_quantity', 'sr_in_quantity', 'hub_quantity'];
                const quantityTotals = binTypes.reduce((acc, key) => {
                    acc[key.replace('_quantity', '').toUpperCase()] = data.reduce((sum, d) => sum + (parseFloat(d[key]) || 0), 0);
                    return acc;
                }, {} as Record<string, number>);

                const barData = Object.entries(quantityTotals)
                    .filter(([, value]) => value > 0)
                    .map(([label, value]) => ({ label, value: value as number }));
                
                const totalBinned = barData.reduce((sum, item) => sum + item.value, 0);

                return {
                    kpis: [
                        { title: "Total Operations", value: totalOperations },
                        { title: "Bins in Maintenance", value: statusCounts['Maintenance'] || 0 },
                        { title: "Total Quantity Binned", value: totalBinned.toLocaleString() }
                    ],
                    charts: [
                         <PieChart key="pie" title="Bin Status Distribution" data={pieData} />,
                         <BarChart key="bar" title="Total Quantity by Bin Type" data={barData} />,
                    ]
                };
            }
            case 'storage': {
                const totalQuantity = data.reduce((sum, d) => sum + (parseFloat(d.quantity) || 0), 0);
                
                const locationCounts = data.reduce((acc, d) => {
                    const locationArea = (d.location || '').split('-')[0];
                    if (locationArea) {
                        acc[locationArea] = (acc[locationArea] || 0) + 1;
                    }
                    return acc;
                }, {} as Record<string, number>);

                // FIX: Explicitly cast value to number to prevent TypeScript errors.
                const barData = Object.entries(locationCounts).map(([label, value]) => ({ label, value: value as number }));

                const materialCounts = data.reduce((acc, d) => {
                    if (d.material_content) {
                        acc[d.material_content] = (acc[d.material_content] || 0) + 1;
                    }
                    return acc;
                }, {} as Record<string, number>);
                
                const pieData = Object.entries(materialCounts).map(([label, value], i) => ({
                    label, value: value as number, color: ['#f87171', '#fb923c', '#fbbf24', '#f472b6', '#ec4899'][i % 5]
                }));
                
                return {
                    kpis: [
                        { title: "Total Vehicles Stored", value: data.length },
                        { title: "Total Quantity Stored (Qtl)", value: totalQuantity.toFixed(2) }
                    ],
                    charts: [
                        <BarChart key="bar" title="Entries by Location Area" data={barData} />,
                        <PieChart key="pie" title="Entries by Material" data={pieData} />
                    ]
                };
            }
            default:
                return { kpis: [{ title: "Total Logs", value: stageLogs.length }], charts: [] };
        }
    }, [stageLogs, stage.id]);

    return (
        <Modal isOpen={true} onClose={onClose} containerClassName="max-w-7xl" bgClassName="bg-slate-100">
            <div className="p-6 border-b bg-white rounded-t-2xl flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{stage.name} - Analytics</h2>
                    <p className="text-sm text-slate-500">{stage.description}</p>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full p-2 transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="p-6 overflow-y-auto">
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analyticsContent.kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
                </div>

                {/* Charts */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[250px]">
                    {analyticsContent.charts}
                </div>
                
                {/* Full Activity Table */}
                <ActivityLogTable logs={stageLogs} stageId={stage.id} />
            </div>
        </Modal>
    );
};