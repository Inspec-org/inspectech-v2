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
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
}

function GenericDataTable<T extends { id: number }>({
  title,
  tabs,
  activeTab,
  onTabChange,
  data,
  columns,
  pageSize = 5,
}: GenericDataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  // Filter data by search
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      {/* Header: Title + Tabs + Search */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {title && (
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          )}
          {tabs && tabs.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTabChange?.(tab)}
                  className={`px-3 py-1 rounded-md text-sm border ${
                    tab === activeTab
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
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
                  <td key={i} className="py-3 px-4">
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
    </div>
  );
}

export default GenericDataTable;
