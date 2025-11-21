
import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, getDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { auth, db } from '../firebase/firebase';
import type { User, LogEntry, ProcessStage } from '../types';

// The shape of the authentication context
interface AuthContextType {
    currentUser: User | null;
    users: User[];
    logs: LogEntry[];
    passwordRequests: string[];
    loading: boolean;
    login: (email: string, pass: string, pin: string) => Promise<void>;
    logout: () => void;
    addUser: (details: Omit<User, 'id' | 'pin' | 'password' | 'status'>) => Promise<{ pin: string; password: string }>;
    requestPasswordReset: (email: string) => Promise<void>;
    approvePasswordReset: (userId: string) => Promise<void>;
    updateUserDetails: (updatedUser: User) => Promise<void>;
    deactivateUser: (userId: string) => Promise<void>;
    // Deprecated functions that will be maintained for now
    ensureHardcodedAdmin: () => Promise<void>;
    updateUserProfile: (updatedUser: User) => Promise<void>;
    submitStageData: (stage: ProcessStage, data: Record<string, any>) => Promise<void>;
    verifyPin: (pin: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The provider component that wraps the app
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [passwordRequests, setPasswordRequests] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Listener for authentication state changes
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, user => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
                    setCurrentUser(doc.exists() ? { id: doc.id, ...doc.data() } as User : null);
                    setLoading(false);
                });
                return () => unsubscribeSnapshot();
            } else {
                setCurrentUser(null);
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // Listener for the users collection
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), snapshot => {
            setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as User[]);
        });
        return () => unsubscribe();
    }, []);

    // Listener for the logs collection
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "logs"), snapshot => {
            setLogs(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as LogEntry[]);
        });
        return () => unsubscribe();
    }, []);
    
    // Listener for the passwordRequests collection
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "passwordRequests"), snapshot => {
            setPasswordRequests(snapshot.docs.map(doc => doc.id));
        });
        return () => unsubscribe();
    }, []);

    // --- Core Functions ---

    const login = async (email: string, pass: string, pin: string) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        if (!userDoc.exists() || userDoc.data().pin !== pin) {
            await signOut(auth);
            throw new Error("Invalid credentials or PIN.");
        }
    };

    const logout = () => signOut(auth);

    const addUser = async (details: Omit<User, 'id' | 'pin' | 'password' | 'status'>) => {
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();
        const newPassword = 'password'; // Default password
        
        const userCredential = await createUserWithEmailAndPassword(auth, details.email, newPassword);
        const newUser = { ...details, pin: newPin, status: 'ACTIVE' };
        
        await setDoc(doc(db, "users", userCredential.user.uid), newUser);
        return { pin: newPin, password: newPassword };
    };

    const updateUserDetails = async (updatedUser: User) => {
        await updateDoc(doc(db, "users", updatedUser.id), updatedUser as any);
    };

    const deactivateUser = async (userId: string) => {
        await updateDoc(doc(db, "users", userId), { status: 'INACTIVE' });
    };

    // --- Password Reset Flow ---

    const requestPasswordReset = async (email: string) => {
        const userQuery = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(userQuery);

        if (querySnapshot.empty) {
            throw new Error("No user with that email.");
        }
        const userId = querySnapshot.docs[0].id;
        await setDoc(doc(db, "passwordRequests", userId), { requestedAt: new Date() });
    };

    const approvePasswordReset = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user || !user.email) {
            throw new Error("User email not found.");
        }
        await sendPasswordResetEmail(auth, user.email);
        await deleteDoc(doc(db, "passwordRequests", userId));
    };

    // --- Deprecated / Placeholder Functions ---
    const ensureHardcodedAdmin = async () => Promise.resolve();
    const updateUserProfile = async (updatedUser: User) => updateUserDetails(updatedUser);
    const submitStageData = async () => Promise.resolve();
    const verifyPin = () => true;

    // --- Value Export ---
    const value = { 
        currentUser, users, logs, passwordRequests, loading, 
        login, logout, addUser, requestPasswordReset, approvePasswordReset,
        updateUserDetails, deactivateUser, 
        // Deprecated
        ensureHardcodedAdmin, updateUserProfile, submitStageData, verifyPin
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};