'use client';
import React, { useContext, useEffect, useState } from 'react';
import { Filter, FileDown, Edit, Send, Trash2, X, FileText, Edit3, Mail, Plus, Divide } from 'lucide-react';
import GenericDataTable, { Column } from '../tables/GenericDataTable';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { ReportDropdown } from '../ui/dropdown/reportsDropdown';
import User from '@/lib/models/User';
import { UserContext } from '@/context/authContext';
import { ThemeToggleButton } from '../common/ThemeToggleButton';
import InvitationModal from '../Modals/invitationModal';

// Types
interface Tab {
    id: string;
    label: string;
    color: 'purple' | 'gray';
}

interface ActionButton {
    icon: React.ReactNode;
    label: string;
    variant: 'primary' | 'secondary' | 'success' | 'danger';
    onClick: () => void;
}

type UserData = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    vendor: string;
    department?: string;
    status?: 'accepted' | 'expired';
    invited?: string;
};


export const dummyUsers: UserData[] = [
    {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        vendor: "ABC Vendor",
    },
    {
        id: "2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        vendor: "ABC Vendor",
    },
    {
        id: "3",
        firstName: "Michael",
        lastName: "Anderson",
        email: "michael.anderson@example.com",
        vendor: "ABC Vendor",
    },
    {
        id: "4",
        firstName: "Emily",
        lastName: "Stone",
        email: "emily.stone@example.com",
        vendor: "ABC Vendor",
    },
    {
        id: "5",
        firstName: "David",
        lastName: "Brown",
        email: "david.brown@example.com",
        vendor: "ABC Vendor",
    },
];

export const dummyAdmins: UserData[] = [
    {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        vendor: "ABC Vendor",
        department: "US Purchase Trailers",
    },
    {
        id: "2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        vendor: "ABC Vendor",
        department: "US Purchase Trailers",
    },
    {
        id: "3",
        firstName: "Michael",
        lastName: "Anderson",
        email: "michael.anderson@example.com",
        vendor: "ABC Vendor",
        department: "Canada Trailers",
    },
    {
        id: "4",
        firstName: "Emily",
        lastName: "Stone",
        email: "emily.stone@example.com",
        vendor: "ABC Vendor",
        department: "US Purchase Trailers",
    },
    {
        id: "5",
        firstName: "David",
        lastName: "Brown",
        email: "david.brown@example.com",
        vendor: "ABC Vendor",
        department: "Canada Trailers",
    },
];

export const dummyInvites: UserData[] = [
    {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        vendor: "ABC Vendor",
        department: "US Purchase Trailers",
        status: "accepted",
        invited: "2023-08-15",
    },
    {
        id: "2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        vendor: "ABC Vendor",
        department: "US Purchase Trailers",
        status: "accepted",
        invited: "2023-08-15",
    },
    {
        id: "3",
        firstName: "Michael",
        lastName: "Anderson",
        email: "michael.anderson@example.com",
        vendor: "ABC Vendor",
        department: "Canada Trailers",
        status: "expired",
        invited: "2023-08-15",
    },
    {
        id: "4",
        firstName: "Emily",
        lastName: "Stone",
        email: "emily.stone@example.com",
        vendor: "ABC Vendor",
        department: "US Purchase Trailers",
        status: "accepted",
        invited: "2023-08-15",
    },
    {
        id: "5",
        firstName: "David",
        lastName: "Brown",
        email: "david.brown@example.com",
        vendor: "ABC Vendor",
        department: "Canada Trailers",
        status: "expired",
        invited: "2023-08-15",
    },
];

// Main Reports Component
const Users: React.FC = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(false)
    const { user } = useContext(UserContext);
    const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
    const tabs: Tab[] = [
        { id: 'users', label: 'Active Users', color: 'purple' },
        ...(user?.role === 'admin' ? [{ id: 'admins', label: 'Admin Users', color: 'gray' as const }] : []),
        { id: 'invites', label: 'Invitations', color: 'gray' },
    ];


    const userColumns: Column<UserData>[] = [
        {
            header: "First Name",
            accessor: "firstName",
            cell: (row) => <div className="opacity-60">{row.firstName}</div>,
        },
        {
            header: "Last Name",
            accessor: "lastName",
            cell: (row) => <div className="opacity-60">{row.lastName}</div>,
        },
        {
            header: "Email",
            accessor: "email",
            cell: (row) => <div className="opacity-60">{row.email}</div>,
        },
        {
            header: "Vendor",
            accessor: "vendor",
            cell: (row) =>
                <div className='text-xs'>
                    <div className="border rounded-full px-2 mb-2">{row.vendor}</div>
                    <div className="inline-block px-3 py-1 bg-[#8556B3] text-white rounded-full">
                        Vendor
                    </div>
                </div>
            ,
        },
    ];

    const adminColumns: Column<UserData>[] = [
        {
            header: "First Name",
            accessor: "firstName",
            cell: (row) => <div className="opacity-60">{row.firstName}</div>,
        },
        {
            header: "Last Name",
            accessor: "lastName",
            cell: (row) => <div className="opacity-60">{row.lastName}</div>,
        },
        {
            header: "Email",
            accessor: "email",
            cell: (row) => <div className="opacity-60">{row.email}</div>,
        },
        {
            header: "Vendor",
            accessor: "vendor",
            cell: (row) =>
                <div className='text-xs'>
                    <div className="border rounded-full px-2 mb-2">{row.vendor}</div>
                    <div className="inline-block px-3 py-1 bg-[#8556B3] text-white rounded-full">
                        Admin
                    </div>
                </div>
            ,
        },
        {
            header: "Company",
            accessor: "department",
            cell: (row) => <div className="opacity-60">{row.department}</div>,
        },
    ];

    const inviteColumns: Column<UserData>[] = [
        {
            header: "Name",
            accessor: "firstName",
            cell: (row) => <div className="opacity-60">{row.firstName}+{row.lastName}</div>,
        },
        {
            header: "Email",
            accessor: "email",
            cell: (row) => <div className="opacity-60">{row.email}</div>,
        },
        {
            header: "Role",
            accessor: "department",
            cell: (row) => <div className="inline-block px-3 py-1 bg-[#8556B3] text-white rounded-full">
                Admin
            </div>,
        },
        {
            header: "Company",
            accessor: "department",
            cell: (row) => <div className="opacity-60">{row.department}</div>,
        },
        {
            header: <div className='text-center'>Status</div>,
            accessor: "status",
            cell: (row) => <div
                className={`px-2 py-1 rounded-full text-center
                    ${row.status === "accepted" ? "bg-[#F2EAFF]" : ""}
                    ${row.status === "expired" ? "bg-[#EF6468] text-white" : ""}
                    `}
            >
                {row.status
                    ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
                    : ""}
            </div>
            ,
        },
        {
            header: "Invited On",
            accessor: "invited",
            cell: (row) => <div className="opacity-60">{row.invited}</div>,
        },

    ];


    return (
        <div className="">
            <div className="relative">
                {/* Page Title */}
                <h1 className="font-bold text-2xl px-2 py-3">Users</h1>
                <div className="flex justify-between mb-5">
                    {/* Tabs */}
                    <div className="inline-block bg-purple-100 p-2 rounded-lg ">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id
                                    ? 'bg-purple-600 text-white'
                                    : 'text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setIsInvitationModalOpen(true)}
                        className="bg-purple-600 text-white rounded-xl  px-2 font-medium hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Plus size={16} />
                        Send Invitation
                    </button>
                </div>


                <div className='bg-white p-3'>

                    {activeTab === 'users' && (
                        <div className="">
                            <div className="h-full">
                                <GenericDataTable title="" data={dummyUsers} tabs={["2"]} columns={userColumns} pageSize={5} currentPage={1} loading={loading} setLoading={setLoading} querykey="user_page" emptyStateImages={{
                                    "All Users": "/images/No Users.svg"
                                }}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'admins' && (
                        <div className="">
                            <div className="h-full">
                                <GenericDataTable title="" data={dummyAdmins} tabs={["2"]} columns={adminColumns} pageSize={5} currentPage={1} loading={loading} setLoading={setLoading} querykey="user_page" emptyStateImages={{
                                    "All Users": "/images/No Users.svg"
                                }}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'invites' && (
                        <div className="">
                            <div className="h-full">
                                <GenericDataTable title="" data={dummyInvites} tabs={["2"]} columns={inviteColumns} pageSize={5} currentPage={1} loading={loading} setLoading={setLoading} querykey="user_page" emptyStateImages={{
                                    "All Users": "/images/No Users.svg"
                                }}
                                />
                            </div>
                        </div>
                    )}
                </div>


            </div>
            <InvitationModal
                isOpen={isInvitationModalOpen}
                onClose={() => setIsInvitationModalOpen(false)}
                onUpdated={() => {
                    // Refresh your data here if needed
                    setLoading(true);
                    // Add your data refresh logic
                }}
                role={user?.role || "admin"}
            />
        </div>
    );
};

export default Users;