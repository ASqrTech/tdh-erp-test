import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Header } from './components/Header';
import { ProcessFlowDiagram } from './components/ProcessFlowDiagram';
import { StageDetailsModal } from './components/StageDetailsModal';
import LoginScreen from './components/LoginScreen';
import { ManagerView } from './components/ManagerView';
import { DashboardView } from './components/DashboardView';
import { UserDashboardView } from './components/UserDashboardView';
import { ProfileModal } from './components/ProfileModal';
import { GateEntryForm } from './components/GateEntryForm';
import { WeighingForm } from './components/WeighingForm';
import { QualityCheckForm } from './components/QualityCheckForm';
import { BinOperationForm } from './components/BinOperationForm';
import { StorageForm } from './components/StorageForm';
import { ManagerProcessView } from './components/ManagerProcessView';
import { AnalyticsModal } from './components/AnalyticsModal';
import type { ProcessStage, Role, User } from './types';
import { PROCESS_STAGES, ROLE_PERMISSIONS } from './constants.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext';

type View = 'process' | 'manage' | 'dashboard';
const managerRoles: User['role'][] = ['ADMIN', 'MANAGER', 'ASSISTANT_MANAGER'];

const AppContent: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const [selectedStage, setSelectedStage] = useState<ProcessStage | null>(null);
    const isManagerOnLoad = currentUser ? managerRoles.includes(currentUser.role) : false;
    const [view, setView] = useState<View>(isManagerOnLoad ? 'process' : 'dashboard');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const prevUserRef = useRef(currentUser);

    useEffect(() => {
        if (!prevUserRef.current && currentUser) {
            const isManager = managerRoles.includes(currentUser.role);
            setView(isManager ? 'process' : 'dashboard');
        }
        prevUserRef.current = currentUser;
    }, [currentUser]);

    const handleStageClick = useCallback((stage: ProcessStage) => {
        setSelectedStage(stage);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedStage(null);
    }, []);

    const getVisibleStages = (role: Role): ProcessStage[] => {
        const allowedStageIds = ROLE_PERMISSIONS[role] || [];
        if (!allowedStageIds) return [];
        if (allowedStageIds.includes('*')) {
            return PROCESS_STAGES;
        }
        return PROCESS_STAGES.filter(stage => allowedStageIds.includes(stage.id));
    };

    if (!currentUser) {
            return <LoginScreen />;
                }

    const visibleStages = getVisibleStages(currentUser.role);
    const isManager = managerRoles.includes(currentUser.role);
    
    const renderMainContent = () => {
        switch (view) {
            case 'dashboard':
                return isManager ? <DashboardView /> : <UserDashboardView />;
            case 'manage':
                return isManager ? <ManagerView /> : null;
            case 'process':
                if (isManager) {
                    return <ManagerProcessView stages={visibleStages} onStageClick={handleStageClick} />;
                }
                if (currentUser.role === 'GATE_ENTRY_OPERATOR') {
                    return <GateEntryForm />;
                }
                if (currentUser.role === 'WEIGHING_OPERATOR') {
                    return <WeighingForm />;
                }
                if (currentUser.role === 'QUALITY_OPERATOR') {
                    return <QualityCheckForm />;
                }
                 if (currentUser.role === 'BIN_OPERATOR') {
                    return <BinOperationForm />;
                }
                if (currentUser.role === 'STORE_MANAGER') {
                    return <StorageForm />;
                }
                return <ProcessFlowDiagram stages={visibleStages} onStageClick={handleStageClick} />;
            default:
                return <ProcessFlowDiagram stages={visibleStages} onStageClick={handleStageClick} />;
        }
    };

    const isDataEntryRole = ['GATE_ENTRY_OPERATOR', 'WEIGHING_OPERATOR', 'QUALITY_OPERATOR', 'BIN_OPERATOR', 'STORE_MANAGER'].includes(currentUser.role);

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
            <Header 
                currentUser={currentUser} 
                onLogout={logout}
                currentView={view}
                onToggleView={setView}
                onProfileClick={() => setIsProfileModalOpen(true)}
            />
            <main className="container mx-auto p-4 md:p-8 flex-grow">
                {view === 'process' && !isDataEntryRole && !isManager && (
                     <div className="text-center mb-8 md:mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Raw Dal Production Lifecycle</h2>
                        <p className="mt-2 text-md text-slate-600 max-w-2xl mx-auto">
                            Welcome, {currentUser.name}. Here is the complete workflow overview.
                        </p>
                    </div>
                )}
               
                {visibleStages.length > 0 || isManager ? (
                    renderMainContent()
                ) : (
                    <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-slate-700">No workflow stages assigned.</h3>
                        <p className="text-slate-500 mt-2">Your role does not have any process stages assigned to it. Please contact your manager.</p>
                    </div>
                )}
            </main>
            
            {selectedStage && (
                isManager ? (
                    <AnalyticsModal 
                        stage={selectedStage}
                        onClose={handleCloseModal}
                    />
                ) : (
                    <StageDetailsModal
                        stage={selectedStage}
                        onClose={handleCloseModal}
                    />
                )
            )}
            {isProfileModalOpen && (
                <ProfileModal onClose={() => setIsProfileModalOpen(false)} />
            )}

            <footer className="text-center py-6 mt-8 text-sm text-slate-500">
                <p>Prepared by: A Square Technologies</p>
            </footer>
        </div>
    );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
