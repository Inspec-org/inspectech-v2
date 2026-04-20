'use client'
import { Edit3, FileText, Filter, Mail, Trash2, X, Check } from 'lucide-react';
import React, { Suspense, useContext, useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
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
import { UserContext } from '@/context/authContext';
import Swal from 'sweetalert2';


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
    const { user } = useContext(UserContext);
    const [openGeneratedReport, setOpenGeneratedReport] = useState(false);
    const [selectedCount, setSelectedCount] = useState(0);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [selectedFullData, setSelectedFullData] = useState<any[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [isAllAcrossPagesSelected, setIsAllAcrossPagesSelected] = useState(false);
    const [loading, setLoading] = useState(true)
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    useEffect(() => { setSelectedCount(selectedRows.length); }, [selectedRows]);
    const [reports, setReports] = useState<ReportData[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const { isOpen: isFilterOpen, openModal: openFilterModal, closeModal: closeEFilterModal } = useModal();
    const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const currentPage = parseInt(searchParams.get('tracking_page') || '1', 10);
    const [pageSize, setPageSize] = useState<number>(10);
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        params.set('tracking_page', '1');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }, [pageSize]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [fullOptions, setFullOptions] = useState<{ [key: string]: string[] }>({});
    const [editingField, setEditingField] = useState<{ rowId: string; field: string } | null>(null);
    const [editingValues, setEditingValues] = useState<any>(null);
    const [inspectionData, setInspectionData] = useState<any[]>([]);
    const [filtersReady, setFiltersReady] = useState(false);
    const [vendorId, setVendorId] = useState<string>('');
    const [departmentId, setDepartmentId] = useState<string>('');
    const lastFetchKeyRef = React.useRef<string | null>(null);
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
    const getReviews = React.useCallback(async (force = false) => {
        if (!vendorId || !departmentId) {
            setReports([]);
            setTotalCount(0);
            setInspectionData([]);
            return;
        }

        const key = JSON.stringify({
            vendorId,
            departmentId,
            page: currentPage,
            limit: pageSize,
            filters: selectedFilters,
        });

        if (!force && lastFetchKeyRef.current === key) return;
        lastFetchKeyRef.current = key;

        try {
            setLoading(true);

            const payload = {
                page: currentPage,
                limit: pageSize,
                department: departmentId,
                vendorId,
                filters: selectedFilters,
            };

            ;

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
                        ? `${String(doc.inspectionId.dateMonth).padStart(2, '0')}/${String(doc.inspectionId.dateDay).padStart(2, '0')}/${doc.inspectionId.dateYear}`
                        : '',
                    review_requested: doc.reviewRequestedAt
                        ? (() => { const d = new Date(doc.reviewRequestedAt); return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`; })()
                        : '—',
                    missing_data: toLabel(doc.missingData),
                    review_completed: doc.reviewCompletedAt
                        ? (() => { const d = new Date(doc.reviewCompletedAt); return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`; })()
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
    }, [selectedFilters, currentPage, pageSize, vendorId, departmentId]);

    // fetch vendor & department lists for inline editing and initial vendor/department
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
                const initialVendorId = Cookies.get('selectedVendorId') || '';
                const initialDepartmentId = Cookies.get('selectedDepartmentId') || '';
                setVendorId(initialVendorId);
                setDepartmentId(initialDepartmentId);
                if (initialVendorId && initialDepartmentId) {
                    const oRes = await apiRequest('/api/reviews/get', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ page: 1, limit: 1, vendorId: initialVendorId, department: initialDepartmentId, optionsOnly: true })
                    });
                    if (oRes.ok) {
                        const jo = await oRes.json();
                        setFullOptions(jo.options || {});
                    }
                }
            } catch (e) {
                // ignore
            }
        })();
    }, []);

    useEffect(() => {
        if (!filtersReady) return;
        if (!vendorId || !departmentId) return;
        getReviews();

    }, [selectedFilters, filtersReady, currentPage, pageSize, vendorId, departmentId, getReviews]);

    useEffect(() => {
        const onDept = () => {
            const params = new URLSearchParams(searchParams);
            params.set('tracking_page', '1');
            window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
            const depId = Cookies.get('selectedDepartmentId') || '';
            setDepartmentId(depId);
            (async () => {
                try {
                    const vId = Cookies.get('selectedVendorId') || '';
                    if (!vId || !depId) return;
                    const oRes = await apiRequest('/api/reviews/get', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ page: 1, limit: 1, vendorId: vId, department: depId, optionsOnly: true })
                    });
                    if (oRes.ok) {
                        const jo = await oRes.json();
                        setFullOptions(jo.options || {});
                    }
                } catch (e) { }
            })();
        };
        const onVendor = () => {
            const params = new URLSearchParams(searchParams);
            params.set('tracking_page', '1');
            window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
            const vId = Cookies.get('selectedVendorId') || '';
            setVendorId(vId);
            (async () => {
                try {
                    const depId = Cookies.get('selectedDepartmentId') || '';
                    if (!vId || !depId) return;
                    const oRes = await apiRequest('/api/reviews/get', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ page: 1, limit: 1, vendorId: vId, department: depId, optionsOnly: true })
                    });
                    if (oRes.ok) {
                        const jo = await oRes.json();
                        setFullOptions(jo.options || {});
                    }
                } catch (e) { }
            })();
        };
        window.addEventListener('selectedDepartmentChanged', onDept as EventListener);
        window.addEventListener('selectedVendorChanged', onVendor as EventListener);
        return () => {
            window.removeEventListener('selectedDepartmentChanged', onDept as EventListener);
            window.removeEventListener('selectedVendorChanged', onVendor as EventListener);
        };
    }, [getReviews, searchParams]);
    useEffect(() => {
        const storedFilters = sessionStorage.getItem('trackingFilters');
        if (storedFilters) {
            try {
                setSelectedFilters(JSON.parse(storedFilters));
            } catch (e) {
                ;
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
                const d = new Date();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const yyyy = d.getFullYear();
                const display = `${mm}/${dd}/${yyyy}`;
                setReports(prev =>
                    prev.map(r =>
                        r.id === unitId
                            ? {
                                ...r,
                                email_notifcation: label,
                                review_completed:
                                    label === 'No' ? 'Pending' :
                                        label === 'Manually Sent' ? display :
                                            r.review_completed,
                            }
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
                        review_requested: editingValues.reviewRequested
                            ? (editingValues.reviewRequested.includes('/')
                                ? editingValues.reviewRequested
                                : (() => { const [y, m, d] = editingValues.reviewRequested.split('-'); return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`; })())
                            : '—',
                        review_completed: editingValues.reviewCompleted
                            ? (editingValues.reviewCompleted.includes('/')
                                ? editingValues.reviewCompleted
                                : (() => { const [y, m, d] = editingValues.reviewCompleted.split('-'); return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`; })())
                            : 'Pending'
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
        // if (selectedRows.length === 0) {
        //     toast.warning('Please select at least one inspection to send notification');
        //     return;
        // }
        setIsNotificationModalOpen(true);
    };

    const handleRemoveFromHistory = async () => {
        if (selectedRows.length === 0) {
            toast.warning('Please select at least one item to remove');
            return;
        }

        const vId = vendorId || Cookies.get('selectedVendorId') || '';
        const dId = departmentId || Cookies.get('selectedDepartmentId') || '';

        if (!vId || !dId) {
            toast.error('Please select vendor and department first');
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to remove ${selectedRows.length} items from the review history. This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, remove them',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                const res = await apiRequest('/api/admin-review/remove', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        unitIds: selectedRows,
                        vendorId: vId,
                        departmentId: dId,
                    }),
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    toast.success(data.message || 'Successfully removed from review history');
                    handleClearSelection();
                    getReviews(true);
                } else {
                    toast.error(data.message || 'Failed to remove from review history');
                }
            } catch (e: any) {
                toast.error(e.message || 'Server error');
            }
        }
    };
    const handleClearSelection = () => {
        setSelectedRows([]);
        setSelectedFullData([]);
        setSelectedCount(0);
        setIsAllAcrossPagesSelected(false);
        setSelectAll(false);
    };

    const handleSelectAll = async () => {
        if (selectAll) {
            setSelectedRows([]);
            setSelectedFullData([]);
            setIsAllAcrossPagesSelected(false);
            setSelectAll(false);
            return;
        }

        try {
            const vId = vendorId || Cookies.get('selectedVendorId') || '';
            const dId = departmentId || Cookies.get('selectedDepartmentId') || '';

            if (!vId || !dId) {
                toast.error('Please select vendor and department first');
                return;
            }

            const res = await apiRequest('/api/reviews/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fetchAllIds: true,
                    department: dId,
                    vendorId: vId,
                    filters: selectedFilters,
                }),
            });

            const json = await res.json();
            if (res.ok && json.success) {
                const allData = json.allReviews || [];
                setSelectedRows(allData.map((r: any) => r.id));
                setSelectedFullData(allData);
                setIsAllAcrossPagesSelected(true);
                setSelectAll(true);
            } else {
                toast.error(json.message || 'Failed to select all');
            }
        } catch (e: any) {
            toast.error(e.message || 'Server error');
        }
    };

    const handleSelectRow = (id: string) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
            setSelectedFullData(selectedFullData.filter((r) => r.id !== id));
            setIsAllAcrossPagesSelected(false);
        } else {
            const row = reports.find(r => r.id === id);
            setSelectedRows([...selectedRows, id]);
            if (row) {
                setSelectedFullData([...selectedFullData, {
                    id: row.id,
                    vendorId: row.vendorId,
                    departmentId: row.departmentId
                }]);
            }
        }
    };


    const handleApplyFilters = (filters: { [key: string]: string[] }) => {
        const params = new URLSearchParams(searchParams);
        params.set('tracking_page', '1');
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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
        setSelectedFullData([]);
        setSelectAll(false);
        setIsAllAcrossPagesSelected(false);
        getReviews(true);
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
                    {/* {editingField?.rowId === row.id && editingField?.field === 'vendor' ? (
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
                    )} */}
                    <div className="group relative pr-6">
                        <div className="opacity-70">{row.vendor}</div>
                        {/* <button onClick={(e) => { e.stopPropagation(); startEditing(row, 'vendor'); }} className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit3 className="w-4 h-4 text-gray-400" />
                        </button> */}
                    </div>
                </div>
            ),
        },
        {
            header: "DEPARTMENT",
            accessor: "department",
            cell: (row) => (
                <div>
                    {/* {editingField?.rowId === row.id && editingField?.field === 'department' ? (
                        <div className="flex items-center gap-2">
                            <ReportDropdown
                                options={vendors.map(v => ({ value: v._id, label: v.name }))}
                                width="200px"
                                value={editingValues?.vendorId || row.vendorId || ''}
                                onChange={(val) => setEditingValues((p: any) => ({ ...(p || {}), vendorId: val }))}
                            />
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
                    )} */}
                    <div className="group relative pr-6">
                        <div className="opacity-70">{row.department}</div>
                        {/* <button onClick={(e) => { e.stopPropagation(); startEditing(row, 'department'); }} className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit3 className="w-4 h-4 text-gray-400" />
                        </button> */}
                    </div>
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
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                                const t = new Date();
                                const CY = t.getFullYear();
                                const CM = t.getMonth() + 1;
                                const CD = t.getDate();
                                const cur = editingValues?.reviewRequested ?? (row.review_requested === '—' ? '' : row.review_requested) ?? '';
                                const [yy, mm, dd] = (() => {
                                    if (!cur) return [CY, CM, CD];
                                    if (cur.includes('/')) {
                                        const [m, d, y] = cur.split('/');
                                        return [parseInt(y, 10), parseInt(m, 10), parseInt(d, 10)];
                                    }
                                    const [y, m, d] = cur.split('-');
                                    return [parseInt(y, 10), parseInt(m, 10), parseInt(d, 10)];
                                })();
                                return (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={1}
                                            max={12}
                                            value={mm}
                                            onChange={(e) => {
                                                const raw = Number(e.target.value);
                                                const m = Math.min(12, Math.max(1, raw));
                                                const cm = yy === CY ? Math.min(m, CM) : m;
                                                const maxDay = yy === CY && cm === CM ? CD : new Date(yy, cm, 0).getDate();
                                                const nd = Math.min(dd, maxDay);
                                                const s = `${String(yy)}-${String(cm).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
                                                setEditingValues((p: any) => ({ ...(p || {}), reviewRequested: s }));
                                            }}
                                            className="w-16 px-3 py-1 bg-[#FAF7FF] border border-gray-300 rounded text-center"
                                        />
                                        <span className="text-gray-400">/</span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={31}
                                            value={dd}
                                            onChange={(e) => {
                                                const raw = Number(e.target.value);
                                                const maxDay = yy === CY && mm === CM ? CD : new Date(yy, mm, 0).getDate();
                                                const d = Math.min(maxDay, Math.max(1, raw));
                                                const s = `${String(yy)}-${String(mm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                setEditingValues((p: any) => ({ ...(p || {}), reviewRequested: s }));
                                            }}
                                            className="w-16 px-3 py-1 bg-[#FAF7FF] border border-gray-300 rounded text-center"
                                        />
                                        <span className="text-gray-400">/</span>
                                        <input
                                            type="number"
                                            min={2000}
                                            max={CY}
                                            value={yy}
                                            onChange={(e) => {
                                                const raw = Number(e.target.value);
                                                const y = Math.min(CY, Math.max(2000, raw));
                                                const cm = y === CY ? Math.min(mm, CM) : mm;
                                                const maxDay = y === CY && cm === CM ? CD : new Date(y, cm, 0).getDate();
                                                const nd = Math.min(dd, maxDay);
                                                const s = `${String(y)}-${String(cm).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
                                                setEditingValues((p: any) => ({ ...(p || {}), reviewRequested: s }));
                                            }}
                                            className="w-20 px-3 py-1 bg-[#FAF7FF] border border-gray-300 rounded text-center"
                                        />
                                    </div>
                                );
                            })()}
                            <button onClick={(e) => { e.stopPropagation(); saveEditing(); }} className="p-1"><Check className="w-4 h-4 text-green-600" /></button>
                            <button onClick={(e) => { e.stopPropagation(); cancelEditing(); }} className="p-1"><X className="w-4 h-4 text-red-500" /></button>
                        </div>
                    ) : (
                        <div className="group relative pr-6">
                            <div className="opacity-70 whitespace-nowrap">{row.review_requested}</div>
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
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                                const t = new Date();
                                const CY = t.getFullYear();
                                const CM = t.getMonth() + 1;
                                const CD = t.getDate();
                                const cur = editingValues?.reviewCompleted ?? (row.review_completed === 'Pending' ? '' : row.review_completed) ?? '';
                                const [yy, mm, dd] = (() => {
                                    if (!cur) return [CY, CM, CD];
                                    if (cur.includes('/')) {
                                        const [m, d, y] = cur.split('/');
                                        return [parseInt(y, 10), parseInt(m, 10), parseInt(d, 10)];
                                    }
                                    const [y, m, d] = cur.split('-');
                                    return [parseInt(y, 10), parseInt(m, 10), parseInt(d, 10)];
                                })();
                                return (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={1}
                                            max={12}
                                            value={mm}
                                            onChange={(e) => {
                                                const raw = Number(e.target.value);
                                                const m = Math.min(12, Math.max(1, raw));
                                                const cm = yy === CY ? Math.min(m, CM) : m;
                                                const maxDay = yy === CY && cm === CM ? CD : new Date(yy, cm, 0).getDate();
                                                const nd = Math.min(dd, maxDay);
                                                const s = `${String(yy)}-${String(cm).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
                                                setEditingValues((p: any) => ({ ...(p || {}), reviewCompleted: s }));
                                            }}
                                            className="w-16 px-3 py-1 bg-[#FAF7FF] border border-gray-300 rounded text-center"
                                        />
                                        <span className="text-gray-400">/</span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={31}
                                            value={dd}
                                            onChange={(e) => {
                                                const raw = Number(e.target.value);
                                                const maxDay = yy === CY && mm === CM ? CD : new Date(yy, mm, 0).getDate();
                                                const d = Math.min(maxDay, Math.max(1, raw));
                                                const s = `${String(yy)}-${String(mm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                setEditingValues((p: any) => ({ ...(p || {}), reviewCompleted: s }));
                                            }}
                                            className="w-16 px-3 py-1 bg-[#FAF7FF] border border-gray-300 rounded text-center"
                                        />
                                        <span className="text-gray-400">/</span>
                                        <input
                                            type="number"
                                            min={2000}
                                            max={CY}
                                            value={yy}
                                            onChange={(e) => {
                                                const raw = Number(e.target.value);
                                                const y = Math.min(CY, Math.max(2000, raw));
                                                const cm = y === CY ? Math.min(mm, CM) : mm;
                                                const maxDay = y === CY && cm === CM ? CD : new Date(y, cm, 0).getDate();
                                                const nd = Math.min(dd, maxDay);
                                                const s = `${String(y)}-${String(cm).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
                                                setEditingValues((p: any) => ({ ...(p || {}), reviewCompleted: s }));
                                            }}
                                            className="w-20 px-3 py-1 bg-[#FAF7FF] border border-gray-300 rounded text-center"
                                        />
                                    </div>
                                );
                            })()}
                            <button onClick={(e) => { e.stopPropagation(); saveEditing(); }} className="p-1"><Check className="w-4 h-4 text-green-600" /></button>
                            <button onClick={(e) => { e.stopPropagation(); cancelEditing(); }} className="p-1"><X className="w-4 h-4 text-red-500" /></button>
                        </div>
                    ) : (
                        <div className="group relative pr-6">
                            <div className="opacity-70 whitespace-nowrap">{row.review_completed}</div>
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
            <div className='bg-white pb-5'>
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
                    userRole={user?.role}
                />
                {filterCount > 0 && (
                    <div className='flex items-center gap-2 px-4 flex-wrap mb-4'>
                        {Object.entries(selectedFilters).map(([filterKey, valueIds]) =>
                            (['dateCreated', 'reviewRequested', 'reviewCompleted'].includes(filterKey))
                                ? valueIds.map((valueId, idx) => {
                                    let formatted = valueId;
                                    try {
                                        const d = new Date(valueId);
                                        formatted = d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
                                    } catch { }
                                    const kindMap: any = { dateCreated: 'Date Created', reviewRequested: 'Review Requested', reviewCompleted: 'Review Completed' };
                                    const labelText = `${idx === 0 ? 'From' : 'To'} ${kindMap[filterKey]}`;
                                    return (
                                        <div key={`${filterKey}-${valueId}-${idx}`} className='flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg'>
                                            <span className='text-sm'>
                                                <span className='font-medium'>{labelText}</span> = "{formatted}"
                                            </span>
                                            <button onClick={() => handleRemoveFilter(filterKey, valueId)} className='hover:bg-blue-100 rounded p-0.5'>
                                                <X className='w-4 h-4 text-gray-600' />
                                            </button>
                                        </div>
                                    );
                                })
                                : valueIds.map(valueId => {
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
                        <GenericDataTable title="" data={reports} tabs={Array.from({ length: Math.max(1, Math.ceil(totalCount / pageSize)) }, (_, i) => i + 1)} columns={columns} pageSize={pageSize} currentPage={currentPage} totalCount={totalCount} loading={loading} setLoading={setLoading} setPageSize={setPageSize} querykey="tracking_page" emptyStateImages={{
                            "All Users": "/images/No Users.svg"
                        }}
                        />
                    </div>
                </div>
                {openGeneratedReport && (
                    <GeneratedReport
                        selectedUnitIds={selectedRows}
                        close={() => setOpenGeneratedReport(false)}
                    />
                )}
            </div>
            <AdminNotificationModal
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
                selectedUnitIds={selectedRows}
                allInspections={selectedFullData}
                onUpdated={handleRefreshAfterUpdate}
            />
            <FilterTrackingModal
                isOpen={isFilterOpen}
                onClose={closeEFilterModal}
                onApply={handleApplyFilters}
                initialFilters={selectedFilters}
                trackingData={inspectionData}
                vendors={vendors}
                departments={departments}
                fullOptions={fullOptions}
            />
            <BatchEditReviewModal
                isOpen={isEditModalOpen}
                onClose={closeEditModal}
                formData={formData}
                setFormData={setFormData}
                onChange={handleChange}
                onDropdownChange={handleDropdownChange}
                selectedUnitIds={selectedRows}
                selectedUnitsData={selectedFullData} // Pass full data
                onUpdated={handleRefreshAfterUpdate}
            />

        </Suspense>
    )
}

export default TrackingInspections
