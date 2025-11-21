import React, { useMemo } from 'react';
import type { User, ProcessStage } from '../types';
import { ROLE_PERMISSIONS, PROCESS_STAGES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { StageCard } from './StageCard';
import { GateEntryActivityTable } from './GateEntryActivityTable';
import { WeighingActivityTable } from './WeighingActivityTable';
import { QualityCheckActivityTable } from './QualityCheckActivityTable';
import { BinOperationActivityTable } from './BinOperationActivityTable';
import { StorageActivityTable } from './StorageActivityTable';
import { ArchiveBoxIcon, BeakerIcon, ClipboardListIcon, ClockIcon, ExclamationCircleIcon, ScaleIcon, TruckIcon, CubeIcon } from './Icons';


interface UserDashboardViewProps {
    currentUser: User;
    onStageClick: (stage: ProcessStage) => void;
}

// Mock data generator for different roles
const getDashboardData = (role: User['role']) => {
    switch (role) {
        // This case is now handled by a custom dashboard view
        // case 'QUALITY_SUPERVISOR':
        //      return {
        //         kpis: [
        //             { title: "Pending Inspections", value: "2" },
        //             { title: "Rejection Rate (24h)", value: "1.5%" },
        //         ],
        //         pendingTasks: [
        //             { id: 'BATCH-460', stage: 'Initial Quality Check', arrived: '2m ago' },
        //             { id: 'BATCH-461', stage: 'Final Quality Re-Check', arrived: '15m ago' }
        //         ],
        //         recentActivity: [
        //             { id: 'BATCH-456', stage: 'Initial Quality Check', status: 'Approved', time: '15m ago' },
        //              { id: 'BATCH-450', stage: 'Final Quality Re-Check', status: 'Approved', time: '45m ago' },
        //         ]
        //     };
        default:
             return {
                kpis: [
                    { title: "Tasks Pending", value: "1" },
                    { title: "Tasks Completed Today", value: "5" },
                ],
                pendingTasks: [
                    { id: 'BATCH-XYZ', stage: 'Your current task', arrived: 'now' }
                ],
                recentActivity: [
                    { id: 'TASK-123', stage: 'Previous task', status: 'Completed', time: '1h ago' },
                ]
            };
    }
}

const KpiCard: React.FC<{ icon: React.ReactNode; title: string; value: string }> = ({ icon, title, value }) => (
    <div className="bg-white p-5 rounded-lg shadow-md flex items-center space-x-4">
        <div className="bg-red-100 text-red-600 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
    </div>
);

interface ActivityItem {
    id: string;
    text: string;
    time: string;
    isWarning?: boolean;
}

const ActivityFeed: React.FC<{ title: string; icon: React.ReactNode; items: ActivityItem[] }> = ({ title, icon, items }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-3 mb-4">
            <div className="text-slate-500">{icon}</div>
            <h3 className="text-xl font-semibold text-slate-700">{title}</h3>
        </div>
        <div className="space-y-4">
            {items.length > 0 ? items.map((item, index) => (
                <div key={index} className="flex space-x-3">
                     <div className={`w-1 flex-shrink-0 rounded-full ${item.isWarning ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">{item.id}</p>
                        <p className="text-sm text-slate-600">{item.text}</p>
                        <p className="text-xs text-slate-400">{item.time}</p>
                    </div>
                </div>
            )) : <p className="text-sm text-slate-500 text-center py-4">No activity to show.</p>}
        </div>
    </div>
);


export const UserDashboardView: React.FC<UserDashboardViewProps> = ({ currentUser, onStageClick }) => {
    if (currentUser.role === 'GATE_ENTRY_OPERATOR') {
        const { logs } = useAuth();

        const gateEntryLogs = useMemo(() => logs
            .filter(log =>
                log.action === 'SUBMIT_STAGE_DATA' &&
                typeof log.details === 'object' &&
                log.details.stageId === 'arrival'
            )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), 
        [logs]);

        const stats = useMemo(() => {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const todayLogs = gateEntryLogs.filter(log => new Date(log.timestamp).getTime() >= todayStart);
            
            const insToday = todayLogs.filter(log => (log.details as any).submittedData?.gate_mode === 'in').length;
            const outsToday = todayLogs.filter(log => (log.details as any).submittedData?.gate_mode === 'out').length;
            const netFlow = insToday - outsToday;

            return {
                insToday,
                outsToday,
                netFlow,
            };
        }, [gateEntryLogs]);

        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome, {currentUser.name}</h2>
                    <p className="mt-1 text-md text-slate-600">Here’s a summary of your operations dashboard.</p>
                </div>
                
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <KpiCard icon={<ClipboardListIcon />} title="Vehicles IN (Today)" value={stats.insToday.toString()} />
                    <KpiCard icon={<ClipboardListIcon />} title="Vehicles OUT (Today)" value={stats.outsToday.toString()} />
                    <KpiCard icon={<TruckIcon />} title="Net Vehicle Flow (Today)" value={stats.netFlow.toString()} />
                </div>

                <div className="w-full">
                    <GateEntryActivityTable currentUser={currentUser} />
                </div>
            </div>
        );
    }
    
    if (currentUser.role === 'OPERATOR') {
        const { logs } = useAuth();

        const weighingLogs = useMemo(() => logs
            .filter(log =>
                log.userId === currentUser.id &&
                log.action === 'SUBMIT_STAGE_DATA' &&
                typeof log.details === 'object' &&
                log.details.stageId === 'weighing'
            )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        [logs, currentUser.id]);

        const stats = useMemo(() => {
            const now = new Date();
            const todayLogs = weighingLogs.filter(log => new Date(now).getTime() - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000);
            
            const totalNetWeightToday = todayLogs.reduce((acc, log) => {
                const data = (log.details as any).submittedData;
                const inWeight = parseFloat(data?.in_weight) || 0;
                const outWeight = parseFloat(data?.out_weight) || 0;
                return acc + (inWeight - outWeight);
            }, 0);
            
            return {
                today: todayLogs.length,
                totalNetWeight: totalNetWeightToday.toFixed(2),
                avgWeight: (todayLogs.length > 0 ? (totalNetWeightToday / todayLogs.length) : 0).toFixed(2),
            };
        }, [weighingLogs]);

        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome, {currentUser.name}</h2>
                    <p className="mt-1 text-md text-slate-600">Here’s your weighing dashboard.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <KpiCard icon={<ClipboardListIcon />} title="Vehicles Weighed Today" value={stats.today.toString()} />
                    <KpiCard icon={<ScaleIcon />} title="Total Net Weight (Qtl.)" value={`${stats.totalNetWeight} Qtl.`} />
                    <KpiCard icon={<TruckIcon />} title="Avg. Net Weight / Vehicle" value={`${stats.avgWeight} Qtl.`} />
                </div>

                <WeighingActivityTable currentUser={currentUser} />
            </div>
        );
    }

    if (currentUser.role === 'QUALITY_SUPERVISOR') {
        const { logs } = useAuth();

        const qualityLogs = useMemo(() => logs
            .filter(log =>
                log.action === 'SUBMIT_STAGE_DATA' &&
                typeof log.details === 'object' &&
                log.details.stageId === 'quality_check_1'
            )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        [logs]);
        
        const weighingLogs = useMemo(() => logs.filter(log => (log.details as any)?.stageId === 'weighing'), [logs]);
        
        const stats = useMemo(() => {
            const inspectedVehicles = new Set(qualityLogs.map(l => (l.details as any).submittedData.vehicle_number));
            const pendingInspectionCount = weighingLogs.filter(l => !inspectedVehicles.has((l.details as any).submittedData.vehicle_number)).length;

            const todayLogs = qualityLogs.filter(log => new Date().getTime() - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000);
            const totalMoisture = todayLogs.reduce((acc, log) => {
                const moisture = parseFloat((log.details as any).submittedData?.moisture_content_percent);
                return acc + (isNaN(moisture) ? 0 : moisture);
            }, 0);
            const avgMoisture = todayLogs.length > 0 ? (totalMoisture / todayLogs.length).toFixed(2) : '0.00';
            
            return {
                pending: pendingInspectionCount,
                inspectedToday: todayLogs.length,
                avgMoisture: `${avgMoisture}%`,
            };
        }, [qualityLogs, weighingLogs]);

        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome, {currentUser.name}</h2>
                    <p className="mt-1 text-md text-slate-600">Here’s your quality control dashboard.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <KpiCard icon={<ClockIcon />} title="Vehicles Pending Inspection" value={stats.pending.toString()} />
                    <KpiCard icon={<ClipboardListIcon />} title="Inspections Today" value={stats.inspectedToday.toString()} />
                    <KpiCard icon={<BeakerIcon />} title="Avg. Moisture (24h)" value={stats.avgMoisture} />
                </div>

                <QualityCheckActivityTable currentUser={currentUser} />
            </div>
        );
    }

    if (currentUser.role === 'BIN_OPERATOR') {
        const { logs } = useAuth();

        const binLogs = useMemo(() => logs.filter(log => (log.details as any)?.stageId === 'bin_operation'), [logs]);
        const qualityLogs = useMemo(() => logs.filter(log => (log.details as any)?.stageId === 'quality_check_1'), [logs]);
        
        const stats = useMemo(() => {
            const binnedVehicles = new Set(binLogs.map(l => (l.details as any).submittedData.vehicle_number));
            const pendingBinningCount = qualityLogs.filter(l => !binnedVehicles.has((l.details as any).submittedData.vehicle_number)).length;

            const maintenanceCount = binLogs.filter(l => (l.details as any).submittedData.bin_status === 'Maintenance').length;
            
            const totalBinnedQuantity = binLogs.reduce((total, log) => {
                const data = (log.details as any).submittedData;
                const quantities = ['ob_quantity', 'cb_quantity', 'wb_quantity', 'pb_quantity', 'sr_in_quantity', 'hub_quantity'];
                const logTotal = quantities.reduce((acc, key) => acc + (parseFloat(data[key]) || 0), 0);
                return total + logTotal;
            }, 0);

            return {
                pending: pendingBinningCount,
                maintenance: maintenanceCount,
                totalQuantity: totalBinnedQuantity.toLocaleString(),
            };
        }, [binLogs, qualityLogs]);

        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome, {currentUser.name}</h2>
                    <p className="mt-1 text-md text-slate-600">Here’s your bin operations dashboard.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <KpiCard icon={<ClockIcon />} title="Pending Bin Assignments" value={stats.pending.toString()} />
                    <KpiCard icon={<ExclamationCircleIcon />} title="Bins Under Maintenance" value={stats.maintenance.toString()} />
                    <KpiCard icon={<ArchiveBoxIcon />} title="Total Quantity Binned" value={`${stats.totalQuantity}`} />
                </div>

                <BinOperationActivityTable currentUser={currentUser} />
            </div>
        );
    }

    if (currentUser.role === 'STORE_MANAGER') {
        const { logs } = useAuth();

        const storageLogs = useMemo(() => logs
            .filter(log =>
                log.userId === currentUser.id &&
                log.action === 'SUBMIT_STAGE_DATA' &&
                typeof log.details === 'object' &&
                log.details.stageId === 'storage'
            )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        [logs, currentUser.id]);

        const stats = useMemo(() => {
            const now = new Date();
            const todayLogs = storageLogs.filter(log => new Date(now).getTime() - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000);
            
            const totalQuantityToday = todayLogs.reduce((acc, log) => {
                const quantity = parseFloat((log.details as any).submittedData?.quantity);
                return acc + (isNaN(quantity) ? 0 : quantity);
            }, 0);
            
            return {
                today: todayLogs.length,
                totalQuantity: totalQuantityToday.toFixed(2),
                avgQuantity: (todayLogs.length > 0 ? (totalQuantityToday / todayLogs.length) : 0).toFixed(2),
            };
        }, [storageLogs]);

        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome, {currentUser.name}</h2>
                    <p className="mt-1 text-md text-slate-600">Here’s your storage operations dashboard.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <KpiCard icon={<ClipboardListIcon />} title="Vehicles Stored Today" value={stats.today.toString()} />
                    <KpiCard icon={<ArchiveBoxIcon />} title="Total Quantity Stored (Qtl.)" value={`${stats.totalQuantity} Qtl.`} />
                    <KpiCard icon={<TruckIcon />} title="Avg. Quantity / Vehicle" value={`${stats.avgQuantity} Qtl.`} />
                </div>

                <StorageActivityTable currentUser={currentUser} />
            </div>
        );
    }

    const data = getDashboardData(currentUser.role);
    const assignedStageIds = ROLE_PERMISSIONS[currentUser.role] || [];
    const assignedStages = PROCESS_STAGES.filter(stage => assignedStageIds.includes(stage.id));

    return (
        <div className="space-y-8">
            <div>
                 <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome, {currentUser.name}</h2>
                 <p className="mt-1 text-md text-slate-600">Here’s a summary of your activities for today.</p>
            </div>

            {/* Assigned Stages */}
            <div>
                <h3 className="text-xl font-semibold text-slate-700 mb-4">Your Workflow Stages</h3>
                {assignedStages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignedStages.map(stage => (
                            <StageCard key={stage.id} stage={stage} onClick={() => onStageClick(stage)} />
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500">You have no stages assigned.</p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pending Tasks & KPIs */}
                <div className="lg:col-span-2 space-y-8">
                     {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {data.kpis.map(kpi => (
                            <div key={kpi.title} className="bg-white p-5 rounded-lg shadow-md">
                                <p className="text-sm text-slate-500">{kpi.title}</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{kpi.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Pending Tasks */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-slate-700 mb-4">Pending Tasks</h3>
                        <div className="space-y-3">
                            {data.pendingTasks.length > 0 ? data.pendingTasks.map(task => (
                                <div key={task.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-md">
                                    <div>
                                        <p className="font-semibold text-yellow-800">{task.id}</p>
                                        <p className="text-sm text-yellow-600">{task.stage}</p>
                                    </div>
                                    <span className="text-sm text-slate-500">{task.arrived}</span>
                                </div>
                            )) : <p className="text-slate-500">No pending tasks.</p>}
                        </div>
                    </div>
                </div>
                
                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Your Recent Activity</h3>
                     <div className="space-y-4">
                        {data.recentActivity.map((activity, index) => (
                             <div key={index} className="flex space-x-3">
                                <div className="flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.status === 'Approved' || activity.status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{activity.id} - {activity.stage}</p>
                                    <p className="text-xs text-slate-500">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}