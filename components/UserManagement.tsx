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
    email: ''
};

export const UserManagement: React.FC = () => {
    const { currentUser, users, addUser, passwordRequests, approvePasswordReset, updateUserDetails, deactivateUser, logs } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState(initialNewEmployeeState);
    const [generatedCredentials, setGeneratedCredentials] = useState<{ pin: string; password: string } | null>(null);

    // State for managing employee details
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [modalMode, setModalMode] = useState<'view' | 'edit' | null>(null);
    const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const credentials = await addUser(newEmployee);
            setGeneratedCredentials(credentials);
        } catch (error) {
            console.error("Failed to add user:", error);
            // You might want to show an error message to the user here
        }
        
    };
    
    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setGeneratedCredentials(null);
        setNewEmployee(initialNewEmployeeState);
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
        closeDetailsModal();
    };

    const handleDeactivateClick = (user: User) => {
        setUserToDeactivate(user);
    };

    const confirmDeactivate = () => {
        if (userToDeactivate) {
            deactivateUser(userToDeactivate.id);
            setUserToDeactivate(null);
        }
    };
    
    const cancelDeactivate = () => {
        setUserToDeactivate(null);
    };

    const handleDownloadLogs = () => {
        if (logs.length === 0) {
            alert("No logs to download.");
            return;
        }
    
        const headers = ["Timestamp", "User ID", "User Name", "Action", "Details"];
        
        const escapeCsvCell = (cell: string) => {
            const strCell = String(cell);
            if (strCell.includes(',') || strCell.includes('"') || strCell.includes('\n')) {
                return `"${strCell.replace(/"/g, '""')}"`;
            }
            return strCell;
        };
    
        const csvContent = [
            headers.join(','),
            ...logs.map(log => {
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

    const availableRoles = Object.keys(ROLE_PERMISSIONS).filter(r => r !== 'ADMIN') as Role[];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Team Management</h2>
                 <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-700 transition"
                    >
                        Add Employee
                    </button>
                    {currentUser?.role === 'ADMIN' && (
                         <button 
                            onClick={handleDownloadLogs}
                            className="bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition flex items-center space-x-2"
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
                    <h3 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">Team Members ({users.length})</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {users.map(user => (
                            <div key={user.id} className={`flex justify-between items-center p-3 bg-slate-50 rounded-md transition-opacity ${user.status === 'INACTIVE' ? 'opacity-50' : ''}`}>
                                <div>
                                    <p className="font-semibold text-slate-800">{user.name} {user.status === 'INACTIVE' && <span className="text-xs text-red-500 font-normal">(Inactive)</span>}</p>
                                    <p className="text-sm text-slate-500 capitalize">{(user.role || '').replace(/_/g, ' ').toLowerCase()}</p>
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
                     <h3 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">Password Reset Requests ({passwordRequests.length})</h3>
                     <div className="space-y-3">
                         {passwordRequests.length > 0 ? passwordRequests.map(userId => {
                             const user = users.find(u => u.id === userId);
                             return user ? (
                                <div key={userId} className="flex justify-between items-center p-3 bg-yellow-50 rounded-md">
                                    <div>
                                        <p className="font-semibold text-yellow-800">{user.name}</p>
                                        <p className="text-sm text-yellow-600">{user.email}</p>
                                    </div>
                                    <button 
                                        onClick={() => approvePasswordReset(userId)}
                                        className="bg-green-500 text-white px-3 py-1 text-sm rounded-md font-semibold hover:bg-green-600 transition"
                                    >
                                        Approve & Reset
                                    </button>
                                </div>
                             ) : null;
                         }) : (
                            <p className="text-slate-500 text-center py-8">No pending requests.</p>
                         )}
                     </div>
                </div>
            </div>

            {isAddModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-6 text-slate-800">Add New Employee</h3>

                        {generatedCredentials ? (
                             <div>
                                <h4 className="font-semibold text-green-600">Employee Added Successfully!</h4>
                                <p className="text-sm text-slate-600 mt-2 mb-4">Please share these temporary credentials with the new employee. They will be prompted to change their password on first login.</p>
                                <div className="bg-slate-100 p-4 rounded-md space-y-2">
                                    <p><span className="font-semibold">PIN:</span> {generatedCredentials.pin}</p>
                                    <p><span className="font-semibold">Password:</span> {generatedCredentials.password}</p>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button onClick={closeAddModal} className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700">Done</button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleAddUser}>
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
                                        <input type="tel" value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="555-123-4567" />
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <textarea value={newEmployee.address} onChange={e => setNewEmployee({...newEmployee, address: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
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
                        <h3 className="text-xl font-bold mb-4 text-slate-800">Confirm Deactivation</h3>
                        <p className="text-slate-600 mb-6">Are you sure you want to deactivate <span className="font-semibold">{userToDeactivate.name}</span>? They will no longer be able to log in.</p>
                        <div className="flex justify-end space-x-2">
                            <button onClick={cancelDeactivate} className="px-4 py-2 bg-gray-200 rounded-md font-medium hover:bg-gray-300">Cancel</button>
                            <button onClick={confirmDeactivate} className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700">Deactivate</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};