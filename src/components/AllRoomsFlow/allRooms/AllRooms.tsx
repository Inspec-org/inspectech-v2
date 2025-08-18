"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { use, useContext, useEffect, useMemo, useRef, useState } from "react";
import { notFound } from "next/navigation";
import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { UserContext } from "@/context/authContext";
import { buildRequestBody } from "@/utils/apiWrapper";
import { toast } from "react-toastify";
import ActionButton from "@/components/common/ActionButton";

type Room = {
    id: string;
    name: string;
    number_of_guests: number;
    created_at: string;
    created_by: string;
    property_name: number;
    kbs_email: string;
};

export default function AllRooms({ sessionId }: { sessionId: string }) {
    const searchParams = useSearchParams();
    const currentPage = parseInt(searchParams.get("room_page") || "1", 10);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [totalRooms, setTotalRooms] = useState(0);
    const router = useRouter();
    const pathname = usePathname()
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const { user } = useContext(UserContext);
    const limit = 10;
    const pageTabs = useMemo(() => {
        const totalPages = Math.ceil(totalRooms / limit);
        return Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
    }, [totalRooms, limit]);
    const roomColumns: Column<Room>[] = [
        { header: "Room Name", accessor: "name" },
        {
            header: "Date", accessor: "created_at",
            cell: (row) => (
                <div className="t">{row.created_at.substring(0, 10)}</div>
            ),
        },
        { header: "Added Guests", accessor: "number_of_guests" },
        { header: "Property Name", accessor: "property_name" },
        { header: "KBS Email", accessor: "kbs_email" },
        {
            header: "Action",
            accessor: "Action", // still needed for default access, won't be used in cell

            cell: (row) =>
                <div className="text-center">
                    <ActionButton link={`/allRooms/detailRoom/${row.id}/?room_page=${currentPage}`} />
                </div>,
        },
    ];

    useEffect(() => {
        if (search) {
            setLoading(true);
            const params = new URLSearchParams(searchParams.toString());
            params.set("room_page", "1");
            router.push(`${pathname}?${params.toString()}`);
        }
    }, [search]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (user?.email) {
                const payloadData = {
                    email: user.email,
                    limit,
                    page: currentPage,
                    search_query: search
                };

                const builtPayload = buildRequestBody(payloadData);
                fetchData(builtPayload);
            }
        }, 1500); // slight delay to prevent double run

        return () => clearTimeout(timeout);
    }, [user, currentPage, search]);

    const fetchData = async (payload: any) => {
        try {
            const response = await fetch('/api/allRoomsFlow/get_all_rooms', {
                method: 'POST',
                headers: {
                    'Session': sessionId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok || data.data.status === false) throw new Error(data.data.message)
            const resData = data.data.data;
            console.log(resData)
            setTotalRooms(resData.total_rooms);
            setRooms(resData.rooms);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            toast.error(errorMessage);
            console.error("Error fetching user:", err);
            setRooms([]);
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="p-6 space-y-6">
                {/* Room Header */}
                <div className="border rounded-2xl p-6 bg-white shadow">
                    {/* Back Button alongside Title */}

                    <div>
                        <GenericDataTable
                            title="All Rooms"
                            tabs={pageTabs}
                            loading={loading}
                            setLoading={setLoading}
                            data={rooms}
                            columns={roomColumns}
                            pageSize={5}
                            currentPage={currentPage}
                            emptyStateImages={{
                                "All Guests": "/images/No Guests.svg"
                            }}
                            querykey="room_page"
                            search={search}
                            setSearch={setSearch}
                        // customTabFilter={(guest, tab) => guest.tab === tab}
                        />
                    </div>
                </div>

                {/* All Guests Table */}
            </div>
        </>
    );
}
