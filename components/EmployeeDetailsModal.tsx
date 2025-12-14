
import React, { useState, useEffect } from 'react';
import type { User, Role } from '../types';
import { ROLE_PERMISSIONS } from '../constants';

interface EmployeeDetailsModalProps {
    user: User;
    mode: 'view' | 'edit';
    onClose: () => void;
    onSave: (updatedUser: User) => void;
}

const availableRoles = Object.keys(ROLE_PERMISSIONS).filter(r => r !== 'ADMIN');

export const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({ user, mode, onClose, onSave }) => {
    const [userData, setUserData] = useState<User>(user);
    const isReadOnly = mode === 'view';

    useEffect(() => {
        setUserData(user);
    }, [user, mode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleResetPin = () => {
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();
        setUserData({ ...userData, pin: newPin });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(userData);
        onClose();
    };

    const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h2 className="text-2xl font-bold text-slate-800">{isReadOnly ? 'View Employee Details' : 'Edit Employee Details'}</h2>
                        <p className="text-sm text-slate-500">User ID: {userData.id}</p>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className={labelClasses}>Full Name</label>
                                <input type="text" id="name" name="name" value={userData.name} onChange={handleChange} className={inputClasses} disabled={isReadOnly} required />
                            </div>
                            <div>
                                <label htmlFor="role" className={labelClasses}>Role</label>
                                <select id="role" name="role" value={userData.role} onChange={handleChange} className={inputClasses} disabled={isReadOnly}>
                                    {availableRoles.map(role => (
                                        <option key={role} value={role}>{role.replace(/_/g, ' ').toLowerCase()}</option>
                                    ))}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="email" className={labelClasses}>Email Address</label>
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700">
                                    {userData.email || ''}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="phone" className={labelClasses}>Phone Number</label>
                                <input type="tel" id="phone" name="phone" value={userData.phone || ''} onChange={(e) => handleChange({...e, target: {...e.target, value: e.target.value.replace(/\D/g, '').slice(0, 10)}})} maxLength={10} pattern="[0-9]{10}" className={inputClasses} disabled={isReadOnly} />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="address" className={labelClasses}>Address</label>
                                <textarea id="address" name="address" value={userData.address || ''} onChange={handleChange} rows={2} className={inputClasses} disabled={isReadOnly} />
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                             <h3 className="text-md font-semibold text-gray-800 mb-2">Emergency & Other Information</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="emergencyContactName" className={labelClasses}>Emergency Contact Name</label>
                                    <input type="text" id="emergencyContactName" name="emergencyContactName" value={userData.emergencyContactName || ''} onChange={handleChange} className={inputClasses} disabled={isReadOnly} />
                                </div>
                                 <div>
                                    <label htmlFor="emergencyContactPhone" className={labelClasses}>Emergency Contact Phone</label>
                                    <input type="text" id="emergencyContactPhone" name="emergencyContactPhone" value={userData.emergencyContactPhone || ''} onChange={handleChange} className={inputClasses} disabled={isReadOnly} />
                                </div>
                             </div>
                             <div className="mt-4">
                                <label htmlFor="OtherDetails" className={labelClasses}>Other Details</label>
                                <textarea id="OtherDetails" name="OtherDetails" value={userData.OtherDetails || ''} onChange={handleChange} rows={2} className={inputClasses} disabled={isReadOnly} />
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <h3 className="text-md font-semibold text-gray-800 mb-2">Security Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div>
                                    <label htmlFor="pin" className={labelClasses}>Security PIN</label>
                                    <input type="text" id="pin" name="pin" value={userData.pin} className={inputClasses} disabled />
                                </div>
                                {!isReadOnly && (
                                    <div>
                                        <button type="button" onClick={handleResetPin} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md font-semibold transition w-full md:w-auto">
                                            Reset PIN
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    <div className="p-6 bg-slate-50 rounded-b-2xl flex justify-end items-center space-x-2">
                        <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 transition" onClick={onClose}>
                            {isReadOnly ? 'Close' : 'Cancel'}
                        </button>
                        {!isReadOnly && (
                            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold transition">
                                Save Changes
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};