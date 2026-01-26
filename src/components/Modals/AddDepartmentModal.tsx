'use client'
import React, { useEffect, useState } from 'react';
import { Building2, Plus, X, Wrench, BarChart3, Truck, ClipboardList, Cog, Camera, Package, Shield, Layers } from 'lucide-react';
import { Modal } from '../ui/modal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import Image from 'next/image';

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
    const [color, setColor] = useState('');
    const [icon, setIcon] = useState('');
    const [loading, setLoading] = useState(false);

    const COLOR_HEX_MAP: Record<string, string> = {
        purple: '#7C3AED',
        blue: '#3B82F6',
        red: '#E96513',
        green: '#059669',
        teal: '#14B8A6',
        orange: '#FB923C',
        pink: '#F43F5E',
        indigo: '#6366F1',
        cyan: '#06B6D4',
        amber: '#F59E0B',
    };
    const renderColorLabel = (name: string, text: string) => (
        <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: name ? (COLOR_HEX_MAP[name] || name) : 'transparent' }} />
            {text}
        </span>
    );
    const colorOptions = [
        { value: 'purple', label: renderColorLabel('purple', 'Purple') },
        { value: 'blue', label: renderColorLabel('blue', 'Blue') },
        { value: 'red', label: renderColorLabel('red', 'Red') },
        { value: 'green', label: renderColorLabel('green', 'Green') },
        { value: 'teal', label: renderColorLabel('teal', 'Teal') },
        { value: 'orange', label: renderColorLabel('orange', 'Orange') },
        { value: 'pink', label: renderColorLabel('pink', 'Pink') },
        { value: 'indigo', label: renderColorLabel('indigo', 'Indigo') },
        { value: 'cyan', label: renderColorLabel('cyan', 'Cyan') },
        { value: 'amber', label: renderColorLabel('amber', 'Amber') },
    ];

    const renderIconLabel = (key: string, text: string) => (
        <span className="flex items-center gap-2">
            {key === '' ? (
                <Image src="/images/departments/van.svg" alt="Van" width={16} height={16} />
            ) : key === 'wrench' ? <Wrench className="w-4 h-4" />
            : key === 'bar-chart' ? <BarChart3 className="w-4 h-4" />
            : key === 'truck' ? <Truck className="w-4 h-4" />
            : key === 'building' ? <Building2 className="w-4 h-4" />
            : key === 'clipboard-list' ? <ClipboardList className="w-4 h-4" />
            : key === 'cog' ? <Cog className="w-4 h-4" />
            : key === 'camera' ? <Camera className="w-4 h-4" />
            : key === 'package' ? <Package className="w-4 h-4" />
            : key === 'shield' ? <Shield className="w-4 h-4" />
            : key === 'layers' ? <Layers className="w-4 h-4" />
            : null}
            {text}
        </span>
    );
    const iconOptions = [
        { value: 'wrench', label: renderIconLabel('wrench', 'Wrench') },
        { value: 'bar-chart', label: renderIconLabel('bar-chart', 'Bar Chart') },
        { value: 'truck', label: renderIconLabel('truck', 'Truck') },
        { value: 'building', label: renderIconLabel('building', 'Building') },
        { value: 'clipboard-list', label: renderIconLabel('clipboard-list', 'Clipboard') },
        { value: 'cog', label: renderIconLabel('cog', 'Cog') },
        { value: 'camera', label: renderIconLabel('camera', 'Camera') },
        { value: 'package', label: renderIconLabel('package', 'Package') },
        { value: 'shield', label: renderIconLabel('shield', 'Shield') },
        { value: 'layers', label: renderIconLabel('layers', 'Layers') },
    ];

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
                body: JSON.stringify({ name, color, icon })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                toast.success('Department added successfully');
                const newDept = (data && data.department) ? data.department : undefined;
                try { if (newDept) { window.dispatchEvent(new CustomEvent("departmentAdded", { detail: newDept })); } } catch {}
                onUpdated?.(newDept);
                onClose();
                setDeparmentName('');
                setColor('');
                setIcon('');
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
                    <p className="text-sm text-gray-400 mt-1">
                        Enter a descriptive name for the department
                    </p>
                </div>

                {/* Color Dropdown */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Color</label>
                    <CustomDropdown
                        options={colorOptions}
                        value={color}
                        onChange={(v) => setColor(v)}
                        placeholder="Select color"
                    />
                </div>

                {/* Icon Dropdown */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Icon</label>
                    <CustomDropdown
                        options={iconOptions}
                        value={icon}
                        onChange={(v) => setIcon(v)}
                        placeholder="Select icon"
                        placement="top"
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
                                This department will be available for assignment to admin users and can be managed after creation.
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