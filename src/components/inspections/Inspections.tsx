'use client'
import { ArrowRight, Briefcase, Cross, Download, Edit, Edit3, Filter, Plus, X, CheckSquare } from 'lucide-react'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx';
import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { UserContext } from '@/context/authContext';
import { FaSuitcase } from 'react-icons/fa';
import Cookies from 'js-cookie';

import { useModal } from '@/hooks/useModal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import CheckList from './CheckLIst';
import FilterInspectionsModal, { dateOptions, deliveredOptions, durationOptions, filterOptions, inspectionStatusOptions, inspectorOptions, locationOptions, typeOptions, unitIdOptions, vendorOptions } from '../Modals/FilterInspectionsModal';
import ReassignDepartmentModal from '../Modals/ReasssignDepartmentModal';
import BatchEditInspectionsModal from '../Modals/BatchEditInspectionsModal';
import ExportInspectionsModal from '../Modals/ExportInspectionsModal';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';

export type InspectionData = {
    id: string;
    status: string;
    type: string;
    inspector: string;
    vendor: string;
    location: string;
    duration: string;
    date: string;
    delivered: string;
};

function Inspections() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [inspections, setInspections] = useState<InspectionData[]>([]);
    const [filters, setFilters] = useState<InspectionData[]>([]);
    const [totalInspections, setTotalInspections] = useState(0);
    const currentPage = parseInt(searchParams.get("inspection_page") || "1", 10);
    const [loading, setLoading] = useState(true)
    const { user } = useContext(UserContext);
    const [department, setDepartment] = useState("");
    const [search, setSearch] = useState("");
    const [limit, setLimit] = useState(10);
    const isResettingInspectionPage = useRef(false);
    const prevLimitRef = useRef(limit);
    const pageTabs = useMemo(() => {
        const totalPages = Math.ceil(totalInspections / limit);
        return Array.from({ length: totalPages }, (_, i) => (i + 1));
    }, [totalInspections, limit]);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const { isOpen, openModal, closeModal } = useModal();
    const { isOpen: isEditModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
    const { isOpen: isExportOpen, openModal: openExportModal, closeModal: closeExportModal } = useModal();
    const { isOpen: isFilterOpen, openModal: openFilterModal, closeModal: closeEFilterModal } = useModal();
    const [selectedExportType, setSelectedExportType] = useState('csv');
    const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});
    const statusParam = searchParams.get("status");
    const [formData, setFormData] = useState({
        status: 'Leave unchanged',
        type: '',
        inspector: '',
        vendor: '',
        location: '',
        date: '',
        duration: '',
        durationMin: "5",
        durationSec: "00",
        dateDay: "01",
        dateMonth: "01",
        dateYear: "2025",
        notes: '',
        delivered_status: '',
        poNumber: '',
        equipmentNumber: '',
        vin: '',
        licensePlateId: '',
        licensePlateCountry: '',
        licensePlateExpiration: '',
        licensePlateState: '',
        possessionOrigin: '',
        manufacturer: '',
        modelYear: '',
        absSensor: '',
        airTankMonitor: '',
        atisregulator: '',
        lightOutSensor: '',
        sensorError: '',
        ultrasonicCargoSensor: '',
        length: '',
        height: '',
        grossAxleWeightRating: '',
        axleType: '',
        brakeType: '',
        suspensionType: '',
        tireModel: '',
        aerokits: '',
        doorBranding: '',
        doorColor: '',
        doorSensor: '',
        doorType: '',
        lashSystem: '',
        mudFlapType: '',
        panelBranding: '',
        noseBranding: '',
        skirted: '',
        skirtColor: '',
        captiveBeam: '',
        cargoCameras: '',
        cartbars: '',
        tpms: '',
        trailerHeightDecal: '',
    });
    // Count total selected filters
    const totalFiltersCount = Object.entries(selectedFilters).reduce((sum, [key, arr]) => sum + (key === 'date' ? (arr.length > 0 ? 1 : 0) : arr.length), 0);
    const [dept, setDept] = useState<string | null>(null);
    const [vendor, setVendor] = useState<string | null>(null);
    const [deptName, setDeptName] = useState<string | null>(null);

    useEffect(() => {
        if (prevLimitRef.current !== limit) {
            if (currentPage !== 1) {
                isResettingInspectionPage.current = true;
                const params = new URLSearchParams(searchParams);
                params.set('inspection_page', "1");
                window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
            }
            prevLimitRef.current = limit;
        }
    }, [limit, currentPage, searchParams])

    useEffect(() => {
        const readFromCookies = () => {
            const storedDeptId = Cookies.get('selectedDepartmentId') || '';
            const storedDeptName = Cookies.get('selectedDepartment') || '';
            setDept(storedDeptId);
            setDepartment(storedDeptId || '');
            setDeptName(storedDeptName || '');
            const storedVendor = Cookies.get('selectedVendorId') || '';
            setVendor(storedVendor);
        };
        readFromCookies();
        const onDept = () => {
            const id = Cookies.get('selectedDepartmentId') || '';
            const name = Cookies.get('selectedDepartment') || '';
            setDept(id);
            setDepartment(id || '');
            setDeptName(name || '');
            setSelectedRows([]);
            setSelectAll(false);
        };
        const onVendor = () => {
            const id = Cookies.get('selectedVendorId') || '';
            setVendor(id);
            setSelectedRows([]);
            setSelectAll(false);
        };
        window.addEventListener('selectedDepartmentChanged', onDept as EventListener);
        window.addEventListener('selectedVendorChanged', onVendor as EventListener);
        return () => {
            window.removeEventListener('selectedDepartmentChanged', onDept as EventListener);
            window.removeEventListener('selectedVendorChanged', onVendor as EventListener);
        };
    }, []);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    const handleDropdownChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const buildServerFilter = (filters: { [key: string]: string[] }): any => {
        const f: any = {};
        if (filters.unitId?.length) f.unitIds = filters.unitId;
        if (filters.inspectionStatus?.length) f.inspectionStatuses = filters.inspectionStatus.map(s => s.toLowerCase());
        if (filters.type?.length) f.types = filters.type;
        if (filters.inspector?.length) f.inspectors = filters.inspector;
        if (filters.vendor?.length) f.vendors = filters.vendor;
        if (filters.location?.length) f.locations = filters.location;
        if (filters.delivered?.length) f.deliveredStatuses = filters.delivered.map(d => d.toLowerCase());
        if (filters.duration?.length) f.duration = filters.duration;
        if ((filters.date || []).length >= 2) {
            const [s, e] = filters.date;
            const sm = String(s).slice(0, 7);
            const em = String(e).slice(0, 7);
            f.dateMonthRange = [sm, em];
            f.dateRange = [String(s), String(e)];
        }
        return f;
    };

    const handleSelectAll = async () => {
        if (selectAll) {
            setSelectedRows([]);
            setSelectAll(false);
            return;
        }
        if (!dept || !vendor) {
            toast.error('Please select department and vendor first');
            return;
        }
        try {
            const res = await apiRequest(`/api/inspections/get-inspections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idsOnly: true, filter: buildServerFilter(selectedFilters), vendorId: vendor, department: dept }),
            });
            const json = await res.json();
            if (res.ok && json.success) {
                const allIds: string[] = (json.allUnitIds || []).map((id: string) => id);
                setSelectedRows(allIds);
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
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };
    const handleRefreshAfterUpdate = () => {
        setSelectedRows([]);
        setSelectAll(false);
        getInspections();
    };
    const handleDeleteSelected = async () => {
        if (!dept || !vendor) {
            toast.error('Please select department and vendor first');
            return;
        }
        if (selectedRows.length === 0) return;
        const ok = typeof window !== 'undefined' ? window.confirm(`Delete ${selectedRows.length} inspection(s)? This cannot be undone.`) : true;
        if (!ok) return;
        try {
            setLoading(true);
            const res = await apiRequest(`/api/inspections/delete-inspections`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unitIds: selectedRows, vendorId: vendor, departmentId: dept }),
            });
            const json = await res.json();
            if (res.ok && json.success) {
                toast.success(`Deleted ${json.deleted?.inspections ?? selectedRows.length} inspection(s)`);
                setSelectedRows([]);
                setSelectAll(false);
                getInspections();
            } else {
                toast.error(json.message || 'Failed to delete');
            }
        } catch (e: any) {
            toast.error(e?.message || 'Server error');
        } finally {
            setLoading(false);
        }
    };
    const handleExportInspections = async (format: string) => {
        try {
            if (!dept || !vendor) {
                toast.error('Please select department and vendor first');
                return;
            }
            const payload: any = {
                all: true,
                page: 1,
                limit: totalInspections || 1000,
                department: dept,
                vendorId: vendor,
                filter: selectedRows.length > 0 ? { unitIds: selectedRows } : buildServerFilter(selectedFilters),
            };
            const res = await apiRequest(`/api/inspections/get-inspections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.message || 'Failed to fetch export data');
            }
            const items: any[] = json.inspections || [];
            const normalize = (val: unknown): string => {
                if (val instanceof Date) return new Date(val).toISOString();
                if (val === null || val === undefined) return '';
                if (Array.isArray(val)) return JSON.stringify(val);
                if (typeof val === 'object') return JSON.stringify(val);
                return String(val);
            };

            // apply required transformations before flattening
            const transform = (doc: any): any => {
                const result: any = {};
                const imageKeys = [
                    'frontLeftSideUrl',
                    'frontRightSideUrl',
                    'rearLeftSideUrl',
                    'rearRightSideUrl',
                    'doorDetailsImageUrl',
                    'insideTrailerImageUrl',
                    'dotFormImageUrl',
                    'dotFormPdfUrl',
                    'additionalAttachment1',
                    'additionalAttachment2',
                    'additionalAttachment3'
                ];
                const images: Record<string, any> = {};
                let vendorSetFromVendorId = false;
                for (const [key, value] of Object.entries(doc)) {
                    if (key === '_id' || key === '__v' || key === 'updatedAt' || key === 'createdAt') {
                        continue;
                    }
                    if (key === 'dotFormPdfFileName') {
                        continue;
                    }
                    if (imageKeys.includes(key)) {
                        images[key] = value as any;
                        continue;
                    }
                    if (key === 'departmentId') {
                        const name = (deptName || '') || (typeof value === 'object' ? (value as any)?.name || '' : '');
                        result['department'] = name;
                        continue;
                    }
                    if (key === 'vendorId') {
                        const name = typeof value === 'object' ? (value as any)?.name || '' : '';
                        if (name) {
                            result['vendor'] = name;
                            vendorSetFromVendorId = true;
                        }
                        continue;
                    }
                    if (key === 'vendor') {
                        if (!vendorSetFromVendorId) {
                            result['vendor'] = value as any;
                        }
                        continue;
                    }
                    if (key === 'durationMin') {
                        const sec = (doc as any)?.durationSec ?? '';
                        result['duration'] = `${value ?? ''} m ${sec} s`;
                        continue;
                    }
                    if (key === 'durationSec') {
                        continue;
                    }
                    if (key === 'dateDay') {
                        const month = (doc as any)?.dateMonth ?? '';
                        const year = (doc as any)?.dateYear ?? '';
                        result['date'] = `${value ?? ''}-${month}-${year}`;
                        continue;
                    }
                    if (key === 'dateMonth' || key === 'dateYear') {
                        continue;
                    }
                    if (key === 'atisregulator') {
                        result['atisRegulator'] = value as any;
                        continue;
                    }
                    if (key === "possessionOrigin") {
                        result['possessionOriginLocation'] = value as any;
                        continue;
                    }
                    if (key === 'aerokits') {
                        result['aerokits'] = value as any;
                        continue;
                    }
                    result[key] = value as any;
                }
                imageKeys.forEach((k) => {
                    if (images[k] !== undefined && images[k] !== null) {
                        result[k] = images[k];
                    }
                });
                return result;
            };

            const flatten = (obj: any, prefix = ''): Record<string, string> => {
                const out: Record<string, string> = {};
                Object.entries(obj).forEach(([key, value]) => {
                    const k = prefix ? `${prefix}.${key}` : key;
                    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                        Object.assign(out, flatten(value, k));
                    } else {
                        out[k] = normalize(value);
                    }
                });
                return out;
            };

            const transformed: any[] = items.map(transform);
            const flatRows: Record<string, string>[] = transformed.map((doc: any) => flatten(doc));
            const allHeaders: string[] = Array.from(new Set(flatRows.flatMap((r) => Object.keys(r))));

            const imageHeaders = ['frontLeftSideUrl', 'frontRightSideUrl', 'rearLeftSideUrl', 'rearRightSideUrl', 'doorDetailsImageUrl', 'insideTrailerImageUrl', 'dotFormImageUrl', 'dotFormPdfUrl', 'additionalAttachment1', 'additionalAttachment2', 'additionalAttachment3'];
            const isCanada = (deptName || '').toLowerCase() === 'canada trailers';

            const generalOrder = [
                'unitId',
                'department',
                'inspectionStatus',
                'reviewReason',
                'type',
                'inspector',
                'vendor',
                'location',
                'delivered',
                'duration',
                'date',
                'notes'
            ];

            let checklistOrder = [
                // Identification & Registration
                'poNumber',
                'owner',
                'equipmentNumber',
                'vin',
                'licensePlateId',
                'licensePlateCountry',
                'licensePlateExpiration',
                'licensePlateState',
                'possessionOriginLocation',
                'manufacturer',
                'modelYear',
                // Sensors & Electrical
                'absSensor',
                'airTankMonitor',
                'atisRegulator',
                'lightOutSensor',
                'sensorError',
                'ultrasonicCargoSensor',
                // Physical Dimensions & Components
                'length',
                'height',
                'grossAxleWeightRating',
                'axleType',
                'brakeType',
                'suspensionType',
                'tireModel',
                'tireBrand',
                // Features & Appearance
                'aerokits',
                'doorBranding',
                'doorColor',
                'doorSensor',
                'doorType',
                'lashSystem',
                'mudFlapType',
                'panelBranding',
                'noseBranding',
                'skirted',
                'skirtColor',
                'conspicuityTape',
                'captiveBeam',
                'cargoCameras',
                'cartbars',
                'tpms',
                'trailerHeightDecal'
            ];
            if (!isCanada) {
                checklistOrder = checklistOrder.filter(h => h !== 'owner' && h !== 'conspicuityTape');
            }

            const generalHeaders = generalOrder;
            const checklistHeaders = checklistOrder;
            const mediaHeaders = imageHeaders;

            const baseHeaders: string[] = [...generalHeaders, ...checklistHeaders, ...mediaHeaders];
            const seen = new Set(baseHeaders);
            const additionalHeaders = allHeaders.filter((h) => !seen.has(h));
            const headers: string[] = [...baseHeaders, ...additionalHeaders];
            const triggerDownload = (blob: Blob, filename: string) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            };
            const escapeCSV = (v: unknown): string => {
                const s = String(v ?? '');
                return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
            };
            const filename = `inspections_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : format}`;
            if (format === 'json') {
                const ordered = flatRows.map(row => {
                    const o: any = {};
                    headers.forEach(h => { o[h] = row[h] ?? ''; });
                    return o;
                });
                const blob = new Blob([JSON.stringify(ordered, null, 2)], { type: 'application/json' });
                triggerDownload(blob, filename);
            } else if (format === 'csv') {
                const csvRows = flatRows.map((row) => headers.map((h) => escapeCSV(row[h])).join(','));
                const csv = [headers.join(','), ...csvRows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                triggerDownload(blob, filename);
            } else if (format === 'excel') {
                const aoa: string[][] = [headers, ...flatRows.map((row) => headers.map((h) => row[h] ?? ''))];
                const ws = XLSX.utils.aoa_to_sheet(aoa);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Inspections');
                const wbout: ArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
                const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                triggerDownload(blob, filename);
            }
        } catch (e: any) {
            toast.error(e.message || 'Failed to export');
        }
    };
    const getInspections = async () => {
        if (isResettingInspectionPage.current) {
            isResettingInspectionPage.current = false;
            return;
        }
        try {

            setLoading(true);
            const res = await apiRequest(`/api/inspections/get-inspections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page: currentPage, limit, filter: buildServerFilter(selectedFilters), department: dept, vendorId: vendor }),
            });
            const json = await res.json();
            if (res.ok && json.success) {
                const mapped: InspectionData[] = (json.inspections || []).map((doc: any) => ({
                    id: doc.unitId,
                    status: (doc.inspectionStatus || '').toString(),
                    type: doc.type || '',
                    inspector: doc.inspector || '',
                    vendor: doc.vendor || '',
                    location: doc.location || '',
                    duration: `${doc.durationMin || ''}m ${doc.durationSec || ''}s`,
                    date: `${String(doc.dateMonth || '').padStart(2, '0')}/${String(doc.dateDay || '').padStart(2, '0')}/${doc.dateYear || ''}`,
                    delivered: doc.delivered === 'yes' ? 'Yes' : doc.delivered === 'no' ? 'No' : '',
                }));

                setTotalInspections(json.total);
                setInspections(mapped);
            } else {
                toast.error(json.message || 'Failed to fetch inspections');
                setInspections([]);
                setTotalInspections(0);
            }
        } catch (e: any) {
            toast.error(e.message || 'Server error');
            setInspections([]);
            setTotalInspections(0);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (currentPage && limit && dept && vendor) {
            getInspections();
        }
    }, [currentPage, limit, selectedFilters, dept, vendor]);

    useEffect(() => {
        const getfilters = async () => {
            try {
                const res = await apiRequest(`/api/inspections/get-filters`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ department: dept, vendorId: vendor }),
                });
                const json = await res.json();
                if (res.ok && json.success) {
                    const mapped: InspectionData[] = (json.inspections || []).map((doc: any) => ({
                        id: doc.unitId,
                        status: (doc.inspectionStatus || '').toString(),
                        type: doc.type || '',
                        inspector: doc.inspector || '',
                        vendor: doc.vendor || '',
                        location: doc.location || '',
                        duration: `${doc.durationMin || ''}m ${doc.durationSec || ''}s`,
                        date: doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 10) : '',
                        delivered: doc.delivered === 'yes' ? 'Yes' : doc.delivered === 'no' ? 'No' : '',
                    }));
                    setFilters(mapped);
                } else {
                    toast.error(json.message || 'Failed to fetch inspections');
                    setFilters([]);
                }
            } catch (e: any) {
                toast.error(e.message || 'Server error');
                setFilters([]);
            }
        };

        if (dept && vendor) {
            getfilters();
        }

    }, [dept, vendor])

    useEffect(() => {
        // Load filters from sessionStorage on mount
        const storedFilters = sessionStorage.getItem('inspectionFilters');
        if (storedFilters) {
            try {
                const parsedFilters = JSON.parse(storedFilters);
                setSelectedFilters(parsedFilters);
            } catch (e) {
                ;
            }
        }
    }, []);



    // Update handleApplyFilters to save to sessionStorage
    const handleApplyFilters = (filters: { [key: string]: string[] }) => {
        const params = new URLSearchParams(searchParams);
        if (currentPage !== 1) {
            isResettingInspectionPage.current = true;
            params.set('inspection_page', '1');
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
        setSelectedFilters(filters);
        sessionStorage.setItem('inspectionFilters', JSON.stringify(filters));
        closeEFilterModal();
    };
    const handleRemoveFilter = (filterKey: string, valueId: string) => {
        setSelectedFilters(prev => {
            const updated = { ...prev };
            updated[filterKey] = updated[filterKey].filter(id => id !== valueId);
            if (updated[filterKey].length === 0) {
                delete updated[filterKey];
            }
            sessionStorage.setItem('inspectionFilters', JSON.stringify(updated));
            return updated;
        });
    };

    // Update handleClearAllFilters to clear sessionStorage
    const handleClearAllFilters = () => {
        setSelectedFilters({});
        sessionStorage.removeItem('inspectionFilters');
    };


    const columns: Column<InspectionData>[] = [
        {
            header: (
                <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="circle-checkbox"
                    disabled={!dept || !vendor}
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
            cell: (row) => (
                <div className="font-medium text-[var(--secondary)]">{row.id}</div>
            ),
        },
        {
            header: "STATUS",
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
            header: "TYPE",
            accessor: "type",
            cell: (row) => (
                <div className="font-medium text-[var(--secondary)]">{row.type}</div>
            ),
        },
        {
            header: "INSPECTOR",
            accessor: "inspector",
            cell: (row) => <div className="opacity-70">{row.inspector}</div>,
        },
        {
            header: "VENDOR",
            accessor: "vendor",
            cell: (row) => <div className="opacity-70">{row.vendor}</div>,
        },
        {
            header: "LOCATION",
            accessor: "location",
            cell: (row) => <div className="opacity-70">{row.location}</div>,
        },
        {
            header: "DURATION",
            accessor: "duration",
            cell: (row) => <div className="opacity-70">{row.duration}</div>,
        },
        {
            header: "DATE",
            accessor: "date",
            cell: (row) => <div className="opacity-70">{row.date}</div>,
        },
        {
            header: "DELIVERED",
            accessor: "delivered",
            cell: (row) => (
                <div
                    className={`font-medium ${row.delivered === "Yes" ? "text-green-600" : "text-red-500"
                        }`}
                >
                    {row.delivered}
                </div>
            ),
        },
    ];

    return (
        <div>

            <div className='bg-white p-4'>
                <div className="flex items-center gap-3 p-2 border-b border-purple-100 bg-gradient-to-r from-[#FAF5FF] from-[0%] to-[#ded1eb] to-[100%] rounded-xl mb-4">
                    <div className="p-1.5 rounded-md ">
                        <CheckSquare className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-semibold text-gray-900">Inspections</h1>
                    </div>
                </div>
                {/* header */}
                <div className='flex flex-col sm:flex-row gap-3 justify-between'>
                    <div className='flex flex-wrap gap-2'>
                        <button className='flex gap-2 items-center bg-[#F3EBFF66] hover:bg-[#F3EBFF] px-2 py-2 text-sm rounded-xl relative' onClick={openFilterModal}>
                            <Filter className='w-4 h-4' />
                            Filter
                            {totalFiltersCount > 0 && (
                                <span className='  text-black '>
                                    ({totalFiltersCount})
                                </span>
                            )}
                        </button>
                        <button disabled={selectedRows.length === 0} className='flex gap-2 items-center bg-[#F3EBFF66] hover:bg-[#F3EBFF] px-2 py-2 text-sm rounded-xl' onClick={openExportModal}>
                            <Download className='w-4 h-4' />
                            Export
                        </button>
                        {(selectedRows.length > 0) && (
                            <>
                                <button className='flex gap-2 items-center bg-[#F3EBFF66] hover:bg-[#0075FF] hover:text-white border border-[#0075FF] px-2 py-2 text-sm rounded-xl text-[#0075FF] whitespace-nowrap' onClick={openModal}>
                                    <Briefcase className='w-4 h-4' />
                                    Reassign Department ({selectedRows.length})
                                </button>
                                {user?.role === "superadmin" && (
                                    <button className='flex gap-2 items-center bg-[#ff3434] hover:bg-[#ff3434]/70 px-2 py-2 text-sm rounded-xl text-white whitespace-nowrap ' onClick={handleDeleteSelected}>
                                        <X className='w-4 h-4' />
                                        Delete Inspection ({selectedRows.length})
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                    <div className='flex flex-wrap gap-2 text-white'>
                        <button
                            onClick={openEditModal}
                            className={`flex gap-2 items-center  px-2 py-2 text-sm rounded-xl whitespace-nowrap hover:bg-[#5cc6a8] bg-[#047857] ${selectedRows.length === 0 ? 'cursor-not-allowed opacity-60' : ''}`}
                            disabled={selectedRows.length === 0}
                        >
                            <Edit className='w-4 h-4' />
                            Batch Edit ({selectedRows.length})
                        </button>
                        {/* {user?.role === "user" && ( */}
                            <>
                                <button className='flex gap-2 items-center bg-[#7522BB] px-2 py-2 text-sm rounded-xl whitespace-nowrap' onClick={() => router.push(`/${user?.role}/inspections/new-inspection`)} >
                                    <Plus className='w-4 h-4' />
                                    Add Inspection
                                </button>
                                <button className='flex gap-2 items-center bg-[#2A85EF] px-2 py-2 text-sm rounded-xl whitespace-nowrap' onClick={() => router.push(`/${user?.role}/inspections/BatchCreate`)}>
                                    <Plus className='w-4 h-4' />
                                    Batch Create
                                </button>
                            </>
                        {/* )} */}


                    </div>

                </div>
                {totalFiltersCount > 0 && (
                    <div className='flex items-center gap-2 mt-4 flex-wrap'>
                        {Object.entries(selectedFilters).map(([filterKey, valueIds]) =>
                            valueIds.map((valueId, idx) => {
                                const isDate = filterKey === 'date';
                                const filterLabel = isDate ? (idx === 0 ? 'From Date' : 'To Date') : (filterOptions.find(f => f.key === filterKey)?.label || filterKey);
                                const filterOptionsMap: any = {
                                    unitId: unitIdOptions,
                                    inspectionStatus: inspectionStatusOptions,
                                    type: typeOptions,
                                    inspector: inspectorOptions,
                                    vendor: vendorOptions,
                                    location: locationOptions,
                                    duration: durationOptions,
                                    date: dateOptions,
                                    delivered: deliveredOptions
                                };
                                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                const formatPretty = (iso: string) => {
                                    const [yy, mm, dd] = String(iso).split('-');
                                    const mi = Math.max(0, parseInt(mm || '1', 10) - 1);
                                    const name = monthNames[mi] || mm;
                                    return yy && mm && dd ? `${name} ${dd}, ${yy}` : iso;
                                };
                                const rawLabel = filterOptionsMap[filterKey]?.find((opt: any) => opt.id === valueId)?.label || valueId;
                                const valueLabel = isDate ? formatPretty(valueId) : rawLabel;

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
                {/* table */}
                <div className="h-full mt-4">
                    <GenericDataTable title="" data={inspections} totalCount={totalInspections} tabs={pageTabs} columns={columns} pageSize={limit} setPageSize={setLimit} currentPage={currentPage} loading={loading} setLoading={setLoading} querykey="inspection_page" search={search} setSearch={setSearch} onRowClick={(row) => { router.push(`/${user?.role}/inspections/Edit/${row.id}`) }} emptyStateImages={{
                        "All Users": "/images/No Users.svg"
                    }}
                    />
                </div>
            </div>
            <ReassignDepartmentModal isOpen={isOpen} onClose={closeModal} department={department} onDepartmentChange={setDepartment} selectedUnitIds={selectedRows} onUpdated={handleRefreshAfterUpdate} />

            <BatchEditInspectionsModal isOpen={isEditModalOpen} onClose={closeEditModal} formData={formData} setFormData={setFormData} onChange={handleChange} onDropdownChange={handleDropdownChange} selectedUnitIds={selectedRows} onUpdated={handleRefreshAfterUpdate} />

            <ExportInspectionsModal isOpen={isExportOpen} onClose={closeExportModal} selectedExportType={selectedExportType} onSelectedExportTypeChange={setSelectedExportType} onExport={handleExportInspections} selectedUnitIds={selectedRows} />

            <FilterInspectionsModal
                isOpen={isFilterOpen}
                onClose={closeEFilterModal}
                onApply={handleApplyFilters}
                initialFilters={selectedFilters}
                inspections={filters}
            />
        </div >
    )
}

export default Inspections
