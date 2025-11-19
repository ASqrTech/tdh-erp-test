import React, { createContext, useState, ReactNode } from 'react';
import type { User, LogEntry, ProcessStage } from '../types';

// Mock Data
const initialUsers: User[] = [
    { id: 'admin', name: 'Admin User', role: 'ADMIN', pin: '0000', password: 'password', email: 'admin@asquare.com', phone: '555-0100', address: '1 Admin Way', status: 'ACTIVE' },
    { id: 'manager', name: 'Manager User', role: 'MANAGER', pin: '1234', password: 'password', phone: '555-0101', address: '123 Factory Lane', email: 'manager@asquare.com', emergencyContactName: 'Jane Doe', emergencyContactPhone: '555-0102', familyDetails: 'Spouse: Jane Doe', status: 'ACTIVE' },
    { id: 'asstmanager', name: 'Assistant Manager', role: 'ASSISTANT_MANAGER', pin: '4321', password: 'password', email: 'asst@asquare.com', status: 'ACTIVE' },
    { id: 'gate1', name: 'Gate Operator', role: 'GATE_ENTRY_OPERATOR', pin: '5555', password: 'password', email: 'gate1@asquare.com', status: 'ACTIVE' },
    { id: 'operator1', name: 'Weighing Operator', role: 'OPERATOR', pin: '1111', password: 'password', email: 'op1@asquare.com', status: 'ACTIVE' },
    { id: 'quality1', name: 'Quality Supervisor', role: 'QUALITY_SUPERVISOR', pin: '2222', password: 'password', email: 'qa1@asquare.com', status: 'ACTIVE' },
    { id: 'binop1', name: 'Bin Operator', role: 'BIN_OPERATOR', pin: '9999', password: 'password', email: 'binop1@asquare.com', status: 'ACTIVE' },
    { id: 'store1', name: 'Store Manager', role: 'STORE_MANAGER', pin: '6666', password: 'password', email: 'store1@asquare.com', status: 'ACTIVE' },
    { id: 'plant1', name: 'Plant Operator', role: 'PLANT_OPERATOR', pin: '7777', password: 'password', email: 'plant1@asquare.com', status: 'ACTIVE' },
    { id: 'pack1', name: 'Packaging Supervisor', role: 'PACKAGING_SUPERVISOR', pin: '8888', password: 'password', email: 'pack1@asquare.com', status: 'ACTIVE' },
    { id: 'logistics1', name: 'Logistics Officer', role: 'LOGISTICS_OFFICER', pin: '3333', password: 'password', email: 'log1@asquare.com', status: 'ACTIVE' },
];

const mockPhoto1 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4='; // A light gray placeholder
const mockPhoto2 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNkMWQ1ZGQiLz48L3N2Zz4='; // A slightly darker gray
const mockPhoto3 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNjZmQ4ZTUiLz48L3N2Zz4='; // Another shade

const initialLogs: LogEntry[] = [
    // --- Flow 1: AP07BM5555 ---
    {
        id: `log-arrival-1`,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        userId: 'gate1', userName: 'Gate Operator', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'arrival', stageName: 'Raw Dal Arrival',
            submittedData: {
                gate_mode: 'in', serial_number: 'A4B9C1',
                vehicle_number: 'AP07BM5555', driver_name: 'Anil Varma', phone_number: '9876543210',
                from_broker: 'Krishna Brokers', to_location: 'Tenali Plant', note: 'Standard delivery.'
            },
        },
    },
    {
        id: `log-weigh-1`,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        userId: 'operator1', userName: 'Weighing Operator', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'weighing', stageName: 'Weighing',
            submittedData: {
                vehicle_number: 'AP07BM5555',
                ticket_number: 'TKT-240726-001',
                in_weight: '500.5',
                out_weight: '255.0',
                sample_collector: 'Ramesh',
                note: 'Standard material.',
            }
        },
    },
    {
        id: `log-quality-1`,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        userId: 'quality1', userName: 'Quality Supervisor', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'quality_check_1', stageName: 'Initial Quality Check',
            submittedData: {
                vehicle_number: 'AP07BM5555', size_analysis_7: '10', size_analysis_5: '80', size_analysis_4: '10',
                small_mud_percent: '0.5', big_mud_stones_percent: '0.2', damage_1: '1', physical_damage_2: '0.5',
                moisture_content_percent: '12.8', transaction_id: 'TRN-Q1-5555', note: 'Standard quality, meets criteria.', upload_report: mockPhoto1,
            }
        },
    },
    {
        id: `log-bin-1`,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        userId: 'binop1', userName: 'Bin Operator', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'bin_operation', stageName: 'Bin Operation',
            submittedData: {
                vehicle_number: 'AP07BM5555', bin_status: 'Fill', rm1: 'RM-A', rm2: 'RM-B', rm3: '',
                ob_quantity: '100', cb_quantity: '150', wb_quantity: '0', pb_quantity: '0', sr_in_quantity: '0', hub_quantity: '0',
            }
        },
    },
    {
        id: `log-storage-1`,
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        userId: 'store1',
        userName: 'Store Manager',
        action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'storage',
            stageName: 'Storage',
            submittedData: {
                entered_vehicle: 'AP07BM5555',
                quantity: '245.5',
                material_content: 'M3',
                jute_bags_quantity: '500',
                plastic_bags_quantity: '0',
                location: 'Kallam-3',
            },
        },
    },
    // --- Flow 2: TS09CD4321 ---
    {
        id: `log-arrival-2`,
        timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        userId: 'gate1', userName: 'Gate Operator', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'arrival', stageName: 'Raw Dal Arrival',
            submittedData: {
                gate_mode: 'in', serial_number: 'X7Y5Z3',
                vehicle_number: 'TS09CD4321', driver_name: 'Sunil Reddy', phone_number: '9123456780',
                from_broker: 'Deccan Brokers', to_location: 'Godown A', note: 'RC copy missing.'
            },
        },
    },
    {
        id: `log-weigh-2`,
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        userId: 'operator1', userName: 'Weighing Operator', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'weighing', stageName: 'Weighing',
            submittedData: {
                vehicle_number: 'TS09CD4321',
                ticket_number: 'TKT-240725-015',
                in_weight: '400.0',
                out_weight: '222.0',
                sample_collector: 'Sunita',
                note: 'RC missing, verify at office.',
            }
        },
    },
    {
        id: `log-quality-2`,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        userId: 'quality1', userName: 'Quality Supervisor', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'quality_check_1', stageName: 'Initial Quality Check',
            submittedData: {
                vehicle_number: 'TS09CD4321', size_analysis_7: '5', size_analysis_5: '90', size_analysis_4: '5',
                small_mud_percent: '0.8', big_mud_stones_percent: '0.3', damage_1: '2', physical_damage_2: '1',
                moisture_content_percent: '13.5', transaction_id: 'TRN-Q1-4321', note: 'Slightly higher moisture. Advised for quick processing.', upload_report: '',
            }
        },
    },
    {
        id: `log-bin-2`,
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
        userId: 'binop1', userName: 'Bin Operator', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'bin_operation', stageName: 'Bin Operation',
            submittedData: {
                vehicle_number: 'TS09CD4321', bin_status: 'Fill', rm1: 'RM-C', rm2: '', rm3: '',
                ob_quantity: '200', cb_quantity: '0', wb_quantity: '0', pb_quantity: '0', sr_in_quantity: '0', hub_quantity: '0',
            }
        },
    },
    {
        id: `log-storage-2`,
        timestamp: new Date(Date.now() - 22.5 * 60 * 60 * 1000).toISOString(),
        userId: 'store1',
        userName: 'Store Manager',
        action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'storage',
            stageName: 'Storage',
            submittedData: {
                entered_vehicle: 'TS09CD4321',
                quantity: '178.0',
                material_content: 'M1',
                jute_bags_quantity: '360',
                plastic_bags_quantity: '0',
                location: 'Godown-A',
            },
        },
    },
    // --- Flow 3: KA05PQ1234 (OUT) ---
    {
        id: `log-arrival-3`,
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 'gate1', userName: 'Gate Operator', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'arrival', stageName: 'Raw Dal Arrival',
            submittedData: {
                gate_mode: 'out', serial_number: 'B8C2D9',
                vehicle_number: 'KA05PQ1234', driver_name: 'Prakash Gowda', phone_number: '8877665544',
                quantity: '210', from_location: 'Tenali Plant', broker_name: 'Garden City Traders', broker_phone: '8877665500',
                note: 'Dispatch for Bengaluru warehouse.'
            },
        },
    },
    {
        id: `log-weigh-3`,
        timestamp: new Date(Date.now() - 3.9 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 'operator1', userName: 'Weighing Operator', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'weighing', stageName: 'Weighing',
            submittedData: {
                vehicle_number: 'KA05PQ1234',
                ticket_number: 'TKT-240722-005',
                in_weight: '450.0',
                out_weight: '235.0',
                sample_collector: 'Ramesh',
                note: '',
            }
        },
    },
    {
        id: `log-quality-3`,
        timestamp: new Date(Date.now() - 3.8 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 'quality1', userName: 'Quality Supervisor', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'quality_check_1', stageName: 'Initial Quality Check',
            submittedData: {
                vehicle_number: 'KA05PQ1234', size_analysis_7: '15', size_analysis_5: '75', size_analysis_4: '10',
                small_mud_percent: '0.3', big_mud_stones_percent: '0.1', damage_1: '0.5', physical_damage_2: '0.2',
                moisture_content_percent: '12.1', transaction_id: 'TRN-Q1-1234', note: 'Excellent quality.', upload_report: mockPhoto2,
            }
        },
    },
    {
        id: `log-bin-3`,
        timestamp: new Date(Date.now() - 3.7 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 'binop1', userName: 'Bin Operator', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'bin_operation', stageName: 'Bin Operation',
            submittedData: {
                vehicle_number: 'KA05PQ1234', bin_status: 'Maintenance', rm1: '', rm2: '', rm3: '',
                ob_quantity: '0', cb_quantity: '0', wb_quantity: '0', pb_quantity: '0', sr_in_quantity: '0', hub_quantity: '0',
            }
        },
    },
    {
        id: `log-storage-3`,
        timestamp: new Date(Date.now() - 3.6 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 'store1',
        userName: 'Store Manager',
        action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'storage',
            stageName: 'Storage',
            submittedData: {
                entered_vehicle: 'KA05PQ1234',
                quantity: '215.0',
                material_content: 'M2',
                jute_bags_quantity: '430',
                plastic_bags_quantity: '0',
                location: 'Baddi-1',
            },
        },
    },
     // --- Flow 4: AP39HJ8899 ---
    {
        id: `log-arrival-4`,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        userId: 'gate1', userName: 'Gate Operator', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'arrival', stageName: 'Raw Dal Arrival',
            submittedData: {
                gate_mode: 'in', serial_number: 'F6G4H2',
                vehicle_number: 'AP39HJ8899', driver_name: 'Rambabu', phone_number: '9182736450',
                from_broker: 'Guntur Farmers Co-op', to_location: 'Weighing Station', note: 'Direct from farm.'
            },
        },
    },
    {
        id: `log-weigh-4`,
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
        userId: 'operator1', userName: 'Weighing Operator', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'weighing', stageName: 'Weighing',
            submittedData: {
                vehicle_number: 'AP39HJ8899',
                ticket_number: 'TKT-240726-002',
                in_weight: '300.0',
                out_weight: '157.7',
                sample_collector: 'Sunita',
                note: 'Driver waiting.',
            }
        },
    },
    {
        id: `log-quality-4`,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        userId: 'quality1', userName: 'Quality Supervisor', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'quality_check_1', stageName: 'Initial Quality Check',
            submittedData: {
                vehicle_number: 'AP39HJ8899', size_analysis_7: '8', size_analysis_5: '82', size_analysis_4: '10',
                small_mud_percent: '1.2', big_mud_stones_percent: '0.5', damage_1: '2.5', physical_damage_2: '1.5',
                moisture_content_percent: '14.1', transaction_id: 'TRN-Q1-8899', note: 'Higher impurity levels.', upload_report: mockPhoto3,
            }
        },
    },
    {
        id: `log-bin-4`,
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        userId: 'binop1', userName: 'Bin Operator', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'bin_operation', stageName: 'Bin Operation',
            submittedData: {
                vehicle_number: 'AP39HJ8899', bin_status: 'Discharge', rm1: 'RM-D', rm2: '', rm3: '',
                ob_quantity: '50', cb_quantity: '50', wb_quantity: '50', pb_quantity: '0', sr_in_quantity: '0', hub_quantity: '0',
            }
        },
    },
    // --- Other logs ---
    {
        id: `log-arrival-5`,
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 'gate1', userName: 'Gate Operator', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'arrival', stageName: 'Raw Dal Arrival',
            submittedData: {
                gate_mode: 'in', serial_number: 'J9K1L0',
                vehicle_number: 'TN01EF9876', driver_name: 'Karthik Raja', phone_number: '9988776655',
                from_broker: 'Chennai Freight', to_location: 'Kallam', note: ''
            },
        },
    },
    {
        id: `log-arrival-6`,
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 'gate1', userName: 'Gate Operator', action: 'SUBMIT_STAGE_DATA',
        details: {
            stageId: 'arrival', stageName: 'Raw Dal Arrival',
            submittedData: {
                gate_mode: 'out', serial_number: 'M3N2P5',
                vehicle_number: 'MH12RS5678', driver_name: 'Sachin More', phone_number: '7766554433',
                quantity: '250', from_location: 'Godown A', broker_name: 'Pune Express', broker_phone: '7766554400'
            },
        },
    },
];

interface AuthContextType {
    currentUser: User | null;
    users: User[];
    passwordRequests: string[];
    logs: LogEntry[];
    login: (userId: string, pin: string, pass: string) => void;
    logout: () => void;
    addUser: (details: Omit<User, 'id' | 'pin' | 'password' | 'status'>) => { pin: string; password: string };
    requestPasswordReset: (userId: string) => void;
    approvePasswordReset: (userId: string) => void;
    updateUserProfile: (updatedUser: User) => void;
    updateUserDetails: (updatedUser: User) => void;
    deactivateUser: (userId: string) => void;
    submitStageData: (stage: ProcessStage, data: Record<string, any>) => void;
    verifyPin: (pin: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [passwordRequests, setPasswordRequests] = useState<string[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>(initialLogs);

    const addLog = (user: User, action: string, details: Record<string, any> | string) => {
        // Per request, do not log actions performed by an admin.
        if (user.role === 'ADMIN') {
            return;
        }
    
        const newLog: LogEntry = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.name,
            action,
            details,
        };
        setLogs(prev => [...prev, newLog]);
    };

    const logCurrentUserAction = (action: string, details: Record<string, any> | string) => {
        if (currentUser) {
            addLog(currentUser, action, details);
        }
    }

    const login = (userId: string, pin: string, pass: string) => {
        const user = users.find(u => u.id.toLowerCase() === userId.toLowerCase() && u.pin === pin && u.password === pass);
        if (user) {
            if (user.status === 'INACTIVE') {
                 throw new Error('This account has been deactivated. Please contact your manager.');
            }
            setCurrentUser(user);
            addLog(user, 'LOGIN', 'User signed in successfully.');
        } else {
            throw new Error('Invalid credentials. Please try again.');
        }
    };

    const logout = () => {
        logCurrentUserAction('LOGOUT', 'User signed out.');
        setCurrentUser(null);
    };

    const addUser = (details: Omit<User, 'id' | 'pin' | 'password' | 'status'>) => {
        const newId = details.name.toLowerCase().replace(/\s/g, '') + (Math.floor(Math.random() * 90) + 10);
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();
        const newPassword = 'password'; // Default password
        const newUser: User = { 
            ...details,
            id: newId, 
            pin: newPin, 
            password: newPassword,
            status: 'ACTIVE',
        };
        setUsers(prev => [...prev, newUser]);
        logCurrentUserAction('ADD_USER', `Created new user: ${newUser.name} (ID: ${newUser.id}, Role: ${newUser.role}).`);
        return { pin: newPin, password: newPassword };
    };
    
    const requestPasswordReset = (userId: string) => {
        const userExists = users.some(u => u.id === userId);
        if (userExists && !passwordRequests.includes(userId)) {
            setPasswordRequests(prev => [...prev, userId]);
            // This action is initiated by a non-logged-in user, so we can't log it via logCurrentUserAction
            // In a real app, we might log this with a system user. For now, we skip logging this.
        }
    }
    
    const approvePasswordReset = (userId: string) => {
        const targetUser = users.find(u => u.id === userId);
        if (!targetUser) return;

        setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, password: 'password' } : u));
        setPasswordRequests(prev => prev.filter(id => id !== userId));
        logCurrentUserAction('APPROVE_PASSWORD_RESET', `Approved password reset for user: ${targetUser.name} (ID: ${userId}).`);
        alert(`Password for user ${userId} has been reset to 'password'.`);
    }

    const updateUserProfile = (updatedUser: User) => {
        setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser?.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
        logCurrentUserAction('UPDATE_OWN_PROFILE', `Updated own profile details.`);
    };

    const updateUserDetails = (updatedUser: User) => {
        setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
        logCurrentUserAction('UPDATE_USER_DETAILS', `Updated details for user: ${updatedUser.name} (ID: ${updatedUser.id}).`);
    };

    const deactivateUser = (userId: string) => {
        const targetUser = users.find(u => u.id === userId);
        setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, status: 'INACTIVE' } : u));
        if (targetUser) {
             logCurrentUserAction('DEACTIVATE_USER', `Deactivated user: ${targetUser.name} (ID: ${userId}).`);
        }
    };
    
    const submitStageData = (stage: ProcessStage, data: Record<string, any>) => {
        const logDetails = {
            stageName: stage.name,
            stageId: stage.id,
            submittedData: data
        };
        logCurrentUserAction('SUBMIT_STAGE_DATA', logDetails);
        alert(`Data for ${stage.name} submitted successfully and logged!`);
    };

    const verifyPin = (pin: string) => {
        if (!currentUser) return false;
        return currentUser.pin === pin;
    };

    const value = { currentUser, users, passwordRequests, logs, login, logout, addUser, requestPasswordReset, approvePasswordReset, updateUserProfile, updateUserDetails, deactivateUser, submitStageData, verifyPin };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
