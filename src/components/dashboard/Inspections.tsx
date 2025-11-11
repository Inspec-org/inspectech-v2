"use client";

import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { buildRequestBody } from "@/utils/apiWrapper";
import Image from "next/image";
import { redirect, usePathname, useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from 'react-toastify';
import { UserContext } from "@/context/authContext";
import { useParams, useSearchParams } from "next/navigation";
type InspectionData = {
    id: string;
    status: string;
    type: string;
    inspector: string;
    vendor: string;
    location: string;
    duration: string;
    date: string;
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
    },
];


export default function Inspections() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    // const [tableData, setTableData] = useState<UserOrder[]>([]);
    const [totaluser, setTotaluser] = useState(0);
    const currentPage = parseInt(searchParams.get("user_page") || "1", 10);
    const [loading, setLoading] = useState(false)
    const { user } = useContext(UserContext);
    const [search, setSearch] = useState("");
    const limit = 5;
    const pageTabs = useMemo(() => {
        const totalPages = Math.ceil(totaluser / limit);
        return Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
    }, [totaluser, limit]);

    // if (!sessionId) {
    //     redirect("/signin");
    // }

    //   useEffect(() => {
    //   if (search) {
    //     console.log("search")
    //     const params = new URLSearchParams(searchParams.toString());
    //     params.set("user_page", "1");
    //     router.push(`${pathname}?${params.toString()}`);
    //   }
    // }, [search]);

    //   useEffect(() => {
    //     const timeout = setTimeout(() => {
    //       if (user?.email) {
    //         const builtPayload = buildRequestBody({
    //           email: user.email,
    //           limit,
    //           page: currentPage,
    //           search_query: search
    //         });
    //         console.log(builtPayload)
    //         fetchData(builtPayload);
    //       }
    //     }, 1000); // slight delay to prevent double run

    //     return () => clearTimeout(timeout);
    //   }, [user, currentPage, search]);
    // const fetchData = async (payload: any) => {
    //     try {
    //         setLoading(true)
    //         const response = await fetch("/api/allUsersFlow/get_all_users", {
    //             method: "POST",
    //             headers: {
    //                 "Session": sessionId,
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify(payload),
    //         });

    //         const result = await response.json();

    //         if (!response.ok || result.data.status === false) {
    //             throw new Error(result.data?.message || result.error)
    //         }

    //         const transformedUsers: UserOrder[] = result.data.data.users.map((user: any) => ({
    //             id: user.id,
    //             user: {
    //                 image: user.profile_image_url ?? "",
    //                 full_name: user.full_name,
    //             },
    //             emailAddress: user.email,
    //             phoneNumber: user.phone,
    //             addedRooms: user.added_rooms,
    //             addedGuests: user.added_guests,
    //         }));

    //         setTotaluser(result.data.data.total_users);
    //         setTableData(transformedUsers);
    //     } catch (err: unknown) {
    //         const errorMessage = err instanceof Error ? err.message : String(err);
    //         toast.error(errorMessage);
    //         console.log("error", err);
    //         setTotaluser(0);
    //         setTableData([]);
    //     } finally {
    //         setLoading(false)
    //     }
    // };

    // const columns: Column<UserOrder>[] = [
    //     {
    //         header: "User", // left aligned
    //         accessor: "user",
    //         cell: (row) => (
    //             <div className="flex items-center gap-2 ">
    //                 {/* {row.user?.image ? row.user.image :  || "User"} */}
    //                 <div className="w-8 h-8">
    //                     <Image
    //                         src={row.user?.image || "/images/avatar.png"}
    //                         alt={row.user?.full_name}
    //                         width={32}
    //                         height={32}
    //                         className="rounded-full h-full w-full object-cover"
    //                     />
    //                 </div>
    //                 <div>
    //                     <div className="font-medium">{row.user.full_name}</div>
    //                 </div>
    //             </div>
    //         ),
    //     },
    //     {
    //         header: <div className="text-center">Email Address</div>,
    //         accessor: "emailAddress",
    //         cell: (row) => (
    //             <div className="text-center text-[var(--secondary)]">{row.emailAddress}</div>
    //         ),
    //     },
    //     {
    //         header: <div className="text-center">Phone Number</div>,
    //         accessor: "PhoneNumber",
    //         cell: (row) => (
    //             <div className="text-center text-[var(--secondary)]">{row.phoneNumber}</div>
    //         ),
    //     },
    //     {
    //         header: <div className="text-center">Added Rooms</div>,
    //         accessor: "AddedRooms",
    //         cell: (row) => (
    //             <div className="text-center text-[var(--secondary)]">{row.addedRooms}</div>
    //         ),
    //     },
    //     {
    //         header: <div className="text-center">Added Guests</div>,
    //         accessor: "AddedGuests",
    //         cell: (row) => (
    //             <div className="text-center text-[var(--secondary)]">{row.addedGuests}</div>
    //         ),
    //     },
    // ];

    const columns: Column<InspectionData>[] = [
        {
            header: "UNIT ID",
            accessor: "id",
            cell: (row) => <div className="font-medium text-[var(--secondary)]">{row.id}</div>,
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
                    {row.status}
                </span>
            ),
        },
        {
            header: "TYPE",
            accessor: "type",
            cell: (row) => <div className="font-medium text-[var(--secondary)]">{row.type}</div>,
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

    ];

    return (
        <div className="h-full">
            <GenericDataTable title="Recent Inspection Orders" data={dummyInspections} tabs={pageTabs} columns={columns} pageSize={limit} currentPage={currentPage} loading={loading} setLoading={setLoading} querykey="user_page" search={search} setSearch={setSearch} emptyStateImages={{
                "All Users": "/images/No Users.svg"
            }}
            />
        </div>
    );
}
