import React, { createContext, useState, ReactNode, useEffect } from 'react';
import type { User, LogEntry, ProcessStage } from '../types';

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
    const [users, setUsers] = useState<User[]>([]);
    const [passwordRequests, setPasswordRequests] = useState<string[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/users');
                const data = await response.json();
                setUsers(data.data);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };

        const fetchLogs = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/gate-entries');
                const data = await response.json();
                const formattedLogs = data.data.map((entry: any) => ({
                    id: `log-arrival-${entry.id}`,
                    timestamp: entry.timestamp,
                    userId: entry.user_id,
                    userName: 'Gate Operator', // This should be fetched from the users table
                    action: 'SUBMIT_STAGE_DATA',
                    details: {
                        stageId: 'arrival',
                        stageName: 'Raw Dal Arrival',
                        submittedData: entry,
                    },
                }));
                setLogs(formattedLogs);
            } catch (error) {
                console.error('Failed to fetch gate entries:', error);
            }
        };

        fetchUsers();
        fetchLogs();
    }, []);

    const addLog = (user: User, action: string, details: Record<string, any> | string) => {
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
        const user = users.find(u => u.email.toLowerCase() === userId.toLowerCase() && u.pin === pin && u.password === pass);
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
    
    const submitStageData = async (stage: ProcessStage, data: Record<string, any>) => {
        const logDetails = {
            stageName: stage.name,
            stageId: stage.id,
            submittedData: data
        };

        if (stage.id === 'arrival') {
            try {
                const response = await fetch('http://localhost:3001/api/gate-entries', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ...data, user_id: currentUser?.id }),
                });

                if (!response.ok) {
                    throw new Error('Failed to submit gate entry');
                }

                const newEntry = await response.json();
                const newLog: LogEntry = {
                    id: `log-arrival-${newEntry.data.id}`,
                    timestamp: newEntry.data.timestamp,
                    userId: newEntry.data.user_id,
                    userName: currentUser?.name ?? 'Unknown User',
                    action: 'SUBMIT_STAGE_DATA',
                    details: {
                        stageId: 'arrival',
                        stageName: 'Raw Dal Arrival',
                        submittedData: newEntry.data,
                    },
                };
                setLogs(prev => [...prev, newLog]);

                alert(`Data for ${stage.name} submitted successfully and logged!`);
            } catch (error) {
                console.error(error);
                alert(`Failed to submit data for ${stage.name}.`);
            }
        } else {
            logCurrentUserAction('SUBMIT_STAGE_DATA', logDetails);
            alert(`Data for ${stage.name} submitted successfully and logged!`);
        }
    };

    const verifyPin = (pin: string) => {
        if (!currentUser) return false;
        return currentUser.pin === pin;
    };

    const value = { currentUser, users, passwordRequests, logs, login, logout, addUser, requestPasswordReset, approvePasswordReset, updateUserProfile, updateUserDetails, deactivateUser, submitStageData, verifyPin };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
