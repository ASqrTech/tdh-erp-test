
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const LoginScreen = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetUserId, setResetUserId] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const { login, requestPasswordReset } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(identifier, password, pin);
    } catch (error) {
      console.error("Failed to login:", error);
      setError("Invalid credentials. Please try again.");
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetMessage("");
    try {
      await requestPasswordReset(resetUserId);
      setResetMessage("Password reset request sent successfully.");
    } catch (error) {
      console.error("Password reset request failed:", error);
      setResetMessage("Failed to send password reset request. Please check the User ID.");
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
                <h2 className="text-2xl font-semibold text-center text-slate-700 mb-6">Employee Login</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="identifier">
                            User ID or Email
                        </label>
                        <input
                            id="identifier"
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="e.g., 'manager' or 'user@example.com'"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="pin">
                            Security PIN
                        </label>
                        <input
                            id="pin"
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="4-digit PIN"
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
                            <p className="text-sm text-gray-600 mb-4">Enter your User ID to send a reset request to your manager.</p>
                            <input
                                type="text"
                                value={resetUserId}
                                onChange={(e) => setResetUserId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Your User ID"
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

export default LoginScreen;
