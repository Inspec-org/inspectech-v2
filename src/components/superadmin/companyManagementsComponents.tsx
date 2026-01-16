'use client'
import { ChevronLeft, ChevronRight, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { AdminUser, Department, TablePaginationProps, User, Vendor, VendorCompany } from "./types";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Cookies from 'js-cookie';
import { apiRequest } from "@/utils/apiWrapper";
import { CustomDropdown } from "../ui/dropdown/CustomDropdown";
import { useModal } from "@/hooks/useModal";
import AddDepartmentModal from "../Modals/AddDepartmentModal";
import AdminManageAccessModal from "../Modals/AdminManageAccessModal";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

export const TablePagination: React.FC<TablePaginationProps> = ({
    currentPage,
    totalCount,
    pageSize,
    onPageChange,
}) => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = totalCount ? (safePage - 1) * pageSize : 0;
    const endIndex = totalCount ? Math.min(startIndex + pageSize, totalCount) : 0;

    const getPageList = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (safePage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
        if (safePage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages];
    };

    const pages = getPageList();

    return (
        <div className="flex items-center justify-between py-4">
            <div className="text-xs text-gray-600">
                Showing <span className="font-semibold">{totalCount ? startIndex + 1 : 0}</span> to{' '}
                <span className="font-semibold">{endIndex}</span> of{' '}
                <span className="font-semibold">{totalCount}</span> entries
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, safePage - 1))}
                    disabled={safePage === 1}
                    className={`w-8 h-8 flex items-center justify-center rounded-md border ${safePage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    <ChevronLeft size={14} />
                </button>
                {pages.map((p, idx) =>
                    typeof p === 'number' ? (
                        <button
                            key={idx}
                            onClick={() => onPageChange(p)}
                            className={`w-8 h-8 rounded-md border text-sm ${safePage === p ? 'bg-[#7C3AED] text-white border-[#7C3AED]' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {p}
                        </button>
                    ) : (
                        <span key={idx} className="px-2 text-gray-400">...</span>
                    )
                )}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
                    disabled={safePage === totalPages}
                    className={`w-8 h-8 flex items-center justify-center rounded-md border ${safePage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
};

// Page Header Component
export const PageHeader: React.FC = () => {
    const router = useRouter();
    return (
        <div className="py-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between border p-4">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Company Management</h1>
                        <p className="text-xs text-[#4A5565] mt-1">Manage vendor companies and admin departments</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors text-sm" onClick={() => router.back()}>
                        <ChevronLeft size={18} />
                        Back to Globals
                    </button>
                </div>
            </div>
        </div>
    );
};

// Admin Departments Section Component
export const AdminDepartmentsSection: React.FC<{ departments: Department[] }> = ({ departments }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const { isOpen, openModal, closeModal } = useModal();
    const [items, setItems] = useState<Department[]>(departments);
    const totalCount = items.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const displayed = items.slice(startIndex, startIndex + pageSize);
    const getPageList = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages; }
        if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
        if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    useEffect(() => { setItems(departments); }, [departments]);
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<any>).detail;
            if (detail && (detail._id || detail.id)) {
                const dep: Department = { id: String(detail._id || detail.id), name: detail.name, status: 'Active' };
                setItems(prev => [dep, ...prev]);
                setCurrentPage(1);
            }
        };
        window.addEventListener('departmentAdded', handler as EventListener);
        return () => window.removeEventListener('departmentAdded', handler as EventListener);
    }, []);

    const [deleting, setDeleting] = useState<string | null>(null);
    const handleDelete = async (id: string) => {
        if (!id) return;
        const { isConfirmed } = await Swal.fire({
            title: "Delete Department?",
            text: "This will remove related inspections and its data. This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete",
        });
        if (!isConfirmed) return;
        try {
            setDeleting(id);
            const res = await apiRequest('/api/departments/delete_department', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ departmentId: id })
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(json.error || 'Failed to delete department');
                return;
            }
            setItems(prev => prev.filter(d => d.id !== id));
            setCurrentPage(1);
            toast.success('Department deleted');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to delete department');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="">
            <div className="flex justify-between items-start gap-3 py-4">
                {/* <UserCog2 className="text-gray-700 mt-1" size={20} /> */}
                <div>
                    <h2 className="text-sm font-normal text-gray-900">Admin Departments</h2>
                    <p className="text-xs text-[#6A7282] mt-1">Manage user's departments in the system</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-purple-700 transition-colors font-medium" onClick={openModal}>
                    <Plus size={18} />
                    Add Department
                </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full ">
                    <thead className='bg-gray-100'>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Sr No</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map((dept, idx) => (
                            <tr key={dept.id} className="border-b  hover:bg-gray-50">
                                <td className="py-4 px-4 text-sm text-gray-900">{startIndex + idx + 1}</td>
                                <td className="py-4 px-4 text-sm text-gray-900">{dept.name}</td>
                                <td className="py-4 px-4">
                                    <span className="inline-flex items-center gap-1 text-sm text-[#00A63E] font-medium bg-[#dcfde6] px-3 py-1 rounded-2xl">
                                        {dept.status}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    <button onClick={() => handleDelete(dept.id)} disabled={deleting === dept.id} className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <TablePagination currentPage={currentPage} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
            <AddDepartmentModal isOpen={isOpen} onClose={closeModal} onUpdated={() => {
                closeModal();
                setCurrentPage(1);
            }} />
        </div>
    );
};

// Admin User Management Section Component
export const AdminUserManagementSection: React.FC<{ adminUsers: AdminUser[] }> = ({ adminUsers }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const [accessModalOpen, setAccessModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<{ name?: string; email?: string; vendorNames?: string[]; departments?: string[] } | null>(null);
    const [tooltip, setTooltip] = useState<{ items: string[]; x: number; y: number } | null>(null);
    const hideTimerRef = useRef<number | null>(null);
    const [items, setItems] = useState<AdminUser[]>(adminUsers);
    useEffect(() => { setItems(adminUsers); }, [adminUsers]);

    const filtered = items.filter((u) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        const vendorText = Array.isArray(u.vendorNames) && u.vendorNames.length
            ? u.vendorNames.join(', ').toLowerCase()
            : (u.vendor || u.department || '').toLowerCase();
        const deptText = Array.isArray(u.departments) ? u.departments.join(', ').toLowerCase() : '';
        return (
            String(u.id).includes(q) ||
            (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.secondaryEmail || '').toLowerCase().includes(q) ||
            vendorText.includes(q) ||
            deptText.includes(q)
        );
    });

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const displayed = filtered.slice(startIndex, startIndex + pageSize);

    const getPageList = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }
        if (safePage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
        if (safePage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages];
    };

    return (
        <div className="">
            <div className="py-4">
                <div className="flex items-start gap-3 mb-6">
                    {/* <UserCog2 className="text-gray-700 mt-1" size={20} /> */}
                    <div>
                        <h2 className="text-sm text-gray-900">Admin User Management</h2>
                        <p className="text-xs text-[#6A7282] mt-1">Manage admin users and their vendor access permissions</p>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or vendor ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none bg-gray-50"
                        />
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Sr No</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Name</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Departments</th>
                            <th className="text-left py-3 px-4 pl-8 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map((user, idx) => (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                                <td className="py-4 px-4 text-sm text-gray-900">{startIndex + idx + 1}</td>
                                <td className="py-4 px-4">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.secondaryEmail}</div>
                                </td>
                                <td className="py-4 px-4 text-sm text-gray-900">{user.email}</td>
                                <td className="py-4 px-4 text-sm text-gray-900">
                                    <div className="inline-block">
                                        {Array.isArray(user.vendorNames) && user.vendorNames.length > 0 ? (
                                            <div
                                                onMouseEnter={(e) => {
                                                    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
                                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                    setTooltip({ items: user.vendorNames?.slice(1) || [], x: Math.min(rect.left, window.innerWidth - 360), y: rect.bottom + 6 });
                                                }}
                                                onMouseLeave={() => {
                                                    hideTimerRef.current = window.setTimeout(() => setTooltip(null), 150);
                                                }}>
                                                <span>{user.vendorNames.slice(0, 1).join(', ')}</span>
                                                {user.vendorNames.length > 1 && (
                                                    <span className="ml-1 text-gray-500">
                                                        +{user.vendorNames.length - 1} more
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span>{user.vendor || user.department || '—'}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-sm text-gray-900">
                                    <div className="inline-block">
                                        {Array.isArray(user.departments) && user.departments.length > 0 ? (
                                            <div
                                                onMouseEnter={(e) => {
                                                    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
                                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                    setTooltip({ items: user.departments?.slice(1) || [], x: Math.min(rect.left, window.innerWidth - 360), y: rect.bottom + 6 });
                                                }}
                                                onMouseLeave={() => {
                                                    hideTimerRef.current = window.setTimeout(() => setTooltip(null), 150);
                                                }}>
                                                <span>{user.departments.slice(0, 1).join(', ')}</span>
                                                {user.departments.length > 1 && (
                                                    <span className="ml-1 text-gray-500">
                                                        +{user.departments.length - 1} more
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span>—</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <button
                                            className="text-sm text-gray-600 hover:text-[#7C3AED] font-medium transition-colors border rounded-full px-3"
                                            onClick={() => {
                                                setSelectedAdmin({
                                                    name: user.name,
                                                    email: user.email,
                                                    vendorNames: Array.isArray(user.vendorNames) ? user.vendorNames : [],
                                                    departments: Array.isArray(user.departments) ? user.departments : [],
                                                });
                                                setAccessModalOpen(true);
                                            }}
                                        >
                                            Manage Access
                                        </button>
                                        <button
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                            onClick={async () => {
                                                const result = await Swal.fire({
                                                    title: 'Delete Admin?',
                                                    text: 'This action cannot be undone.',
                                                    icon: 'warning',
                                                    showCancelButton: true,
                                                    confirmButtonColor: '#EF4444',
                                                    cancelButtonColor: '#6B7280',
                                                    confirmButtonText: 'Delete',
                                                    cancelButtonText: 'Cancel'
                                                });
                                                if (result.isConfirmed) {
                                                    try {
                                                        const res = await apiRequest('/api/users/delete-user', {
                                                            method: 'DELETE',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ targetEmail: user.email })
                                                        });
                                                        const json = await res.json().catch(() => ({}));
                                                        if (res.ok && json.success) {
                                                            setItems((prev) => prev.filter((u) => u.email !== user.email));
                                                            toast.success('Admin user removed.');
                                                        } else {
                                                            toast.error(json.message || 'Unable to delete user.');
                                                        }
                                                    } catch (err: any) {
                                                        toast.error(err?.message || 'Unexpected error.');
                                                    }
                                                }
                                            }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {tooltip && tooltip.items.length > 0 && (
                <div
                    className="z-[9999] bg-white border border-gray-200 rounded-md shadow-lg p-2 text-base w-max max-w-sm"
                    style={{ position: 'fixed', top: tooltip.y, left: tooltip.x }}
                    onMouseEnter={() => { if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; } }}
                    onMouseLeave={() => setTooltip(null)}
                >
                    {tooltip.items.map((t, i) => (
                        <div key={i} className="text-gray-700">{t}</div>
                    ))}
                </div>
            )}
            <TablePagination currentPage={safePage} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
            <AdminManageAccessModal
                isOpen={accessModalOpen}
                onClose={() => setAccessModalOpen(false)}
                adminName={selectedAdmin?.name}
                adminEmail={selectedAdmin?.email}
                adminVendorNames={selectedAdmin?.vendorNames}
                adminDepartmentNames={selectedAdmin?.departments}
                onUpdated={(payload) => {
                    setAccessModalOpen(false);
                    if (payload && selectedAdmin?.email) {
                        const vnames = Array.isArray(payload.vendorNames) ? payload.vendorNames : [];
                        const dnames = Array.isArray(payload.departmentNames) ? payload.departmentNames : [];
                        setItems(prev => prev.map(u =>
                            u.email === selectedAdmin.email
                                ? { ...u, vendorNames: vnames, vendor: vnames.length ? vnames.join(', ') : '—', departments: dnames }
                                : u
                        ));
                    }
                }}
            />
        </div>
    );
};

// Admin Vendor Access Section Component
export const AdminVendorAccessSection: React.FC<{ vendors: Vendor[] }> = ({ vendors }) => {

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const totalCount = vendors.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const displayed = vendors.slice(startIndex, startIndex + pageSize);
    const getPageList = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages; }
        if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
        if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    return (
        <div className="">
            <div className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3 ">
                    {/* <Shield className="text-gray-700 mt-1" size={20} /> */}
                    <div>
                        <h2 className="text-sm text-gray-900">Admin Vendor Access</h2>
                        <p className="text-xs text-[#6A7282] mt-1">Manage vendor access for Margaret Harris</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                    <UserPlus size={18} />
                    Assign Vendor Access
                </button>
            </div>

            {/* <div className="mb-4">
                <h3 className="text-sm text-gray-900 mb-4">Assigned Vendors</h3>
            </div> */}

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map((vendor, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-4 px-4 text-sm text-gray-900">{vendor.name}</td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-[#00C950] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                        </label>
                                        <span className="inline-flex items-center gap-1 text-sm text-[#00A63E] font-medium bg-[#dcfde6] px-3 py-1 rounded-2xl">
                                            <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                                            {vendor.status}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <TablePagination currentPage={currentPage} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
        </div>
    );
};

// Vendor Companies Section Component
export const VendorCompaniesSection: React.FC = () => {
    const [companies] = useState<VendorCompany[]>([
        { id: 5, name: 'ABC vendor', vendorId: 5, status: 'Active' },
        { id: 6, name: 'ABC vendor', vendorId: 5, status: 'Active' },
        { id: 7, name: 'ABC vendor', vendorId: 5, status: 'Active' },
        { id: 8, name: 'ABC vendor', vendorId: 5, status: 'Active' },
        { id: 9, name: 'ABC vendor', vendorId: 5, status: 'Active' },
    ]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const totalCount = companies.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const displayed = companies.slice(startIndex, startIndex + pageSize);
    const getPageList = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages; }
        if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
        if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    return (
        <div className="">
            <div className="flex items-start gap-3 py-4">
                {/* <Building2 className="text-gray-700 mt-1" size={20} /> */}
                <div>
                    <h2 className="text-sm text-gray-900">Vendor Companies</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage vendor companies in the system</p>
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Sr No</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor ID</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map((company, idx) => (
                            <tr key={company.id} className="border-b hover:bg-gray-50">
                                <td className="py-4 px-4 text-sm text-gray-900">{startIndex + idx + 1}</td>
                                <td className="py-4 px-4 text-sm text-gray-900">{company.name}</td>
                                <td className="py-4 px-4 text-sm text-gray-900">{company.vendorId}</td>
                                <td className="py-4 px-4">
                                    <span className="inline-flex items-center gap-1 text-sm text-[#00A63E] font-medium bg-[#dcfde6] px-3 py-1 rounded-2xl">
                                        <span className="w-1.5 h-1.5 bg-[#00A63E] rounded-full"></span>
                                        {company.status}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    <button className="text-red-500 hover:text-red-700 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <TablePagination currentPage={currentPage} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
        </div>
    );
};

// Vendors Section (Unified Table)
export const VendorsSection: React.FC<{ vendors: Vendor[] }> = ({ vendors }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const totalCount = vendors.length;
    const startIndex = (currentPage - 1) * pageSize;
    const displayed = vendors.slice(startIndex, startIndex + pageSize);

    return (
        <div className="">
            <div className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3 ">
                    <div>
                        <h2 className="text-sm text-gray-900">Vendors</h2>
                        <p className="text-xs text-[#6A7282] mt-1">Manage vendor access and companies</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                    <UserPlus size={18} />
                    Assign Vendor Access
                </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Sr No</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Active / InActive</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map((vendor, idx) => (
                            <tr key={`${vendor.name}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-4 px-4 text-sm text-gray-900">{startIndex + idx + 1}</td>
                                <td className="py-4 px-4 text-sm text-gray-900">{vendor.name}</td>
                                <td className="py-4 px-4">
                                    <span className="inline-flex items-center gap-1 text-sm text-[#00A63E] font-medium bg-[#dcfde6] px-3 py-1 rounded-2xl">
                                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                                        {vendor.status}
                                    </span>
                                </td>
                                <td className="py-4 px-4 pl-10">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-[#00C950] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                    </label>
                                </td>
                                <td className="py-4 px-4">
                                    <button className="text-red-500 hover:text-red-700 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <TablePagination currentPage={currentPage} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
        </div>
    );
};

// Vendor User Management Section Component
export const VendorUserManagementSection: React.FC<{ vendors: Vendor[] }> = ({ vendors }) => {
    const [selectedVendor, setSelectedVendor] = useState<string>(() => Cookies.get('selectedVendorId') || '');
    const [vendorOptions, setVendorOptions] = useState<{ value: string; label: string }[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await apiRequest('/api/vendors/get-vendors');
                const json = await res.json();
                if (res.ok) {
                    const opts = (json.vendors || []).map((v: any) => ({ value: String(v._id), label: v.name }));
                    setVendorOptions(opts);
                    if (!selectedVendor && opts.length) {
                        setSelectedVendor(opts[0].value);
                    }
                } else {
                    setVendorOptions([]);
                }
            } catch {
                setVendorOptions([]);
            }
        })();
    }, []);

    useEffect(() => {
        if (!selectedVendor) {
            setUsers([]);
            return;
        }
        (async () => {
            try {
                const res = await apiRequest(`/api/users/get-users?vendorId=${selectedVendor}&page=1&limit=100`);
                const json = await res.json();
                if (res.ok) {
                    const mapped: User[] = (json.users || []).map((u: any, idx: number) => ({
                        id: idx + 1,
                        name: `${(u.firstName || '').trim()} ${(u.lastName || '').trim()}`.trim() || (u.name || ''),
                        email: u.email || '',
                        added: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US') : '',
                        status: u.isDeleted ? 'Inactive' : 'Active',
                    }));
                    setUsers(mapped);
                } else {
                    setUsers([]);
                }
            } catch {
                setUsers([]);
            }
        })();
    }, [selectedVendor]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const totalCount = users.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const displayed = users.slice(startIndex, startIndex + pageSize);
    const getPageList = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages; }
        if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
        if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    return (
        <div className="">
            <div className="py-4 space-y-4">
                <div className="flex items-start gap-3">
                    {/* <Users className="text-gray-700 mt-1" size={20} /> */}
                    <div>
                        <h2 className="text-sm text-gray-900">Vendor User Management</h2>
                        <p className="text-xs text-gray-500 mt-1">Manage vendor users in the system</p>
                    </div>
                </div>

                <div className="w-full bg-gray-50 p-4 border rounded-lg">
                    <div className="flex gap-3 max-w-[60%] ">
                        <CustomDropdown
                            name="select-vendor"
                            options={vendorOptions}
                            value={selectedVendor}
                            onChange={(val) => { setSelectedVendor(val); setCurrentPage(1); }}
                            placeholder="Select Vendor"
                            width='430px'
                        />
                        {/* <select
                            value={selectedVendor}
                            onChange={(e) => setSelectedVendor(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none"
                        >
                            <option value="ABC Vendor">ABC Vendor</option>
                            <option value="XYZ Vendor">XYZ Vendor</option>
                            <option value="Phantom Temporal">Phantom Temporal</option>
                        </select> */}

                        <button className="flex items-center gap-2 px-6 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-purple-700 transition-colors font-medium whitespace-nowrap">
                            <UserPlus size={18} />
                            Add User to Vendor
                        </button>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map((user) => (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                                <td className="py-4 px-4">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </td>
                                <td className="py-4 px-4 text-sm text-gray-900">{user.email}</td>
                                <td className="py-4 px-4 text-sm text-gray-900">{user.added}</td>
                                <td className="py-4 px-4">
                                    <span className="inline-flex items-center gap-1 text-sm text-[#00A63E] font-medium bg-[#dcfde6] px-3 py-1 rounded-2xl">
                                        <span className="w-1.5 h-1.5 bg-[#00A63E] rounded-full"></span>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-sm text-gray-600">⋮ Actions</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <TablePagination currentPage={currentPage} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
        </div>
    );
};