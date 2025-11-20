
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const LoginScreen: React.FC = () => {
    const { login, requestPasswordReset, addUser } = useAuth();
    const [email, setEmail] = useState('admin@example.com'); // Default for demo
    const [password, setPassword] = useState('password'); // Default for demo
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [newCreds, setNewCreds] = useState<{email: string, pin: string, password: string} | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setNewCreds(null); 
        try {
            await login(email, password, pin);
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await requestPasswordReset(resetEmail);
            setResetMessage(`A password reset email has been sent to ${resetEmail}.`);
        } catch (err: any) {
            setResetMessage(err.message);
        }
    }

    const handleCreatePrimaryManager = async () => {
        setError('');
        setNewCreds(null);
        const managerEmail = 'admin@example.com';
        try {
            const creds = await addUser({
                name: 'Primary Admin',
                email: managerEmail,
                role: 'MANAGER',
            });
            setNewCreds({ ...creds, email: managerEmail });
            setError(''); 
        } catch (err: any) {
            if (err.message.includes('auth/email-already-in-use')) {
                 setError(`Account '${managerEmail}' already exists. Please try to log in or reset the password.`);
            } else {
                setError(`Failed to create manager: ${err.message}`);
            }
            setNewCreds(null);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">A Square Technologies ERP</h1>
                    <p className="text-slate-500 mt-2">Client: Tenali Double Horse</p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-lg">
                    {newCreds && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <strong className="font-bold">Primary Manager Created!</strong>
                            <span className="block sm:inline"> Please save these credentials and log in:</span>
                            <ul className="list-disc list-inside">
                                <li>Email: {newCreds.email}</li>
                                <li>Password: {newCreds.password}</li>
                                <li>PIN: {newCreds.pin}</li>
                            </ul>
                        </div>
                    )}
                    <h2 className="text-2xl font-semibold text-center text-slate-700 mb-6">Employee Login</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="e.g., 'admin@example.com'"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Your password"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="pin">
                                PIN
                            </label>
                            <input
                                id="pin"
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Your 4-digit PIN"
                                maxLength={4}
                                required
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button
                            type="submit"
                            className="w-full bg-red-600 text-white py-2.5 px-4 rounded-md font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                        >
                            Sign In
                        </button>
                    </form>
                    <div className="text-center mt-4">
                        <button onClick={() => setShowReset(true)} className="text-sm text-red-600 hover:underline">
                            Forgot Password?
                        </button>
                    </div>
                    <div className="text-center mt-6 pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-2">First time setup:</p>
                        <button type="button" onClick={handleCreatePrimaryManager} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700">
                            Create Primary Manager
                        </button>
                    </div>
                </div>
            </div>
             {showReset && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm animate-fade-in">
                        <h3 className="text-lg font-semibold mb-4">Request Password Reset</h3>
                        {resetMessage ? (
                            <p className="text-green-600">{resetMessage}</p>
                        ) : (
                            <form onSubmit={handlePasswordReset}>
                                <p className="text-sm text-gray-600 mb-4">Enter your email address to receive a password reset link.</p>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Your email address"
                                    required
                                />
                                <div className="mt-6 flex justify-end space-x-2">
                                    <button type="button" onClick={() => setShowReset(false)} className="px-4 py-2 bg-gray-200 rounded-md text-sm font-medium hover:bg-gray-300">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">Send Request</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
