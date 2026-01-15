'use client'
import React, { useState } from 'react';
import { Users, Building2, Shield, Trash2, Search, ChevronLeft, UserPlus, UserCog2, Briefcase, Store, UserCog, ChevronRight } from 'lucide-react';
import { Department, User, VendorCompany, AdminUser, Vendor } from './types'
import { useRouter } from 'next/navigation';

//pagination
type TablePaginationProps = {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

const TablePagination: React.FC<TablePaginationProps> = ({
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
          className={`w-8 h-8 flex items-center justify-center rounded-md border ${
            safePage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, idx) =>
          typeof p === 'number' ? (
            <button
              key={idx}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-md border text-sm ${
                safePage === p ? 'bg-[#7C3AED] text-white border-[#7C3AED]' : 'text-gray-700 hover:bg-gray-100'
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
          className={`w-8 h-8 flex items-center justify-center rounded-md border ${
            safePage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};


// Page Header Component
const PageHeader: React.FC = () => {
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
const AdminDepartmentsSection: React.FC = () => {
    const [departments] = useState<Department[]>([
        { id: "13", name: 'UK Purchase Traders', status: 'Active' },
        { id: "14", name: 'Canada Trailers', status: 'Active' },
        { id: "15", name: 'Campaign', status: 'Active' },
    ]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const totalCount = departments.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const displayed = departments.slice(startIndex, startIndex + pageSize);
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
                {/* <UserCog2 className="text-gray-700 mt-1" size={20} /> */}
                <div>
                    <h2 className="text-sm font-normal text-gray-900">Admin Departments</h2>
                    <p className="text-xs text-[#6A7282] mt-1">Manage user's departments in the system</p>
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full ">
                    <thead className='bg-gray-100'>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map((dept) => (
                            <tr key={dept.id} className="border-b  hover:bg-gray-50">
                                <td className="py-4 px-4 text-sm text-gray-900">{dept.id}</td>
                                <td className="py-4 px-4 text-sm text-gray-900">{dept.name}</td>
                                <td className="py-4 px-4">
                                    <span className="inline-flex items-center gap-1 text-sm text-[#00A63E] font-medium bg-[#dcfde6] px-3 py-1 rounded-2xl">
                                        {dept.status}
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

// Admin User Management Section Component
const AdminUserManagementSection: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [adminUsers] = useState<AdminUser[]>([
        { id: 163, name: 'Kisha Searcy', email: 'searchyl@amazon.com', secondaryEmail: 'searcy@amazon.com', department: 'US Purchase Teams' },
        { id: 164, name: 'Yordanos Telfera', email: 'ytelfera@amazon.com', secondaryEmail: 'ytelfera@amazon.com', department: 'US Purchase Teams' },
        { id: 165, name: 'Mauddys Lopez', email: 'lmauddys@amacon.com', secondaryEmail: 'lmauddys@amacon.com', department: 'US Purchase Teams' },
        { id: 166, name: 'Andrea Duffey', email: 'adduffe@amazor.com', secondaryEmail: 'adduffe@amazor.com', department: 'US Purchase Teams' },
        { id: 167, name: 'Admin US Purchase Trailers', email: 'admin-ustraillers@inspectech.com', secondaryEmail: 'admin-ustrailers@inspectech.com', department: 'US Purchase Teams' },
        { id: 168, name: 'Kimi Hunter', email: 'kiholder@amacon.com', secondaryEmail: 'kiholder@amacon.com', department: 'US Purchase Teams' },
        { id: 169, name: 'Natalie Mizysak', email: 'mizysak@amazon.com', secondaryEmail: 'mizysak@amazon.com', department: 'US Purchase Teams' },
        { id: 170, name: 'Aaron Sims', email: 'aaaron@acurian.com', secondaryEmail: 'aaron.sims@acurian.com', department: 'US Purchase Teams' },
    ]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);

    const filtered = adminUsers.filter((u) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
            String(u.id).includes(q) ||
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.secondaryEmail.toLowerCase().includes(q) ||
            u.department.toLowerCase().includes(q)
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
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Name</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="text-left py-3 px-4 pl-8 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map((user) => (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                                <td className="py-4 px-4 text-sm text-gray-900">{user.id}</td>
                                <td className="py-4 px-4">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.secondaryEmail}</div>
                                </td>
                                <td className="py-4 px-4 text-sm text-gray-900">{user.email}</td>
                                <td className="py-4 px-4 text-sm text-gray-900">{user.department}</td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <button className="text-sm text-gray-600 hover:text-[#7C3AED] font-medium transition-colors border rounded-full px-3">
                                            Manage Access
                                        </button>
                                        <button className="text-red-500 hover:text-red-700 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <TablePagination currentPage={safePage} totalCount={totalCount} pageSize={pageSize} onPageChange={setCurrentPage} />
        </div>
    );
};

// Admin Vendor Access Section Component
const AdminVendorAccessSection: React.FC = () => {
    const [vendors] = useState<Vendor[]>([
        { name: 'XYZ Vendor', status: 'Active' },
        { name: 'Phantom Temporal', status: 'Active' },
        { name: 'Bluegrass', status: 'Active' },
        { name: 'Great Slate', status: 'Active' },
        { name: 'Jo Malone', status: 'Active' },
    ]);

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
const VendorCompaniesSection: React.FC = () => {
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
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor ID</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map((company) => (
                            <tr key={company.id} className="border-b hover:bg-gray-50">
                                <td className="py-4 px-4 text-sm text-gray-900">{company.id}</td>
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

// Vendor User Management Section Component
const VendorUserManagementSection: React.FC = () => {
    const [selectedVendor, setSelectedVendor] = useState('ABC Vendor');
    const [users] = useState<User[]>([
        { id: 1, name: 'John Doe', email: 'johndoe@example.com', added: '11/12/2024', status: 'Active' },
        { id: 2, name: 'John Doe', email: 'johndoe@example.com', added: '11/12/2024', status: 'Active' },
        { id: 3, name: 'John Doe', email: 'johndoe@example.com', added: '11/12/2024', status: 'Active' },
    ]);

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
                        <select
                            value={selectedVendor}
                            onChange={(e) => setSelectedVendor(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none"
                        >
                            <option value="ABC Vendor">ABC Vendor</option>
                            <option value="XYZ Vendor">XYZ Vendor</option>
                            <option value="Phantom Temporal">Phantom Temporal</option>
                        </select>

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

// Main Company Management Page Component
const CompanyManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('admin-departments');
    const tabs = [
        { id: 'admin-departments', label: 'Admin Departments', icon: <Building2 className="text-gray-400" size={18} /> },
        { id: 'admin-users', label: 'Admin Users', icon: <Users className="text-gray-400" size={18} /> },
        { id: 'assigned-vendors', label: 'Assigned Vendors', icon: <Briefcase className="text-gray-400" size={18} /> },
        { id: 'vendor-companies', label: 'Vendor Companies', icon: <Store className="text-gray-400" size={18} /> },
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
                        {activeTab === 'admin-departments' && <AdminDepartmentsSection />}
                        {activeTab === 'admin-users' && <AdminUserManagementSection />}
                        {activeTab === 'assigned-vendors' && <AdminVendorAccessSection />}
                        {activeTab === 'vendor-companies' && <VendorCompaniesSection />}
                        {activeTab === 'vendor-users' && <VendorUserManagementSection />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CompanyManagementPage;