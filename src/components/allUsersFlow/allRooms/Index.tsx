"use client";

import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { buildRequestBody } from "@/utils/apiWrapper";
import Image from "next/image";
import { redirect, useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from 'react-toastify';
import { UserContext } from "@/context/authContext";
import { useParams } from "next/navigation";
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

// const rooms: Room[] = [
//     {
//         id: "1",
//         serialNumber: 1,
//         roomName: "Deluxe Suite",
//         roomId: "R101",
//         guests: 2,
//         addedOn: "2025-06-25",
//         Action: "View Details",
//         isFull: true
//     },
//     {
//         id: "2",
//         serialNumber: 2,
//         roomName: "Executive Room",
//         roomId: "R102",
//         guests: 3,
//         addedOn: "2025-06-24",
//         Action: "View Details",
//         isFull: false

//     },
//     {
//         id: "3",
//         serialNumber: 3,
//         roomName: "Standard Room",
//         roomId: "R103",
//         guests: 1,
//         addedOn: "2025-06-23",
//         Action: "View Details",
//         isFull: false

//     },
// ];

export default function Rooms({ sessionId }: { sessionId: string }) {
    const params = useParams();
    // const [tableData, setTableData] = useState<UserOrder[]>([]);
    const [totalRooms, setTotalRooms] = useState(0);
    const [currentPage, setCurrentPage] = useState(() => Number(params.page) || 1);
    const [loading, setLoading] = useState(false)
    const { user } = useContext(UserContext);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomStatus, setRoomStatus] = useState<string>("all");
    const [roomactiveTab, setRoomActiveTab] = useState("Active");
    const hasFetchedRef = useRef(false);
    const limit = 5;
    const pageTabs = useMemo(() => {
        const totalPages = Math.ceil(totalRooms / limit);
        return Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
    }, [totalRooms, limit]);
    const customTabs = ["All Rooms", "Full Rooms", "Empty Rooms"];
    if (!sessionId) {
        redirect("/signin");
    }
    useEffect(() => {
        if (user?.email && !hasFetchedRef.current) {
            const builtPayload = buildRequestBody({
                email: user.email,
                user_id: params.id,
                room_status: roomStatus,
                limit,
                page: currentPage,
            });
            fetchData(builtPayload);
            console.log("fetchData", builtPayload);
            hasFetchedRef.current = true;
        }
    }, [user, currentPage, roomStatus]);
    const fetchData = async (payload: any) => {
        try {
            const response = await fetch("/api/allUsersFlow/get_all_rooms_of_user", {
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
            console.log("error", err);
        }
    };

    const handleTabChange = (tab: string) => {
        setRoomActiveTab(tab);
        const firstWord = tab.split(" ")[0].toLowerCase();
        setRoomStatus(firstWord);
        hasFetchedRef.current = false
    };

    const roomColumns: Column<Room>[] = [

        { header: "Serial Number", accessor: "serialNumber" },
        { header: "Room Name", accessor: "name" },
        { header: "Room ID", accessor: "external_id" },
        { header: "Guests", accessor: "number_of_guests" },
        { header: "Added on", accessor: "created_at" },
        {
            header: "Action",
            accessor: "Action", // still needed for default access, won't be used in cell

            cell: (row) => <ActionButton link={`/detailRoom/${row.id}`} />,
        },
    ];

    return (
        <div className="p-6">
            <GenericDataTable data={rooms} tabs={pageTabs} columns={roomColumns} pageSize={limit} currentPage={currentPage} setCurrentPage={setCurrentPage} loading={loading}
                custom_tabs={customTabs}
                emptyStateImages={{
                    "Rooms": "/images/No Rooms.svg"
                }}
                // customTabFilter={(room, tab) => {
                //     if (tab === "Full Rooms") return room.isFull;
                //     if (tab === "Empty Rooms") return !room.isFull;
                //     return true; // All Rooms
                // }}
                activeTab={roomactiveTab}
                onTabChange={handleTabChange}
            />
        </div>
    );
}
