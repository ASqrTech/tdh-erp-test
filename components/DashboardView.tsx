import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ManagerView } from './ManagerView';
import { UserDashboardView } from './UserDashboardView'; 

export const DashboardView: React.FC = () => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    switch (currentUser.role) {
        case 'ADMIN':
        case 'MANAGER':
            return <ManagerView />;
        case 'GATE_ENTRY_OPERATOR':
        case 'WEIGHING_OPERATOR':
        case 'STORE_MANAGER':
        case 'BIN_OPERATOR':
        case 'QUALITY_OPERATOR':
        case 'ASSISTANT_MANAGER':
            return <UserDashboardView />;
        default:
            // For any other authenticated role, show a generic user dashboard
            return <UserDashboardView />;
    }
};
