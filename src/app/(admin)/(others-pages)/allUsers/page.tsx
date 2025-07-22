"use client";

import GenericDataTable, { Column } from "../../../../components/tables/GenericDataTable";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { toast } from 'react-toastify';

type UserOrder = {
  id: number;
  user: {
    image: string;
    full_name: string;
    role: string;
  };
  userName: string;
  emailAddress: string;
  PhoneNumber: number;
  AddedRooms: number;
  AddedGuests: number;
  Action: string;
};

function ViewDetailsButton({ id }: { id: number }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/detailUser/${id}`)}
      className="text-blue-600 hover:underline"
    >
      View Details
    </button>
  );
}

// const tableData: UserOrder[] = [
//   {
//     id: 1,
//     user: {
//       image: "/images/user/user-01.jpg",
//       name: "Ammar Farooq",
//       role: "Admin",
//     },
//     userName: "ammar123",
//     emailAddress: "ammar@example.com",
//     PhoneNumber: 923001112233,
//     AddedRooms: 3,
//     AddedGuests: 6,
//     Action: "ViewDetails",
//   },
//   {
//     id: 2,
//     user: {
//       image: "/images/user/user-03.jpg",
//       name: "Muneeba Sarfaraz",
//       role: "Manager",
//     },
//     userName: "muneeba123",
//     emailAddress: "muneeba@example.com",
//     PhoneNumber: 923004445566,
//     AddedRooms: 2,
//     AddedGuests: 4,
//     Action: "ViewDetails",
//   },
//   {
//     id: 3,
//     user: {
//       image: "/images/user/user-02.jpg",
//       name: "Usman Ali",
//       role: "Receptionist",
//     },
//     userName: "usman123",
//     emailAddress: "usman@example.com",
//     PhoneNumber: 923007778899,
//     AddedRooms: 5,
//     AddedGuests: 10,
//     Action: "ViewDetails",
//   },
//   {
//     id: 4,
//     user: {
//       image: "/images/user/user-04.jpg",
//       name: "Zainab Khan",
//       role: "Support",
//     },
//     userName: "zainab123",
//     emailAddress: "zainab@example.com",
//     PhoneNumber: 923003336699,
//     AddedRooms: 1,
//     AddedGuests: 2,
//     Action: "ViewDetails",
//   },
//   {
//     id: 5,
//     user: {
//       image: "/images/user/user-05.jpg",
//       name: "Ali Raza",
//       role: "Moderator",
//     },
//     userName: "ali123",
//     emailAddress: "ali@example.com",
//     PhoneNumber: 923009995544,
//     AddedRooms: 4,
//     AddedGuests: 8,
//     Action: "ViewDetails",
//   },
// ];




// populate this with actual data

export default function OrdersPage() {
  const [tableData, setTableData] = useState<UserOrder[]>([]);
  const [totaluser, setTotaluser] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false)
  const limit = 5
  const pageTabs = useMemo(() => {
    const totalPages = Math.ceil(totaluser / limit);
    return Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
  }, [totaluser, limit]);
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/get_all_users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Session": "a00947f0b96d39ada08163b37d5020b8"
        },
        body: JSON.stringify({
          "api_key": "v10gv2f4vdfhbtymhsdfvweuyv678gv8erh",
          "data": {
            "email": "abdulrafay23butt@gmail.com",
            "page": currentPage,
            "limit": limit
          }
        }),

      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error)
      }
      setTotaluser(result.data.data.total_users);
      const apiData = result.data.data.users || [];
      const transformed: UserOrder[] = apiData.map((item: any) => ({
        id: item.id,
        user: {
          image: "/images/default_image.svg",
          full_name: item.full_name,
          role: "user", // or derive from item if available
        },
        userName: item.full_name,
        emailAddress: item.email,
        PhoneNumber: item.phone || "",
        AddedRooms: item.added_rooms,
        AddedGuests: item.added_guests,
        Action: "View" // or custom logic
      }));

      return transformed;
    } catch (error) {
      toast.error((error as Error)?.message || "Something went wrong");
      console.error("Error fetching data:", error);
      return [];
    }finally{
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData().then((data) => {
      setTableData(data);
    });
  }, [currentPage]);
  const columns: Column<UserOrder>[] = [
    {
      header: "User", // left aligned
      accessor: "user",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Image
            src={row.user?.image ? row.user.image : "/images/default_image.svg"}
            alt={row.user?.full_name || "User"}
            width={32}
            height={32}
            className="rounded-full"
          />
          <div>
            <div className="font-medium">{row.user.full_name}</div>
          </div>
        </div>
      ),
    },
    {
      header: <div className="text-center">Email Address</div>,
      accessor: "emailAddress",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.emailAddress}</div>
      ),
    },
    {
      header: <div className="text-center">Phone Number</div>,
      accessor: "PhoneNumber",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.PhoneNumber}</div>
      ),
    },
    {
      header: <div className="text-center">Added Rooms</div>,
      accessor: "AddedRooms",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.AddedRooms}</div>
      ),
    },
    {
      header: <div className="text-center">Added Guests</div>,
      accessor: "AddedGuests",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.AddedGuests}</div>
      ),
    },
    {
      header: <div className="text-center">Action</div>,
      accessor: "Action",
      cell: (row) => (
        <div className="text-center">
          <ViewDetailsButton id={row.id} />
        </div>
      ),
    },
  ];



  return (
    <div className="p-6">
      <GenericDataTable title="All Users" data={tableData} tabs={pageTabs} columns={columns} pageSize={limit} currentPage={currentPage} setCurrentPage={setCurrentPage} loading={loading} emptyStateImages={{
        "All Users": "/images/No Users.svg"
      }}
      />
    </div>
  );
}
