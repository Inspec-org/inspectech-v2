"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { notFound } from "next/navigation";
import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { FaArrowLeft } from "react-icons/fa";


interface Guest {
  id: number;
  name: string;
  sex: string;
  dob: string;
  documentNo: string;
  documentType: string;
  issuingCountry: string;
  addedOn: string;
  tab: string; // 'Scan', 'Passport', 'TCK'
}

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
    isFull: true,
  },
  {
    id: 2,
    serialNumber: 2,
    roomName: "Executive Room",
    roomId: "R102",
    guests: 3,
    addedOn: "2025-06-24",
    Action: "View Details",
    isFull: false,
  },
  {
    id: 3,
    serialNumber: 3,
    roomName: "Standard Room",
    roomId: "R103",
    guests: 1,
    addedOn: "2025-06-23",
    Action: "View Details",
    isFull: false,
  },
];

const allGuests: Guest[] = [
  {
    id: 1,
    name: "Gabler Alendra",
    sex: "Female",
    dob: "Apr 10, 2001",
    documentNo: "#12345",
    documentType: "Passport",
    issuingCountry: "Berlin",
    addedOn: "Apr 10, 2024",
    tab: "Added By Passport",
  },
  {
    id: 2,
    name: "Alex Sauud",
    sex: "Female",
    dob: "Apr 10, 2001",
    documentNo: "#12345",
    documentType: "TC ID",
    issuingCountry: "Berlin",
    addedOn: "Apr 10, 2024",
    tab: "Added By TCK",
  },
  {
    id: 3,
    name: "Samanthna",
    sex: "Female",
    dob: "Apr 10, 2001",
    documentNo: "#12345",
    documentType: "Passport",
    issuingCountry: "Berlin",
    addedOn: "Apr 10, 2024",
    tab: "Added By Passport",
  },
  {
    id: 4,
    name: "Aina Arif",
    sex: "Female",
    dob: "Apr 10, 2001",
    documentNo: "#12345",
    documentType: "TC ID",
    issuingCountry: "Berlin",
    addedOn: "Apr 10, 2024",
    tab: "Added By TCK",
  },
  {
    id: 5,
    name: "Mathoor Delii",
    sex: "Female",
    dob: "Apr 10, 2001",
    documentNo: "#12345",
    documentType: "Passport",
    issuingCountry: "Berlin",
    addedOn: "Apr 10, 2024",
    tab: "Added By Passport",
  },
];

export default function DetailRoomPage() {

  const router = useRouter(); // Access the router
  
   
  const params = useParams();
  const roomId = parseInt(params.id as string);
 const handleBack = () => {
      // router.push(`/detailUser/${roomId}`); 
      router.back();
    };
  const room = rooms.find((r) => r.id === roomId);
  const [activeTab, setActiveTab] = useState("Added By Passport");

  const guestColumns: Column<Guest>[] = [
    { header: "Guest Name", accessor: "name" },
    { header: "Sex", accessor: "sex" },
    { header: "DOB", accessor: "dob" },
    { header: "Document No", accessor: "documentNo" },
    { header: "Document type", accessor: "documentType" },
    { header: "Issuing Country", accessor: "issuingCountry" },
    { header: "Added on", accessor: "addedOn" },
  ];

  return (
     <div className="p-6 space-y-6">
      {/* Room Header */}
      <div className="border rounded-2xl p-6 bg-white shadow">
        {/* Back Button alongside Title */}
        <div className="flex items-center mb-5 border-b border-gray-200 pb-4">
          <button
            onClick={handleBack}
            className="text-gray-800 dark:text-white mr-3 text-xl"
          >
            <FaArrowLeft className="w-4 h-4" /> {/* Arrow icon */}
          </button>
          <h2 className="text-2xl font-weight-600 text-gray-800 dark:text-white">
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
            <h3 className="text-lg font-weight-600">{room?.roomName}</h3>
            <p className="text-sm text-gray-500">
              {room?.roomId} | {room?.addedOn}
            </p>
          </div>
        </div>

        <div>
          <GenericDataTable
            title="All Guests"
            tabs={["Added By Scan Documents", "Added By Passport", "Added By TCK"]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            data={allGuests}
            columns={guestColumns}
            pageSize={5}
            emptyStateImages={{
              "All Guests": "/images/No Guests.svg"
            }}
            customTabFilter={(guest, tab) => guest.tab === tab}
          />
        </div>
      </div>

      {/* All Guests Table */}
    </div>
  );
}
