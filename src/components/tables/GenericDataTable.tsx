"use client";
import React, { useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";

// Reusable column definition
export interface Column<T> {
  header: string;
  accessor: keyof T | string;
  cell?: (row: T) => React.ReactNode;
}

interface GenericDataTableProps<T> {
  title?: string;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  data: T[]; // Make sure each item includes a `tab` field if using tab filtering
  columns: Column<T>[];
  pageSize?: number;
  customTabFilter?: (item: T, tab: string) => boolean;
  emptyStateImages?: { [title: string]: string };
}

function GenericDataTable<T extends { id: number; tab?: string }>({
  title,
  tabs,
  activeTab,
  onTabChange,
  customTabFilter,
  data,
  columns,
  emptyStateImages,
  pageSize = 5,
}: GenericDataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  

  // 🔸 Filter by active tab (optional)
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
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      {/* Header: Title + Tabs + Search */}
     
      <div
  className={`flex items-center justify-between flex-wrap gap-4 ${
    tabs?.length ? "mb-4" : "mb-6"
  }`}
>
  {/* Title and Tabs */}
  <div className={`flex ${tabs?.length ? "flex-col gap-2" : "items-center gap-4"}`}>
    {title && (
      <h1 className="text-2xl font-weight-600 text-gray-800  font-raleway">
        {title}
      </h1>
    )}

    {/* Tabs */}
    {tabs && tabs.length > 0&& (
      <div className="flex items-center gap-2 bg-gray-100 p-2  rounded-lg shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              onTabChange?.(tab);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-md font-medium capitalize font-raleway transition ${
              tab === activeTab
                ? "bg-[var(--accent)] text-white"
                : "text-gray-700 hover:bg-gray-200"
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


      {isEmpty ? (
  <div className="flex flex-col items-center justify-center py-20">
    {emptyImage && (
      <img src={emptyImage} alt="No data" className="w-52 h-52 mb-4 object-contain" />
    )}
    <p className="text-lg text-gray-600 font-medium">{entityLabel?.toLowerCase()} added yet!!</p>
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
      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 border rounded-md text-sm disabled:opacity-50"
      >
        ← Previous
      </button>
      <div className="flex gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`w-8 h-8 rounded-md text-sm ${
              currentPage === i + 1
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <button
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border rounded-md text-sm disabled:opacity-50"
      >
        Next →
      </button>
    </div>
  </>
)}

    </div>
  );
}

export default GenericDataTable;
