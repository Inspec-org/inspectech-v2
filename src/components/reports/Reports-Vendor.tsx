'use client';
import React, { useContext, useEffect, useState } from 'react';
import { Filter, FileDown, Edit, Send, Trash2, X, FileText, Edit3, Mail } from 'lucide-react';
import GenericDataTable, { Column } from '../tables/GenericDataTable';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { ReportDropdown } from '../ui/dropdown/reportsDropdown';
import GeneratedReport from './GeneratedReport';
import AnalysisDashboard from './AnalysisDashboard';
import User from '@/lib/models/User';
import { UserContext } from '@/context/authContext';

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

type ReportData = {
    id: string;
    status: string;
    vendor: string;
    department: string;
    date_created: string;
    review_requested: string;
    missing_data: string;
    review_completed: string;
    email_notifcation: string;
};

export const dummyReports: ReportData[] = [
    {
        id: "RPT-001",
        status: "Completed",
        vendor: "Cappadocia Travel Co.",
        department: "Safety",
        date_created: "2025-10-25",
        review_requested: "2025-10-26",
        missing_data: "None",
        review_completed: "2025-10-27",
        email_notifcation: "Yes",
    },
    {
        id: "RPT-002",
        status: "Pending",
        vendor: "Skyline Tours",
        department: "Quality",
        date_created: "2025-10-28",
        review_requested: "—",
        missing_data: "Incomplete Image File",
        review_completed: "—",
        email_notifcation: "No",
    },
    {
        id: "RPT-003",
        status: "In Progress",
        vendor: "Blue Horizon Travels",
        department: "Maintenance",
        date_created: "2025-10-29",
        review_requested: "2025-10-30",
        missing_data: "Incomplete Checklist",
        review_completed: "—",
        email_notifcation: "Yes",
    },
    {
        id: "RPT-004",
        status: "Completed",
        vendor: "Anatolia Adventures",
        department: "Health & Safety",
        date_created: "2025-10-15",
        review_requested: "2025-10-16",
        missing_data: "None",
        review_completed: "Pending",
        email_notifcation: "Yes",
    },
    {
        id: "RPT-005",
        status: "Pending",
        vendor: "Historic Gateways",
        department: "Logistics",
        date_created: "2025-11-01",
        review_requested: "—",
        missing_data: "Incomplete DOT Form",
        review_completed: "Pending",
        email_notifcation: "No",
    },
];

// Tab Component
const Tab: React.FC<{
    tab: Tab;
    isActive: boolean;
    onClick: () => void;
}> = ({ tab, isActive, onClick }) => {
    const colorClasses = {
        purple: isActive ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700',
        gray: isActive ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-600',
    };

    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${colorClasses[tab.color]} hover:opacity-90`}
        >
            {tab.label}
        </button>
    );
};

// Action Button Component
const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    variant: 'primary' | 'secondary' | 'success' | 'danger';
    onClick: () => void;
}> = ({ icon, label, variant, onClick }) => {
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300',
        success: 'bg-green-500 text-white hover:bg-green-600',
        danger: 'bg-red-500 text-white hover:bg-red-600',
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${variantClasses[variant]}`}
        >
            {icon}
            {label}
        </button>
    );
};

// Selection Badge Component
const SelectionBadge: React.FC<{
    count: number;
    onClear: () => void;
}> = ({ count, onClear }) => {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md">
            <span className="text-sm text-gray-700">Vendor + {count} selected</span>
            <button
                onClick={onClear}
                className="text-gray-500 hover:text-gray-700 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// Report Card Component
const ReportCard: React.FC<{
    title: string;
    description: string;
    onFilterClick: () => void;
    onGenerateReport: () => void;
    onBatchEdit: () => void;
    onSendNotification: () => void;
    onRemoveFromHistory: () => void;
    selectedCount: number;
    onClearSelection: () => void;
}> = ({
    title,
    description,
    onFilterClick,
    onGenerateReport,
    onBatchEdit,
    onSendNotification,
    onRemoveFromHistory,
    selectedCount,
    onClearSelection,
}) => {
        return (
            <div className="rounded-lg p-6">
                {/* Title and Description */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                    <ActionButton
                        icon={<Filter className="w-4 h-4" />}
                        label="Filter"
                        variant="primary"
                        onClick={onFilterClick}
                    />
                    <ActionButton
                        icon={<FileText className="w-4 h-4" />}
                        label="Generate Report"
                        variant="secondary"
                        onClick={onGenerateReport}
                    />
                    <ActionButton
                        icon={<Edit3 className="w-4 h-4" />}
                        label="Batch Edit"
                        variant="secondary"
                        onClick={onBatchEdit}
                    />
                    <ActionButton
                        icon={<Mail className="w-4 h-4" />}
                        label="Send Admin Notification"
                        variant="success"
                        onClick={onSendNotification}
                    />
                    <ActionButton
                        icon={<Trash2 className="w-4 h-4" />}
                        label="Remove from Status History"
                        variant="danger"
                        onClick={onRemoveFromHistory}
                    />

                    {selectedCount > 0 && (
                        <SelectionBadge count={selectedCount} onClear={onClearSelection} />
                    )}
                </div>
            </div>
        );
    };

// Main Reports Component
const Reports: React.FC = () => {
    const [activeTab, setActiveTab] = useState('inspection');
    const [selectedCount, setSelectedCount] = useState(2);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [loading, setLoading] = useState(false)
    const [openGeneratedReport, setOpenGeneratedReport] = useState(false);
    const { user } = useContext(UserContext);



    useEffect(() => {
        if (user && user?.role === "vendor" || role === "user") {
            setActiveTab('analytics')
        }
    }, [user])

    const handleFilterClick = () => {
        ;
    };

    const handleGenerateReport = () => {
        setOpenGeneratedReport(!openGeneratedReport);
    };

    const handleBatchEdit = () => {
        ;
    };

    const handleSendNotification = () => {
        ;
    };

    const handleRemoveFromHistory = () => {
        ;
    };

    const handleClearSelection = () => {
        setSelectedCount(0);
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRows([]);
        } else {
            setSelectedRows(dummyReports.map((row) => row.id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectRow = (id: string) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const columns: Column<ReportData>[] = [
        {
            header: (
                <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="circle-checkbox"
                />
            ),
            accessor: "select",
            cell: (row) => (
                <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => handleSelectRow(row.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="circle-checkbox"
                />
            ),
        },

        {
            header: "REPORT ID",
            accessor: "id",
            cell: (row) => <div className="font-medium text-[var(--secondary)]">{row.id}</div>,
        },
        {
            header: "STATUS",
            accessor: "status",
            cell: (row) => (
                <span
                    className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap
                    ${row.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : row.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                        }`}
                >
                    {row.status.toUpperCase()}
                </span>
            ),
        },
        {
            header: "VENDOR",
            accessor: "vendor",
            cell: (row) => <div className="opacity-70">{row.vendor}</div>,
        },
        {
            header: "DEPARTMENT",
            accessor: "department",
            cell: (row) => <div className="opacity-70">{row.department}</div>,
        },
        {
            header: "DATE CREATED",
            accessor: "date_created",
            cell: (row) => <div className="opacity-70">{row.date_created}</div>,
        },
        {
            header: "REVIEW REQUESTED",
            accessor: "review_requested",
            cell: (row) => <div className="opacity-70">{row.review_requested}</div>,
        },
        {
            header: "MISSING DATA",
            accessor: "missing_data",
            cell: (row) =>
                <ReportDropdown
                    options={[
                        { value: "None", label: "None" },
                        { value: "Incomplete Image File", label: "Incomplete Image File" },
                        { value: "Incomplete DOT Form", label: "Incomplete DOT Form" },
                        { value: "Incomplete Checklist", label: "Incomplete Checklist" },

                    ]}
                    width='200px'
                    value={row.missing_data}
                // onChange={(val) => setDepartment(val)}
                />,
        },
        {
            header: "REVIEW COMPLETED",
            accessor: "review_completed",
            cell: (row) => (
                <span
                    className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap
                    ${/^\d{4}-\d{2}-\d{2}$/.test(row.review_completed)     // checks if date format YYYY-MM-DD
                            ? "bg-green-100 text-green-700"                  // date styling
                            : row.review_completed === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                        }`}
                >
                    {row.review_completed.toUpperCase()}
                </span>
            ),
        },
        {
            header: "EMAIL NOTIFICATION",
            accessor: "email_notifcation",
            cell: (row) =>
                <ReportDropdown
                    options={[
                        { value: "No", label: "No" },
                        { value: "Yes", label: "Yes" },
                        { value: "Manually Sent", label: "Manually Sent" },
                    ]}
                    width='150px'
                    value={row.email_notifcation}
                // onChange={(val) => setDepartment(val)}
                />,
        },
    ];


    return (
        <div className="">
            <div className="relative">
                {/* Page Title */}


                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-3 p-2 border-b border-purple-100 bg-gradient-to-r from-[#FAF5FF] from-[0%] to-[#ded1eb] to-[100%] rounded-xl mb-4">
                        <div className="p-1.5 rounded-md ">
                            <FileText className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-semibold text-gray-900">Reports</h1>
                        </div>
                    </div>
                    <AnalysisDashboard />
                </div>
            </div>

        </div>
    );
};

export default Reports;