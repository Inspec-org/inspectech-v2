'use client'
import { Edit3, FileText, Filter, Mail, Trash2, X, Check } from 'lucide-react';
import React, { Suspense, useEffect, useState } from 'react'
import GenericDataTable, { Column } from '../tables/GenericDataTable';
import { ReportDropdown } from '../ui/dropdown/reportsDropdown';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import GeneratedReport from '../reports/GeneratedReport';
import AdminNotificationModal from '../Modals/AdminNotificationModal';
import { apiRequest } from '@/utils/apiWrapper';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import FilterInspectionsModal from '../Modals/FilterInspectionsModal';
import { useModal } from '@/hooks/useModal';
import { InspectionData } from '../inspections/Inspections';
import FilterTrackingModal from '../Modals/FilterTrackingModal';
import { Header } from './components';
import BatchEditReviewModal from '../Modals/BatchEditReviewModal';


type ReportData = {
    id: string;
    status: string;
    vendor: string;
    vendorId?: string;
    department: string;
    departmentId?: string;
    date_created: string;
    review_requested: string;
    missing_data: string;
    review_completed: string;
    email_notifcation: string;
};


function TrackingInspections() {
    const [openGeneratedReport, setOpenGeneratedReport] = useState(false);
    const [selectedCount, setSelectedCount] = useState(0);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [loading, setLoading] = useState(true)
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    useEffect(() => { setSelectedCount(selectedRows.length); }, [selectedRows]);
    const [reports, setReports] = useState<ReportData[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const { isOpen: isFilterOpen, openModal: openFilterModal, closeModal: closeEFilterModal } = useModal();
    const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});
    const [vendors, setVendors] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [editingField, setEditingField] = useState<{ rowId: string; field: string } | null>(null);
    const [editingValues, setEditingValues] = useState<any>(null);
    const [inspectionData, setInspectionData] = useState<any[]>([]);
    const [filtersReady, setFiltersReady] = useState(false);
    const { isOpen: isEditModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
    const [formData, setFormData] = useState<{
        reviewCompletedAt?: string;
        missingData?: string;
    }>({});

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    const handleDropdownChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };



    const toLabel = (s: string) => (s === 'none' ? 'None' : s === 'incomplete image file' ? 'Incomplete Image File' : s === 'incomplete checklist' ? 'Incomplete Checklist' : s === 'incomplete dot form' ? 'Incomplete DOT Form' : s);
    const toEmailLabel = (s: string) => (s === 'yes' ? 'Yes' : s === 'no' ? 'No' : s === 'manually sent' ? 'Manually Sent' : s);
    const fromLabel = (s: string) => (s || '').toLowerCase();
    const getReviews = React.useCallback(async () => {
        const vendorId = Cookies.get('selectedVendorId') || '';
        const departmentId = Cookies.get('selectedDepartmentId') || '';

        try {
            setLoading(true);

            const payload = {
                page: 1,
                limit: 5,
                department: departmentId,
                vendorId,
                filters: selectedFilters,
            };

            console.log('📤 REQUEST PAYLOAD:', payload);

            const res = await apiRequest('/api/reviews/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (res.ok && json.success) {
                const mapped: ReportData[] = (json.reviews || []).map((doc: any) => ({
                    id: doc.unitId,
                    status: doc.inspectionId.inspectionStatus,
                    vendor: doc.vendorName || '',
                    vendorId: String(doc.vendorId || ''),
                    department: doc.departmentName || '',
                    departmentId: String(doc.departmentId || ''),
                    date_created: doc.inspectionId.dateDay
                        ? `${doc.inspectionId.dateYear}-${doc.inspectionId.dateMonth}-${doc.inspectionId.dateDay}`
                        : '',
                    review_requested: doc.reviewRequestedAt
                        ? new Date(doc.reviewRequestedAt).toISOString().slice(0, 10)
                        : '—',
                    missing_data: toLabel(doc.missingData),
                    review_completed: doc.reviewCompletedAt
                        ? new Date(doc.reviewCompletedAt).toISOString().slice(0, 10)
                        : 'Pending',
                    email_notifcation: toEmailLabel(doc.emailNotification),
                }));

                setReports(mapped);
                setTotalCount(json.total || mapped.length);

                setInspectionData(
                    mapped.map(r => ({
                        id: r.id,
                        status: r.status,
                        vendor: r.vendor,
                        department: r.department,
                        date_created: r.date_created,
                        review_requested: r.review_requested,
                        missing_data: r.missing_data,
                        review_completed: r.review_completed,
                        email_notifcation: r.email_notifcation,
                    }))
                );
            } else {
                toast.error(json.message || 'Failed to fetch reviews');
                setReports([]);
                setTotalCount(0);
                setInspectionData([]);
            }
        } catch (e: any) {
            toast.error(e.message || 'Server error');
            setReports([]);
            setTotalCount(0);
            setInspectionData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedFilters]);

    // fetch vendor & department lists for inline editing
    useEffect(() => {
        (async () => {
            try {
                const vRes = await apiRequest('/api/vendors/get-vendors');
                if (vRes.ok) {
                    const j = await vRes.json();
                    setVendors(j.vendors || []);
                }
                const dRes = await apiRequest('/api/departments/get-departments');
                if (dRes.ok) {
                    const jd = await dRes.json();
                    setDepartments(jd.departments || []);
                }
            } catch (e) {
                // ignore
            }
        })();
    }, []);
    useEffect(() => {
        if (!filtersReady) return;
        getReviews();

    }, [selectedFilters, filtersReady]);
    useEffect(() => {
        const storedFilters = sessionStorage.getItem('trackingFilters');
        if (storedFilters) {
            try {
                setSelectedFilters(JSON.parse(storedFilters));
            } catch (e) {
                console.error('Invalid stored filters', e);
            }
        }
        setFiltersReady(true);
    }, []);

    const onMissingChange = async (unitId: string, label: string, vendorId: string, departmentId: string) => {

        try {
            const res = await apiRequest('/api/reviews/update', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    unitId,
                    vendorId,
                    departmentId,
                    missingData: fromLabel(label),
                }),
            });

            const json = await res.json();

            if (res.ok && json.success) {
                setReports(prev =>
                    prev.map(r =>
                        r.id === unitId
                            ? { ...r, missing_data: label }
                            : r
                    )
                );
                toast.success('Inspection updated.');
            } else {
                toast.error(json.message || 'Failed to update');
            }
        } catch (e: any) {
            toast.error(e.message || 'Server error');
        }
    };

    const onEmailChange = async (unitId: string, label: string, vendorId: string, departmentId: string) => {

        try {
            const res = await apiRequest('/api/reviews/update', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    unitId,
                    vendorId,
                    departmentId,
                    emailNotification: fromLabel(label),
                }),
            });

            const json = await res.json();

            if (res.ok && json.success) {
                setReports(prev =>
                    prev.map(r =>
                        r.id === unitId
                            ? { ...r, email_notifcation: label }
                            : r
                    )
                );
                toast.success('Inspection updated.');
            } else {
                toast.error(json.message || 'Failed to update');
            }
        } catch (e: any) {
            toast.error(e.message || 'Server error');
        }
    };

    const startEditing = (row: ReportData, field: string) => {
        setEditingField({ rowId: row.id, field });
        setEditingValues({
            vendorId: row.vendorId || '',
            departmentId: row.departmentId || '',
            reviewRequested: row.review_requested === '—' ? '' : row.review_requested,
            reviewCompleted: row.review_completed === 'Pending' ? '' : row.review_completed,
        });
    };

    const cancelEditing = () => {
        setEditingField(null);
        setEditingValues(null);
    };

    const saveEditing = async () => {
        if (!editingField || !editingValues) return;
        const original = reports.find(r => r.id === editingField.rowId);

        // Check if department is being changed
        const isDepartmentChanged = editingField.field === 'department' &&
            editingValues.departmentId &&
            editingValues.departmentId !== original?.departmentId;

        setLoading(true);
        try {
            const payload: any = {
                unitId: editingField.rowId,
                vendorId: original?.vendorId || '',
                departmentId: original?.departmentId || ''
            };
            if (editingValues.vendorId) payload.newVendorId = editingValues.vendorId;
            if (editingValues.departmentId) payload.newDepartmentId = editingValues.departmentId;
            if (editingValues.reviewRequested !== undefined) payload.reviewRequestedAt = editingValues.reviewRequested || null;
            if (editingValues.reviewCompleted !== undefined) payload.reviewCompletedAt = editingValues.reviewCompleted || null;

            const res = await apiRequest('/api/reviews/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (res.ok && json.success) {
                if (isDepartmentChanged) {
                    // Remove the inspection from frontend if department changed
                    setReports(prev => prev.filter(r => r.id !== editingField.rowId));
                    setTotalCount(prev => prev - 1);
                    toast.success('Inspection moved to the new department.');
                } else {
                    // Update the inspection normally
                    setReports(prev => prev.map(r => r.id === editingField.rowId ? {
                        ...r,
                        vendor: vendors.find(v => v._id === editingValues.vendorId)?.name || r.vendor,
                        vendorId: editingValues.vendorId || r.vendorId,
                        department: departments.find(d => d._id === editingValues.departmentId)?.name || r.department,
                        departmentId: editingValues.departmentId || r.departmentId,
                        review_requested: editingValues.reviewRequested || '—',
                        review_completed: editingValues.reviewCompleted || 'Pending'
                    } : r));
                    toast.success('Inspection updated.');
                }
                cancelEditing();
            } else {
                toast.error(json.message || 'Failed to save');
            }
        } catch (e: any) {
            toast.error(e?.message || 'Server error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterClick = () => {
        openFilterModal();
    };

    const handleGenerateReport = () => {
        setOpenGeneratedReport(!openGeneratedReport);
    };

    const handleBatchEdit = () => {
        openEditModal()
    };

    const handleSendNotification = () => {
        setIsNotificationModalOpen(true);
    };

    const handleRemoveFromHistory = () => {
        console.log('Remove from history clicked');
    };
    const handleClearSelection = () => {
        setSelectedRows([]);
        setSelectedCount(0);
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRows([]);
        } else {
            setSelectedRows(reports.map((row) => row.id));
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

    const handleApplyFilters = (filters: { [key: string]: string[] }) => {
        setSelectedFilters(filters);
        sessionStorage.setItem('trackingFilters', JSON.stringify(filters));
        closeEFilterModal();
    };

    const handleRemoveFilter = (filterKey: string, valueId: string) => {
        setSelectedFilters(prev => {
            const updated = { ...prev };
            updated[filterKey] = updated[filterKey].filter(id => id !== valueId);
            if (updated[filterKey].length === 0) {
                delete updated[filterKey];
            }
            sessionStorage.setItem('trackingFilters', JSON.stringify(updated));
            return updated;
        });
    };
    const handleClearAllFilters = () => {
        setSelectedFilters({});
        sessionStorage.removeItem('trackingFilters');
    };

    const handleRefreshAfterUpdate = () => {
        setSelectedRows([]);
        setSelectAll(false);
        getReviews();
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
            header: "UNIT ID",
            accessor: "id",
            cell: (row) => <div className="font-medium text-[var(--secondary)]">{row.id}</div>,
        },
        {
            header: "INSPECTION STATUS",
            accessor: "status",
            cell: (row) => (
                <span
                    className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${row.status === "complete"
                        ? "bg-[#7522BB1A] text-[#7522BB]"
                        : row.status === "incomplete"
                            ? "bg-blue-100 text-blue-700"
                            : row.status === "needs review"
                                ? "bg-[#FB923C1A] text-[#FB923C]"
                                : row.status === "pass"
                                    ? "bg-[#16A34A1A] text-[#16A34A]"
                                    : row.status === "fail"
                                        ? "bg-red-100 text-red-700"
                                        : ""
                        }`}
                >
                    {row.status.toUpperCase()}
                </span>
            ),
        },
        {
            header: "VENDOR",
            accessor: "vendor",
            cell: (row) => (
                <div className="relative">
                    {editingField?.rowId === row.id && editingField?.field === 'vendor' ? (
                        <div className="flex items-center gap-2">
                            <ReportDropdown
                                options={vendors.map(v => ({ value: v._id, label: v.name }))}
                                width="200px"
                                value={editingValues?.vendorId || row.vendorId || ''}
                                onChange={(val) => setEditingValues((p: any) => ({ ...(p || {}), vendorId: val }))}
                            />
                            <button onClick={(e) => { e.stopPropagation(); saveEditing(); }} className="p-1"><Check className="w-4 h-4 text-green-600" /></button>
                            <button onClick={(e) => { e.stopPropagation(); cancelEditing(); }} className="p-1"><X className="w-4 h-4 text-red-500" /></button>
                        </div>
                    ) : (
                        <div className="group relative pr-6">
                            <div className="opacity-70">{row.vendor}</div>
                            <button onClick={(e) => { e.stopPropagation(); startEditing(row, 'vendor'); }} className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit3 className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: "DEPARTMENT",
            accessor: "department",
            cell: (row) => (
                <div>
                    {editingField?.rowId === row.id && editingField?.field === 'department' ? (
                        <div className="flex items-center gap-2">
                            <ReportDropdown
                                options={departments.map(d => ({ value: d._id, label: d.name }))}
                                width="200px"
                                value={editingValues?.departmentId || row.departmentId || ''}
                                onChange={(val) => setEditingValues((p: any) => ({ ...(p || {}), departmentId: val }))}
                            />
                            <button onClick={(e) => { e.stopPropagation(); saveEditing(); }} className="p-1"><Check className="w-4 h-4 text-green-600" /></button>
                            <button onClick={(e) => { e.stopPropagation(); cancelEditing(); }} className="p-1"><X className="w-4 h-4 text-red-500" /></button>
                        </div>
                    ) : (
                        <div className="group relative pr-6">
                            <div className="opacity-70">{row.department}</div>
                            <button onClick={(e) => { e.stopPropagation(); startEditing(row, 'department'); }} className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit3 className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: "DATE CREATED",
            accessor: "date_created",
            cell: (row) => <div className="opacity-70 whitespace-nowrap">{row.date_created}</div>,
        },
        {
            header: "REVIEW REQUESTED",
            accessor: "review_requested",
            cell: (row) => (
                <div className="relative">
                    {editingField?.rowId === row.id && editingField?.field === 'reviewRequested' ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={editingValues?.reviewRequested || (row.review_requested === '—' ? '' : row.review_requested) || ''}
                                onChange={(e) => setEditingValues((p: any) => ({ ...(p || {}), reviewRequested: e.target.value }))}
                                className="px-2 py-1 border rounded"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button onClick={(e) => { e.stopPropagation(); saveEditing(); }} className="p-1"><Check className="w-4 h-4 text-green-600" /></button>
                            <button onClick={(e) => { e.stopPropagation(); cancelEditing(); }} className="p-1"><X className="w-4 h-4 text-red-500" /></button>
                        </div>
                    ) : (
                        <div className="group relative pr-6">
                            <div className="opacity-70">{row.review_requested}</div>
                            <button onClick={(e) => { e.stopPropagation(); startEditing(row, 'reviewRequested'); }} className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit3 className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    )}
                </div>
            ),
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
                    onChange={(val) => onMissingChange(row.id, val, row.vendorId || "", row.departmentId || "")}
                />,
        },
        {
            header: "REVIEW COMPLETED",
            accessor: "review_completed",
            cell: (row) => (
                <div className="relative">
                    {editingField?.rowId === row.id && editingField?.field === 'reviewCompleted' ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={editingValues?.reviewCompleted || (row.review_completed === 'Pending' ? '' : row.review_completed) || ''}
                                onChange={(e) => setEditingValues((p: any) => ({ ...(p || {}), reviewCompleted: e.target.value }))}
                                className="px-2 py-1 border rounded"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button onClick={(e) => { e.stopPropagation(); saveEditing(); }} className="p-1"><Check className="w-4 h-4 text-green-600" /></button>
                            <button onClick={(e) => { e.stopPropagation(); cancelEditing(); }} className="p-1"><X className="w-4 h-4 text-red-500" /></button>
                        </div>
                    ) : (
                        <div className="group relative pr-6">
                            <div className="opacity-70">{row.review_completed}</div>
                            <button onClick={(e) => { e.stopPropagation(); startEditing(row, 'reviewCompleted'); }} className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit3 className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    )}
                </div>
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
                    onChange={(val) => onEmailChange(row.id, val, row.vendorId || "", row.departmentId || "")}
                />,
        },
    ];
    const filterCount = Object.values(selectedFilters).reduce((acc, arr) => acc + arr.length, 0);
    return (
        <Suspense fallback={<div>Loading...</div>}>
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
                    hasActiveFilters={Object.values(selectedFilters).some(arr => arr.length > 0)}
                    filterCount={filterCount}
                />
                {filterCount > 0 && (
                    <div className='flex items-center gap-2 px-4 flex-wrap mb-4'>
                        {Object.entries(selectedFilters).map(([filterKey, valueIds]) =>
                            valueIds.map(valueId => {
                                // You'll need to import or define your filter options for tracking
                                const filterOptionsMap: any = {
                                    status: [
                                        { id: 'complete', label: 'Complete' },
                                        { id: 'incomplete', label: 'Incomplete' },
                                        { id: 'needs review', label: 'Needs Review' },
                                        { id: 'pass', label: 'Pass' },
                                        { id: 'fail', label: 'Fail' }
                                    ],
                                    vendor: inspectionData.map(item => ({ id: item.vendor, label: item.vendor })).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
                                    department: inspectionData.map(item => ({ id: item.department, label: item.department })).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
                                    missing_data: [
                                        { id: 'None', label: 'None' },
                                        { id: 'Incomplete Image File', label: 'Incomplete Image File' },
                                        { id: 'Incomplete DOT Form', label: 'Incomplete DOT Form' },
                                        { id: 'Incomplete Checklist', label: 'Incomplete Checklist' }
                                    ],
                                    email_notifcation: [
                                        { id: 'Yes', label: 'Yes' },
                                        { id: 'No', label: 'No' },
                                        { id: 'Manually Sent', label: 'Manually Sent' }
                                    ]
                                };

                                const filterLabels: any = {
                                    status: 'Status',
                                    vendor: 'Vendor',
                                    department: 'Department',
                                    missing_data: 'Missing Data',
                                    email_notifcation: 'Email Notification',
                                    date_created: 'Date Created',
                                    review_requested: 'Review Requested',
                                    review_completed: 'Review Completed'
                                };

                                const filterLabel = filterLabels[filterKey] || filterKey;
                                const valueLabel = filterOptionsMap[filterKey]?.find((opt: any) => opt.id === valueId)?.label || valueId;

                                return (
                                    <div key={`${filterKey}-${valueId}`} className='flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg'>
                                        <span className='text-sm'>
                                            <span className='font-medium'>{filterLabel}</span> = "{valueLabel}"
                                        </span>
                                        <button onClick={() => handleRemoveFilter(filterKey, valueId)} className='hover:bg-blue-100 rounded p-0.5'>
                                            <X className='w-4 h-4 text-gray-600' />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                        <button onClick={handleClearAllFilters} className='text-blue-600 hover:text-blue-700 text-sm font-medium'>
                            Clear all
                        </button>
                    </div>
                )}
                <div className="px-4">
                    <div className="h-full">
                        <GenericDataTable title="" data={reports} tabs={[1]} columns={columns} pageSize={5} currentPage={1} totalCount={totalCount} loading={loading} setLoading={setLoading} querykey="user_page" emptyStateImages={{
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
            <FilterTrackingModal
                isOpen={isFilterOpen}
                onClose={closeEFilterModal}
                onApply={handleApplyFilters}
                initialFilters={selectedFilters}
                trackingData={inspectionData}
            />
            <BatchEditReviewModal
                isOpen={isEditModalOpen}
                onClose={closeEditModal}
                formData={formData}
                setFormData={setFormData}
                onChange={handleChange}
                onDropdownChange={handleDropdownChange}
                selectedUnitIds={selectedRows}
                selectedUnitsData={reports.filter(r => selectedRows.includes(r.id))} // Pass full data
                onUpdated={handleRefreshAfterUpdate}
            />

        </Suspense>
    )
}

export default TrackingInspections
