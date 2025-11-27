import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
    TruckIcon, ScaleIcon, ArchiveBoxIcon, 
    ClockIcon, ExclamationCircleIcon, CogIcon, ShieldCheckIcon, 
    UsersIcon, UserGroupIcon, ChartBarIcon, DocumentTextIcon, ArrowRightIcon, PaperAirplaneIcon
} from './Icons';
import { WeighingActivityTable } from './WeighingActivityTable';
import { GateEntryActivityTable } from './GateEntryActivityTable';
import { StorageActivityTable } from './StorageActivityTable';
import { QualityCheckActivityTable } from './QualityCheckActivityTable';
import { DispatchActivityTable } from './DispatchActivityTable';

const StatCard = ({ icon, label, value }: { icon: JSX.Element, label: string, value: string | number }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3 border border-slate-100">
        <div className="bg-red-50 p-3 rounded-full text-red-600">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{label}</p>
            <p className="text-xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

export const UserDashboardView = () => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center h-screen bg-slate-50">
                <ExclamationCircleIcon />
                <h1 className="text-xl font-semibold text-red-600 mt-4">An Error Occurred</h1>
                <p className="text-slate-500 mt-2">We couldn't load your dashboard. Please try logging out and back in.</p>
            </div>
        );
    }

    const getDashboardData = () => {
        const baseData = {
            greeting: `Welcome, ${currentUser.name || 'User'}`,
            quote: "Ready to make an impact? Here's your current standing.",
            summaryCards: [] as { icon: JSX.Element, label: string, value: string | number }[],
            mainActions: [] as { label: string, icon: JSX.Element, path: string }[],
            activityComponent: null as React.ReactNode,
        };

        switch (currentUser.role) {

            case 'DISPATCH_OPERATOR':
                return {
                    ...baseData,
                    greeting: "Dispatch Console",
                    quote: "Manage and record all outbound shipments.",
                    summaryCards: [
                        { icon: <PaperAirplaneIcon />, label: "Today's Dispatches", value: "15" },
                        { icon: <ClockIcon />, label: "Pending Shipments", value: "2" },
                        { icon: <TruckIcon />, label: "Vehicles on Route", value: "10" },
                        { icon: <DocumentTextIcon />, label: "Total Items Shipped", value: "1,200" },
                    ],
                    // The form is now shown on a separate view, triggered by the "Create Record" button.
                    activityComponent: <DispatchActivityTable currentUser={currentUser} />
                };
            
            case 'ADMIN':
            case 'MANAGER':
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

            case 'GATE_ENTRY_OPERATOR':
                return {
                    ...baseData,
                    greeting: "Gate Entry Console",
                    quote: "Securing and managing all entry and exit points.",
                    activityComponent: <GateEntryActivityTable currentUser={currentUser}/>
                };

            case 'WEIGHING_OPERATOR':
                return {
                    ...baseData,
                    greeting: "Weighing Operator Console",
                    quote: "Ensuring accurate and efficient weight recording.",
                    activityComponent: <WeighingActivityTable currentUser={currentUser}/>
                };

            case 'QUALITY_OPERATOR': 
                return {
                    ...baseData,
                    greeting: "Quality Check Dashboard",
                    quote: "Ensuring all materials meet the required standards.",
                    activityComponent: <QualityCheckActivityTable currentUser={currentUser}/>
                };

            case 'STORE_MANAGER':
            case 'BIN_OPERATOR':
                return {
                    ...baseData,
                    greeting: "Storage Management",
                    quote: "Oversee all stored materials.",
                    activityComponent: <StorageActivityTable currentUser={currentUser}/>
                };

            default:
                return {
                    ...baseData,
                    mainActions: [],
                    summaryCards: [],
                };
        }
    };

    const data = getDashboardData();

    return (
        <div className="p-4 md:p-6 space-y-8 bg-slate-50 min-h-screen">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{data.greeting}</h1>
                <p className="text-slate-500 mt-1">{data.quote}</p>
            </div>

            {data.summaryCards.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {data.summaryCards.map((card, index) => (
                        <StatCard 
                            key={index} 
                            icon={card.icon}
                            label={card.label} 
                            value={card.value} 
                        />
                    ))}
                </div>
            )}

            {data.mainActions.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-slate-700 mb-3">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.mainActions.map((action, index) => (
                            <a href={action.path} key={index} className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-all border border-slate-100 flex items-center justify-between group">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-red-50 text-red-600 p-2 rounded-lg group-hover:bg-red-100 transition-colors">
                                        {action.icon}
                                    </div>
                                    <span className="font-semibold text-slate-700">{action.label}</span>
                                </div>
                                <div className="text-slate-400 group-hover:text-red-500 transition-colors">
                                    <ArrowRightIcon />
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {data.activityComponent && (
                <div className="w-full">
                    {data.activityComponent}
                </div>
            )}
        </div>
    );
};