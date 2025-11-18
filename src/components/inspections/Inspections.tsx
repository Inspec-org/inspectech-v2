'use client'
import { ArrowRight, Briefcase, Cross, Download, Edit, Edit3, Filter, Plus, X } from 'lucide-react'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { UserContext } from '@/context/authContext';
import { FaSuitcase } from 'react-icons/fa';

import { useModal } from '@/hooks/useModal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import CheckList from './CheckLIst';
import FilterInspectionsModal, { dateOptions, deliveredOptions, durationOptions, filterOptions, inspectionStatusOptions, inspectorOptions, locationOptions, typeOptions, unitIdOptions, vendorOptions } from '../Modals/FilterInspectionsModal';
import ReassignDepartmentModal from '../Modals/ReasssignDepartmentModal';
import BatchEditInspectionsModal from '../Modals/BatchEditInspectionsModal';
import ExportInspectionsModal from '../Modals/ExportInspectionsModal';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';

type InspectionData = {
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
    const [totaluser, setTotaluser] = useState(5);
    const currentPage = parseInt(searchParams.get("user_page") || "1", 10);
    const [loading, setLoading] = useState(false)
    const { user } = useContext(UserContext);
    const [department, setDepartment] = useState("");
    const [search, setSearch] = useState("");
    const [limit, setLimit] = useState(10);
    const pageTabs = useMemo(() => {
        const totalPages = Math.ceil(totaluser / limit);
        return Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
    }, [totaluser, limit]);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const { isOpen, openModal, closeModal } = useModal();
    const { isOpen: isEditModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
    const { isOpen: isExportOpen, openModal: openExportModal, closeModal: closeExportModal } = useModal();
    const { isOpen: isFilterOpen, openModal: openFilterModal, closeModal: closeEFilterModal } = useModal();
    const [selectedExportType, setSelectedExportType] = useState('csv');
    const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});
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
        dateDay: "MM",
        dateMonth: "DD",
        dateYear: "YYYY",
        notes: '',
        delivered_status: ''
    });

    const handleApplyFilters = (filters: { [key: string]: string[] }) => {
        setSelectedFilters(filters);
        closeEFilterModal();
    };

    const handleRemoveFilter = (filterKey: string, valueId: string) => {
        setSelectedFilters(prev => {
            const updated = { ...prev };
            updated[filterKey] = updated[filterKey].filter(id => id !== valueId);
            if (updated[filterKey].length === 0) {
                delete updated[filterKey];
            }
            return updated;
        });
    };

    const handleClearAllFilters = () => {
        setSelectedFilters({});
    };

    // Count total selected filters
    const totalFiltersCount = Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    const handleDropdownChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRows([]);
        } else {
            setSelectedRows(inspections.map((row) => row.id));
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

    useEffect(() => {
        const getInspections = async () => {
            try {
                console.log(selectedFilters)
                setLoading(true);
                const res = await apiRequest(`/api/inspections/get-inspections`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ page: currentPage, limit, filter: selectedFilters }),
                });
                const json = await res.json();
                if (res.ok && json.success) {
                    setTotaluser(json.total || 0);
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
                    setInspections(mapped);
                } else {
                    toast.error(json.message || 'Failed to fetch inspections');
                    setInspections([]);
                    setTotaluser(0);
                }
            } catch (e: any) {
                toast.error(e.message || 'Server error');
                setInspections([]);
                setTotaluser(0);
            } finally {
                setLoading(false);
            }
        };

        getInspections();
    }, [currentPage, limit, search, selectedFilters]);

    useEffect(() => {
        const getfilters = async () => {
            try {
                setLoading(true);
                const res = await apiRequest(`/api/inspections/get-filters`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                });
                const json = await res.json();
                if (res.ok && json.success) {
                    setTotaluser(json.total || 0);
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
                    setTotaluser(0);
                }
            } catch (e: any) {
                toast.error(e.message || 'Server error');
                setFilters([]);
                setTotaluser(0);
            } finally {
                setLoading(false);
            }
        };

        getfilters();

    }, [])

    const columns: Column<InspectionData>[] = [
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
                        <button className='flex gap-2 items-center bg-[#F3EBFF66] px-2 py-2 text-sm rounded-xl relative' onClick={openFilterModal}>
                            <Filter className='w-4 h-4' />
                            Filter
                            {totalFiltersCount > 0 && (
                                <span className='  text-black '>
                                    ({totalFiltersCount})
                                </span>
                            )}
                        </button>
                        <button className='flex gap-2 items-center bg-[#F3EBFF66] px-2 py-2 text-sm rounded-xl' onClick={openExportModal}>
                            <Download className='w-4 h-4' />
                            Export
                        </button>
                        {(selectedRows.length > 0) && (
                            <>
                                <button className='flex gap-2 items-center bg-[#F3EBFF66] border border-[#0075FF] px-2 py-2 text-sm rounded-xl text-[#0075FF] whitespace-nowrap' onClick={openModal}>
                                    <Briefcase className='w-4 h-4' />
                                    Reassign Department ({selectedRows.length})
                                </button>
                                <button className='flex gap-2 items-center bg-[#F49595] px-2 py-2 text-sm rounded-xl text-white whitespace-nowrap'>
                                    <X className='w-4 h-4' />
                                    Delete Inspection ({selectedRows.length})

                                </button>

                            </>
                        )}
                    </div>
                    <div className='flex flex-wrap gap-2 text-white'>
                        <button
                            onClick={openEditModal}
                            className={`flex gap-2 items-center bg-[#6BD6B6] px-2 py-2 text-sm rounded-xl whitespace-nowrap ${selectedRows.length === 0 ? 'pointer-events-none-none' : 'hover:bg-[#5cc6a8]'}`}
                            disabled={selectedRows.length === 0}
                        >
                            <Edit className='w-4 h-4' />
                            Batch Edit ({selectedRows.length})
                        </button>

                        <button className='flex gap-2 items-center bg-[#7522BB] px-2 py-2 text-sm rounded-xl whitespace-nowrap' onClick={() => router.push("/inspections/new-inspection")} >
                            <Plus className='w-4 h-4' />
                            Add Inspection
                        </button>
                        <button className='flex gap-2 items-center bg-[#2A85EF] px-2 py-2 text-sm rounded-xl whitespace-nowrap' onClick={() => router.push("/inspections/BatchCreate")}>
                            <Plus className='w-4 h-4' />
                            Batch Create
                        </button>
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
                <div className="h-full">
                    <GenericDataTable title="" data={inspections} tabs={pageTabs} columns={columns} pageSize={limit} setPageSize={setLimit} currentPage={currentPage} loading={loading} setLoading={setLoading} querykey="user_page" search={search} setSearch={setSearch} onRowClick={(row) => { router.push(`/inspections/Edit/${row.id}`) }} emptyStateImages={{
                        "All Users": "/images/No Users.svg"
                    }}
                    />
                </div>
            </div>
            <ReassignDepartmentModal isOpen={isOpen} onClose={closeModal} department={department} onDepartmentChange={setDepartment} />

            <BatchEditInspectionsModal isOpen={isEditModalOpen} onClose={closeEditModal} formData={formData} onChange={handleChange} onDropdownChange={handleDropdownChange} />

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
