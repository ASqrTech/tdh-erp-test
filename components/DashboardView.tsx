
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ManagerView } from './ManagerView';
import { GateEntryActivityTable } from './GateEntryActivityTable';
import { UserDashboardView } from './UserDashboardView'; // A default view for other logged-in users

export const DashboardView: React.FC = () => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>; // Or a more sophisticated loading spinner
    }

    switch (currentUser.role) {
        case 'ADMIN':
        case 'MANAGER':
            return <ManagerView />;
        case 'GATE_OPERATOR':
            // The GateEntryActivityTable now includes the form and the table
            return <GateEntryActivityTable currentUser={currentUser} />;
        default:
            // For any other authenticated role, show a generic user dashboard
            return <UserDashboardView />;
    }
};
