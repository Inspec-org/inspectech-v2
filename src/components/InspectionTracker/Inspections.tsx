'use client'
import { Edit3, FileText, Filter, Mail, Trash2, X } from 'lucide-react';
import React, { useState } from 'react'
import GenericDataTable, { Column } from '../tables/GenericDataTable';
import { ReportDropdown } from '../ui/dropdown/reportsDropdown';
import GeneratedReport from '../reports/GeneratedReport';
import AdminNotificationModal from '../Modals/AdminNotificationModal';
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

export const Header: React.FC<{
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
            <div className="rounded-lg p-4">
                {/* Title and Description */}
                <div className="mb-4">
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
function Inspections() {
    const [openGeneratedReport, setOpenGeneratedReport] = useState(false);
    const [selectedCount, setSelectedCount] = useState(2);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [loading, setLoading] = useState(false)
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

    const handleFilterClick = () => {
        console.log('Filter clicked');
    };

    const handleGenerateReport = () => {
        setOpenGeneratedReport(!openGeneratedReport);
    };

    const handleBatchEdit = () => {
        console.log('Batch edit clicked');
    };

    const handleSendNotification = () => {
        setIsNotificationModalOpen(true);
    };

    const handleRemoveFromHistory = () => {
        console.log('Remove from history clicked');
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
        <div className='bg-white pb-5 max-w-[1080px]'>
            <Header
                title="Inspection Log & Vendor Performance Tracker"
                description="Track inspection requests, turnaround times, and vendor performance"
                onFilterClick={handleFilterClick}
                onGenerateReport={handleGenerateReport}
                onBatchEdit={handleBatchEdit}
                onSendNotification={handleSendNotification}
                onRemoveFromHistory={handleRemoveFromHistory}
                selectedCount={selectedCount}
                onClearSelection={handleClearSelection}
            />
            <div className="px-4">
                <div className="h-full">
                    <GenericDataTable title="" data={dummyReports} tabs={["2"]} columns={columns} pageSize={5} currentPage={1} loading={loading} setLoading={setLoading} querykey="user_page" emptyStateImages={{
                        "All Users": "/images/No Users.svg"
                    }}
                    />
                </div>
            </div>
            {openGeneratedReport && <GeneratedReport close={() => setOpenGeneratedReport(false)} />}
            <AdminNotificationModal
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
            />
        </div>
    )
}

export default Inspections
