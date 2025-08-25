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
type PropertyOrder = {
  id: string;
  property_name: string;
  host_name: string;
  created_at: string;
  room_count: number;
  kbs_email: string;
  KBS_password: string;
  action: string;
};

export default function Properties({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const pathname = usePathname()
  const searchParams = useSearchParams();
  const [tableData, setTableData] = useState<PropertyOrder[]>([]);
  const [totaluser, setTotaluser] = useState(0);
  const [search, setSearch] = useState("");
  const currentPage = parseInt(searchParams.get("property_page") || "1", 10);
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
      params.set("property_page", "1");
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
      const response = await fetch("/api/allPropertiesFlow/get_all_properties", {
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

      setTotaluser(result.data.data.total_properties);
      setTableData(result.data.data.properties);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(errorMessage);
      console.log("error", err);
    } finally {
      setLoading(false)
    }
  };

  const columns: Column<PropertyOrder>[] = [
    {
      header: <div className="text-center">Property Name</div>,
      accessor: "emailAddress",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.property_name}</div>
      ),
    },
    {
      header: <div className="text-center">Host Name</div>,
      accessor: "PhoneNumber",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.host_name}</div>
      ),
    },
    {
      header: <div className="text-center">Added On</div>,
      accessor: "AddedRooms",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.created_at.substring(0, 10)}</div>
      ),
    },
    {
      header: <div className="text-center">Added Rooms</div>,
      accessor: "AddedRooms",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.room_count}</div>
      ),
    },
    {
      header: <div className="text-center">KBS Email</div>,
      accessor: "AddedGuests",
      cell: (row) => (
        <div className="text-center text-[var(--secondary)]">{row.kbs_email}</div>
      ),
    },
    {
      header: <div className="text-center">KBS Password</div>,
      accessor: "AddedGuests",
      cell: (row) => (
        <div className="text-center">********</div>
      ),
    },
    {
      header: <div className="text-center">Action</div>,
      accessor: "Action",
      cell: (row) => (
        <div className="text-center">
          <ActionButton link={`/allProperties/detailProperty/${row.id}/?tab=${"overview"}&property_page=${currentPage}`} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <GenericDataTable title="All Properties" data={tableData} tabs={pageTabs} columns={columns} pageSize={limit} currentPage={currentPage} loading={loading} setLoading={setLoading} querykey="property_page" search={search} setSearch={setSearch} emptyStateImages={{
        "All Users": "/images/No Users.svg"
      }}
      />
    </div>
  );
}
