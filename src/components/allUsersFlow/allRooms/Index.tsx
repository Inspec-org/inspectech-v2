"use client";

import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { buildRequestBody } from "@/utils/apiWrapper";
import Image from "next/image";
import { redirect, usePathname, useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from 'react-toastify';
import { UserContext } from "@/context/authContext";
import { useParams, useSearchParams } from "next/navigation";
import ActionButton from "../../common/ActionButton";
interface Room {
    id: string;
    name: string;
    external_id: string;
    number_of_guests: number;
    created_at: string;
    status: string;
    Action: string;

}

interface RoomsProps {
    sessionId: string;
    apiEndpoint: string;
    idKey: "user_id" | "property_id";
}

export default function Rooms({ sessionId, apiEndpoint, idKey }: RoomsProps) {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user } = useContext(UserContext);
    const [search, setSearch] = useState("");
    const [rooms, setRooms] = useState<Room[]>([]);
    const [totalRooms, setTotalRooms] = useState(0);
    const [roomStatus, setRoomStatus] = useState<string>("all");
    const [roomactiveTab, setRoomActiveTab] = useState("All Rooms");
    const [initialized, setInitialized] = useState(false);
    const [loading, setLoading] = useState(true);

    const currentPage = parseInt(searchParams.get("room_page") || "1", 10);
    const limit = 10;

    const pageTabs = useMemo(() => {
        const totalPages = Math.ceil(totalRooms / limit);
        return Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
    }, [totalRooms, limit]);

    const customTabs = ["All Rooms", "Full Rooms", "Empty Rooms"];

    if (!sessionId) {
        redirect("/signin");
    }

    useEffect(() => {
        if (search) {
            setLoading(true);
            const params = new URLSearchParams(searchParams.toString());
            params.set("room_page", "1");
            router.push(`${pathname}?${params.toString()}`);
        }
    }, [search]);
    useEffect(() => {
        if (!initialized) {
            const tabParam = searchParams.get("activeTab") || "All Rooms";
            setRoomActiveTab(tabParam);
            setRoomStatus(tabParam.split(" ")[0].toLowerCase());
            setInitialized(true);
        }
    }, [searchParams, initialized]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (user?.email && initialized) {
                const builtPayload = buildRequestBody({
                    email: user.email,
                    [idKey]: params[idKey], // dynamic key here
                    room_status: roomStatus,
                    limit,
                    page: currentPage,
                    search_query: search
                });
                fetchData(builtPayload);
            }
        }, 1500);

        return () => clearTimeout(timeout);
    }, [user, currentPage, roomStatus, initialized, idKey, params, apiEndpoint, search]);

    const fetchData = async (payload: any) => {
        try {
            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    Session: sessionId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok || result.data.status === false) {
                throw new Error(result.data.message);
            }

            const roomsWithSerial = result.data.data.rooms.map((room: any, index: number) => ({
                ...room,
                serialNumber: index + 1,
            }));

            setTotalRooms(result.data.data.total_rooms);
            setRooms(roomsWithSerial);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            toast.error(errorMessage);
            setRooms([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab: string) => {
        setLoading(true);
        setRoomActiveTab(tab);
        setRoomStatus(tab.split(" ")[0].toLowerCase());
        const params = new URLSearchParams(searchParams.toString());
        params.set("room_page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const roomColumns: Column<Room>[] = [
        { header: "Serial Number", accessor: "serialNumber" },
        { header: "Room Name", accessor: "name" },
        { header: "Room ID", accessor: "external_id" },
        { header: "Guests", accessor: "number_of_guests" },
        {
            header: "Added on", accessor: "created_at",
            cell: (row) => row.created_at.substring(0, 10)
        },
        {
            header: "Action",
            accessor: "Action",
            cell: (row) =>
                <ActionButton
                    link={`/${params.user_id
                        ? `allUsers/detailUser/${params.user_id}`
                        : `allProperties/detailProperty/${params.property_id}`
                        }/detailRoom/${row.id}/?room_page=${currentPage}&activeTab=${roomactiveTab}`}
                />

        },
    ];

    return (
        <div className="p-6">
            <GenericDataTable
                data={rooms}
                tabs={pageTabs}
                columns={roomColumns}
                pageSize={limit}
                currentPage={currentPage}
                loading={loading}
                custom_tabs={customTabs}
                emptyStateImages={{ "Rooms": "/images/No Rooms.svg" }}
                activeTab={roomactiveTab}
                onTabChange={handleTabChange}
                querykey="room_page"
                setLoading={setLoading}
                search={search}
                setSearch={setSearch}
            />
        </div>
    );
}

