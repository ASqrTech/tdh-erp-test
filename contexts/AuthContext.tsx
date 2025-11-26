
import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail, getAuth } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, getDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { auth, db, firebaseConfig } from '../firebase/firebase';
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
    submitStageData: (stage: ProcessStage, data: Record<string, any>) => Promise<void>;
    // Deprecated functions that will be maintained for now
    ensureHardcodedAdmin: () => Promise<void>;
    updateUserProfile: (updatedUser: User) => Promise<void>;
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
                    // Use user.uid as the canonical ID to prevent data inconsistency
                    setCurrentUser(doc.exists() ? { id: user.uid, ...doc.data() } as User : null);
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching user document:", error);
                    setCurrentUser(null);
                    setLoading(false);
                });
                return () => unsubscribeSnapshot();
            } else {
                setCurrentUser(null);
                setUsers([]);
                setLogs([]);
                setPasswordRequests([]);
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // Set up listeners for collections only when a user is authenticated
    useEffect(() => {
        if (!currentUser) {
            return; // No user, no listeners
        }

        const unsubscribeUsers = onSnapshot(collection(db, "users"), snapshot => {
            setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as User[]);
        }, (error) => console.error("Error listening to users collection:", error));

        const unsubscribeLogs = onSnapshot(collection(db, "logs"), snapshot => {
            setLogs(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LogEntry)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        }, (error) => console.error("Error listening to logs collection:", error));

        const unsubscribePasswordRequests = onSnapshot(collection(db, "passwordRequests"), snapshot => {
            setPasswordRequests(snapshot.docs.map(doc => doc.id));
        }, (error) => console.error("Error listening to passwordRequests collection:", error));

        // Cleanup function
        return () => {
            unsubscribeUsers();
            unsubscribeLogs();
            unsubscribePasswordRequests();
        };
    }, [currentUser]); // Rerun this effect when the user changes

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

        const secondaryAppName = 'secondary-auth';
        let secondaryApp;
        if (!getApps().some(app => app.name === secondaryAppName)) {
            secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        } else {
            secondaryApp = getApp(secondaryAppName);
        }
        const secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, details.email, newPassword);
        const newUser = { ...details, pin: newPin, status: 'ACTIVE' };
        
        await setDoc(doc(db, "users", userCredential.user.uid), newUser);
        return { pin: newPin, password: newPassword };
    };

    const updateUserDetails = async (updatedUser: User) => {
        // Use setDoc with merge to prevent data loss and handle non-existent docs
        await setDoc(doc(db, "users", updatedUser.id), updatedUser, { merge: true });
    };

    const deactivateUser = async (userId: string) => {
        await updateDoc(doc(db, "users", userId), { status: 'INACTIVE' });
    };

    const submitStageData = async (stage: ProcessStage, data: Record<string, any>) => {
        if (!currentUser) throw new Error("No authenticated user found.");

        await addDoc(collection(db, "logs"), {
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            userName: currentUser.name,
            action: `${stage.id}_RECORDED`,
            details: data,
        });
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
    const verifyPin = (pin: string): boolean => {
        if (!currentUser) return false;
        return currentUser.pin === pin;
    };

    // --- Value Export ---
    const value = { 
        currentUser, users, logs, passwordRequests, loading, 
        login, logout, addUser, requestPasswordReset, approvePasswordReset,
        updateUserDetails, deactivateUser, submitStageData,
        // Deprecated
        ensureHardcodedAdmin, updateUserProfile, verifyPin
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
