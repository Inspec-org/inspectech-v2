'use client'
import React, { useEffect, useState } from 'react';
import { Users, Building2, Shield, Trash2, Search, ChevronLeft, UserPlus, UserCog2, Briefcase, Store, UserCog, ChevronRight } from 'lucide-react';
import { Department, User, VendorCompany, AdminUser, Vendor } from './types'
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/utils/apiWrapper';
import Cookies from 'js-cookie';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { AdminDepartmentsSection, AdminUserManagementSection, PageHeader, VendorsSection, VendorUserManagementSection } from './companyManagementsComponents';

// Main Company Management Page Component
const CompanyManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('admin-departments');
    const [departments, setDepartments] = useState<Department[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [vendorId, setVendorId] = useState(() => Cookies.get('selectedVendorId') || '');
    // get departments api
    useEffect(() => {
        (async () => {
            try {
                const res = await apiRequest('/api/departments/get-departments');
                if (res.ok) {
                    const json = await res.json();
                    const mapped = (json.departments || []).map((d: any) => ({ id: String(d._id), name: d.name, status: 'Active' }));
                    setDepartments(mapped);
                } else {
                    setDepartments([]);
                }
            } catch {
                setDepartments([]);
            }
        })();
    }, []);
    // get vendors api
    useEffect(() => {
        (async () => {
            try {
                const res = await apiRequest('/api/vendors/get-vendors');
                const json = await res.json();
                if (res.ok) {
                    const mapped: Vendor[] = (json.vendors || []).map((v: any) => ({ name: v.name, status: 'Active' }));
                    setVendors(mapped);
                } else {
                    setVendors([]);
                }
            } catch {
                setVendors([]);
            }
        })();
    }, []);
    // handle selected vendor
    useEffect(() => {
        const handleVendorChange = () => {
            const v = Cookies.get('selectedVendorId') || '';
            setVendorId(v);
        };
        window.addEventListener('selectedVendorChanged', handleVendorChange as EventListener);
        return () => {
            window.removeEventListener('selectedVendorChanged', handleVendorChange as EventListener);
        };
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await apiRequest(`/api/users/get-users?role=admin&page=1&limit=100`);
                const json = await res.json();
                if (res.ok) {
                    const mapped = (json.users || []).map((u: any, idx: number) => {
                        const vendorNames = Array.isArray(u.vendorNames) && u.vendorNames.length
                            ? u.vendorNames
                            : typeof u.vendor === 'string'
                                ? u.vendor.split(',').map((s: string) => s.trim()).filter(Boolean)
                                : [];
                        return {
                            id: idx + 1,
                            name: `${(u.firstName || '').trim()} ${(u.lastName || '').trim()}`.trim() || (u.name || ''),
                            email: u.email || '',
                            secondaryEmail: u.email || '',
                            vendor: vendorNames.length ? vendorNames.join(', ') : '—',
                            vendorNames,
                            departments: Array.isArray(u.departmentNames) ? u.departmentNames : [],
                            department: vendorNames.length ? vendorNames[0] : '—',
                        };
                    });
                    setAdmins(mapped);
                } else {
                    setAdmins([]);
                }
            } catch {
                setAdmins([]);
            }
        })();
    }, [vendorId]);
    const tabs = [
        { id: 'admin-departments', label: 'Admin Departments', icon: <Building2 className="text-gray-400" size={18} /> },
        { id: 'admin-users', label: 'Admin Users', icon: <Users className="text-gray-400" size={18} /> },
        { id: 'vendors', label: 'Vendors', icon: <Briefcase className="text-gray-400" size={18} /> },
        { id: 'vendor-users', label: 'Vendor Users', icon: <UserCog2 className="text-gray-400" size={18} /> },
    ];

    return (
        <div className="bg-gray-50">
            <PageHeader />

            <main className="max-w-7xl mx-auto pb-8">
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-6 px-6 pt-4">
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`pb-3 text-sm font-medium transition-colors ${activeTab === t.id ? 'text-[#7C3AED] border-b-2 border-[#7C3AED]' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                <span className="flex items-center gap-2">
                                    {activeTab === t.id ? React.cloneElement(t.icon as React.ReactElement<any>, { className: 'text-[#7C3AED]' }) : t.icon}
                                    {t.label}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="px-4 pt-4">
                        {activeTab === 'admin-departments' && <AdminDepartmentsSection departments={departments} />}
                        {activeTab === 'admin-users' && <AdminUserManagementSection adminUsers={admins} />}
                        {activeTab === 'vendors' && <VendorsSection vendors={vendors} />}
                        {activeTab === 'vendor-users' && <VendorUserManagementSection vendors={vendors} />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CompanyManagementPage;