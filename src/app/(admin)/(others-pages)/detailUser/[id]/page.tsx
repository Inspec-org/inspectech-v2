"use client";
import UserAddressCard from "@/components/user-profile/UserKBSCred";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { useState } from "react";
import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";

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
    Date:"Apr 10,2025",
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
    Date:"Apr 10,2025",
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
    Date:"Apr 10,2025",
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
    Date:"Apr 10,2025",
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
    Date:"Apr 10,2025",
    Action: "ViewDetails",
  },
];

interface Room {
  id: number;
  serialNumber: number;
  roomName: string;
  roomId: string;
  guests: number;
  addedOn: string;
  isFull: boolean;
  Action: string;

}


const rooms: Room[] = [
  {
    id: 1,
    serialNumber: 1,
    roomName: "Deluxe Suite",
    roomId: "R101",
    guests: 2,
    addedOn: "2025-06-25",
    Action: "View Details",
    isFull: true
  },
  {
    id: 2,
    serialNumber: 2,
    roomName: "Executive Room",
    roomId: "R102",
    guests: 3,
    addedOn: "2025-06-24",
    Action: "View Details",
    isFull: false

  },
  {
    id: 3,
    serialNumber: 3,
    roomName: "Standard Room",
    roomId: "R103",
    guests: 1,
    addedOn: "2025-06-23",
    Action: "View Details",
    isFull: false

  },
];

interface GeneratedLink {
  id: number;
  generatedLink:string;
  generatedOn: string;
  checkInDate: string;
  checkOutDate: string;
  roomName: string;
  scannedDocs: number;
  Action: string;
}

const links: GeneratedLink[] = [
  {
    id: 1,
    generatedOn: "Apr 10, 2025",
    checkInDate: "Apr 10, 2025",
    checkOutDate: "Apr 15, 2025",
    roomName: "Living room 01",
    scannedDocs: 12,
    generatedLink: "www.scannedroom.pk",
    Action: "View Details"
  },
  {
    id: 2,
    generatedOn: "Apr 12, 2025",
    checkInDate: "Apr 12, 2025",
    checkOutDate: "Apr 16, 2025",
    roomName: "Living room 02",
    scannedDocs: 10,
    generatedLink: "www.scannedroom2.pk",
    Action: "View Details"
  }
];

interface PageProps {
  params: {
    id: string;
  };
}


function ViewDetailsButton({ id }: { id: number }) {
  const router = useRouter();
  // console.log("View Details");

  return (
    <button
      onClick={() => router.push(`/detailRoom/${id}`)}
      className="text-blue-600 hover:underline"
    >
      View Details
    </button>
  );
}

function ViewLinkDetailsButton({ id }: { id: number }) {
  const router = useRouter();


  return (
    <button
      onClick={() => router.push(`/detailLink/${id}`)}
      className="text-blue-600 hover:underline"
    >
      View Details
    </button>
  );
}




export default function Profile() {
const router = useRouter(); // Access the router

  const handleBack = () => {
    router.push('/allUsers');
  };


  const roomColumns: Column<Room>[] = [

    { header: "Serial Number", accessor: "serialNumber" },
    { header: "Room Name", accessor: "roomName" },
    { header: "Room ID", accessor: "roomId" },
    { header: "Guests", accessor: "guests" },
    { header: "Added on", accessor: "addedOn" },
    {
      header: "Action",
      accessor: "Action", // still needed for default access, won't be used in cell

      cell: (row) => <ViewDetailsButton id={row.id} />,
    },
  ];

  const linkColumns: Column<GeneratedLink>[] = [
    { header: "Generated On", accessor: "generatedOn" },
    { header: "Check-in Date", accessor: "checkInDate" },
    { header: "Check-Out Date", accessor: "checkOutDate" },
    { header: "Room Name", accessor: "roomName" },
    { header: "Scanned Documents", accessor: "scannedDocs" },
    {
      header: "Action",
      accessor: "Action",
      cell: (row) => <ViewLinkDetailsButton id={row.id} />
    },
  ];







  const [roomactiveTab, setRoomActiveTab] = useState("Active");

  const handleTabChange = (tab: string) => {
    setRoomActiveTab(tab); // Update the current active tab
  };
  const params = useParams();
  const userId = parseInt(params.id as string);
  const [currentPage, setCurrentPage] = useState(1);
  //   const userId = parseInt(params.id);
  const user = users.find((u) => u.id === userId);
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) return notFound();

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
                onClick={() => setActiveTab(tab)}
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
            <UserMetaCard user={user} />
            <UserInfoCard user={user} />
            <UserAddressCard user={user} />
          </div>
        )}

        {activeTab === "rooms" && (

          <GenericDataTable

            data={rooms} // your Room[] array
            columns={roomColumns}
            loading={false}
            pageSize={5}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            tabs={["All Rooms", "Full Rooms", "Empty Rooms"]}
            activeTab={roomactiveTab}
            onTabChange={handleTabChange}
            emptyStateImages={{
              "Rooms": "/images/No Rooms.svg"
            }}
            customTabFilter={(room, tab) => {
              if (tab === "Full Rooms") return room.isFull;
              if (tab === "Empty Rooms") return !room.isFull;
              return true; // All Rooms
            }}
          />
        )}

        {activeTab === "links" && (
          <GenericDataTable
            data={links}
            columns={linkColumns}
            loading={false}
            tabs={["1"]}
            pageSize={5}
            title="All Links"
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            emptyStateImages={{
              "All Links": "/images/No Links.svg"
            }}
          />
        )}
      </div>
    </div>
  );
}
