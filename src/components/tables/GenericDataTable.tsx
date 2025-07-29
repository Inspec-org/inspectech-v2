"use client";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { ClipLoader } from "react-spinners"

// Reusable column definition
export interface Column<T> {
  header: string | React.ReactNode;
  accessor: keyof T | string;
  cell?: (row: T) => React.ReactNode;
}

interface GenericDataTableProps<T> {
  title?: string;
  tabs: string[];
  custom_tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  data: T[]; // Make sure each item includes a `tab` field if using tab filtering
  columns: Column<T>[];
  pageSize?: number;
  customTabFilter?: (item: T, tab: string) => boolean;
  emptyStateImages?: { [title: string]: string };
  currentPage: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean
}

function GenericDataTable<T extends { id: string; tab?: string }>({
  title,
  tabs,
  custom_tabs,
  activeTab,
  onTabChange,
  customTabFilter,
  data,
  columns,
  emptyStateImages,
  pageSize = 10,
  currentPage,
  setCurrentPage,
  loading
}: GenericDataTableProps<T>) {
  // const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const tabFilteredData = useMemo(() => {
    if (!activeTab || !customTabFilter) return data;
    return data.filter((item) => customTabFilter(item, activeTab));
  }, [data, activeTab, customTabFilter]);

  // 🔍 Filter by search
  const filteredData = useMemo(() => {
    return tabFilteredData.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
    );
  }, [tabFilteredData, search]);

  const isEmpty = filteredData.length === 0;

  // 🔸 Derive fallback key if title is missing
  const fallbackTitle = !title && emptyStateImages
    ? Object.keys(emptyStateImages)[0]
    : undefined;

  // 🔹 Use title or fallback title
  const effectiveTitle = title || fallbackTitle;

  // 🔹 Get image path from effective title
  const emptyImage = effectiveTitle ? emptyStateImages?.[effectiveTitle] : null;

  // 🔹 Derive label from image path
  let entityLabel = "data";
  if (emptyImage) {
    const fileName = emptyImage.split("/").pop(); // e.g. "no-users.png"
    const baseName = fileName?.split(".")[0];     // e.g. "no-users"
    entityLabel = baseName?.split("-").pop() || "data"; // e.g. "users"
  }

  // 📄 Paginate the filtered data
  const totalPages = tabs.length;
  const currentData = filteredData;
  console.log(data)
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      {/* Header: Title + Tabs + Search */}

      <div
        className={`flex items-center justify-between flex-wrap gap-4 ${custom_tabs?.length ? "mb-4" : "mb-6"
          }`}
      >
        {/* Title*/}
        <div className={`flex ${tabs?.length ? "flex-col gap-2" : "items-center gap-4"}`}>
          {title && (
            <h1 className="text-2xl font-weight-600 text-gray-800  font-raleway">
              {title}
            </h1>
          )}
          {custom_tabs && custom_tabs.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-100 p-2  rounded-lg shadow-sm">
              {custom_tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTabChange?.(tab)}
                  className={`px-3 py-1 rounded-md text-sm border ${tab === activeTab
                    ? "bg-[var(--accent)] text-white"
                    : "text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="relative w-72">
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
          <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <ClipLoader />
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20">
          {emptyImage && (
            <img src={emptyImage} alt="No data" className="w-52 h-52 mb-4 object-contain" />
          )}
          <p className="text-lg text-gray-600 font-medium">
            {entityLabel?.toLowerCase()} added yet!!
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto border-t border-gray-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left font-raleway text-[var(--secondary)] border-b">
                  {columns.map((col, i) => (
                    <th key={i} className="py-2 px-4 font-medium">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    {columns.map((col, i) => (
                      <td key={i} className="py-3 px-4 font-raleway">
                        {col.cell ? col.cell(row) : (row as any)[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <Link href={`/allUsers/${Math.max(1, currentPage - 1)}`}>
              <button
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md text-sm disabled:opacity-50"
              >
                ← Previous
              </button>
            </Link>
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <Link key={tab} href={`/allUsers/${tab}`}>
                  <button
                    className={`w-8 h-8 rounded-md text-sm ${currentPage === Number(tab)
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {tab}
                  </button>
                </Link>
              ))}
            </div>
            <Link href={`/allUsers/${Math.min(totalPages, currentPage + 1)}`}>
              <button
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-md text-sm disabled:opacity-50"
              >
                Next →
              </button>
            </Link>
          </div>
        </>
      )}

    </div>
  );
}

export default GenericDataTable;
