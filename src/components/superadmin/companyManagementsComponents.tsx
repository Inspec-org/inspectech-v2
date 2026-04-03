'use client'
import { ChevronLeft, ChevronRight, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { AdminUser, Department, TablePaginationProps, User, Vendor, VendorCompany } from "./types";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, Fragment } from "react";
import Cookies from 'js-cookie';
import { apiRequest } from "@/utils/apiWrapper";
import { CustomDropdown } from "../ui/dropdown/CustomDropdown";
import { useModal } from "@/hooks/useModal";
import AddDepartmentModal from "../Modals/AddDepartmentModal";
import AdminManageAccessModal from "../Modals/AdminManageAccessModal";
import VendorManageAccessModal from "../Modals/VendorManageAccessModal";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import InvitationModal from "../Modals/invitationModal";
import { ClipLoader } from "react-spinners";

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
export const AdminDepartmentsSection: React.FC<{ departments: Department[]; totalCount?: number; currentPage?: number; pageSize?: number; onPageChange?: (page: number) => void; loading?: boolean; onStatusUpdated?: (id: string, status: 'Active' | 'Inactive') => void }> = ({ departments, totalCount: extTotal, currentPage: extPage, pageSize: extSize, onPageChange, loading, onStatusUpdated }) => {
    const [currentPage, setCurrentPage] = useState(extPage ?? 1);
    const [pageSize] = useState(extSize ?? 5);
    const { isOpen, openModal, closeModal } = useModal();
    const [items, setItems] = useState<Department[]>(departments);
    const [totalCount, setTotalCount] = useState<number>(extTotal ?? departments.length);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, extPage ?? currentPage), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const displayed = items.slice(startIndex, endIndex);

    useEffect(() => {
        setItems(departments);
        setTotalCount(typeof extTotal === 'number' ? extTotal : departments.length);
    }, [departments, extTotal]);

    useEffect(() => {
        if (typeof extPage === 'number') {
            setCurrentPage(extPage);
        }
    }, [extPage]);
    // const getPageList = () => {
    //     const pages: (number | string)[] = [];
    //     if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages; }
    //     if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    //     if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    //     return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    // };

    // Backend pagination: data loads per page; ignore incoming full list
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<any>).detail;
            if (detail && (detail._id || detail.id)) {
                const dep: Department = { id: String(detail._id || detail.id), name: detail.name, status: 'Active' };
                setItems(prev => [dep, ...prev]);
                setTotalCount(prev => prev + 1);
                setCurrentPage(1);
            }
        };
        window.addEventListener('departmentAdded', handler as EventListener);
        return () => window.removeEventListener('departmentAdded', handler as EventListener);
    }, []);

    const [deleting, setDeleting] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const handleStatusToggle = async (dept: Department) => {
        if (!dept?.id) return;
        const next = dept.status === 'Active' ? 'inactive' : 'active';
        try {
            setUpdating(dept.id);
            const res = await apiRequest('/api/departments/update_department_status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ departmentId: dept.id, status: next })
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) { toast.error(json.error || 'Failed to update status'); return; }
            setItems(prev => prev.map(d => d.id === dept.id ? { ...d, status: next === 'active' ? 'Active' : 'Inactive' } : d));
            onStatusUpdated && onStatusUpdated(dept.id, next === 'active' ? 'Active' : 'Inactive');
            toast.success(next === 'active' ? 'Department activated' : 'Department deactivated');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to update status');
        } finally {
            setUpdating(null);
        }
    };
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
            setTotalCount(prev => Math.max(0, prev - 1));
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
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <ClipLoader color="#7C3AED" size={28} />
                    </div>
                ) : (
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
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleStatusToggle(dept)}
                                                disabled={updating === dept.id}
                                                className={`${updating === dept.id ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                                aria-pressed={dept.status === 'Active'}
                                                aria-label="Toggle status"
                                            >
                                                <div className={`relative inline-flex items-center h-6 w-11 rounded-full ${dept.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                    <span className={`inline-block h-5 w-5 transform bg-white rounded-full transition ${dept.status === 'Active' ? 'translate-x-5' : 'translate-x-1'}`} />
                                                </div>
                                            </button>
                                            <span className={`${dept.status === 'Active' ? 'text-[#00A63E] bg-[#dcfde6]' : 'text-gray-600 bg-gray-100'} text-sm font-medium px-3 py-1 rounded-2xl`}>
                                                {dept.status}
                                            </span>
                                        </div>
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
                )}
            </div>
            <TablePagination currentPage={currentPage} totalCount={totalCount} pageSize={pageSize} onPageChange={(p) => { setCurrentPage(p); onPageChange && onPageChange(p); }} />
            <AddDepartmentModal isOpen={isOpen} onClose={closeModal} onUpdated={() => {
                closeModal();
                setCurrentPage(1);
            }} />
        </div>
    );
};

// Admin User Management Section Component
export const AdminUserManagementSection: React.FC<{
    adminUsers?: AdminUser[];
    totalCount?: number;
    currentPage?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    searchQuery?: string;
    onSearchChange?: (q: string) => void;
    loading?: boolean;
}> = ({ adminUsers = [], totalCount: extTotal, currentPage: extPage = 1, pageSize: extSize = 2, onPageChange, searchQuery, onSearchChange, loading }) => {
    const [searchQueryLocal, setSearchQueryLocal] = useState(searchQuery ?? '');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [accessModalOpen, setAccessModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<{ name?: string; email?: string; vendorNames?: string[]; departments?: string[] } | null>(null);
    const [items, setItems] = useState<AdminUser[]>(adminUsers);
    const [totalCount, setTotalCount] = useState<number>(extTotal ?? adminUsers.length);

    useEffect(() => { setItems(adminUsers); }, [adminUsers]);
    useEffect(() => { setTotalCount(extTotal ?? adminUsers.length); }, [extTotal, adminUsers]);
    useEffect(() => { setSearchQueryLocal(searchQuery ?? ''); }, [searchQuery]);

    const pageSize = extSize;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(extPage, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const displayed = items;

    const toggleRow = (userId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
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
                            value={searchQuery ?? searchQueryLocal}
                            onChange={(e) => { setSearchQueryLocal(e.target.value); onSearchChange && onSearchChange(e.target.value); }}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none bg-gray-50"
                        />
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <ClipLoader color="#7C3AED" size={28} />
                    </div>
                ) : (
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
                            {displayed.map((user, idx) => {
                                const isExpanded = expandedRows.has(user.id.toString());
                                const hasExtraVendors = Array.isArray(user.vendorNames) && user.vendorNames.length > 0;
                                const hasExtraDepts = Array.isArray(user.departments) && user.departments.length > 0;
                                const hasExpandableContent = hasExtraVendors || hasExtraDepts;

                                return (
                                    <Fragment key={user.id}>
                                        <tr
                                            className={`border-b hover:bg-gray-50 ${hasExpandableContent ? 'cursor-pointer' : ''}`}
                                            onClick={(e) => {
                                                // Don't toggle if clicking on buttons
                                                if ((e.target as HTMLElement).closest('button')) return;
                                                if (hasExpandableContent) toggleRow(user.id.toString());
                                            }}
                                        >
                                            <td className="py-4 px-4 text-sm text-gray-900">{startIndex + idx + 1}</td>
                                            <td className="py-4 px-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                {/* <div className="text-sm text-gray-500">{user.secondaryEmail}</div> */}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-900">{user.email}</td>
                                            <td className="py-4 px-4 text-sm text-gray-900">
                                                {Array.isArray(user.vendorNames) && user.vendorNames.length > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <span>{user.vendorNames[0]}</span>
                                                        {user.vendorNames.length > 1 && (
                                                            <span className="text-xs text-gray-500 font-medium">
                                                                +{user.vendorNames.length - 1} more
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span>{user.vendor || user.department || '—'}</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-900">
                                                {Array.isArray(user.departments) && user.departments.length > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <span>{user.departments[0]}</span>
                                                        {user.departments.length > 1 && (
                                                            <span className="text-xs text-gray-500 font-medium">
                                                                +{user.departments.length - 1} more
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span>—</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        className="text-sm text-gray-600 hover:text-[#7C3AED] font-medium transition-colors border rounded-full px-3 py-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
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
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
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
                                        {isExpanded && hasExpandableContent && (
                                            <tr className="bg-gray-50/50 border-b">
                                                <td colSpan={6} className="py-4 px-4">
                                                    <div className="flex gap-8 pl-4">
                                                        {hasExtraVendors && (
                                                            <div className="flex-1">
                                                                <p className="text-xs font-semibold text-gray-600 mb-3">ALL VENDORS</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {user.vendorNames?.map((vendor, i) => (
                                                                        <span key={i} className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700">
                                                                            {vendor}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {hasExtraDepts && (
                                                            <div className="flex-1">
                                                                <p className="text-xs font-semibold text-gray-600 mb-3">ALL DEPARTMENTS</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {user.departments?.map((dept, i) => (
                                                                        <span key={i} className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700">
                                                                            {dept}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            <TablePagination currentPage={extPage} totalCount={totalCount} pageSize={extSize} onPageChange={onPageChange || (() => { })} />
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
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('adminAccessUpdated'));
                        }
                    }
                }}
            />
        </div>
    );
};


// Vendors Section (Unified Table)
export const VendorsSection: React.FC<{ vendors?: Vendor[]; totalCount?: number; currentPage?: number; pageSize?: number; onPageChange?: (page: number) => void; loading?: boolean; onStatusUpdated?: (id: string, status: 'Active' | 'Inactive') => void }> = ({ vendors = [], totalCount: extTotal, currentPage: extPage, pageSize: extSize, onPageChange, loading, onStatusUpdated }) => {
    const [currentPage, setCurrentPage] = useState(extPage ?? 1);
    const [pageSize] = useState(extSize ?? 5);
    const [items, setItems] = useState<Vendor[]>(vendors);
    const [totalCount, setTotalCount] = useState<number>(typeof extTotal === 'number' ? extTotal : vendors.length);

    useEffect(() => {
        setItems(vendors);
        setTotalCount(typeof extTotal === 'number' ? extTotal : vendors.length);
    }, [vendors, extTotal]);

    useEffect(() => {
        if (typeof extPage === 'number') {
            setCurrentPage(extPage);
        }
    }, [extPage]);

    const startIndex = ((extPage ?? currentPage) - 1) * (extSize ?? pageSize);
    const displayed = items;

    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [usersLoading, setUsersLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [accessModalOpen, setAccessModalOpen] = useState(false);
    const [accessVendor, setAccessVendor] = useState<{ id: string; name: string } | null>(null);

    const handleToggleStatus = async (vendor: Vendor, checked: boolean) => {
        if (!vendor?._id) return;
        try {
            setTogglingId(vendor._id);
            const res = await apiRequest('/api/vendors/update_vendor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vendorId: vendor._id, status: checked ? 'active' : 'inactive' }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) { toast.error(json.error || 'Failed to update vendor status'); return; }
            setItems(prev => prev.map(v => v._id === vendor._id ? { ...v, status: checked ? 'Active' : 'Inactive' } : v));
            onStatusUpdated && onStatusUpdated(String(vendor._id), checked ? 'Active' : 'Inactive');
            toast.success('Vendor status updated');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to update vendor status');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDeleteVendor = async (vendor: Vendor) => {
        if (!vendor?._id) return;
        const { isConfirmed } = await Swal.fire({
            title: 'Delete Vendor?',
            text: 'This will remove the vendor, its inspections, and vendor access from users. This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete',
        });
        if (!isConfirmed) return;
        try {
            setDeletingId(vendor._id);
            const res = await apiRequest('/api/vendors/delete_vendor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vendorId: vendor._id }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) { toast.error(json.error || 'Failed to delete vendor'); return; }
            setItems(prev => prev.filter(v => v._id !== vendor._id));
            setTotalCount(prev => Math.max(0, prev - 1));
            toast.success('Vendor deleted');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to delete vendor');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="">
            <div className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3 ">
                    <div>
                        <h2 className="text-sm text-gray-900">Vendors & Company Management</h2>
                        <p className="text-xs text-[#6A7282] mt-1">Manage vendor access and companies information</p>
                    </div>
                </div>
                {/* <button className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                    <UserPlus size={18} />
                    Assign Vendor Access
                </button> */}
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <ClipLoader color="#7C3AED" size={28} />
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Sr No</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayed.map((vendor, idx) => (
                                <tr key={vendor._id || `${vendor.name}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-4 px-4 text-sm text-gray-900">{startIndex + idx + 1}</td>
                                    <td className="py-4 px-4 text-sm text-gray-900">{vendor.name}</td>
                                    <td className="py-4 px-4 flex items-center gap-2">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={vendor.status === 'Active'}
                                                onChange={(e) => handleToggleStatus(vendor, e.target.checked)}
                                                disabled={togglingId === vendor._id}
                                            />
                                            <div className={`w-11 h-6 ${vendor.status === 'Active' ? 'bg-[#00C950]' : 'bg-[#D9D9D9]'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                                        </label>
                                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${vendor.status === 'Active' ? 'text-[#00A63E] bg-[#dcfde6]' : 'bg-gray-300'} px-3 py-1 rounded-2xl`}>
                                            <span className={`w-1.5 h-1.5 bg-green-600 rounded-full ${vendor.status === 'Active' ? 'block' : 'hidden'}`}></span>
                                            {vendor.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="text-sm text-gray-600 hover:text-[#7C3AED] font-medium transition-colors border rounded-full px-3 whitespace-nowrap"
                                                onClick={() => { setAccessVendor({ id: String(vendor._id), name: vendor.name }); setAccessModalOpen(true); }}
                                            >
                                                Manage Access
                                            </button>
                                            <button
                                                onClick={() => handleDeleteVendor(vendor)}
                                                disabled={deletingId === vendor._id}
                                                className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <TablePagination currentPage={currentPage} totalCount={totalCount} pageSize={pageSize} onPageChange={(p) => { setCurrentPage(p); onPageChange && onPageChange(p); }} />
            {accessVendor && (
                <VendorManageAccessModal
                    isOpen={accessModalOpen}
                    onClose={() => setAccessModalOpen(false)}
                    vendorId={accessVendor.id}
                    vendorName={accessVendor.name}
                    onUpdated={() => { setAccessModalOpen(false); }}
                />
            )}
        </div>
    );
};

// Vendor User Management Section Component
export const VendorUserManagementSection: React.FC<{ vendors: Vendor[] }> = ({ vendors }) => {
    const [selectedVendor, setSelectedVendor] = useState<string>(() => Cookies.get('selectedVendorId') || '');
    const [vendorOptions, setVendorOptions] = useState<{ value: string; label: string }[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const [totalCount, setTotalCount] = useState(0);
    const [inviteOpen, setInviteOpen] = useState(false);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const displayed = users;
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [usersLoading, setUsersLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const limit = 250;
                const firstRes = await apiRequest(`/api/vendors/get-vendors?page=1&limit=${limit}`);
                const firstJson = await firstRes.json().catch(() => ({}));
                let list = Array.isArray(firstJson.vendors) ? firstJson.vendors : [];
                const totalPages = firstJson.totalPages || 1;
                for (let p = 2; p <= totalPages; p++) {
                    const r = await apiRequest(`/api/vendors/get-vendors?page=${p}&limit=${limit}`);
                    if (r.ok) {
                        const j = await r.json().catch(() => ({}));
                        const more = Array.isArray(j.vendors) ? j.vendors : [];
                        list = list.concat(more);
                    }
                }
                const opts = list.map((v: any) => ({ value: String(v._id), label: v.name }));
                setVendorOptions(opts);
                if (!selectedVendor && opts.length) {
                    setSelectedVendor(opts[0].value);
                }
            } catch {
                setVendorOptions([]);
            }
        })();
    }, []);

    useEffect(() => {
        if (!selectedVendor) {
            setUsers([]);
            setTotalCount(0);
            return;
        }
        (async () => {
            setUsersLoading(true);
            try {
                const res = await apiRequest(`/api/users/get-users?vendorId=${selectedVendor}&page=${currentPage}&limit=${pageSize}&role=user`);
                const json = await res.json().catch(() => ({}));
                if (res.ok) {
                    const mapped: User[] = (json.users || []).map((u: any, idx: number) => {
                        const rawStatus = u.status ?? (u.isActive ?? (!u.isDeleted ? 'active' : 'inactive'));
                        const status = String(rawStatus).toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
                        return {
                            id: (currentPage - 1) * pageSize + idx + 1,
                            name: `${(u.firstName || '').trim()} ${(u.lastName || '').trim()}`.trim() || (u.name || ''),
                            email: u.email || '',
                            added: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US') : '',
                            status,
                        };
                    });
                    setUsers(mapped);
                    setTotalCount(Number(json.total || json.totalCount || mapped.length));
                } else {
                    setUsers([]);
                    setTotalCount(0);
                }
            } catch {
                setUsers([]);
                setTotalCount(0);
            } finally {
                setUsersLoading(false);
            }
        })();
    }, [selectedVendor, currentPage, pageSize]);


    const getPageList = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages; }
        if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
        if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    const handleToggleStatus = async (user: User, checked: boolean) => {
        if (!user?.email) return;
        try {
            setTogglingId(user.id.toString());
            const res = await apiRequest('/api/users/update-access', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetEmail: user.email, status: checked ? 'active' : 'inactive' })
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json.success) { toast.error(json.message || 'Failed to update user status'); return; }
            setUsers(prev => prev.map(u => u.email === user.email ? { ...u, status: checked ? 'Active' : 'Inactive' } : u));
            toast.success('User status updated');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to update user status');
        } finally {
            setTogglingId(null);
        }
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
                            searchable={true}
                            searchPlaceholder="Search Vendor"
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

                        <button onClick={() => setInviteOpen(true)} disabled={!selectedVendor} className="flex items-center gap-2 px-6 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-purple-700 transition-colors font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                            <UserPlus size={18} />
                            Add User to Vendor
                        </button>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                {usersLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <ClipLoader color="#7C3AED" size={28} />
                    </div>
                ) : (
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
                                    </td>
                                    <td className="py-4 px-4 text-sm text-gray-900">{user.email}</td>
                                    <td className="py-4 px-4 text-sm text-gray-900">{user.added}</td>
                                    <td className="py-4 px-4 flex items-center gap-2">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={user.status === 'Active'}
                                                onChange={(e) => handleToggleStatus(user, e.target.checked)}
                                                disabled={togglingId === user.id.toString()}
                                            />
                                            <div className={`w-11 h-6 ${user.status === 'Active' ? 'bg-[#00C950]' : 'bg-[#D9D9D9]'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                                        </label>
                                        <span className={`inline-flex items-center gap-1 text-sm text-[#00A63E] font-medium bg-[#dcfde6] px-3 py-1 rounded-2xl ${user.status === 'Active' ? 'block' : 'hidden'}`}>
                                            <span className={`w-1.5 h-1.5 bg-[#00A63E] rounded-full ${user.status === 'Active' ? 'block' : 'hidden'}`}></span>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-sm text-gray-600">
                                        <button
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                            onClick={async () => {
                                                const result = await Swal.fire({
                                                    title: 'Delete User?',
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
                                                            setUsers((prev) => prev.filter((u) => u.email !== user.email));
                                                            toast.success('User removed Successfully.');
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
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <TablePagination currentPage={currentPage} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
            <InvitationModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} role={"vendor"} vendorId={selectedVendor || ""} onUpdated={() => { setInviteOpen(false); setCurrentPage(1); }} />
        </div>
    );
};
