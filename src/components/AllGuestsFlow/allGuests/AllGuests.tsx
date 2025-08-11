"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { use, useContext, useEffect, useMemo, useRef, useState } from "react";
import { notFound } from "next/navigation";
import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { FaArrowLeft } from "react-icons/fa";
import { UserContext } from "@/context/authContext";
import { buildRequestBody } from "@/utils/apiWrapper";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";

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
    room_no: number;
    property: string;
};

export default function AllGuests({ sessionId }: { sessionId: string }) {
    const { isOpen, openModal, closeModal } = useModal();
    const searchParams = useSearchParams();
    const currentPage = parseInt(searchParams.get("guest_page") || "1", 10);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [totalGuests, setTotalGuests] = useState(0);
    const router = useRouter();
    const pathname = usePathname()
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const { user } = useContext(UserContext);
    const [selectedId, setSelectedId] = useState<string | null>(null);
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
        {
            header: "Action",
            accessor: "Action", // still needed for default access, won't be used in cell

            cell: (row) => <button className="text-[#F90404]  hover:underline" onClick={() => { setSelectedId(row.id); openModal() }}>Delete</button>,
        },
    ];

    useEffect(() => {
        if (search) {
            setLoading(true);
            const params = new URLSearchParams(searchParams.toString());
            params.set("guest_page", "1");
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
            const response = await fetch('/api/allGuestsFlow/get_all_guests', {
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
                id: g.id,
                name: `${g.first_name} ${g.last_name}`,
                sex: g.sex,
                date_of_birth: g.date_of_birth,
                document_number: g.document_number,
                document_type: g.document_type,
                room_no: g.room_no,
                property: g.property
            }));

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

    const handleDelete = async (id: string) => {
        const builtPayload = buildRequestBody({
            email: user?.email,
            guest_id: id
        });
        try {
            closeModal();
            setLoading(true)
            const response = await fetch('/api/allGuestsFlow/delete_guest', {
                method: 'POST',
                headers: {
                    'Session': sessionId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(builtPayload),
            });
            const data = await response.json();
            if (!response.ok || data.data.status === false) throw new Error(data.data.message)
            setGuests((prevGuests) => prevGuests.filter((guest) => guest.id !== id));
            toast.success(data.data.message);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast.error(errorMessage);
        }
        finally {
            setLoading(false)
        }
    };

    return (
        <>
            <div className="p-6 space-y-6">
                {/* Room Header */}
                <div className="border rounded-2xl p-6 bg-white shadow">
                    {/* Back Button alongside Title */}

                    <div>
                        <GenericDataTable
                            title="All Guests"
                            tabs={pageTabs}
                            loading={loading}
                            setLoading={setLoading}
                            data={guests}
                            columns={guestColumns}
                            pageSize={5}
                            currentPage={currentPage}
                            emptyStateImages={{
                                "All Guests": "/images/No Guests.svg"
                            }}
                            querykey="guest_page"
                            search={search}
                            setSearch={setSearch}
                        // customTabFilter={(guest, tab) => guest.tab === tab}
                        />
                    </div>
                </div>

                {/* All Guests Table */}
            </div>
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] p-6 lg:p-10">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-4">Are you sure?</h2>
                    <p className="text-gray-600 mb-6">This action cannot be undone. Do you really want to delete this item?</p>

                    <div className="flex justify-center gap-4">
                        <button
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
                        </button>
                        <button
                            onClick={closeModal}
                            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
