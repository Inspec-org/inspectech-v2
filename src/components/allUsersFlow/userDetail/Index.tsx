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
import Rooms from "../allRooms/Index";
import { ClipLoader } from "react-spinners";
import Links from "../AllLinks/Links";
// export const metadata: Metadata = {
//   title: "User Profile | TailAdmin",
//   description: "Detailed user profile page.",
// };

const users = [
  {
    id: 1,
    user: {
      image: "/images/user/user-01.jpg",
      name: "Ammar Farooq",
      role: "Admin",
    },
    userName: "ammar123",
    emailAddress: "ammar@example.com",
    PhoneNumber: 923001112233,
    AddedRooms: 3,
    AddedGuests: 6,
    Date: "Apr 10,2025",
    Action: "ViewDetails",
  },
  {
    id: 2,
    user: {
      image: "/images/user/user-03.jpg",
      name: "Muneeba Sarfaraz",
      role: "Manager",
    },
    userName: "muneeba123",
    emailAddress: "muneeba@example.com",
    PhoneNumber: 923004445566,
    AddedRooms: 2,
    AddedGuests: 4,
    Date: "Apr 10,2025",
    Action: "ViewDetails",
  },
  {
    id: 3,
    user: {
      image: "/images/user/user-02.jpg",
      name: "Usman Ali",
      role: "Receptionist",
    },
    userName: "usman123",
    emailAddress: "usman@example.com",
    PhoneNumber: 923007778899,
    AddedRooms: 5,
    AddedGuests: 10,
    Date: "Apr 10,2025",
    Action: "ViewDetails",
  },
  {
    id: 4,
    user: {
      image: "/images/user/user-04.jpg",
      name: "Zainab Khan",
      role: "Support",
    },
    userName: "zainab123",
    emailAddress: "zainab@example.com",
    PhoneNumber: 923003336699,
    AddedRooms: 1,
    AddedGuests: 2,
    Date: "Apr 10,2025",
    Action: "ViewDetails",
  },
  {
    id: 5,
    user: {
      image: "/images/user/user-05.jpg",
      name: "Ali Raza",
      role: "Moderator",
    },
    userName: "ali123",
    emailAddress: "ali@example.com",
    PhoneNumber: 923009995544,
    AddedRooms: 4,
    AddedGuests: 8,
    Date: "Apr 10,2025",
    Action: "ViewDetails",
  },
];



type User = {
  id: string;
  profile_image_url: string;
  full_name: string;
  email: string;
  phone: number;
};



interface GeneratedLink {
  id: string;
  check_in: string;
  check_out: string;
  number_of_guests: number;
  created_at: string;
  status: string;
  room_name: string;
  Action: string;
}


interface PageProps {
  params: {
    id: string;
  };
}



export default function Index({ sessionId }: { sessionId: string }) {
  const router = useRouter(); // Access the router
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const params = useParams();
  const userId = params.user_id as string;
  const tab = searchParams.get("user_tab")
  const { user } = useContext(UserContext);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const FetchedRef = useRef(false);;
  const [activeTab, setActiveTab] = useState(tab);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (user?.email && !FetchedRef.current && userId) {
      const builtPayload = buildRequestBody({
        email: user.email,
        user_id: userId
      });
      fetchUser(builtPayload);
      FetchedRef.current = true;
    }
  }, [user, userId]);
  const fetchUser = async (payload: any) => {
    try {
      const response = await fetch('/api/allUsersFlow/get_user_detail', {
        method: 'POST',
        headers: {
          'Session': sessionId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || data.data.status === false) throw new Error(data.data.message)
      setUserDetails(data.data.data);
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
      user_id: userId
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
  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString()); // keep existing params
    params.set("user_tab", tab); // change tab value

    router.push(`?${params.toString()}`);
    setActiveTab(tab);
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
            User Details
          </h2>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-3 bg-gray-100 p-2 rounded-lg shadow-sm">
            {["overview", "rooms", "links"].map((tab) => (
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
                  : tab === "rooms"
                    ? "Rooms"
                    : "Generated Links"}
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
            <UserMetaCard user={userDetails} handleDelete={handleDelete} />
            <UserInfoCard user={userDetails} />
            {/* <UserAddressCard user={user} /> */}
          </div>
        )}

        {activeTab === "rooms" && (

          <Rooms sessionId={sessionId} apiEndpoint="/api/allUsersFlow/get_all_rooms_of_user" idKey="user_id" />
        )}

        {activeTab === "links" && (
          <Links sessionId={sessionId} />
        )}
      </div>
    </div>
  );
}
