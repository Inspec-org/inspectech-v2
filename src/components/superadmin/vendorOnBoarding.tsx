'use client'
import React, { useState, useEffect } from 'react';
import { Building2, FolderOpen, LogOut, AlertCircle, ChevronLeft, X, Check } from 'lucide-react';
import { Department } from './types';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';

// Types


// Header Component
const OnboardingHeader: React.FC = () => {
    return (
        <header className="py-8">
            <div className="max-w-7xl mx-auto bg-[#FCF9FF] p-4 rounded-lg border-t-4 border-[#7C3AED] shadow-sm">
                <div className="flex justify-end items-start mb-6">

                    <button className="flex items-center gap-2 text-[#7C3AED] hover:text-purple-700 transition-colors">
                        <LogOut size={24} />
                        <span className="text-sm font-medium">Logout</span>
                    </button>
                </div>
                <div className="flex flex-col justify-center items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Building2 className="text-[#9333EA]" size={32} />
                    </div>
                    <div className="text-center mt-2">
                        <h1 className="text-xl font-bold text-gray-900 mb-2">InspecTech Vendor Onboarding</h1>
                        <p className="text-xs text-[#6B7280] mb-1">Advanced Inventory Monitoring & Analytics Suite</p>
                        <p className="text-xs text-[#6B7280]">Complete setup for your vendor account</p>
                    </div>
                </div>

            </div>
        </header>
    );
};

// Info Banner Component
const InfoBanner: React.FC = () => {
    return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-[#7C3AED] flex-shrink-0 mt-0.5" size={20} />
            <div>
                <p className="font-semibold text-purple-900 text-sm">Complete all fields</p>
                <p className="text-purple-700 text-sm">All information is required to properly set up your vendor account</p>
            </div>
        </div>
    );
};

// Section Card Component
const SectionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}> = ({ icon, title, description, children }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-purple-100 rounded-lg">
                    {icon}
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                </div>
            </div>
            {children}
        </div>
    );
};

// Main Component
const VendorOnboardingForm: React.FC = () => {
    const router = useRouter();
    const [vendorName, setVendorName] = useState('');
    const [departments, setDepartments] = useState<Department[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const getDepartments = async () => {
        try {
            const res = await apiRequest("/api/departments/get-departments");
            if (res.ok) {
                const json = await res.json();
                const mapped = (json.departments || []).map((d: any) => ({
                    id: String(d._id),
                    name: d.name,
                    company: '',
                    checked: false,
                }));
                setDepartments(mapped);
            } else {
                setDepartments([]);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            toast.error(errorMessage);
            setDepartments([]);
        }
    };

    useEffect(() => {
        getDepartments();
    }, []);

    const handleDepartmentToggle = (id: string) => {
        setDepartments(departments.map(dept =>
            dept.id === id ? { ...dept, checked: !dept.checked } : dept
        ));
    };

    const handleSelectAll = () => {
        setDepartments(departments.map(dept => ({ ...dept, checked: true })));
    };

    const handleClearAll = () => {
        setDepartments(departments.map(dept => ({ ...dept, checked: false })));
    };

    const selectedCount = departments.filter(d => d.checked).length;
    const hasError = selectedCount === 0;

    const handleComplete = async () => {
        if (!vendorName.trim()) return;
        const selectedIds = departments.filter(d => d.checked).map(d => d.id);
        if (!selectedIds.length) {
            toast.error('Select at least one department');
            return;
        }
        try {
            setSubmitting(true);
            const res = await apiRequest("/api/vendors/add_vendor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: vendorName.trim(), departmentAccess: selectedIds })
            });
            if (res.ok) {
                const json = await res.json();
                toast.success('Vendor created');
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Failed to create vendor');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <OnboardingHeader />

            <main className="max-w-7xl mx-auto pb-8">
                <InfoBanner />

                <div className="grid lg:grid-cols-2 gap-6 mt-6">
                    {/* Vendor Details Section */}
                    <SectionCard
                        icon={<Building2 className="text-[#7C3AED]" size={24} />}
                        title="Vendor Details"
                        description="Basic information about the vendor"
                    >
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Vendor Name
                            </label>
                            <input
                                type="text"
                                value={vendorName}
                                onChange={(e) => setVendorName(e.target.value)}
                                placeholder="Enter vendor name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none transition"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                This name will be displayed throughout the system
                            </p>
                        </div>
                    </SectionCard>

                    {/* Department Access Section */}
                    <SectionCard
                        icon={<FolderOpen className="text-[#7C3AED]" size={24} />}
                        title="Department Access"
                        description="Select departments to access"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-gray-700">
                                    Controls which inspection data this vendor can see
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-sm text-[#7C3AED] hover:text-purple-700 font-medium flex items-center gap-1"
                                    >
                                        <Check size={16} />
                                        Select All
                                    </button>
                                    <button
                                        onClick={handleClearAll}
                                        className="text-sm text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
                                    >
                                        <X size={16} />
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {departments.map((dept) => (
                                    <label
                                        key={dept.id}
                                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={dept.checked}
                                            onChange={() => handleDepartmentToggle(dept.id)}
                                            className="mt-1 w-4 h-4 text-[#7C3AED] border-gray-300 rounded focus:ring-[#7C3AED] circle-checkbox"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{dept.name}</p>
                                            <p className="text-xs text-gray-500">{dept.company}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {hasError && (
                                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                                    <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                                    <p className="text-sm text-yellow-800">
                                        No departments selected. Please select at least one.
                                    </p>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between mt-8">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors" onClick={() => router.back()}>
                        <ChevronLeft size={20} />
                        <span className="font-medium">Back</span>
                    </button>

                    <button
                        onClick={handleComplete}
                        disabled={!vendorName || hasError || submitting}
                        className={`px-8 py-3 rounded-lg font-semibold transition-all ${!vendorName || hasError || submitting
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#7C3AED] text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
                            }`}
                    >
                        Complete Onboarding
                    </button>
                </div>
            </main>
        </div>
    );
};

export default VendorOnboardingForm;