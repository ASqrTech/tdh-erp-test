
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Role, User } from '../types';
import { ROLE_PERMISSIONS } from '../constants';
import { EyeIcon, PencilIcon, TrashIcon, DownloadIcon } from './Icons';
import { EmployeeDetailsModal } from './EmployeeDetailsModal';

const initialNewEmployeeState = {
    name: '',
    role: 'OPERATOR' as Role,
    address: '',
    phone: '',
    email: '',
    em: ''
};

export const ManagerView: React.FC = () => {
    const { currentUser, users, addUser, passwordRequests, approvePasswordReset, updateUserDetails, deleteUser, logs } = useAuth();
    
    if (!currentUser) {
        return null;
    }

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState(initialNewEmployeeState);
    const [generatedCredentials, setGeneratedCredentials] = useState<{ pin: string; password: string } | null>(null);
    const [addUserError, setAddUserError] = useState<string>('');

    // State for managing employee details
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [modalMode, setModalMode] = useState<'view' | 'edit' | null>(null);
    const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddUserError('');
        try {
            const credentials = await addUser(newEmployee);
            setGeneratedCredentials(credentials);
            setNewEmployee(initialNewEmployeeState);
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                setAddUserError(`The email "${newEmployee.email}" is already in use. Please use a different email address.`);
            } else {
                setAddUserError(error.message || 'Failed to create user. Please try again.');
            }
        }
    };
    
    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setGeneratedCredentials(null);
        setNewEmployee(initialNewEmployeeState);
        setAddUserError('');
    }

    const openDetailsModal = (user: User, mode: 'view' | 'edit') => {
        setSelectedUser(user);
        setModalMode(mode);
    };

    const closeDetailsModal = () => {
        setSelectedUser(null);
        setModalMode(null);
    };

    const handleSaveUserDetails = (updatedUser: User) => {
        updateUserDetails(updatedUser);
    };

    const handleDeactivateClick = (user: User) => {
        setUserToDeactivate(user);
    };

    const confirmDeactivate = () => {
        if (userToDeactivate) {
            deleteUser(userToDeactivate.id);
            setUserToDeactivate(null);
        }
    };
    
    const cancelDeactivate = () => {
        setUserToDeactivate(null);
    };

    const handleDownloadLogs = () => {
        const safeLogs = logs || [];
        if (safeLogs.length === 0) {
            alert("No logs to download.");
            return;
        }
    
        const headers = ["Timestamp", "User ID", "User Name", "Action", "Details"];
        
        const escapeCsvCell = (cell: any) => {
            const cellStr = String(cell || '');
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        };
    
        const csvContent = [
            headers.join(','),
            ...safeLogs.map(log => {
                const detailsString = typeof log.details === 'string'
                    ? log.details
                    : JSON.stringify(log.details);
                
                return [
                    escapeCsvCell(log.timestamp),
                    escapeCsvCell(log.userId),
                    escapeCsvCell(log.userName),
                    escapeCsvCell(log.action),
                    escapeCsvCell(detailsString)
                ].join(',');
            })
        ].join('\n');
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `erp_activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const availableRoles = Object.keys(ROLE_PERMISSIONS).filter(r => r !== 'ADMIN');
    const safeUsers = (users || []).filter(user => {
        // If current user is MANAGER, hide ADMIN and MANAGER entries
        if (currentUser?.role === 'MANAGER' && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
            return false;
        }
        return true;
    });
    const safePasswordRequests = passwordRequests || [];

    return (
        <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0 mb-6">
                 <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Team Management</h2>
                 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-md font-semibold hover:bg-red-700 transition text-sm sm:text-base"
                    >
                        Add Employee
                    </button>
                    {currentUser?.role === 'ADMIN' && (
                         <button 
                            onClick={handleDownloadLogs}
                            className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition flex items-center justify-center space-x-2 text-sm sm:text-base"
                        >
                            <DownloadIcon />
                            <span>Logs</span>
                        </button>
                    )}
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Team Members */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">Team Members ({safeUsers.length})</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {safeUsers.map(user => (
                            <div key={user.id} className={`flex justify-between items-center p-3 bg-slate-50 rounded-md transition-opacity ${user.status === 'INACTIVE' ? 'opacity-50' : ''}`}>
                                <div>
                                    <p className="font-semibold text-slate-800">{user.name} {user.status === 'INACTIVE' && <span className="text-xs text-red-500 font-normal">(Inactive)</span>}</p>
                                    <p className="text-sm text-slate-500 capitalize">{user.role.replace(/_/g, ' ').toLowerCase()}</p>
                                </div>
                                 <div className="flex items-center space-x-1">
                                    <button onClick={() => openDetailsModal(user, 'view')} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-200 rounded-full transition" aria-label="View Details"><EyeIcon /></button>
                                    <button onClick={() => openDetailsModal(user, 'edit')} className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-slate-200 rounded-full transition" aria-label="Edit User"><PencilIcon /></button>
                                    {user.status === 'ACTIVE' && (
                                        <button onClick={() => handleDeactivateClick(user)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-200 rounded-full transition" aria-label="Deactivate User"><TrashIcon /></button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Password Reset Requests */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                     <h3 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">Password Reset Requests ({safePasswordRequests.length})</h3>
                     <div className="space-y-3">
                         {safePasswordRequests.length > 0 ? safePasswordRequests.map(request => {
                             // Find user by email
                             const user = safeUsers.find(u => u.email?.toLowerCase() === request.email.toLowerCase());
                             
                             return (
                                <div key={request.email} className="flex justify-between items-center p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <div className="flex-1">
                                        <p className="font-semibold text-yellow-900">{user ? user.name : 'User Not Found'}</p>
                                        <p className="text-sm text-yellow-700 mt-1">Email: {request.email}</p>
                                        {user && <p className="text-sm text-yellow-600">Role: {user.role}</p>}
                                        <p className="text-xs text-yellow-600 mt-1">
                                            Requested: {new Date(request.requestedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {user ? (
                                            <button 
                                                onClick={() => {
                                                    approvePasswordReset(request.email);
                                                    openDetailsModal(user, 'edit');
                                                }}
                                                className="bg-blue-500 text-white px-4 py-2 text-sm rounded-md font-semibold hover:bg-blue-600 transition shadow"
                                            >
                                                Change PIN
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => approvePasswordReset(request.email)}
                                                className="bg-red-500 text-white px-4 py-2 text-sm rounded-md font-semibold hover:bg-red-600 transition shadow"
                                            >
                                                Dismiss
                                            </button>
                                        )}
                                    </div>
                                </div>
                             );
                         }) : (
                            <p className="text-slate-500 text-center py-8">No pending password reset requests.</p>
                         )}
                     </div>
                </div>
            </div>

            {/* Current User/Admin Section at Bottom */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">Your Information</h3>
                <div className="space-y-3">
                    {currentUser && (
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md">
                            <div>
                                <p className="font-semibold text-slate-800">{currentUser.name}</p>
                                <p className="text-sm text-slate-500 capitalize">{currentUser.role.replace(/_/g, ' ').toLowerCase()}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => openDetailsModal(currentUser, 'view')} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-200 rounded-full transition" aria-label="View Details"><EyeIcon /></button>
                                <button onClick={() => openDetailsModal(currentUser, 'edit')} className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-slate-200 rounded-full transition" aria-label="Edit User"><PencilIcon /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isAddModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-6 text-slate-800">Add New Employee</h3>

                        {generatedCredentials ? (
                             <div>
                                <h4 className="font-semibold text-green-600">Employee Added Successfully!</h4>
                                <p className="text-sm text-slate-600 mt-2 mb-4">Please share these credentials with the new employee. They will be prompted to change their password on first login.</p>
                                <div className="bg-slate-100 p-4 rounded-md space-y-2">
                                    <p><span className="font-semibold">User ID:</span> {(users || []).find(u => u.pin === generatedCredentials.pin)?.id}</p>
                                    <p><span className="font-semibold">PIN:</span> {generatedCredentials.pin}</p>
                                    <p><span className="font-semibold">Password:</span> {generatedCredentials.password}</p>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button onClick={closeAddModal} className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700">Done</button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleAddUser}>
                                {addUserError && (
                                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                                        {addUserError}
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input type="text" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input type="email" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="employee@asquare.com" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <input type="tel" value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} maxLength={10} pattern="[0-9]{10}" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="9876543210" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <textarea value={newEmployee.address} onChange={e => setNewEmployee({...newEmployee, address: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                                        <input type="text" value={newEmployee.em} onChange={e => setNewEmployee({...newEmployee, em: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Emergency contact number" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                        <select value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value as Role})} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                                            {availableRoles.map(role => (
                                                <option key={role} value={role}>{role.replace(/_/g, ' ').toLowerCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end space-x-2">
                                    <button type="button" onClick={closeAddModal} className="px-4 py-2 bg-gray-200 rounded-md font-medium hover:bg-gray-300">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700">Generate Credentials</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {selectedUser && modalMode && (
                <EmployeeDetailsModal
                    user={selectedUser}
                    mode={modalMode}
                    onClose={closeDetailsModal}
                    onSave={handleSaveUserDetails}
                />
            )}

            {userToDeactivate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md animate-fade-in">
                        <h3 className="text-xl font-bold mb-4 text-slate-800">Confirm Deletion</h3>
                        <p className="text-slate-600 mb-6">Are you sure you want to delete <span className="font-semibold">{userToDeactivate.name}</span>? This action cannot be undone and they will be permanently removed from the system.</p>
                        <div className="flex justify-end space-x-2">
                            <button onClick={cancelDeactivate} className="px-4 py-2 bg-gray-200 rounded-md font-medium hover:bg-gray-300">Cancel</button>

                            <button onClick={confirmDeactivate} className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
