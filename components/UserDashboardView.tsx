
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { 
    TruckIcon, ScaleIcon, ArchiveBoxIcon, CubeIcon, 
    ClipboardListIcon, ClockIcon, ExclamationCircleIcon, CogIcon, ShieldCheckIcon, 
    UsersIcon, UserGroupIcon, ChartBarIcon, DocumentTextIcon, ArrowRightIcon
} from './Icons';
import { WeighingActivityTable } from './WeighingActivityTable';
import { GateEntryActivityTable } from './GateEntryActivityTable';
import { StorageActivityTable } from './StorageActivityTable';

const StatCard = ({ icon, label, value }: { icon: JSX.Element, label: string, value: string | number }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3">
        <div className="bg-red-100 p-2 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-lg font-semibold text-slate-700">{value}</p>
        </div>
    </div>
);

export const UserDashboardView = () => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-semibold text-red-600">An Error Occurred</h1>
                <p className="text-slate-500 mt-2">We couldn\'t load your dashboard. Please try logging out and back in.</p>
            </div>
        );
    }

    const getDashboardData = () => {
        const baseData = {
            greeting: `Welcome, ${currentUser.name}`,
            quote: "Ready to make an impact? Here\'s your current standing.",
            summaryCards: [],
            mainActions: [],
            activityComponent: null as React.ReactNode,
        };

        switch (currentUser.role) {
            case UserRole.ADMIN:
                return {
                    ...baseData,
                    greeting: "Admin Dashboard",
                    quote: "Oversee and manage the entire ERP system.",
                    summaryCards: [
                        { icon: <UsersIcon />, label: "Active Users", value: "12" },
                        { icon: <ClockIcon />, label: "Pending Approvals", value: "3" },
                        { icon: <ShieldCheckIcon />, label: "System Status", value: "Operational" },
                        { icon: <ExclamationCircleIcon />, label: "Alerts", value: "0" },
                    ],
                    mainActions: [
                        { label: "Manage Users", icon: <UserGroupIcon />, path: "/users" },
                        { label: "System Settings", icon: <CogIcon />, path: "/settings" },
                        { label: "View Reports", icon: <ChartBarIcon />, path: "/reports" },
                    ]
                };

            case UserRole.GATE_SECURITY:
                return {
                    ...baseData,
                    greeting: "Gate Security Console",
                    quote: "Securing and managing all entry and exit points.",
                     summaryCards: [
                        { icon: <TruckIcon />, label: "Today\'s Entries", value: "42" },
                        { icon: <TruckIcon className="transform -scale-x-100" />, label: "Today\'s Exits", value: "38" },
                        { icon: <ClipboardListIcon />, label: "Pending Inward", value: "4" },
                        { icon: <ClockIcon />, label: "Avg. Turnaround", value: "25m" },
                    ],
                    activityComponent: <GateEntryActivityTable />
                };

            case UserRole.WEIGHBRIDGE_OPERATOR:
                return {
                    ...baseData,
                    greeting: "Weighbridge Control",
                    quote: "Ensuring accurate and efficient weight recording.",
                     summaryCards: [
                        { icon: <ScaleIcon />, label: "Total Weigh-ins", value: "80" },
                        { icon: <DocumentTextIcon />, label: "Tare Registered", value: "65" },
                        { icon: <TruckIcon />, label: "Gross Weighted", value: "15" },
                        { icon: <ClockIcon />, label: "Avg. Weight Time", value: "8m" },
                    ],
                    activityComponent: <WeighingActivityTable />
                };

            case UserRole.STORAGE_SUPERVISOR:
                return {
                    ...baseData,
                    greeting: "Storage Management",
                    quote: "Oversee all stored materials.",
                     summaryCards: [
                        { icon: <ArchiveBoxIcon />, label: "Total Stored", value: "4500 MT" },
                        { icon: <CubeIcon />, label: "Stock Value", value: "₹ 1.2 Cr" },
                        { icon: <ClipboardListIcon />, label: "Stockouts", value: "0" },
                        { icon: <ClockIcon />, label: "Avg. Storage Time", value: "48h" },
                    ],
                    activityComponent: <StorageActivityTable />
                };
            default:
                return baseData;
        }
    };

    const data = getDashboardData();

    return (
        <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{data.greeting}</h1>
                <p className="text-slate-500">{data.quote}</p>
            </div>

            {/* Full-width container for the activity table */}
            <div className="w-full">
                {data.activityComponent}
            </div>

            {/* Main Actions for Admin */}
            {data.mainActions.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-slate-700 mb-3">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.mainActions.map((action, index) => (
                            <a href={action.path} key={index} className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-red-100 p-2 rounded-full">
                                        {action.icon}
                                    </div>
                                    <span className="font-semibold text-slate-700">{action.label}</span>
                                </div>
                                <ArrowRightIcon />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
