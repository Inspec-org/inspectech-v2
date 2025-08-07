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
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
interface Link {
    id: string;
    check_in: string;
    check_out: string;
    number_of_guests: number;
    created_at: string;
    status: string;
    room_name: string;
    Action: string;
}

export default function Links({ sessionId }: { sessionId: string }) {
    const params = useParams();
    const { isOpen, openModal, closeModal } = useModal();
    const searchParams = useSearchParams();
    const [totalLinks, setTotalLinks] = useState(0);
    const currentPage = parseInt(searchParams.get("link_page") || "1", 10);
    const [loading, setLoading] = useState(true)
    const { user } = useContext(UserContext);
    const [links, setLinks] = useState<Link[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const limit = 10;
    const pageTabs = useMemo(() => {
        const totalPages = Math.ceil(totalLinks / limit);
        return Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
    }, [totalLinks, limit]);
    const hasFetched = useRef(false);


    if (!sessionId) {
        redirect("/signin");
    }


    useEffect(() => {
        const timeout = setTimeout(() => {
            if (user?.email && !hasFetched.current) {
                const builtPayload = buildRequestBody({
                    email: user.email,
                    user_id: params.user_id,
                    limit,
                    page: currentPage,
                });
                fetchData(builtPayload);
                hasFetched.current = true;
            }
        }, 1500); // slight delay to prevent double run

        return () => clearTimeout(timeout);
    }, [user, currentPage]);

    const fetchData = async (payload: any) => {
        try {

            const response = await fetch("/api/allUsersFlow/get_all_links_of_user", {
                method: "POST",
                headers: {
                    Session: sessionId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            // Check if the response is not ok or the status is false in data
            if (!response.ok || result.data.status === false) {
                throw new Error(result.data.message); // Throw an error if conditions are met
            }

            // Process data if no error occurred
            const roomsWithSerial = result.data.data.links.map((room: any, index: number) => ({
                ...room,
                serialNumber: index + 1,
            }));

            setTotalLinks(result.data.data.total_links);
            setLinks(roomsWithSerial);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            toast.error(errorMessage); // Display error message to user
            console.error("Error occurred during data fetch:", err); // Log error for debugging

            setLinks([]); // Clear links or handle state as needed on error
        } finally {
            setLoading(false); // Set loading state to false whether success or error
        }
    };

    const handleDelete = async (id: string) => {
        const builtPayload = buildRequestBody({
            email: user?.email,
            link_id: id
        });
        try {
            closeModal();
            setLoading(true)
            const response = await fetch('/api/allUsersFlow/delete_link', {
                method: 'POST',
                headers: {
                    'Session': sessionId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(builtPayload),
            });
            const data = await response.json();
            if (!response.ok || data.data.status === false) throw new Error(data.data.message)
            setLinks((prevLinks) => prevLinks.filter((link) => link.id !== id));
            toast.success(data.data.message);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast.error(errorMessage);
        }
        finally{
            setLoading(false)
        }
    };


    const linkColumns: Column<Link>[] = [

        {
            header: "Generated On", accessor: "created_at",
            cell: (row) => row.created_at.substring(0, 10)
        },
        { header: "Check_in Date", accessor: "check_in" },
        { header: "Check_out Date", accessor: "check_out" },
        { header: "Room Name", accessor: "room_name" },
        { header: "Scanned Documents", accessor: "number_of_guests" },
        {
            header: "Action",
            accessor: "Action", // still needed for default access, won't be used in cell

            cell: (row) => <button className="text-[#F90404]  hover:underline" onClick={() => { openModal(); setSelectedId(row.id) }}>Delete</button>,
        },
    ];

    return (
        <>
            <div className="p-6">
                <GenericDataTable title="All Links" data={links} tabs={pageTabs} columns={linkColumns} pageSize={limit} currentPage={currentPage} loading={loading}
                    emptyStateImages={{
                        "Rooms": "/images/No Rooms.svg"
                    }}
                    // customTabFilter={(room, tab) => {
                    //     if (tab === "Full Rooms") return room.isFull;
                    //     if (tab === "Empty Rooms") return !room.isFull;
                    //     return true; // All Rooms
                    // }}
                    querykey="link_page"
                    setLoading={setLoading}
                />
            </div>
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] p-6 lg:p-10">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-4">Are you sure?</h2>
                    <p className="text-gray-600 mb-6">This action cannot be undone. Do you really want to delete this item?</p>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={(e) => {
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
