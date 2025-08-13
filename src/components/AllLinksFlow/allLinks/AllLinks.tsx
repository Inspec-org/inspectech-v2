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
type LinkOrder = {
  id: string;
  property_name: string;
  host_name: string;
  room_name: string;
  created_at: string;
  number_of_guests: number;
};

export default function Links({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const pathname = usePathname()
  const searchParams = useSearchParams();
  const [tableData, setTableData] = useState<LinkOrder[]>([]);
  const [totaluser, setTotaluser] = useState(0);
  const [search, setSearch] = useState("");
  const currentPage = parseInt(searchParams.get("link_page") || "1", 10);
  const [loading, setLoading] = useState(true)
  const { user } = useContext(UserContext);
  const hasFetchedRef = useRef(false);
  const limit = 10;
  const pageTabs = useMemo(() => {
    const totalPages = Math.ceil(totaluser / limit);
    return Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
  }, [totaluser, limit]);

  if (!sessionId) {
    redirect("/signin");
  }

  useEffect(() => {
    if (search) {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set("link_page", "1");
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
        fetchData(builtPayload);
      }
    }, 1500); // slight delay to prevent double run

    return () => clearTimeout(timeout);
  }, [user, currentPage, search]);
  const fetchData = async (payload: any) => {
    try {
      setLoading(true)
      const response = await fetch("/api/allLinksFlow/get_all_links", {
        method: "POST",
        headers: {
          "Session": sessionId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.data.status === false) {
        throw new Error(result.data.message);
      }

      setTotaluser(result.data.data.total_links);
      setTableData(result.data.data.links);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(errorMessage);
      console.log("error", err);
      setTableData([]);
      setTotaluser(0);
    } finally {
      setLoading(false)
    }
  };

  const columns: Column<LinkOrder>[] = [
    {
      header: <div className="text-center">Host Name</div>,
      accessor: "emailAddress",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.host_name}</div>
      ),
    },
    {
      header: <div className="text-center">Generated On</div>,
      accessor: "PhoneNumber",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.created_at.substring(0, 10)}</div>
      ),
    },
    {
      header: <div className="text-center">Room Name</div>,
      accessor: "AddedRooms",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.room_name}</div>
      ),
    },
    {
      header: <div className="text-center">Property Name</div>,
      accessor: "AddedRooms",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.property_name}</div>
      ),
    },
    {
      header: <div className="text-center">Scanned Doc</div>,
      accessor: "AddedGuests",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.number_of_guests}</div>
      ),
    },
    {
      header: <div className="text-center">Action</div>,
      accessor: "Action",
      cell: (row) => (
        <div className="text-center">
          <ActionButton link={`/allLinks/detailLink/${row.id}/?link_page=${currentPage}`} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <GenericDataTable title="All Links" data={tableData} tabs={pageTabs} columns={columns} pageSize={limit} currentPage={currentPage} loading={loading} setLoading={setLoading} querykey="link_page" search={search} setSearch={setSearch} emptyStateImages={{
        "All Users": "/images/No Users.svg"
      }}
      />
    </div>
  );
}
