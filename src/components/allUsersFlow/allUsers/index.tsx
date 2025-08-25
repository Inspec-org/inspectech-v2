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
type UserOrder = {
  id: string;
  user: {
    image: string;
    full_name: string;
  };
  emailAddress: string;
  phoneNumber: string;
  addedRooms: number;
  addedGuests: number;
  action: string;
};

export default function Index({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tableData, setTableData] = useState<UserOrder[]>([]);
  const [totaluser, setTotaluser] = useState(0);
  const currentPage = parseInt(searchParams.get("user_page") || "1", 10);
  const [loading, setLoading] = useState(true)
  const { user } = useContext(UserContext);
  const [search, setSearch] = useState("");
  const limit = 5;
  const pageTabs = useMemo(() => {
    const totalPages = Math.ceil(totaluser / limit);
    return Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
  }, [totaluser, limit]);

  if (!sessionId) {
    redirect("/signin");
  }

  useEffect(() => {
  if (search) {
    console.log("search")
    const params = new URLSearchParams(searchParams.toString());
    params.set("user_page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }
}, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (user?.email) {
        const builtPayload = buildRequestBody({
          email: user.email,
          limit,
          page: currentPage,
          search_query: search
        });
        console.log(builtPayload)
        fetchData(builtPayload);
      }
    }, 1000); // slight delay to prevent double run

    return () => clearTimeout(timeout);
  }, [user, currentPage, search]);
  const fetchData = async (payload: any) => {
    try {
      setLoading(true)
      const response = await fetch("/api/allUsersFlow/get_all_users", {
        method: "POST",
        headers: {
          "Session": sessionId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.data.status === false) {
        throw new Error(result.data?.message || result.error)
      }

      const transformedUsers: UserOrder[] = result.data.data.users.map((user: any) => ({
        id: user.id,
        user: {
          image: user.profile_image_url ?? "",
          full_name: user.full_name,
        },
        emailAddress: user.email,
        phoneNumber: user.phone,
        addedRooms: user.added_rooms,
        addedGuests: user.added_guests,
      }));

      setTotaluser(result.data.data.total_users);
      setTableData(transformedUsers);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(errorMessage);
      console.log("error", err);
      setTotaluser(0);
      setTableData([]);
    } finally {
      setLoading(false)
    }
  };

  const columns: Column<UserOrder>[] = [
    {
      header: "User", // left aligned
      accessor: "user",
      cell: (row) => (
        <div className="flex items-center gap-2 ">
          {/* {row.user?.image ? row.user.image :  || "User"} */}
          <div className="w-8 h-8">
            <Image
              src={row.user?.image || "/images/avatar.png"}
              alt={row.user?.full_name}
              width={32}
              height={32}
              className="rounded-full h-full w-full object-cover"
            />
          </div>
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
        <div className="text-center text-[var(--secondary)]">{row.phoneNumber}</div>
      ),
    },
    {
      header: <div className="text-center">Added Rooms</div>,
      accessor: "AddedRooms",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.addedRooms}</div>
      ),
    },
    {
      header: <div className="text-center">Added Guests</div>,
      accessor: "AddedGuests",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.addedGuests}</div>
      ),
    },
    {
      header: <div className="text-center">Action</div>,
      accessor: "Action",
      cell: (row) => (
        <div className="text-center">
          <ActionButton link={`/allUsers/detailUser/${row.id}/?user_page=${currentPage}&user_tab=overview`} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <GenericDataTable title="All Users" data={tableData} tabs={pageTabs} columns={columns} pageSize={limit} currentPage={currentPage} loading={loading} setLoading={setLoading} querykey="user_page" search={search} setSearch={setSearch} emptyStateImages={{
        "All Users": "/images/No Users.svg"
      }}
      />
    </div>
  );
}
