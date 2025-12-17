"use client";

import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { buildRequestBody } from "@/utils/apiWrapper";
import Image from "next/image";
import { redirect, usePathname, useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from 'react-toastify';
import { UserContext } from "@/context/authContext";
import { useParams, useSearchParams } from "next/navigation";
import { recentInspection } from "./Dashboard"


export default function Inspections({ recentInspections, loading, onRefresh }: { recentInspections: recentInspection[], loading: boolean, onRefresh: () => void }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    // const [tableData, setTableData] = useState<UserOrder[]>([]);
    const [totaluser, setTotaluser] = useState(0);
    const currentPage = parseInt(searchParams.get("user_page") || "1", 10);
    const [loadin, setLoading] = useState(false)
    const { user } = useContext(UserContext);
    const [search, setSearch] = useState("");
    const limit = 5;
    const pageTabs = useMemo(() => {
        const totalPages = Math.ceil(totaluser / limit);
        return Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
    }, [totaluser, limit]);


    const columns: Column<recentInspection>[] = [
        {
            header: "UNIT ID",
            accessor: "id",
            cell: (row) => <div className="opacity-70 whitespace-nowrap">{row.unitId}</div>,
        },
        {
            header: "STATUS",
            accessor: "status",
            cell: (row) => (
                <span
                    className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${row.inspectionStatus === "complete"
                        ? "bg-[#7522BB1A] text-[#7522BB]"
                        : row.inspectionStatus === "incomplete"
                            ? "bg-blue-100 text-blue-700"
                            : row.inspectionStatus === "needs review"
                                ? "bg-[#FB923C1A] text-[#FB923C]"
                                : row.inspectionStatus === "pass"
                                    ? "bg-[#16A34A1A] text-[#16A34A]"
                                    : row.inspectionStatus === "fail"
                                        ? "bg-red-100 text-red-700"
                                        : ""
                        }`}
                >
                    {row.inspectionStatus.toUpperCase()}
                </span>
            ),
        },
        {
            header: "TYPE",
            accessor: "type",
            cell: (row) => <div className="opacity-70 whitespace-nowrap">{row.type}</div>,
        },
        {
            header: "INSPECTOR",
            accessor: "inspector",
            cell: (row) => <div className="opacity-70 whitespace-nowrap">{row.inspector}</div>,
        },
        {
            header: "VENDOR",
            accessor: "vendor",
            cell: (row) => <div className="opacity-70 whitespace-nowrap">{row.vendor}</div>,
        },
        {
            header: "LOCATION",
            accessor: "location",
            cell: (row) => <div className="opacity-70 whitespace-nowrap">{row.location}</div>,
        },
        {
            header: "DURATION",
            accessor: "duration",
            cell: (row) => <div className="opacity-70 whitespace-nowrap">{row.duration}</div>,
        },
        {
            header: "DATE",
            accessor: "date",
            cell: (row) => <div className="opacity-70 whitespace-nowrap">{row.date}</div>,
        },

    ];

    return (
        <div className="border p-6 rounded-2xl">
            {/* <GenericDataTable title="Recent Inspection Orders" min_height="405px" title_font_size="text-lg font-bold" data={recentInspections} tabs={pageTabs} columns={columns} pageSize={limit} currentPage={currentPage} loading={loading} setLoading={setLoading} onRefresh={onRefresh} querykey="user_page" search={search} setSearch={setSearch} emptyStateImages={{
                "All Users": "/images/No Users.svg"
            }}
            /> */}
        </div>
    );
}
