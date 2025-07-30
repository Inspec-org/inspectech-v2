"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { notFound } from "next/navigation";
import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { FaArrowLeft } from "react-icons/fa";
import { UserContext } from "@/context/authContext";
import { buildRequestBody } from "@/utils/apiWrapper";
import { toast } from "react-toastify";


type Room = {
    name: string;
    external_id: number;
    added_on: string;
};


type Guest = {
    id: string;
    guest_add_type: string;
    tck_number: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    sex: string;
    document_type: string;
    document_number: string;
    issuing_country: string;
    created_at: string;
};

export default function Index({ sessionId }: { sessionId: string }) {

    const router = useRouter(); // Access the router
    const [currentPage, setCurrentPage] = useState(1);
    const [rooms, setRooms] = useState<Room | null>(null);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [totalGuests, setTotalGuests] = useState(0);
    const params = useParams();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const roomId = (params.room_id as string);
    const userId = (params.user_id as string);
    const handleBack = () => {
        // Extract userId and page from the path
        const pathSegments = pathname.split("/");
        const userId = params.user_id; // e.g., 'bdb236fe...'
        const user_page = searchParams.get("user_page") || "1";
        const room_page = searchParams.get("room_page") || "1";
        const activeTab = searchParams.get("activeTab") || "All Rooms";

        const backPath = `/allUsers/detailUser/${userId}/rooms?user_page=${user_page}&room_page=${room_page}&activeTab=${encodeURIComponent(activeTab)}`;

        router.push(backPath);
    };
    // const room = rooms?.find((r) => r.id === roomId);
    const [activeTab, setActiveTab] = useState("Added By Scan Documents");
    const [guestType, setGuestType] = useState<string>("scan");
    const { user } = useContext(UserContext);
    const FetchedRef = useRef(false);
    const limit = 10;
    const pageTabs = useMemo(() => {
        const totalPages = Math.ceil(totalGuests / limit);
        return Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
    }, [totalGuests, limit]);
    const guestColumns: Column<Guest>[] = [
        { header: "Guest Name", accessor: "name" },
        { header: "Sex", accessor: "sex" },
        { header: "DOB", accessor: "date_of_birth" },
        { header: "Document No", accessor: "document_number" },
        { header: "Document type", accessor: "document_type" },
        { header: "Issuing Country", accessor: "issuing_country" },
        {
            header: "Added on", accessor: "created_at",
            cell: (row) => row.created_at.substring(0, 10)
        },
    ];

    useEffect(() => {
        if (user?.email && !FetchedRef.current && userId && roomId) {
            const builtPayload = buildRequestBody({
                email: user.email,
                user_id: userId,
                room_id: roomId,
                guest_add_type: guestType
            });
            fetchRoom(builtPayload);
            FetchedRef.current = true;
        }
    }, [user, userId, guestType, roomId]);

    const fetchRoom = async (payload: any) => {
        try {
            const response = await fetch('/api/allUsersFlow/get_room_details', {
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
            const transformedGuests = resData.guests.map((g: Guest) => ({
                name: `${g.first_name} ${g.last_name}`,
                sex: g.sex,
                date_of_birth: g.date_of_birth,
                document_number: g.document_number,
                document_type: g.document_type,
                issuing_country: g.issuing_country,
                created_at: g.created_at,
            }));
            console.log(resData.total_guests)
            setRooms(resData.room);
            setTotalGuests(resData.total_guests);
            setGuests(transformedGuests);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            toast.error(errorMessage);
            console.error("Error fetching user:", err);
            setGuests([]);
        }
    }
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const tabToGuestTypeMap: Record<string, string> = {
            "Added By Scan Documents": "scan",
            "Added By Passport": "manually",
            "Added By TCK": "tck",
        };

        setGuestType(tabToGuestTypeMap[tab] || "");
        FetchedRef.current = false
    };

    return (
        <div className="p-6 space-y-6">
            {/* Room Header */}
            <div className="border rounded-2xl p-6 bg-white shadow">
                {/* Back Button alongside Title */}
                <div className="flex items-center mb-5 border-b border-gray-200 pb-4">
                    <button
                        onClick={handleBack}
                        className="text-gray-800 mr-3 text-xl"
                    >
                        <FaArrowLeft className="w-4 h-4" /> {/* Arrow icon */}
                    </button>
                    <h2 className="text-2xl font-weight-600 text-gray-800 ">
                        Room Details
                    </h2>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl shadow-sm mb-6">
                    <div className="bg-violet-100 text-violet-700 p-3 rounded-full">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path d="M4 12V4h16v8M4 12v8h16v-8M4 12h16" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-weight-600">{rooms?.name}</h3>
                        <p className="text-sm text-gray-500">
                            {rooms?.added_on.substring(0, 10)}
                        </p>
                    </div>
                </div>

                <div>
                    <GenericDataTable
                        title="All Guests"
                        custom_tabs={["Added By Scan Documents", "Added By Passport", "Added By TCK"]}
                        activeTab={activeTab}
                        tabs={pageTabs}
                        loading={false}
                        onTabChange={handleTabChange}
                        data={guests}
                        columns={guestColumns}
                        pageSize={5}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        emptyStateImages={{
                            "All Guests": "/images/No Guests.svg"
                        }}
                    // customTabFilter={(guest, tab) => guest.tab === tab}
                    />
                </div>
            </div>

            {/* All Guests Table */}
        </div>
    );
}
