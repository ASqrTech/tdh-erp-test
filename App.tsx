import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import { ManagerView } from './components/ManagerView';
import { UserDashboardView } from './components/UserDashboardView';
import { Header } from './components/Header';
import { GateEntryForm } from './components/GateEntryForm';
import { DispatchForm } from './components/DispatchForm';
import { WeighingForm } from './components/WeighingForm';
import { QualityCheckForm } from './components/QualityCheckForm';
import { BinOperationForm } from './components/BinOperationForm';

type View = 'dashboard' | 'process' | 'manage';

const AppContent: React.FC = () => {
    const auth = useAuth();
    const [currentView, setCurrentView] = useState<View>('dashboard');

    const handleToggleView = (view: View) => {
        if (view === 'manage' && !(auth.currentUser?.role === 'ADMIN' || auth.currentUser?.role === 'MANAGER')) {
            return;
        }
        setCurrentView(view);
    };

    if (auth.loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!auth.currentUser) {
        return <LoginScreen />;
    }

    const renderMainContent = () => {
        if (currentView === 'process') {
            switch (auth.currentUser?.role) {
                case 'GATE_ENTRY_OPERATOR':
                    return <GateEntryForm onSubmissionSuccess={() => setCurrentView('dashboard')} />;
                case 'DISPATCH_OPERATOR':
                    return <DispatchForm onSubmissionSuccess={() => setCurrentView('dashboard')} />;
                case 'WEIGHING_OPERATOR':
                    return <WeighingForm onSubmissionSuccess={() => setCurrentView('dashboard')} />;
                case 'QUALITY_CHECK_OPERATOR':
                    return <QualityCheckForm onSubmissionSuccess={() => setCurrentView('dashboard')} />;
                case 'BIN_OPERATOR':
                    return <BinOperationForm onSubmissionSuccess={() => setCurrentView('dashboard')} />;
                default:
                    // Fallback for other roles who might click a 'process' button without a form
                    return <UserDashboardView />;
            }
        }

        if (currentView === 'manage') {
            return <ManagerView />;
        }

        // Default to dashboard
        if (auth.currentUser.role === 'MANAGER' || auth.currentUser.role === 'ADMIN') {
            return <ManagerView />;
        }
        return <UserDashboardView />;
    };

    return (
        <>
            <Header 
                currentUser={auth.currentUser} 
                onLogout={auth.logout} 
                currentView={currentView} 
                onToggleView={handleToggleView}
                onProfileClick={() => console.log('Profile clicked')} // Placeholder
            />
            <main className="p-4 sm:p-6 lg:p-8">
                {renderMainContent()}
            </main>
        </>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-gray-50">
                <AppContent />
            </div>
        </AuthProvider>
    );
};

export default App;
