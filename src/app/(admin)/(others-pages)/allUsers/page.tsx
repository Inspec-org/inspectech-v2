"use client";

import GenericDataTable, { Column } from "../../../../components/tables/GenericDataTable";
import Image from "next/image";
import { useRouter } from "next/navigation";

type UserOrder = {
  id: number;
  user: {
    image: string;
    name: string;
    role: string;
  };
  userName:string;
  emailAddress: string;
  PhoneNumber: number;
  AddedRooms: number;
  AddedGuests: number;
  Action:string;
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

const tableData: UserOrder[] = [
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

  

  


// populate this with actual data

export default function OrdersPage() {
  const columns: Column<UserOrder>[] = [
    {
      header: "User",
      accessor: "user",
      cell: (row) => (
        
        <div className="flex items-center gap-2">
          <Image
            src={row.user.image}
            alt={row.user.name}
            width={32}
            height={32}
            className="rounded-full"
          />
          <div>
            <div className="font-medium">{row.user.name}</div>
            <div className="text-xs text-gray-500">{row.user.role}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Email Address",
      accessor: "emailAddress",
    },
    {
      header: "Phone Number",
      accessor: "PhoneNumber",
    },
    {
      header: "Added Rooms",
      accessor: "AddedRooms",
    },
    {
      header: "Added Guests",
      accessor: "AddedGuests",
    },
   {
  header: "Action",
  accessor: "Action",
  cell: (row) => <ViewDetailsButton id={row.id} />,
}
  ];

  return (
    <div className="p-6">
      <GenericDataTable title="All Users" data={tableData} columns={columns} pageSize={5} />
    </div>
  );
}
