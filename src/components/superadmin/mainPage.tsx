'use client'
import React, { useState, useEffect } from 'react';
import { Building2, Users, LayoutDashboard, Key, LogOut, Store, Shield, FileText, AlertCircle, Info, ChevronRight, AlertTriangle } from 'lucide-react';

// Types
import { AccountCardProps, ManagementCardProps, AlertBannerProps } from './types';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';

// Header Component
const Header: React.FC = () => {
    return (
        <header className="bg-[#6B46C1] text-white py-8 px-8 shadow-lg">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div></div>
                <div className='text-center'>
                    <h1 className="text-xl font-bold">InspecTech Onboarding Console</h1>
                    <p className="text-[#F3E8FF] text-xs font-light mt-1">Advanced Inventory Monitoring & Analytics Suite</p>
                </div>
                <button className="flex items-center gap-2 text-white hover:text-purple-200 transition-colors">
                    <LogOut size={18} />
                    <span className="text-sm">Logout</span>
                </button>
            </div>
        </header>
    );
};

// Welcome Banner Component
const WelcomeBanner: React.FC<{ email: string }> = ({ email }) => {
    return (
        <div className="mb-4">
            <p className="text-gray-700 text-center text-xs">
                Welcome, <span className="font-semibold">{email}</span>. Select the user type you want to onboard and test
            </p>

        </div>
    );
};

// Account Card Component
const AccountCard: React.FC<AccountCardProps> = ({
    title,
    description,
    icon,
    content,
    buttonText,
    buttonDisabled = false,
    warningText,
    onButtonClick,
    isActive = true,
    borderColor,
}) => {
    return (
        <div className={`bg-white border-t-4 ${borderColor || 'border-[#16A34A]'} rounded-lg shadow-md p-6 ${!isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900">{title}</h3>
                    <p className="text-xs font-medium text-[#6B7280] mt-1">{description}</p>
                </div>
            </div>

            <p className="text-gray-600 text-sm mb-4">{content}</p>

            {warningText && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-center gap-2">
                    <Info size={16} className="text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{warningText}</p>
                </div>
            )}

            {buttonText && (
                <button
                    onClick={onButtonClick}
                    disabled={buttonDisabled}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${buttonDisabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#7C3AED] text-white hover:bg-purple-700'
                        }`}
                >
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: buttonDisabled ? 'text-gray-400' : 'text-white', size: 18 }) : null}
                    {buttonText}
                </button>
            )}
        </div>
    );
};

// Management Card Component
const ManagementCard: React.FC<ManagementCardProps> = ({ title, description, icon, children, borderColor }) => {
    return (
        <div className={`bg-white border-t-4 ${borderColor || 'border-[#7C3AED]'} rounded-lg shadow-md p-6`}>
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-purple-100 rounded-lg">
                    {icon}
                </div>
                <div>
                    <h3 className="text-base font-medium text-gray-900">{title}</h3>
                    <p className="text-xs text-[#6B7280] mt-1">{description}</p>
                </div>
            </div>
            {children}
        </div>
    );
};

// Alert Banner Component
const AlertBanner: React.FC<AlertBannerProps> = ({ type, message }) => {
    const Icon = type === 'warning' ? AlertCircle : AlertTriangle;

    return (
        <div className={`border rounded-lg p-4 flex items-start gap-2 bg-[#FEF3C7] border-yellow-200 text-yellow-800`}>
            <Icon size={20} className="flex-shrink-0 " />
            <p className="text-sm">{message}</p>
        </div>
    );
};

// Section Header Component
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => {
    return (
        <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="">{icon}</div>
                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            </div>
            <p className="text-xs text-[#6B7280] ml-9">{description}</p>
        </div>
    );
};

// Main Page Component
const InspecTechOnboarding: React.FC = () => {
    const [selectedVendor, setSelectedVendor] = useState<string>('');
    const [vendors, setVendors] = useState<{ _id: string; name: string }[]>([]);
    const router = useRouter();

    const getVendors = async () => {
        try {
            const res = await apiRequest('/api/vendors/get-vendors');
            if (res.ok) {
                const json = await res.json();
                setVendors(json.vendors || []);
                console.log(json.vendors)
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'An error occurred';
            toast.error(msg);
            setVendors([]);
        }
    };

    useEffect(() => { getVendors(); }, []);

    const handleAccessDashboard = () => {
        if (!selectedVendor) return;
        const v = vendors.find(v => String(v._id) === String(selectedVendor));
        Cookies.set('selectedVendorId', selectedVendor);
        if (v) Cookies.set('selectedVendor', v.name);
        window.dispatchEvent(new CustomEvent("selectedVendorChanged", { detail: selectedVendor }));
        router.push('/superadmin/users');
    };

    return (
        <div className="min-h-screen bg-gray-50 lg:px-4 xl:px-0">
            <Header />

            <main className="max-w-7xl mx-auto py-8">
                <WelcomeBanner email="vendor@inspectech.com" />

                {/* Account Selection Section */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <AccountCard
                        title="Vendor Account"
                        description="Manage vendor-specific features"
                        icon={<Store className="text-[#16A34A]" size={24} />}
                        content="Access the vendor dashboard to view and manage inspection data"
                        buttonText="Onboard Vendor"
                        isActive={true}
                        borderColor="border-[#22C55E]"
                        onButtonClick={() => router.push('/superadmin/vendorOnboarding')}
                    />

                    <AccountCard
                        title="Admin Account"
                        description="Manage administrative controls"
                        icon={<Shield className="text-gray-400" size={24} />}
                        content="Access the department selection page and administrative features"
                        warningText="Only available to admin account managers"
                        buttonText="Onboard Admin"
                        buttonDisabled={true}
                        isActive={false}
                        borderColor="border-[#E5E7EB]"
                    />
                </div>

                {/* Advanced Management Tools Section */}
                <div className="mb-1">
                    <SectionHeader
                        icon={<Users size={24} color='#9CA3AF' />}
                        title="Advanced Management Tools"
                        description="Access specialized management features to control vendor accounts, user access, and dashboard views"
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Vendor Dashboards */}
                    <ManagementCard
                        title="Vendor Dashboards"
                        description="Quick access to vendor data"
                        icon={<LayoutDashboard className="text-[#7C3AED]" size={24} />}
                        borderColor="border-[#7C3AED]"
                    >
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Quick Access Vendor Dashboards</h4>
                            <p className="text-xs text-[#6B7280] mb-4">Select a vendor to directly access their dashboard</p>

                            <div className="flex gap-3">
                                <div className="flex-1 min-w-0">
                                    <CustomDropdown
                                        name="select-vendor"
                                        options={vendors.map((v) => ({ value: String(v._id), label: v.name }))}
                                        value={selectedVendor}
                                        onChange={(val) => setSelectedVendor(val)}
                                        placeholder="Select Vendor"
                                    />
                                </div>

                                <button
                                    onClick={handleAccessDashboard}
                                    disabled={!selectedVendor}
                                    className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedVendor
                                        ? 'bg-[#7C3AED] text-white hover:bg-purple-700'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Access Dashboard
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </ManagementCard>

                    {/* Company Management */}
                    <ManagementCard
                        title="Company Management"
                        description="Manage all companies"
                        icon={<Building2 className="text-[#7C3AED]" size={24} />}
                    >
                        <div>
                            <p className="text-sm text-gray-600 mb-4">
                                View, edit, and delete companies, including vendor accounts in the system
                            </p>

                            <button className="w-full bg-[#7C3AED] text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2" onClick={() => router.push('/superadmin/companyManagement')}>
                                <FileText size={20} />
                                Manage Companies
                            </button>
                        </div>
                    </ManagementCard>
                </div>

                {/* Vendor Management Section */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <ManagementCard
                        title="Vendor Management"
                        description="Maintain vendor accounts"
                        icon={<Users className="text-[#7C3AED]" size={24} />}
                    >
                        <div className="">
                            <p className="text-gray-600 text-sm mb-4">
                                Create, edit, and manage vendor accounts and their unique identifiers
                            </p>

                            <AlertBanner
                                type="warning"
                                message="Both Vendor Management and Company Management cards are now active. You can use either for managing accounts."
                            />

                            <button className="w-full mt-4 bg-purple-50 text-?? py-3 px-4 rounded-lg font-medium hover:bg-purple-100 transition-colors flex items-center justify-center gap-2">
                                <Users size={20} />
                                Manage Vendors
                            </button>
                        </div>
                    </ManagementCard>
                </div>



                {/* Admin Access Control Section */}
                <div className="">
                    <SectionHeader
                        icon={<Key size={24} color='#7C3AED' />}
                        title="Admin Access Control"
                        description=""
                    />
                </div>

                <div className={`bg-white border-t-4 border-[#9CA3AF] rounded-lg shadow-md p-6`}>
                    <h4 className="text-xsfont-bold text-gray-900">Admin Dashboard Access</h4>
                    <p className="text-[10px] text-[#9CA3AF] mb-4">Access administrative dashboards for different departments</p>

                    <AlertBanner
                        type="info"
                        message="This feature will be removed in the future. Please use the Company Management card instead, which provides enhanced functionality for managing all accounts and access."
                    />
                </div>
            </main>
        </div>
    );
};

export default InspecTechOnboarding;