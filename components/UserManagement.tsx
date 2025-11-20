
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types';

export const UserManagement: React.FC = () => {
    const { users, addUser, deactivateUser, updateUserDetails } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'MANAGER' | 'USER'>('USER');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const { pin, password } = await addUser({ name, email, role });
            setSuccess(`User created successfully! Email: ${email}, Password: ${password}, PIN: ${pin}`);
            setName('');
            setEmail('');
            setRole('USER');
        } catch (err: any) {
            setError(`Failed to create user: ${err.message}`);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setError('');
        setSuccess('');
        try {
            await updateUserDetails({ ...editingUser, name, email, role });
            setSuccess('User updated successfully!');
            setEditingUser(null);
            setName('');
            setEmail('');
            setRole('USER');
        } catch (err: any) {
            setError(`Failed to update user: ${err.message}`);
        }
    };

    const startEdit = (user: User) => {
        setEditingUser(user);
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-4">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">{editingUser ? 'Edit User' : 'Create New User'}</h3>
            <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'MANAGER' | 'USER')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    >
                        <option value="USER">User</option>
                        <option value="MANAGER">Manager</option>
                    </select>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-500 text-sm">{success}</p>}
                <div className="flex space-x-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        {editingUser ? 'Update User' : 'Add User'}
                    </button>
                    {editingUser && (
                        <button type="button" onClick={() => setEditingUser(null)} className="bg-gray-200 px-4 py-2 rounded-md">
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="mt-8">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Existing Users</h3>
                <ul className="space-y-2">
                    {users.map(user => (
                        <li key={user.id} className="p-2 border rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{user.name} ({user.email})</p>
                                <p className="text-sm text-gray-600">{user.role} - {user.status}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => startEdit(user)} className="text-sm text-blue-600">Edit</button>
                                {user.status === 'ACTIVE' && (
                                    <button onClick={() => deactivateUser(user.id)} className="text-sm text-red-600">Deactivate</button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
