'use client';
import React, { Suspense, useContext, useEffect, useRef, useState } from 'react';
import { Filter, FileDown, Edit, Send, Trash2, X, FileText, Edit3, Mail, Plus, Divide } from 'lucide-react';
import GenericDataTable, { Column } from '../tables/GenericDataTable';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { ReportDropdown } from '../ui/dropdown/reportsDropdown';
import User from '@/lib/models/User';
import { UserContext } from '@/context/authContext';
import { ThemeToggleButton } from '../common/ThemeToggleButton';
import InvitationModal from '../Modals/invitationModal';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { useSearchParams } from 'next/navigation';

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


// Main Reports Component
const Users: React.FC = () => {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('users');
    const [userLoading, setUserLoading] = useState(false)
    const [invitationLoading, setInvitationLoading] = useState(false)
    const [invites, setInvites] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [totalUsers, setTotalUsers] = useState<number>(0)
    const [totalUsersPages, setTotalUsersPages] = useState<number[]>([])
    const userCurrentPage = parseInt(searchParams.get("user_page") || "1", 10);
    const [userlimit, setUserLimit] = useState<number>(10)
    const [totalInvitations, setTotalInvitations] = useState<number>(0)
    const [totalInvitationsPages, setTotalInvitationsPages] = useState<number[]>([])
    const invitationCurrentPage = parseInt(searchParams.get("invitation_page") || "1", 10);
    const [Invitationslimit, setInvitationsLimit] = useState<number>(10)
    const isResettingUserPage = useRef(false);
    const isResettingInvitationPage = useRef(false);

    useEffect(() => {
        if (userCurrentPage !== 1) {
            isResettingUserPage.current = true;
            const params = new URLSearchParams(searchParams);
            params.set('user_page', "1");
            window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        }
    }, [userlimit])

    useEffect(() => {
        if (invitationCurrentPage !== 1) {
            isResettingInvitationPage.current = true;
            const params = new URLSearchParams(searchParams);
            params.set('invitation_page', "1");
            window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        }
    }, [Invitationslimit])

    const { user } = useContext(UserContext);
    const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
    const tabs: Tab[] = [
        { id: 'users', label: 'Active Users', color: 'purple' },
        ...(user?.role === 'admin' ? [{ id: 'admins', label: 'Admin Users', color: 'gray' as const }] : []),
        { id: 'invites', label: 'Invitations', color: 'gray' },
    ];
    const [vendorId, setVendorId] = useState(() => {
        return Cookies.get('selectedVendorId') || '';
    });


    useEffect(() => {
        setVendorId(Cookies.get('selectedVendorId') || '');
        console.log('vendorId', vendorId)
    }, []);

    const getInvites = async () => {
        if (isResettingInvitationPage.current) {
            isResettingInvitationPage.current = false;
            return;
        }
        setInvitationLoading(true);
        try {
            const res = await apiRequest(`/api/invite/list?vendorId=${vendorId}&page=${invitationCurrentPage}&limit=${Invitationslimit}`);
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || 'Failed to fetch invitations')
            }
            setInvites(json.invitations || []);
            setTotalInvitations(json.total || 0);
            const pagesArray = Array.from({ length: json.totalPages || 0 }, (_, i) => i + 1);
            setTotalInvitationsPages(pagesArray);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to fetch invitations';
            toast.error(errorMessage);
            setInvites([]);
        } finally {
            setInvitationLoading(false);
        }
    };

    const getUsers = async () => {
        if (isResettingUserPage.current) {
            isResettingUserPage.current = false;
            return;
        }
        setUserLoading(true);
        try {
            const res = await apiRequest(`/api/users/get-users?vendorId=${vendorId}&page=${userCurrentPage}&limit=${userlimit}`);
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || 'Failed to fetch users')
            }
            console.log('json.users', json.users || [])
            setUsers(json.users || []);
            setTotalUsers(json.total || 0);
            const pagesArray = Array.from({ length: json.totalPages || 0 }, (_, i) => i + 1);
            setTotalUsersPages(pagesArray);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to fetch users';
            toast.error(errorMessage);
            setUsers([]);
        } finally {
            setUserLoading(false);
        }
    };

    useEffect(() => {
        setTimeout(() => {
            getUsers();
        }, 2000);
    }, [userCurrentPage, userlimit]);
    useEffect(() => {
        getInvites();
    }, [invitationCurrentPage, Invitationslimit]);
    // getInvites();

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

    const inviteColumns: Column<any>[] = [
        {
            header: "Name",
            accessor: "name",
            cell: (row) => <div className="opacity-60">{row.name}</div>,
        },
        {
            header: "Email",
            accessor: "email",
            cell: (row) => <div className="opacity-60">{row.email}</div>,
        },
        {
            header: "Role",
            accessor: "role",
            cell: (row) => <div className="inline-block px-3 py-1 bg-[#8556B3] text-white rounded-full">
                {row.role?.charAt(0).toUpperCase() + row.role?.slice(1)}
            </div>,
        },
        {
            header: "Company",
            accessor: "vendorName",
            cell: (row) => <div className="opacity-60">{row.vendorName || 'N/A'}</div>,
        },
        {
            header: <div className='text-center'>Status</div>,
            accessor: "status",
            cell: (row) => <div
                className={`px-2 py-1 rounded-full text-center
                    ${row.status === "accepted" ? "bg-[#10B981] text-white" : ""}
                    ${row.status === "expired" ? "bg-[#EF6468] text-white" : ""}
                    ${row.status === "pending" ? "bg-[#F2EAFF]" : ""}
                    `}
            >
                {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : ""}
            </div>
            ,
        },
        {
            header: "Invited On",
            accessor: "invited",
            cell: (row) => <div className="opacity-60">{row.invited ? new Date(row.invited).toLocaleDateString() : ''}</div>,
        },
    ];


    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="relative">
                {/* Page Title */}
                <h1 className="font-bold text-2xl px-2 py-3">Users</h1>



                <div className='bg-white p-6'>
                    <div className="flex justify-between mb-5">
                        {/* Tabs */}
                        <div className="inline-block bg-purple-100 p-2 rounded-lg ">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id
                                        ? 'bg-[#7522BB] text-white'
                                        : 'text-gray-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setIsInvitationModalOpen(true)}
                            disabled={user?.role === "admin"}
                            className="bg-[#7522BB] text-white rounded-xl  px-2 font-medium hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Plus size={16} />
                            Send Invitation
                        </button>
                    </div>

                    {activeTab === 'users' && (
                        <div className="">
                            <div className="h-full">
                                <GenericDataTable title="" data={users} tabs={totalUsersPages} columns={userColumns} pageSize={userlimit} currentPage={userCurrentPage} setPageSize={setUserLimit} loading={userLoading} setLoading={setInvitationLoading} querykey="user_page" emptyStateImages={{
                                    "All Users": "/images/No Users.svg"
                                }}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'admins' && (
                        <div className="">
                            <div className="h-full">
                                <GenericDataTable title="" data={dummyAdmins} tabs={totalUsersPages} columns={adminColumns} pageSize={5} currentPage={1} loading={invitationLoading} setLoading={setInvitationLoading} querykey="user_page" emptyStateImages={{
                                    "All Users": "/images/No Users.svg"
                                }}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'invites' && (
                        <div className="">
                            <div className="h-full">
                                <GenericDataTable title="" data={invites} tabs={totalInvitationsPages} columns={inviteColumns} pageSize={Invitationslimit} currentPage={invitationCurrentPage} setPageSize={setInvitationsLimit} loading={invitationLoading} setLoading={setInvitationLoading} querykey="invitation_page" emptyStateImages={{
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
                    getInvites();
                }}
                role={user?.role === "user" ? "vendor" : "admin"}
                vendorId={vendorId}
            />
        </Suspense>
    );
};

export default Users;