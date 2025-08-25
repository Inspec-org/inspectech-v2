"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { FaArrowLeft } from "react-icons/fa";
import { UserContext } from "@/context/authContext";
import { buildRequestBody } from "@/utils/apiWrapper";
import { toast } from "react-toastify";
import { Room, Guest } from "../../interfaces/types";

export default function Index({ sessionId, flag }: { sessionId: string, flag: boolean }) {

    const router = useRouter(); // Access the router
    const [currentPage, setCurrentPage] = useState(1);
    const [rooms, setRooms] = useState<Room | null>(null);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [totalGuests, setTotalGuests] = useState(0);
    const [search, setSearch] = useState("");
    const params = useParams();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const roomId = (params.room_id as string);
    const userId = (params.user_id as string);
    const propertyId = (params.property_id as string);
    const [loading, setLoading] = useState(true);
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
        { header: "DOB", accessor: "date_of_birth" },
        { header: "Gender", accessor: "sex" },
        { header: "Room no", accessor: "room_no" },
        { header: "Property", accessor: "property" },
        { header: "Document No", accessor: "document_number" },
        { header: "Document type", accessor: "document_type" },
    ];

    const handleBack = () => {
        const paramsString = searchParams.toString();

        let basePath = "";
        if (params.user_id && !flag) {
            basePath = `/allUsers/detailUser/${params.user_id}`;
        } else if (params.property_id && !flag) {
            basePath = `/allProperties/detailProperty/${params.property_id}`;
        }
        else if (params.room_id && flag) {
            basePath = `/allRooms`;
        }

        router.push(`${basePath}?${paramsString}`);
    };

    useEffect(() => {
        if (search) {
            setLoading(true);
            setCurrentPage(1)
        }
    }, [search]);
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (user?.email && (userId || propertyId) && roomId && !flag) {

                // Define type so TS knows about optional fields
                interface Payload {
                    email: string;
                    room_id: string;
                    guest_add_type: string;
                    user_id?: string;
                    property_id?: string;
                    search_query?: string;
                }

                const payloadData: Payload = {
                    email: user.email,
                    room_id: roomId,
                    guest_add_type: guestType,
                    search_query: search
                };

                let endpoint = "";

                if (userId) {
                    payloadData.user_id = userId;
                    endpoint = "/api/allUsersFlow/get_room_details";
                } else if (propertyId) {
                    payloadData.property_id = propertyId;
                    endpoint = "/api/allPropertiesFlow/get_room_details";
                }
                const builtPayload = buildRequestBody(payloadData);
                fetchRoom(endpoint, builtPayload);
            }
            else if (user?.email && roomId && flag) {
                const payloadData = {
                    email: user.email,
                    room_id: roomId,
                    guest_add_type: guestType,
                    search_query: search
                };
                const builtPayload = buildRequestBody(payloadData);
                fetchRoom("/api/allRoomsFlow/get_room_details", builtPayload);
            }
        }, 1500); // slight delay to prevent double run

        return () => clearTimeout(timeout);
    }, [user, userId, guestType, roomId, propertyId, search]);



    const fetchRoom = async (endpoint: string, payload: any) => {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Session': sessionId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok || data.data.status === false) throw new Error(data.data?.message || data.error)
            const resData = data.data.data;
            const transformedGuests = resData.guests.map((g: Guest) => ({
                name: `${g.first_name} ${g.last_name}`,
                sex: g.sex,
                date_of_birth: g.date_of_birth,
                document_number: g.document_number,
                document_type: g.document_type,
                room_no: g.room_no,
                property: g.property
            }));
            setRooms(resData.room);
            setTotalGuests(resData.total_guests);
            setGuests(transformedGuests);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            toast.error(errorMessage);
            console.error("Error fetching user:", err);
            setGuests([]);
        } finally {
            setLoading(false)
        }
    }
    const handleTabChange = (tab: string) => {
        setLoading(true)
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
                        loading={loading}
                        setLoading={setLoading}
                        onTabChange={handleTabChange}
                        data={guests}
                        columns={guestColumns}
                        pageSize={5}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        search={search}
                        setSearch={setSearch}
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
