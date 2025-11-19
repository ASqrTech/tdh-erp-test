import React, { useMemo } from 'react';
import { 
    TruckIcon, 
    ScaleIcon, 
    ShieldCheckIcon,
    ExclamationCircleIcon
} from './Icons';
import { useAuth } from '../hooks/useAuth';
import { PROCESS_STAGES } from '../constants';

// A component for the new Process Health cards
const ProcessHealthCard: React.FC<{ stage: any }> = ({ stage }) => {
    const statusColors = {
        nominal: 'bg-green-500',
        warning: 'bg-yellow-500',
        critical: 'bg-red-500',
    };
    return (
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4 transition-all hover:shadow-lg hover:-translate-y-1">
            <div className={`flex-shrink-0 p-3 rounded-lg ${stage.color.bg} ${stage.color.text}`}>
                {stage.icon}
            </div>
            <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">{stage.name}</p>
                <p className="text-xl font-bold text-slate-900">{stage.metric}</p>
            </div>
            <div className="flex flex-col items-center w-14">
                <div className={`w-3 h-3 rounded-full ${statusColors[stage.status]} animate-pulse`}></div>
                <p className="text-xs text-slate-500 capitalize mt-1">{stage.status}</p>
            </div>
        </div>
    );
};

// A component for the new Alert items
const AlertItem: React.FC<{ alert: any }> = ({ alert }) => {
    const alertConfig = {
        warning: {
            icon: <ExclamationCircleIcon />,
            iconBg: 'bg-yellow-100',
            iconText: 'text-yellow-600',
            border: 'border-yellow-400',
        },
        critical: {
            icon: <ExclamationCircleIcon />,
            iconBg: 'bg-red-100',
            iconText: 'text-red-600',
            border: 'border-red-400',
        }
    };
    const config = alertConfig[alert.level];

    return (
        <div className={`flex items-start p-3 bg-white rounded-lg border-l-4 ${config.border} shadow-sm`}>
            <div className={`flex-shrink-0 p-2 rounded-full ${config.iconBg} ${config.iconText}`}>
                {config.icon}
            </div>
            <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-slate-800">{alert.title}</p>
                <p className="text-sm text-slate-600">{alert.description}</p>
            </div>
            <p className="text-xs text-slate-400 whitespace-nowrap ml-2">{alert.time}</p>
        </div>
    );
};

export const DashboardView: React.FC = () => {
    const { logs } = useAuth();

    const dashboardData = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const todayLogs = logs.filter(l => new Date(l.timestamp).getTime() >= todayStart);

        // --- KPIs ---
        const weighingLogsToday = todayLogs.filter(l => (l.details as any)?.stageId === 'weighing');
        const totalProductionToday = weighingLogsToday.reduce((sum, log) => sum + parseFloat((log.details as any).submittedData.quantity || 0), 0);

        const arrivalLogs = logs.filter(l => (l.details as any)?.stageId === 'arrival');
        const dispatchLogs = logs.filter(l => (l.details as any)?.stageId === 'dispatch');
        const arrivedVehicles = new Set(arrivalLogs.map(l => (l.details as any).submittedData.vehicle_number));
        const dispatchedVehicles = new Set(dispatchLogs.map(l => (l.details as any).submittedData.truck_no || (l.details as any).submittedData.vehicle_number));
        
        arrivedVehicles.forEach(vehicle => {
            if (dispatchedVehicles.has(vehicle)) {
                arrivedVehicles.delete(vehicle);
            }
        });
        const vehiclesOnSite = arrivedVehicles.size;

        const qualityLogs = logs.filter(l => (l.details as any)?.stageId === 'quality_check_1');
        const highMoistureSamples = qualityLogs.filter(l => parseFloat((l.details as any).submittedData.moisture_content_percent || 0) > 13.5).length;
        const qaScore = qualityLogs.length > 0 ? ((1 - (highMoistureSamples / qualityLogs.length)) * 100) : 100;
        
        // --- Process Health ---
        const processHealth = PROCESS_STAGES.map(stage => {
            const stageLogs = logs.filter(l => (l.details as any)?.stageId === stage.id);
            const stageLogsToday = todayLogs.filter(l => (l.details as any)?.stageId === stage.id);
            let metric: string | number = `${stageLogsToday.length} entries`;
            let status: 'nominal' | 'warning' | 'critical' = 'nominal';
            let pendingCount = 0;

            if (stage.id === 'weighing') {
                const totalQuintals = stageLogsToday.reduce((sum, log) => sum + parseFloat((log.details as any).submittedData.quantity || 0), 0);
                metric = `${totalQuintals.toFixed(1)} Qtl.`;
            }
            
            if (stage.id === 'quality_check_1') {
                 const weighingVehicleLogs = logs.filter(l => (l.details as any)?.stageId === 'weighing');
                 const inspectedVehicles = new Set(stageLogs.map(l => (l.details as any).submittedData.vehicle_number));
                 pendingCount = weighingVehicleLogs.filter(l => !inspectedVehicles.has((l.details as any).submittedData.entered_vehicle)).length;
                 metric = `${pendingCount} pending`;
                 if (pendingCount > 3) status = 'warning';
            }

            if (stage.id === 'bin_operation') {
                 const qualityVehicles = new Set(qualityLogs.map(l => (l.details as any).submittedData.vehicle_number));
                 const binnedVehicles = new Set(stageLogs.map(l => (l.details as any).submittedData.vehicle_number));
                 pendingCount = Array.from(qualityVehicles).filter(v => !binnedVehicles.has(v)).length;
                 metric = `${pendingCount} pending`;
                 if (pendingCount > 3) status = 'warning';
            }
            
            return { ...stage, metric, status, pendingCount };
        });

        // --- Alerts ---
        const alerts = [];
        const recentHighMoisture = qualityLogs
            .filter(l => new Date(l.timestamp).getTime() >= todayStart && parseFloat((l.details as any).submittedData.moisture_content_percent || 0) > 14)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (recentHighMoisture) {
            alerts.push({
                id: 'alert-moisture', level: 'critical', title: 'High Moisture Detected',
                description: `Vehicle ${(recentHighMoisture.details as any).submittedData.vehicle_number} recorded at ${(recentHighMoisture.details as any).submittedData.moisture_content_percent}%.`,
                time: new Date(recentHighMoisture.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        }

        const binHealth = processHealth.find(p => p.id === 'bin_operation');
        if (binHealth && binHealth.pendingCount > 3) {
            alerts.push({
                id: 'alert-bottleneck', level: 'warning', title: 'Potential Bottleneck',
                description: `Binning operations are falling behind. ${binHealth.pendingCount} vehicles are awaiting bin assignment.`,
                time: 'Just now'
            });
        }

        const longStayVehicleLog = Array.from(arrivedVehicles)
            .map(v => logs.find(l => (l.details as any)?.stageId === 'arrival' && (l.details as any)?.submittedData.vehicle_number === v))
            .filter(Boolean)
            .find(log => (now.getTime() - new Date(log!.timestamp).getTime()) > 8 * 60 * 60 * 1000);

        if (longStayVehicleLog) {
             alerts.push({
                id: 'alert-longstay', level: 'warning', title: 'Vehicle Long Stay',
                description: `Vehicle ${(longStayVehicleLog.details as any).submittedData.vehicle_number} has been on-site for over 8 hours.`,
                time: `Arrived at ${new Date(longStayVehicleLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            });
        }

        return {
            kpis: [
                { title: 'Throughput (Today)', value: `${totalProductionToday.toFixed(2)} Qtl.`, icon: <ScaleIcon /> },
                { title: 'Live Vehicles On-Site', value: vehiclesOnSite, icon: <TruckIcon /> },
                { title: 'Quality Score (All Time)', value: `${qaScore.toFixed(1)}%`, icon: <ShieldCheckIcon /> },
            ],
            processHealth,
            alerts
        };
    }, [logs]);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Manager's Live Dashboard</h2>
                <p className="mt-1 text-md text-slate-600">A real-time overview of the factory floor operations.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardData.kpis.map(kpi => (
                    <div key={kpi.title} className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
                        <div className="bg-red-100 text-red-600 p-4 rounded-full">
                            {kpi.icon}
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{kpi.title}</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">{kpi.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Live Process Health</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dashboardData.processHealth
                            .filter(stage => ['arrival', 'weighing', 'quality_check_1', 'bin_operation', 'processing'].includes(stage.id))
                            .map(stage => <ProcessHealthCard key={stage.id} stage={stage} />)
                        }
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Actionable Alerts</h3>
                    <div className="space-y-3">
                        {dashboardData.alerts.length > 0 ? (
                            dashboardData.alerts.map(alert => <AlertItem key={alert.id} alert={alert} />)
                        ) : (
                            <div className="text-center p-8 bg-white rounded-lg shadow-md h-full flex flex-col justify-center">
                                <p className="text-slate-500 font-semibold">No critical alerts</p>
                                <p className="text-sm text-slate-400 mt-1">System is operating nominally.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};