"use client";
import UserAddressCard from "@/components/user-profile/UserKBSCred";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { notFound, usePathname, useSearchParams } from "next/navigation";
import { Metadata } from "next";
import { useContext, useEffect, useRef, useState } from "react";
import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import ActionButton from "@/components/common/ActionButton";
import { UserContext } from "@/context/authContext";
import { buildRequestBody } from "@/utils/apiWrapper";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import Rooms from "@/components/allUsersFlow/allRooms/Index";


type Property = {
  id: number;
  property_name: string;
  host_name: string;
  kbs_email: string;
  kbs_password: string;
  created_at:string;
  Action: string;
};

export default function PropertyDetails({ sessionId }: { sessionId: string }) {
    const router = useRouter(); // Access the router
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const params = useParams();
    const propertyId = params.property_id as string;
    const tab = searchParams.get("tab")
    const { user } = useContext(UserContext);
    const [propertyDetails, setPropertyDetails] = useState<Property | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const FetchedRef = useRef(false);;
    const [activeTab, setActiveTab] = useState(tab);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        if (user?.email && !FetchedRef.current && propertyId) {
            const builtPayload = buildRequestBody({
                email: user.email,
                property_id: propertyId
            });
            fetchData(builtPayload);
            FetchedRef.current = true;
        }
    }, [user, propertyId]);
    const fetchData = async (payload: any) => {
        try {
            const response = await fetch('/api/allPropertiesFlow/get_property_detail', {
                method: 'POST',
                headers: {
                    'Session': sessionId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok || data.data.status === false) throw new Error(data.data.message)
            console.log(data.data.data)
            setPropertyDetails(data.data.data);
        } catch (error) {
            console.error("Error fetching user:", error);
            return null;
        }
        finally {
            setLoading(false)
        }
    }
    const handleDelete = async () => {
        const builtPayload = buildRequestBody({
            email: user?.email,
            user_id: propertyId
        });
        try {
            const response = await fetch('/api/allUsersFlow/delete_user', {
                method: 'POST',
                headers: {
                    'Session': sessionId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(builtPayload),
            });
            const data = await response.json();
            if (!response.ok || data.data.status === false) throw new Error(data.data.message)
            toast.success(data.data.message);
            handleBack();
        } catch (error) {
            console.error("Error deleting user:", error);
            return null;
        }
    }
    const handleBack = () => {
        const user_page = searchParams.get("user_page") || "1";
        router.push(`/allUsers/?user_page=${user_page}`);
    };
    const handleTabChange = (newTab: string) => {
        const segments = pathname.split("/");
        segments[segments.length - 1] = newTab; // Replace last segment (the tab name)
        const newPath = segments.join("/");

        const query = searchParams.toString(); // e.g., page=2&activeTab=Rooms
        const fullPath = query ? `${newPath}?${query}` : newPath;

        router.push(fullPath); // preserves query params
        setActiveTab(newTab);  // update tab state
    };


    return (
        <div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
                <div className="flex items-center mb-5 border-b border-gray-200 pb-4">
                    {/* Back Button alongside Title */}
                    <button
                        onClick={handleBack}
                        className="text-gray-800  mr-3 text-xl" // Same color as title
                    >
                        <FaArrowLeft className="w-4 h-4" /> {/* Arrow Icon */}
                    </button>
                    <h2 className="text-2xl font-weight-600 text-gray-800 ">
                        Property Details
                    </h2>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="flex gap-3 bg-gray-100 p-2 rounded-lg shadow-sm">
                        {["overview", "rooms"].map((tab) => (
                            <button
                                key={tab}
                                className={`px-4 py-2 rounded-md font-medium capitalize transition ${activeTab === tab
                                    ? "bg-[var(--accent)] text-white"
                                    : "text-gray-700 hover:bg-gray-200"
                                    }`}
                                onClick={() => handleTabChange(tab)}
                            >
                                {tab === "overview"
                                    ? "Overview"
                                    : "Rooms"
                                }
                            </button>
                        ))}
                    </div>
                </div>


                {/* Tab Panels */}
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        {loading && (
                            <div className="flex justify-center items-center">
                                <ClipLoader color="#465fff" size={30} />
                            </div>
                        )}
                        <UserAddressCard propertyDetails={propertyDetails} />
                    </div>
                )}

                {activeTab === "rooms" && (

                    <Rooms sessionId={sessionId} />
                )}

                {/* {activeTab === "links" && (
                    <Links sessionId={sessionId} />
                )} */}
            </div>
        </div>
    );
}
