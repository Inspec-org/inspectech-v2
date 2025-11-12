'use client'
import { Briefcase, Cross, Download, Edit, Filter, Plus, X } from 'lucide-react'
import React, { useContext, useMemo, useState } from 'react'
import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { UserContext } from '@/context/authContext';
import { FaSuitcase } from 'react-icons/fa';


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

export const dummyInspections: InspectionData[] = [
    {
        id: "1",
        status: "Completed",
        type: "Safety Inspection",
        inspector: "John Smith",
        vendor: "Cappadocia Travel Co.",
        location: "Goreme, Turkey",
        duration: "2 hours",
        date: "2025-10-25",
        delivered: "Yes"
    },
    {
        id: "2",
        status: "Pending",
        type: "Quality Check",
        inspector: "Fatma Kaya",
        vendor: "Skyline Tours",
        location: "Istanbul, Turkey",
        duration: "3 hours",
        date: "2025-10-28",
        delivered: "Yes"
    },
    {
        id: "3",
        status: "In Progress",
        type: "Maintenance Audit",
        inspector: "Ali Demir",
        vendor: "Blue Horizon Travels",
        location: "Antalya, Turkey",
        duration: "1.5 hours",
        date: "2025-10-29",
        delivered: "Yes"
    },
    {
        id: "4",
        status: "Completed",
        type: "Health & Safety Check",
        inspector: "Mehmet Yildiz",
        vendor: "Anatolia Adventures",
        location: "Pamukkale, Turkey",
        duration: "2 hours",
        date: "2025-10-15",
        delivered: "No"
    },
    {
        id: "5",
        status: "Pending",
        type: "Vehicle Inspection",
        inspector: "Elif Aydin",
        vendor: "Historic Gateways",
        location: "Izmir, Turkey",
        duration: "1 hour",
        date: "2025-11-01",
        delivered: "Yes"
    },
];

function Inspections() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    // const [tableData, setTableData] = useState<UserOrder[]>([]);
    const [totaluser, setTotaluser] = useState(5);
    const currentPage = parseInt(searchParams.get("user_page") || "1", 10);
    const [loading, setLoading] = useState(false)
    const { user } = useContext(UserContext);
    const [search, setSearch] = useState("");
    const limit = 5;
    const pageTabs = useMemo(() => {
        const totalPages = Math.ceil(totaluser / limit);
        return Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
    }, [totaluser, limit]);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);


    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRows([]);
        } else {
            setSelectedRows(dummyInspections.map((row) => row.id));
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
                        <button className='flex gap-2 items-center bg-[#F3EBFF66] px-2 py-2 text-sm rounded-xl'>
                            <Filter className='w-4 h-4' />
                            Filter
                        </button>
                        <button className='flex gap-2 items-center bg-[#F3EBFF66] px-2 py-2 text-sm rounded-xl'>
                            <Download className='w-4 h-4' />
                            Export
                        </button>
                        {(selectedRows.length > 0) && (
                            <>
                                <button className='flex gap-2 items-center bg-[#F3EBFF66] border border-[#0075FF] px-2 py-2 text-sm rounded-xl text-[#0075FF] whitespace-nowrap'>
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
                        <button className='flex gap-2 items-center bg-[#6BD6B6] px-2 py-2 text-sm rounded-xl whitespace-nowrap'>
                            <Edit className='w-4 h-4' />
                            Batch Edit
                        </button>
                        <button className='flex gap-2 items-center bg-[#7522BB] px-2 py-2 text-sm rounded-xl whitespace-nowrap'>
                            <Plus className='w-4 h-4' />
                            Add Inspection
                        </button>
                        <button className='flex gap-2 items-center bg-[#2A85EF] px-2 py-2 text-sm rounded-xl whitespace-nowrap'>
                            <Plus className='w-4 h-4' />
                            Batch Create
                        </button>
                    </div>

                </div>
                {/* table */}
                <div className="h-full">
                    <GenericDataTable title="" data={dummyInspections} tabs={pageTabs} columns={columns} pageSize={limit} currentPage={currentPage} loading={loading} setLoading={setLoading} querykey="user_page" search={search} setSearch={setSearch} onClick={() => { router.push("/inspections/BatchEdit") }} emptyStateImages={{
                        "All Users": "/images/No Users.svg"
                    }}
                    />
                </div>
            </div>
        </div >
    )
}

export default Inspections
