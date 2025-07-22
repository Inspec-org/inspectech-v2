"use client";

import { useParams, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useState } from "react";
import GenericDataTable, { Column } from "@/components/tables/GenericDataTable";
import { FaArrowLeft } from "react-icons/fa";

// 🧾 Types
interface Link {
  id: number;
  generatedLink: string;
  generatedOn: string;
  checkInDate: string;
  checkOutDate: string;
  roomName: string;
  scannedDocs: number;
  Action: string;
}

interface Guest {
  id: number;
  name: string;
  sex: string;
  dob: string;
  documentNo: string;
  documentType: string;
  issuingCountry: string;
  addedOn: string;

}


const links: Link[] = [
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

const scannedGuests: Guest[] = [
  {
    id: 1,
    name: "Gabler Alendra",
    sex: "Female",
    dob: "Apr 10, 2001",
    documentNo: "#12345",
    documentType: "Passport",
    issuingCountry: "Berlin",
    addedOn: "Apr 10, 2024",

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
  },
  {
    id: 4,
    name: "Mathoor Delii",
    sex: "Female",
    dob: "Apr 10, 2001",
    documentNo: "#12345",
    documentType: "Passport",
    issuingCountry: "Berlin",
    addedOn: "Apr 10, 2024",
  },
];

export default function DetailedLinkPage() {
  const router = useRouter(); // Access the router
  const [currentPage, setCurrentPage] = useState(1);
  const handleBack = () => {
    router.back(); // This takes the user to the previous page
  };
  const params = useParams();
  const linkId = parseInt(params.id as string);

  const link = links.find((l) => l.id === linkId);

  if (!link) return notFound();

  // 🔹 Columns
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
      <div className="border rounded-2xl p-6 ">
        <div className="flex items-center mb-5 border-b border-gray-200 pb-4">
          {/* Back Button alongside Title */}
          <button
            onClick={handleBack}
            className="text-gray-800 dark:text-white mr-3 text-xl" // Same color as title
          >
            <FaArrowLeft className="w-4 h-4" /> {/* Arrow Icon */}
          </button>
          <h2 className="text-2xl font-weight-600 text-gray-800 dark:text-white">
            User Details
          </h2>
        </div>

        <div className="border border-gray-300 bg-white p-6 mb-6 rounded-xl">
          {/* 🔹 Full-width heading */}
          <h3 className="text-xl font-weight-600 text-gray-800 mb-4">
            Basic Details
          </h3>

          {/* 🔹 Responsive 3-column grid for fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Generated Link</p>
              <p className="text-sm font-medium text-blue-600 truncate">
                {link.generatedLink}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Generated On</p>
              <p className="text-sm font-medium">{link.generatedOn}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Check-in Date</p>
              <p className="text-sm font-medium">{link.checkInDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Check-out Date</p>
              <p className="text-sm font-medium">{link.checkOutDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Room Name</p>
              <p className="text-sm font-medium">{link.roomName}</p>
            </div>
          </div>
        </div>


        <GenericDataTable
          title="Scanned Documents"
          tabs={["1"]}
          loading={false}
          data={scannedGuests}
          columns={guestColumns}
          pageSize={5}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          emptyStateImages={{
            "Scanned Documents": "/images/No Docs.svg",
          }}

        />
      </div>



    </div>
  );
}
