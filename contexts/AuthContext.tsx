
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from '../firebase/firebase';
import type { User, LogEntry, ProcessStage } from '../types';

interface AuthContextType {
    currentUser: User | null;
    users: User[];
    logs: LogEntry[];
    loading: boolean;
    login: (email: string, pass: string, pin: string) => Promise<void>;
    logout: () => void;
    addUser: (details: Omit<User, 'id' | 'pin' | 'password' | 'status'>) => Promise<{ pin: string; password: string }>;
    requestPasswordReset: (email: string) => Promise<void>;
    updateUserProfile: (updatedUser: User) => Promise<void>;
    updateUserDetails: (updatedUser: User) => Promise<void>;
    deactivateUser: (userId: string) => Promise<void>;
    submitStageData: (stage: ProcessStage, data: Record<string, any>) => Promise<void>;
    verifyPin: (pin: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeUserSnapshot: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, user => {
            if (unsubscribeUserSnapshot) {
                unsubscribeUserSnapshot();
            }

            if (user) {
                const userRef = doc(db, "users", user.uid);
                unsubscribeUserSnapshot = onSnapshot(userRef, 
                    (doc) => {
                        if (doc.exists()) {
                            setCurrentUser({ id: doc.id, ...doc.data() } as User);
                        } else {
                            // This can happen on new user creation; the user doc hasn't been created yet.
                            // We won't set currentUser to null, as the doc should appear shortly.
                        }
                        setLoading(false);
                    },
                    (error) => {
                        console.error("Error fetching user document:", error);
                        setCurrentUser(null);
                        setLoading(false);
                    }
                );
            } else {
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUserSnapshot) {
                unsubscribeUserSnapshot();
            }
        };
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as User[];
            setUsers(usersData);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "logs"), (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as LogEntry[];
            setLogs(logsData);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email: string, pass: string, pin: string) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        if (!userDoc.exists() || userDoc.data().pin !== pin) {
            await signOut(auth);
            throw new Error("Invalid PIN or user data not found.");
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    const addUser = async (details: Omit<User, 'id' | 'pin' | 'password' | 'status'>) => {
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();
        const newPassword = 'password'; // Default password
        
        const userCredential = await createUserWithEmailAndPassword(auth, details.email, newPassword);
        const newUser: Omit<User, 'id'> = { 
            ...details,
            pin: newPin, 
            password: newPassword, // Note: You should not store plaintext passwords
            status: 'ACTIVE',
        };
        
        await setDoc(doc(db, "users", userCredential.user.uid), newUser);
        return { pin: newPin, password: newPassword };
    };
    
    const requestPasswordReset = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const updateUserProfile = async (updatedUser: User) => {
        const userRef = doc(db, "users", updatedUser.id);
        await updateDoc(userRef, updatedUser as any);
    };

    const updateUserDetails = async (updatedUser: User) => {
        const userRef = doc(db, "users", updatedUser.id);
        await updateDoc(userRef, updatedUser as any);
    };

    const deactivateUser = async (userId: string) => {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { status: 'INACTIVE' });
    };
    
    const submitStageData = async (stage: ProcessStage, data: Record<string, any>) => {
        const logDetails = {
            stageName: stage.name,
            stageId: stage.id,
            submittedData: data,
            timestamp: new Date().toISOString(),
            userId: currentUser?.id,
            userName: currentUser?.name,
            action: 'SUBMIT_STAGE_DATA',
        };

        await addDoc(collection(db, "logs"), logDetails);
    };
    
    const verifyPin = (pin: string) => {
        if (!currentUser) return false;
        return currentUser.pin === pin;
    };

    const value = { currentUser, users, logs, loading, login, logout, addUser, requestPasswordReset, updateUserProfile, updateUserDetails, deactivateUser, submitStageData, verifyPin };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
