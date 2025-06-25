"use client";
import UserAddressCard from "@/components/user-profile/UserKBSCred";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { useState } from "react";
import GenericDataTable,{Column} from "@/components/tables/GenericDataTable";
import { useParams } from "next/navigation";

// export const metadata: Metadata = {
//   title: "User Profile | TailAdmin",
//   description: "Detailed user profile page.",
// };

const users = [
  {
    id: 1,
    user: {
      image: "/images/users/user1.jpg",
      name: "Ammar Farooq",
      role: "Admin",
    },
    userName:"ammar123",
    emailAddress: "ammar@example.com",
    PhoneNumber: 923001112233,
    AddedRooms: 3,
    AddedGuests: 6,
    Action: "ViewDetails",
  },
  {
    id: 2,
    user: {
      image: "/images/users/user2.jpg",
      name: "Muneeba Sarfaraz",
      role: "Manager",
    },
    userName:"muneeba123",
    emailAddress: "muneeba@example.com",
    PhoneNumber: 923004445566,
    AddedRooms: 2,
    AddedGuests: 4,
    Action: "ViewDetails",
  },
  {
    id: 3,
    user: {
      image: "/images/users/user3.jpg",
      name: "Usman Ali",
      role: "Receptionist",
    },
    userName:"usman123",
    emailAddress: "usman@example.com",
    PhoneNumber: 923007778899,
    AddedRooms: 5,
    AddedGuests: 10,
    Action: "ViewDetails",
  },
  {
    id: 4,
    user: {
      image: "/images/users/user4.jpg",
      name: "Zainab Khan",
      role: "Support",
    },
    userName:"zainab123",
    emailAddress: "zainab@example.com",
    PhoneNumber: 923003336699,
    AddedRooms: 1,
    AddedGuests: 2,
    Action: "ViewDetails",
  },
  {
    id: 5,
    user: {
      image: "/images/users/user5.jpg",
      name: "Ali Raza",
      role: "Moderator",
    },
    userName:"ali123",
    emailAddress: "ali@example.com",
    PhoneNumber: 923009995544,
    AddedRooms: 4,
    AddedGuests: 8,
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
}
const roomColumns: Column<Room>[] = [
  { header: "Serial Number", accessor: "serialNumber" },
  { header: "Room Name", accessor: "roomName" },
  { header: "Room ID", accessor: "roomId" },
  { header: "Guests", accessor: "guests" },
  { header: "Added on", accessor: "addedOn" },
  {
    header: "Action",
    accessor: "id", // still needed for default access, won't be used in cell
    cell: (row) => (
      <button
        // onClick={() => handleRoomAction(row)}
        className="text-blue-600 hover:underline"
      >
        View
      </button>
    ),
  },
];
const rooms: Room[] = [
    {
      id: 1,
      serialNumber: 1,
      roomName: "Deluxe Suite",
      roomId: "R101",
      guests: 2,
      addedOn: "2025-06-25",
    },
    {
      id: 2,
      serialNumber: 2,
      roomName: "Executive Room",
      roomId: "R102",
      guests: 3,
      addedOn: "2025-06-24",
    },
    {
      id: 3,
      serialNumber: 3,
      roomName: "Standard Room",
      roomId: "R103",
      guests: 1,
      addedOn: "2025-06-23",
    },
  ];

interface PageProps {
  params: {
    id: string;
  };
}


export default function Profile()
 {
const [roomactiveTab, setRoomActiveTab] = useState("Active");
    
const handleTabChange = (tab: string) => {
  setRoomActiveTab(tab); // Update the current active tab
};
 const params = useParams();
  const userId = parseInt(params.id as string);

//   const userId = parseInt(params.id);
  const user = users.find((u) => u.id === userId);
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) return notFound();

  return (
    <div>
        <div className="bg-accent text-white p-4">Accent Color Test</div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
        <h2 className="mb-5 text-xl font-semibold text-gray-800 ">User Details</h2>

        {/* Tabs */}
        <div className="mb-6">
  <div className="flex gap-3 bg-gray-100 p-2 rounded-lg shadow-sm">
    {["overview", "rooms", "links"].map((tab) => (
      <button
        key={tab}
        className={`px-4 py-2 rounded-md font-medium capitalize transition ${
          activeTab === tab
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
      pageSize={5}
         tabs={["All Rooms", "Full Rooms","Empty Rooms"]}
      activeTab={roomactiveTab}
       onTabChange={handleTabChange}
    />
                 )}

        {activeTab === "links" && (
          <div className="p-4 border rounded-xl text-sm text-gray-700">
            <p>Generated links will appear here (customize as needed).</p>
          </div>
        )}
      </div>
    </div>
  );
}
