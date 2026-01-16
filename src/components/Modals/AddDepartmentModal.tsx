'use client'
import React, { useEffect, useState } from 'react';
import { Building2, Plus, UserPlus, X } from 'lucide-react';
import { Modal } from '../ui/modal';
import { MultiSelectDropdown } from '../ui/dropdown/MultiSelectDropdown';

import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onUpdated?: (newDept?: { _id: string; name: string }) => void;
};



const AddDepartmentModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onUpdated,
}) => {
    const [deparmentName, setDeparmentName] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = deparmentName.trim();
        if (!name) {
            toast.error('Please enter a department name');
            return;
        }
        setLoading(true);
        try {
            const res = await apiRequest('/api/departments/add_department', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                toast.success('Department added successfully');
                const newDept = (data && data.department) ? data.department : undefined;
                try { if (newDept) { window.dispatchEvent(new CustomEvent("departmentAdded", { detail: newDept })); } } catch {}
                onUpdated?.(newDept);
                onClose();
                setDeparmentName('');
            } else {
                toast.error(data.error || 'Failed to add department');
            }
        } catch (error: any) {
            toast.error(error?.message || 'Failed to add department');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="max-w-[700px] max-h-[90vh] overflow-auto">
            {/* Purple Header */}
            <div className="bg-gradient-to-b from-[#6D28D9] to-[#3730A3] px-6 py-4 rounded-t-lg relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                    <X size={20} />
                </button>
                <div className="flex items-center gap-3 text-white">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Add New Department</h2>
                        <p className="text-sm text-white/90 mt-0.5">Create new department for your organization</p>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-5">
                {/* Admin Name Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                        Department Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={deparmentName}
                        onChange={(e) => setDeparmentName(e.target.value)}
                        placeholder="Enter department name"
                        className="w-full px-4 py-2.5 bg-[#FAF7FF] border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-blue-900 mb-1">
                                Department Configuration
                            </h4>
                            <p className="text-sm text-blue-800 lea">
                                This department will be available for assignment to all users.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 pb-6 flex items-center justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading || !deparmentName.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add Department
                </button>
            </div>
        </Modal>
    );
};

export default AddDepartmentModal;