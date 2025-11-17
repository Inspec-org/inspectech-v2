'use client'
import { ArrowRight, Briefcase, Cross, Download, Edit, Edit3, Filter, Plus, X } from 'lucide-react'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { UserContext } from '@/context/authContext';
import { FaSuitcase } from 'react-icons/fa';
import { Modal } from '../ui/modal';
import { useModal } from '@/hooks/useModal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import CheckList from './CheckLIst';
import FilterInspectionsModal from '../Modals/FilterInspectionsModal';
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
    const [totaluser, setTotaluser] = useState(5);
    const currentPage = parseInt(searchParams.get("user_page") || "1", 10);
    const [loading, setLoading] = useState(false)
    const { user } = useContext(UserContext);
    const [department, setDepartment] = useState("");
    const [search, setSearch] = useState("");
    const limit = 5;
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
                setLoading(true);
                const res = await apiRequest(`/api/inspections/get-inspections`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ page: currentPage, limit, filter: { search } }),
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
    }, [currentPage, limit, search]);

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
                    className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${row.status === "Completed"
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
            <h1>Inspections</h1>
            <div className='bg-white p-4'>
                {/* header */}
                <div className='flex justify-between'>
                    <div className='flex gap-2'>
                        <button className='flex gap-2 items-center bg-[#F3EBFF66] px-2 py-2 text-sm rounded-xl' onClick={openFilterModal}>
                            <Filter className='w-4 h-4' />
                            Filter
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
                    <div className='flex gap-2 text-white'>
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
                {/* table */}
                <div className="h-full">
                    <GenericDataTable title="" data={inspections} tabs={pageTabs} columns={columns} pageSize={limit} currentPage={currentPage} loading={loading} setLoading={setLoading} querykey="user_page" search={search} setSearch={setSearch} onClick={() => { router.push("/inspections/BatchEdit") }} emptyStateImages={{
                        "All Users": "/images/No Users.svg"
                    }}
                    />
                </div>
            </div>
            {/*  b Reassign Modal */}
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] p-4 ">
                <div className="">
                    <div className='flex gap-2 text-[#0075FF] items-center  mb-2'>
                        <Briefcase className='w-6 h-6' />
                        <h2 className="text-xl font-semibold">Reassign Department</h2>
                    </div>
                    <p className="text-gray-600 mb-6 text-sm">Choose a new department for the 1 selected inspection</p>

                    <div className='flex flex-col justify-between gap-4 items-start mb-5'>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <CustomDropdown
                            options={[
                                { value: "us", label: "US Purchase Trailers" },
                                { value: "canadian", label: "Canadian Trailers" },

                            ]}
                            width="400px"
                            value={department}
                            onChange={(val) => setDepartment(val)}
                        />
                    </div>

                    <div className="flex justify-end gap-4">
                        {/* <button
                            onClick={(e) => {
                                console.log(selectedId)
                                if (selectedId) {
                                    e.preventDefault();
                                    handleDelete(selectedId);
                                }
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                        >
                            Yes, Delete
                        </button> */}

                        <button
                            onClick={closeModal}
                            className="border border-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={closeModal}
                            className="bg-[#8FADF5] text-white px-4 py-2 rounded-lg hover:bg-gray-400 transition flex gap-2 items-center"
                        >
                            <ArrowRight className='w-4 h-4' />
                            Reassign
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Batch Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={closeEditModal}
                className="max-w-[450px] max-h-[90vh] p-0 flex flex-col"
            >
                {/* Modal container */}
                <div className="bg-white rounded-lg w-full flex flex-col max-h-[90vh]">
                    {/* Header (fixed) */}
                    <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                        <div>
                            <h2 className="text-lg font-semibold text-[#059669] flex gap-2 items-center">

                                Batch Edit
                            </h2>
                            <p className="text-xs text-gray-600 mt-1">
                                Update fields for 1 selected inspection. Leave blank to existing values.
                            </p>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto flex-1">
                        <h2 className="text-md font-semibold flex gap-2 items-center pl-4">
                            General Information
                        </h2>
                        {/* Form */}
                        <div className="p-4 space-y-5">
                            {/* Status */}
                            <div className="flex flex-col items-start gap-4">
                                <label className="w-32 text-gray-700 font-medium">Status</label>
                                <CustomDropdown
                                    options={[
                                        { value: "pass", label: "PASS" },
                                        { value: "fail", label: "FAIL" },
                                        { value: "need_review", label: "NEEDS REVIEW" },
                                        { value: "out_of_cycle", label: "OUT OF CYCLE (DELIVERED)" },
                                        { value: "no_inspection", label: "NO INSPECTION(DELIVERED)" },
                                        { value: "incomplete", label: "INCOMPLETE" },
                                        { value: "complete", label: "COMPLETE" },
                                    ]}
                                    value={formData.status}
                                    onChange={(val) => handleDropdownChange("status", val)}
                                />
                            </div>

                            {/* Type */}
                            <div className="flex flex-col items-start gap-4">
                                <label className="w-32 text-gray-700 font-medium">Type</label>
                                <CustomDropdown
                                    options={[
                                        { value: "53-foot-trailer", label: "53 Foot Trailer" },
                                    ]}
                                    value={formData.type}
                                    onChange={(val) => handleDropdownChange("type", val)}
                                />
                            </div>

                            {/* Inspector */}
                            <div className="flex flex-col items-start gap-4">
                                <label className="w-32 text-gray-700 font-medium">Inspector</label>
                                <input
                                    type="text" placeholder="Leave unchanged"
                                    value={formData.inspector}
                                    onChange={(e) => handleChange('inspector', e.target.value)}

                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF] w-full"
                                />
                            </div>

                            {/* Vendor */}
                            <div className="flex flex-col items-start gap-4">
                                <label className="w-32 text-gray-700 font-medium">Vendor</label>
                                <input
                                    type="text" placeholder="Leave unchanged"
                                    value={formData.vendor}
                                    onChange={(e) => handleChange('vendor', e.target.value)}

                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF] w-full"
                                />
                            </div>

                            {/* Location */}
                            <div className="flex flex-col items-start gap-4">
                                <label className="w-32 text-gray-700 font-medium">Location</label>
                                <input
                                    type="text" placeholder="Leave unchanged"
                                    value={formData.location}
                                    onChange={(e) => handleChange('location', e.target.value)}

                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF] w-full"
                                />
                            </div>

                            {/* Duration */}
                            <div className="flex flex-col items-start gap-4">
                                <label className="w-32 text-gray-700 font-medium">Duration</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        value={formData.durationMin}
                                        onChange={(e) => handleChange("durationMin", e.target.value)}
                                        className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                                    />
                                    <span className="text-sm text-gray-500">min</span>
                                    <input
                                        type="number"
                                        value={formData.durationSec}
                                        onChange={(e) => handleChange("durationSec", e.target.value)}
                                        className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                                    />
                                    <span className="text-sm text-gray-500">sec</span>
                                </div>
                            </div>

                            {/* Date */}
                            <div className="flex flex-col items-start gap-4">
                                <label className="w-full text-gray-400 font-medium">
                                    <span>Date (UnEditable)</span><br />
                                    <span className='text-xs'>Date field tracks initial database creation timestamp and remains inactive for data integrity preservation.</span>
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text" placeholder="Leave unchanged"
                                        value={formData.dateDay}
                                        onChange={(e) => handleChange("dateDay", e.target.value)}
                                        disabled
                                        className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-400 text-center"
                                    />
                                    <span className="text-gray-400">/</span>
                                    <input
                                        type="text" placeholder="Leave unchanged"
                                        value={formData.dateMonth}
                                        onChange={(e) => handleChange("dateMonth", e.target.value)}
                                        disabled
                                        className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-400 text-center"
                                    />
                                    <span className="text-gray-400">/</span>
                                    <input
                                        type="text" placeholder="Leave unchanged"
                                        value={formData.dateYear}
                                        onChange={(e) => handleChange("dateYear", e.target.value)}
                                        disabled
                                        className="w-20 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-400 text-center"
                                    />
                                </div>
                            </div>

                            {/* Type */}
                            <div className="flex flex-col items-start gap-4">
                                <label className="w-32 text-gray-700 font-medium">Delivered Status</label>
                                <CustomDropdown
                                    options={[
                                        { value: "yes", label: "Yes" },
                                        { value: "no", label: "No" },
                                    ]}
                                    value={formData.delivered_status}
                                    onChange={(val) => handleDropdownChange("delivered_status", val)}
                                />
                            </div>
                        </div>
                        <CheckList prop='batch' formData={formData as any} setFormData={setFormData as any} />
                    </div>

                    {/* Footer (fixed) */}
                    <div className="flex justify-end gap-3 p-4 border-t flex-shrink-0">
                        <button
                            onClick={closeModal}
                            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            className="px-6 py-2.5 text-white bg-[#059669] rounded-lg hover:bg-[#059669]/90 transition font-medium flex gap-2 items-center"
                        >
                            <Edit3 className='w-4 h-4' />
                            Update
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Export Modal */}
            <Modal isOpen={isExportOpen} onClose={closeExportModal} className="max-w-[500px] p-4 ">
                <div className="">
                    <div className='flex gap-2 items-center  mb-2'>
                        <Download className='w-6 h-6' />
                        <h2 className="text-xl font-semibold">Export Data</h2>
                    </div>
                    <p className="text-gray-600 mb-6 text-sm">Select a pormat to export 40 inspection records</p>

                    <div>
                        <div className='flex gap-2 items-start mb-5 border rounded-xl p-4'>
                            <div>
                                <input type="radio" name="format" id="" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 flex flex-col">
                                    <span>CSV File</span>
                                    <span className='text-gray-400 text-xs'>Export as comma-separated values file</span>
                                </label>
                            </div>
                        </div>
                        <div className='flex gap-2 items-start mb-5 border rounded-xl p-4'>
                            <div>
                                <input type="radio" name="format" id="" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 flex flex-col">
                                    <span>JSON Data</span>
                                    <span className='text-gray-400 text-xs'>Export as JavaScript Object Notation</span>
                                </label>
                            </div>
                        </div>

                        <div className='flex gap-2 items-start mb-5 border rounded-xl p-4'>
                            <div>
                                <input type="radio" name="format" id="" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 flex flex-col">
                                    <span>EXCEL File</span>
                                    <span className='text-gray-400 text-xs'>Export in Microsoft Excel format</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        {/* <button
                            onClick={(e) => {
                                console.log(selectedId)
                                if (selectedId) {
                                    e.preventDefault();
                                    handleDelete(selectedId);
                                }
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                        >
                            Yes, Delete
                        </button> */}

                        <button
                            onClick={closeModal}
                            className="border border-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={closeModal}
                            className="bg-[#7844AB] text-white px-4 py-2 rounded-lg hover:bg-gray-400 transition flex gap-2 items-center"
                        >
                            <ArrowRight className='w-4 h-4' />
                            Export As
                        </button>
                    </div>
                </div>
            </Modal >

            <FilterInspectionsModal isOpen={isFilterOpen} onClose={closeEFilterModal} />
        </div >
    )
}

export default Inspections
