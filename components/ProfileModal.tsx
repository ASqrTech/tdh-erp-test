import React, { useState } from 'react';
import type { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon } from './Icons';
import { Modal } from './Modal';

interface ProfileModalProps {
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
    const { currentUser, updateUserProfile } = useAuth();
    const [userData, setUserData] = useState<User | null>(currentUser);
    const [isSaved, setIsSaved] = useState(false);

    if (!userData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateUserProfile(userData);
        setIsSaved(true);
        setTimeout(() => {
            setIsSaved(false);
            onClose();
        }, 1500);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`${currentUser?.name} Profile`}>
            <div className="flex flex-col items-center text-center mb-6">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                    <UserIcon />
                </div>
                <p className="text-sm text-slate-500 capitalize">{currentUser?.role.replace(/_/g, ' ')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" name="name" value={userData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"/>
                    </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input type="email" name="email" value={userData.email || ''} onChange={handleChange} placeholder="your.email@example.com" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input type="text" name="phone" value={userData.phone || ''} onChange={handleChange} placeholder="e.g., 555-123-4567" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"/>
                    </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input type="text" name="address" value={userData.address || ''} onChange={handleChange} placeholder="e.g., 123 Factory Lane" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"/>
                    </div>
                </div>

                <div className="pt-4 border-t">
                        <h3 className="text-md font-semibold text-gray-800 mb-2">Emergency & Family Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                            <input type="text" name="emergencyContactName" value={userData.emergencyContactName || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"/>
                        </div>
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                            <input type="text" name="emergencyContactPhone" value={userData.emergencyContactPhone || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"/>
                        </div>
                        </div>
                        <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Family Details</label>
                        <textarea name="familyDetails" value={userData.familyDetails || ''} onChange={handleChange} placeholder="e.g., Spouse: Jane Doe, Child: John Doe" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"/>
                    </div>
                </div>

                    <div className="flex justify-end items-center pt-4 space-x-2">
                    <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 transition" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className={`px-4 py-2 rounded-md font-semibold transition flex items-center ${isSaved ? 'bg-green-500' : 'bg-red-600 hover:bg-red-700'} text-white`}>
                        {isSaved ? (
                            <>
                                <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                Saved!
                            </>
                        ) : 'Save Changes' }
                    </button>
                </div>
            </form>
        </Modal>
    );
};