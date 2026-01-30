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
import Header from './common/header';
import AddAdminModal from '../Modals/addAdminModal';
import AddVendorModal from '../Modals/AddVendorModal';
import { useModal } from '@/hooks/useModal';



// Welcome Banner Component
const WelcomeBanner: React.FC<{ email: string }> = ({ email }) => {
    return (
        <div className="mb-4 border shadow-sm p-4 text-gray-500 font-light text-sm">
            <p className="">
                Welcome, <span className="font-semibold">{email}</span>.
            </p>
            <p>
                Select the user type you want to onboard and test
            </p>
        </div>
    );
};

// Account Card Component
const AccountCard: React.FC<AccountCardProps> = ({
    title,
    description,
    icon,
    iconbgColor,
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
                <div className={`p-3 rounded-lg ${isActive ? `${iconbgColor}` : 'bg-gray-100'}`}>
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
    const [departments, setDepartments] = useState<{ _id: string; name: string }[]>([]);
    const { isOpen, openModal, closeModal } = useModal();
    const { isOpen: isVendorOpen, openModal: openVendorModal, closeModal: closeVendorModal } = useModal();
    const router = useRouter();

    const getVendors = async () => {
        try {
            const res1 = await apiRequest('/api/vendors/get-vendors?page=1&limit=1');
            if (!res1.ok) {
                setVendors([]);
                return;
            }
            const json1 = await res1.json();
            const total = Number(json1?.total ?? json1?.totalCount ?? (Array.isArray(json1?.vendors) ? json1.vendors.length : 0));
            const limit = Math.max(total, 1);
            const res2 = await apiRequest(`/api/vendors/get-vendors?page=1&limit=${limit}`);
            if (res2.ok) {
                const json2 = await res2.json();
                setVendors(Array.isArray(json2?.vendors) ? json2.vendors : []);
            } else {
                setVendors([]);
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'An error occurred';
            toast.error(msg);
            setVendors([]);
        }
    };

    const getDepartments = async () => {
        try {
            const res = await apiRequest('/api/departments/get-departments');
            if (res.ok) {
                const json = await res.json();
                setDepartments(Array.isArray(json.departments) ? json.departments : []);
            } else {
                setDepartments([]);
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'An error occurred';
            toast.error(msg);
            setDepartments([]);
        }
    };

    useEffect(() => { getVendors(); getDepartments(); }, []);

    const handleAccessDashboard = () => {
        if (!selectedVendor) return;
        const v = vendors.find(v => String(v._id) === String(selectedVendor));
        Cookies.set('selectedVendorId', selectedVendor);
        if (v) Cookies.set('selectedVendor', v.name);
        window.dispatchEvent(new CustomEvent("selectedVendorChanged", { detail: selectedVendor }));
        router.push('/superadmin/departments');
    };

    return (
        <div className=" bg-gray-50 ">
            <main className="">
                <WelcomeBanner email="vendor@inspectech.com" />

                {/* Account Selection Section */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <AccountCard
                        title="Vendor Account"
                        description="Manage vendor-specific features"
                        icon={<Store className="text-[#16A34A]" size={24} />}
                        iconbgColor="bg-green-100"
                        content="Access the vendor dashboard to view and manage inspection data"
                        buttonText="Onboard Vendor"
                        isActive={true}
                        borderColor="border-[#7C3AED]"
                        onButtonClick={() => openVendorModal()}
                    />

                    <AccountCard
                        title="Admin Account"
                        description="Manage administrative controls"
                        icon={<Shield className="text-[#7C3AED]" size={24} />}
                        iconbgColor='bg-purple-100'
                        content="Access the department selection page and administrative features"
                        buttonText="Onboard Admin"
                        buttonDisabled={false}
                        isActive={true}
                        borderColor="border-[#7C3AED]"
                        onButtonClick={() => openModal()}
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
                                        placement="top"
                                        searchable
                                        searchPlaceholder="Search vendors..."
                                    />
                                </div>

                                <button
                                    onClick={handleAccessDashboard}
                                    disabled={!selectedVendor}
                                    className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedVendor
                                        ? 'bg-[#7C3AED] text-white hover:bg-purple-700'
                                        : 'bg-[#7C3AED] text-white opacity-60 cursor-not-allowed'
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
                {/* <div className="grid md:grid-cols-2 gap-6 mb-8">
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

                            <button className="w-full mt-4 bg-purple-50 text-[#7C3AED] py-3 px-4 rounded-lg font-medium hover:bg-purple-100 transition-colors flex items-center justify-center gap-2">
                                <Users size={20} />
                                Manage Vendors
                            </button>
                        </div>
                    </ManagementCard>
                </div> */}



                {/* Admin Access Control Section */}
                {/* <div className="">
                    <SectionHeader
                        icon={<Key size={24} color='#7C3AED' />}
                        title="Admin Access Control"
                        description=""
                    />
                </div>

                <div className={`bg-white border-t-4 border-[#7C3AED] rounded-lg shadow-md p-6`}>
                    <h4 className="text-xsfont-bold text-gray-900">Admin Dashboard Access</h4>
                    <p className="text-[10px] text-[#9CA3AF] mb-4">Access administrative dashboards for different departments</p>

                    <AlertBanner
                        type="info"
                        message="This feature will be removed in the future. Please use the Company Management card instead, which provides enhanced functionality for managing all accounts and access."
                    />
                </div> */}
                <AddAdminModal isOpen={isOpen} onClose={closeModal} vendors={vendors} departments={departments} />
                <AddVendorModal isOpen={isVendorOpen} onClose={closeVendorModal} onUpdated={getVendors} departments={departments} />
            </main>
        </div>
    );
};

export default InspecTechOnboarding;