import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, getDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { auth, db, firebaseConfig } from '../firebase/firebase';
import { PROCESS_STAGES } from '../constants'; // Import process stages
import type { User } from '../types';

// Ensure LogEntry includes stageId
interface LogEntry {
    id: string;
    stageId: string;
    timestamp: Date;
    userId: string;
    userName: string;
    action: string;
    details: Record<string, any>;
}

// The shape of the authentication context
interface AuthContextType {
    currentUser: User | null;
    users: User[];
    logs: LogEntry[]; // Replaces gateRecords with a unified logs array
    passwordRequests: Array<{ userId: string; email: string; userName: string; userRole: string; requestedAt: Date }>;
    loading: boolean;
    login: (email: string, pin: string) => Promise<void>;
    logout: () => void;
    addUser: (details: Omit<User, 'id' | 'pin' | 'password' | 'status'>) => Promise<{ pin: string; password: string }>;
    requestPasswordReset: (email: string) => Promise<void>;
    approvePasswordReset: (requestEmail: string) => Promise<void>;
    updateUserDetails: (updatedUser: User) => Promise<void>;
    deactivateUser: (userId: string) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    submitStageData: (stageId: string, data: Record<string, any>) => Promise<void>;
    ensureHardcodedAdmin: () => Promise<void>;
    updateUserProfile: (updatedUser: User) => Promise<void>;
    verifyPin: (pin: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [passwordRequests, setPasswordRequests] = useState<Array<{ userId: string; email: string; userName: string; userRole: string; requestedAt: Date }>>([]);
    const [loading, setLoading] = useState(true);
    const [userDocLoaded, setUserDocLoaded] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, user => {
            if (user) {
                setUserDocLoaded(false);
                const userRef = doc(db, "users", user.uid);
                const unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        setCurrentUser({ id: user.uid, ...doc.data() } as User);
                        setUserDocLoaded(true);
                    } else {
                        setCurrentUser(null);
                        setUserDocLoaded(false);
                    }
                    setLoading(false);
                }, (error: any) => {
                    if (error.code !== 'permission-denied') {
                        console.error("Error fetching user document:", error);
                    }
                    setCurrentUser(null);
                    setUserDocLoaded(false);
                    setLoading(false);
                });
                return () => unsubscribeSnapshot();
            } else {
                setCurrentUser(null);
                setUserDocLoaded(false);
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // Set up all data listeners ONLY when user is authenticated AND user doc is loaded
    useEffect(() => {
        if (!currentUser || !userDocLoaded) {
            setUsers([]);
            setPasswordRequests([]);
            setLogs([]);
            return; // Don't set up any listeners until fully authenticated
        }

        // Only set up listeners if authenticated AND user doc loaded
        const logCollections = PROCESS_STAGES.map(stage => stage.id);
        const unsubscribers = logCollections.map(stageId => {
            const logQuery = collection(db, `${stageId}_records`);

            return onSnapshot(logQuery, snapshot => {
                const newLogs = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
                    return {
                        id: doc.id,
                        stageId: stageId,
                        timestamp: timestamp,
                    } as any as LogEntry;
                });

                setLogs(prevLogs => {
                    const otherLogs = prevLogs.filter(log => log.stageId !== stageId);
                    const updatedLogs = [...otherLogs, ...newLogs];
                    return updatedLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                });
            }, (error) => console.error(`Error listening to ${stageId}_records:`, error));
        });

        const isManager = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
        const usersQuery = isManager ? collection(db, "users") : query(collection(db, "users"), where("id", "==", currentUser.id));
        const unsubscribeUsers = onSnapshot(usersQuery, snapshot => {
            setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as User[]);
        }, (error) => console.error("Error listening to users collection:", error));
    
        return () => {
            unsubscribers.forEach(unsub => unsub());
            unsubscribeUsers();
        };
    }, [currentUser, userDocLoaded]);

    const login = async (identifier: string, pin: string) => {
    let userEmail = identifier;

    // If identifier is not an email, resolve it to an email first
    if (!identifier.includes('@')) {
        // We can't query Firestore here due to permission restrictions
        // Assume the identifier is an email or we need to authenticate differently
        throw new Error("Please enter a valid email address.");
    }

    userEmail = identifier;

    // First, authenticate with Firebase Auth using the default password
    const userCredential = await signInWithEmailAndPassword(auth, userEmail, 'password');
    
    // Now that we're authenticated, verify the PIN in Firestore
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

    if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error("User not found.");
    }

    if (userDoc.data().pin !== pin) {
        await signOut(auth);
        throw new Error("Invalid PIN.");
    }
};

    const logout = () => signOut(auth);

    const addUser = async (details: Omit<User, 'id' | 'pin' | 'password' | 'status'>) => {
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();
        const newPassword = 'password';

        try {
            const secondaryAppName = 'secondary-auth';
            const existingApp = getApps().find(app => app.name === secondaryAppName);
            let secondaryApp;
            
            if (existingApp) {
                secondaryApp = existingApp;
            } else {
                secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
            }
            
            const secondaryAuth = getAuth(secondaryApp);

            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, details.email, newPassword);
            const newUser = { ...details, pin: newPin, status: 'ACTIVE' };
            
            await setDoc(doc(db, "users", userCredential.user.uid), newUser);
            
            // Sign out from secondary auth to avoid conflicts
            await signOut(secondaryAuth);
            
            return { pin: newPin, password: newPassword };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    };

    const updateUserDetails = async (updatedUser: User) => {
        await setDoc(doc(db, "users", updatedUser.id), updatedUser, { merge: true });
    };

    const deactivateUser = async (userId: string) => {
        await updateDoc(doc(db, "users", userId), { status: 'INACTIVE' });
    };

    const deleteUser = async (userId: string) => {
        try {
            // Delete from Firestore - this prevents login since user document is required for auth
            await deleteDoc(doc(db, "users", userId));
            console.log('User deleted from Firestore:', userId);
            
            // Cloud Function deletion from Firebase Auth requires Blaze plan
            // The Firestore deletion is sufficient to prevent login
        } catch (error) {
            console.error('Error deleting user from Firestore:', error);
            throw error;
        }
    };

    const submitStageData = async (stageId: string, data: Record<string, any>) => {
        if (!currentUser) throw new Error("No authenticated user found.");
        if (!stageId || typeof stageId !== 'string') {
            console.error("submitStageData called with an invalid stageId:", stageId);
            throw new Error("Invalid stage ID provided for data submission.");
        }
    
        const collectionName = `${stageId}_records`;
    
        // THE DIAGNOSTIC FIX: Inject the stageId directly into the details object.
        // This creates a redundant but reliable source of truth within the database itself.
        const dataToSubmit = {
            ...data,
            stageId: stageId 
        };

        await addDoc(collection(db, collectionName), {
            timestamp: new Date(),
            userId: currentUser.id,
            userName: currentUser.name,
            details: dataToSubmit, // The details object now contains its own stageId.
        });
    };

    const requestPasswordReset = async (email: string) => {
        // Check if a request already exists for this email
        const existingRequest = passwordRequests.find(req => req.email.toLowerCase() === email.toLowerCase());
        if (existingRequest) {
            throw new Error("A password reset request for this email is already pending admin approval.");
        }
        
        // Frontend-only: No database validation, just add to local state
        // The admin will verify if this is a valid user when they see the request
        const newRequest = {
            userId: `temp-${Date.now()}`, // Temporary ID since we don't validate
            email,
            userName: 'Pending Verification',
            userRole: 'Unknown',
            requestedAt: new Date()
        };
        
        setPasswordRequests(prev => [...prev, newRequest]);
    };

    const approvePasswordReset = async (requestEmail: string) => {
        // Frontend-only: Remove from local state
        setPasswordRequests(prev => prev.filter(req => req.email !== requestEmail));
    };

    const ensureHardcodedAdmin = async () => Promise.resolve();
    const updateUserProfile = async (updatedUser: User) => updateUserDetails(updatedUser);
    const verifyPin = (pin: string): boolean => {
        if (!currentUser) return false;
        return currentUser.pin === pin;
    };

    const value = { 
        currentUser, users, logs, passwordRequests, loading, 
        login, logout, addUser, requestPasswordReset, approvePasswordReset,
        updateUserDetails, deactivateUser, deleteUser, submitStageData,
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