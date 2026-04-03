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
    const [vendorId, setVendorId] = useState(() => Cookies.get('selectedVendorId') || '');
    const [deptLoading, setDeptLoading] = useState(false);
    const [vendorsLoading, setVendorsLoading] = useState(false);
    const [adminsLoading, setAdminsLoading] = useState(false);

    // Admin Departments pagination
    const [deptPage, setDeptPage] = useState(1);
    const deptPageSize = 5;
    const [departments, setDepartments] = useState<Department[]>([]);
    const [departmentsTotal, setDepartmentsTotal] = useState(0);

    // Vendors pagination
    const [vendorsPage, setVendorsPage] = useState(1);
    const vendorsPageSize = 5;
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [vendorsTotal, setVendorsTotal] = useState(0);

    // Admin Users pagination + search
    const [adminPage, setAdminPage] = useState(1);
    const adminPageSize = 5;
    const [adminSearch, setAdminSearch] = useState('');
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [adminsTotal, setAdminsTotal] = useState(0);
    const [adminReloadFlag, setAdminReloadFlag] = useState(0);
    // get departments api
    useEffect(() => {
        (async () => {
            setDeptLoading(true);
            try {
                const res = await apiRequest(`/api/departments/get-departments?page=${deptPage}&limit=${deptPageSize}`);
                if (res.ok) {
                    const json = await res.json();
                    const mapped = (json.departments || []).map((d: any) => ({ id: String(d._id), name: d.name, status: String(d.status).toLowerCase() === 'inactive' ? 'Inactive' : 'Active' }));
                    setDepartments(mapped);
                    setDepartmentsTotal(Number((json?.pagination?.total) ?? json.total ?? json.totalCount ?? mapped.length));
                } else {
                    setDepartments([]);
                    setDepartmentsTotal(0);
                }
            } catch {
                setDepartments([]);
                setDepartmentsTotal(0);
            } finally {
                setDeptLoading(false);
            }
        })();
    }, [deptPage]);
    // get vendors api
    useEffect(() => {
        (async () => {
            setVendorsLoading(true);
            try {
                const res = await apiRequest(`/api/vendors/get-vendors?page=${vendorsPage}&limit=${vendorsPageSize}&role=admin`);
                const json = await res.json();

                if (res.ok) {
                    const mapped: Vendor[] = (json.vendors || []).map((v: any) => ({ _id: String(v._id), name: v.name, status: v.status && String(v.status).toLowerCase() === 'inactive' ? 'Inactive' : 'Active' }));
                    setVendors(mapped);
                    setVendorsTotal(Number((json?.pagination?.total) ?? json.total ?? json.totalCount ?? mapped.length));
                } else {
                    setVendors([]);
                    setVendorsTotal(0);
                }
            } catch {
                setVendors([]);
                setVendorsTotal(0);
            } finally {
                setVendorsLoading(false);
            }
        })();
    }, [vendorsPage]);

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
        const handler = () => {
            setAdminReloadFlag((prev) => prev + 1);
        };
        window.addEventListener('adminAccessUpdated', handler as EventListener);
        return () => {
            window.removeEventListener('adminAccessUpdated', handler as EventListener);
        };
    }, []);

    useEffect(() => {
        setAdminsLoading(true);

        const timer = setTimeout(async () => {
            try {
                const res = await apiRequest(
                    `/api/users/get-users?role=admin&page=${adminPage}&limit=${adminPageSize}&q=${encodeURIComponent(adminSearch)}`
                );
                const json = await res.json();

                if (res.ok) {
                    const mapped = (json.users || []).map((u: any, idx: number) => {
                        const vendorNames = Array.isArray(u.vendorNames) && u.vendorNames.length
                            ? u.vendorNames
                            : typeof u.vendor === "string"
                                ? u.vendor.split(",").map((s: string) => s.trim()).filter(Boolean)
                                : [];

                        return {
                            id: (adminPage - 1) * adminPageSize + idx + 1,
                            name:
                                `${(u.firstName || "").trim()} ${(u.lastName || "").trim()}`.trim() ||
                                u.name ||
                                "",
                            email: u.email || "",
                            secondaryEmail: u.email || "",
                            vendor: vendorNames.length ? vendorNames.join(", ") : "—",
                            vendorNames,
                            departments: Array.isArray(u.departmentNames) ? u.departmentNames : [],
                            department: vendorNames.length ? vendorNames[0] : "—",
                        };
                    });

                    setAdmins(mapped);
                    setAdminsTotal(Number(json.total || json.totalCount || mapped.length));
                } else {
                    setAdmins([]);
                    setAdminsTotal(0);
                }
            } catch {
                setAdmins([]);
                setAdminsTotal(0);
            } finally {
                setAdminsLoading(false);
            }
        }, 1000); // ⏳ 2 seconds debounce

        return () => {
            clearTimeout(timer); // 🚫 cancel previous call
        };
    }, [adminPage, adminSearch, vendorId, adminReloadFlag]);

    const tabs = [
        { id: 'admin-departments', label: 'Admin Departments', icon: <Building2 className="text-gray-400" size={18} /> },
        { id: 'admin-users', label: 'Admin Users', icon: <Users className="text-gray-400" size={18} /> },
        { id: 'vendors', label: 'Vendors & Companies', icon: <Store className="text-gray-400" size={18} /> },
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
                        {activeTab === 'admin-departments' && (
                            <AdminDepartmentsSection
                                departments={departments}
                                totalCount={departmentsTotal}
                                currentPage={deptPage}
                                pageSize={deptPageSize}
                                onPageChange={setDeptPage}
                                loading={deptLoading}
                                onStatusUpdated={(id, status) => setDepartments(prev => prev.map(d => d.id === id ? { ...d, status } : d))}
                            />
                        )}
                        {activeTab === 'admin-users' && (
                            <AdminUserManagementSection
                                adminUsers={admins}
                                totalCount={adminsTotal}
                                currentPage={adminPage}
                                pageSize={adminPageSize}
                                onPageChange={setAdminPage}
                                searchQuery={adminSearch}
                                onSearchChange={(q) => { setAdminSearch(q); setAdminPage(1); }}
                                loading={adminsLoading}
                            />
                        )}
                        {activeTab === 'vendors' && (
                            <VendorsSection
                                vendors={vendors}
                                totalCount={vendorsTotal}
                                currentPage={vendorsPage}
                                pageSize={vendorsPageSize}
                                onPageChange={setVendorsPage}
                                loading={vendorsLoading}
                                onStatusUpdated={(id, status) => setVendors(prev => prev.map(v => v._id === id ? { ...v, status } : v))}
                            />
                        )}
                        {activeTab === 'vendor-users' && (
                            <VendorUserManagementSection vendors={vendors} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CompanyManagementPage;
