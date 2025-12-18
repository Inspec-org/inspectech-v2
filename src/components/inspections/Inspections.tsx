'use client'
import { ArrowRight, Briefcase, Cross, Download, Edit, Edit3, Filter, Plus, X } from 'lucide-react'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
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
        dateYear: "2925",
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
        rtbIndicator: '',
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
        amenikis: '',
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
    const totalFiltersCount = Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0);
    const [dept, setDept] = useState<string | null>(null);
    const [vendor, setVendor] = useState<string | null>(null);

    useEffect(() => {
        if (currentPage !== 1) {
            isResettingInspectionPage.current = true;
            const params = new URLSearchParams(searchParams);
            params.set('inspection_page', "1");
            window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        }
    }, [limit])

    useEffect(() => {
        const storedDept = Cookies.get("selectedDepartmentId") || '';
        setDept(storedDept);
        setDepartment(storedDept || '');
        const storedVendor = Cookies.get("selectedVendorId") || '';
        setVendor(storedVendor);
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
                body: JSON.stringify({ idsOnly: true, filter: selectedFilters, vendorId: vendor, department: dept }),
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
    const getInspections = async () => {
        if (isResettingInspectionPage.current) {
            isResettingInspectionPage.current = false;
            return;
        }
        try {
            console.log("api running")
            setLoading(true);
            const res = await apiRequest(`/api/inspections/get-inspections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page: currentPage, limit, filter: selectedFilters, department: dept, vendorId: vendor }),
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
                    date: `${doc.dateDay || ''}-${doc.dateMonth || ''}-${doc.dateYear || ''}`,
                    delivered: doc.delivered === 'yes' ? 'Yes' : doc.delivered === 'no' ? 'No' : '',
                }));
                console.log(json)
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
        setTimeout(() => {
            console.log(currentPage, limit, selectedFilters, dept, vendor)
            if (currentPage && limit && selectedFilters && dept && vendor)
                getInspections();
        }, 2000);
    }, [currentPage, limit, search, selectedFilters, dept, vendor]);

    useEffect(() => {
        const getfilters = async () => {
            try {
                const res = await apiRequest(`/api/inspections/get-filters`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ department: dept }),
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

        getfilters();

    }, [dept])

    useEffect(() => {
        // Load filters from sessionStorage on mount
        const storedFilters = sessionStorage.getItem('inspectionFilters');
        if (storedFilters) {
            try {
                const parsedFilters = JSON.parse(storedFilters);
                setSelectedFilters(parsedFilters);
            } catch (e) {
                console.error('Failed to parse filters from sessionStorage', e);
            }
        }
    }, []);

    // Update handleApplyFilters to save to sessionStorage
    const handleApplyFilters = (filters: { [key: string]: string[] }) => {
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
            <h1 className='font-bold text-2xl px-2 py-3'>Inspections</h1>
            <div className='bg-white p-4'>
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
                        <button className='flex gap-2 items-center bg-[#F3EBFF66] hover:bg-[#F3EBFF] px-2 py-2 text-sm rounded-xl' onClick={openExportModal}>
                            <Download className='w-4 h-4' />
                            Export
                        </button>
                        {(selectedRows.length > 0) && (
                            <>
                                <button className='flex gap-2 items-center bg-[#F3EBFF66] hover:bg-[#0075FF] hover:text-white border border-[#0075FF] px-2 py-2 text-sm rounded-xl text-[#0075FF] whitespace-nowrap' onClick={openModal}>
                                    <Briefcase className='w-4 h-4' />
                                    Reassign Department ({selectedRows.length})
                                </button>
                                <button className='flex gap-2 items-center bg-[#F49595] px-2 py-2 text-sm rounded-xl text-white whitespace-nowrap cursor-not-allowed*' disabled>
                                    <X className='w-4 h-4' />
                                    Delete Inspection ({selectedRows.length})

                                </button>

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
                        {user?.role === "user" && (
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
                        )}


                    </div>

                </div>
                {totalFiltersCount > 0 && (
                    <div className='flex items-center gap-2 mt-4 flex-wrap'>
                        {Object.entries(selectedFilters).map(([filterKey, valueIds]) =>
                            valueIds.map(valueId => {
                                const filterLabel = filterOptions.find(f => f.key === filterKey)?.label || filterKey;
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

            <ExportInspectionsModal isOpen={isExportOpen} onClose={closeExportModal} selectedExportType={selectedExportType} onSelectedExportTypeChange={setSelectedExportType} />

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
