"use client";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { FaExternalLinkSquareAlt, FaSearch } from "react-icons/fa";
import { ClipLoader } from "react-spinners"

// Reusable column definition
export interface Column<T> {
  header: string | React.ReactNode;
  accessor: keyof T | string;
  cell?: (row: T) => React.ReactNode;
}

interface GenericDataTableProps<T> {
  title?: string;
  title_font_size?: string
  tabs: string[];
  custom_tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  data: T[]; // Make sure each item includes a `tab` field if using tab filtering
  columns: Column<T>[];
  pageSize?: number;
  totalCount?: number
  setPageSize?: React.Dispatch<React.SetStateAction<number>>;
  customTabFilter?: (item: T, tab: string) => boolean;
  emptyStateImages?: { [title: string]: string };
  currentPage: number
  setCurrentPage?: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean,
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  querykey?: string
  min_height?:string
  search?: string
  setSearch?: React.Dispatch<React.SetStateAction<string>>
  onRowClick?: (row: T) => void
}

function GenericDataTable<T extends { id: string; tab?: string }>({
  title,
  title_font_size,
  tabs,
  min_height,
  custom_tabs,
  activeTab,
  onTabChange,
  customTabFilter,
  data,
  columns,
  totalCount,
  emptyStateImages,
  pageSize = 10,
  setPageSize,
  currentPage,
  setCurrentPage,
  loading,
  setLoading,
  querykey,
  search,
  setSearch,
  onRowClick
}: GenericDataTableProps<T>) {

  const router = useRouter();
  const searchParams = useSearchParams();

  const tabFilteredData = useMemo(() => {
    if (!activeTab || !customTabFilter) return data;
    return data.filter((item) => customTabFilter(item, activeTab));
  }, [data, activeTab, customTabFilter]);

  const goToPage = (page: number) => {
    if (querykey) {
      if (setLoading) {
        setLoading(true);
      }
      const params = new URLSearchParams(searchParams);
      // setCurrentPage(page)
      params.set(querykey, String(page)); // update dynamic key
      router.push(`?${params.toString()}`);
    }
  };

  const isEmpty = tabFilteredData.length === 0;

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
  const currentData = tabFilteredData;
  return (
    <div className="h-full">
      <div
        className={`flex items-center justify-between flex-wrap gap-4 ${custom_tabs?.length ? "mb-4" : "mb-6"
          }`}
      >
        {/* Title*/}
        <div className={`flex ${tabs?.length ? "flex-col gap-2" : "items-center gap-4"}`}>
          {title && (
            <h1 className={`${title_font_size ? title_font_size : 'text-2xl font-weight-600'}  text-gray-800  font-raleway`}>
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
        {/* <div className="relative w-72">
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              // setCurrentPage(1);
            }}
          />
          <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
        </div> */}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[200px]">
          <ClipLoader color="#465fff" size={30} />
        </div>
      ) : !loading && isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20">
          {/* {emptyImage && (
            <img src={emptyImage} alt="No data" className="w-52 h-52 mb-4 object-contain" />
          )}
          <p className="text-lg text-gray-600 font-medium">
            {entityLabel?.toLowerCase()} added yet!!
          </p> */}
          No Data
        </div>
      ) : (
        <>
          {/* Table */}
          <div className={`overflow-x-auto border-t border-gray-200 h-[${min_height}]`}>
            <table className="min-w-full text-sm">
              <thead>
                <tr className={`text-left font-raleway ${title !== "Recent Inspection Orders" ? "bg-[#F2EBFF] text-[#3730A3]" : ""} `}>
                  {columns.map((col, i) => (
                    <th key={i} className="py-2 px-4 font-medium text-center">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50" onClick={() => onRowClick?.(row)}>
                    {columns.map((col, i) => (
                      <td key={i} className="py-3 px-4 font-raleway text-center">
                        {col.cell ? col.cell(row) : (row as any)[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {title === "Recent Inspection Orders" ? (
            <div className="flex justify-between items-edn mt-6 text-[#6B65F2] text-sm">
              <div className="flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 cursor-pointer" />
                <p>Refresh</p>
              </div>
              <div className="flex items-center gap-2">
                <p>View All Inspections</p>
                <ExternalLink className="w-4 h-4 cursor-pointer" />
              </div>
            </div>
          ) :
            (
              <div className="flex sm:flex-row flex-col-reverse justify-between items-center mt-4 bg-[#F6F8FF] sm:px-2 sm:py-2 py-4 sm:gap-0 gap-2">
                {/* Left side: Showing results */}
                <div className="flex sm:flex-row flex-col sm:items-center sm:gap-4">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{((currentPage - 1) * pageSize) + 1}</span> to{" "}
                    <span className="font-semibold">{Math.min(currentPage * pageSize, tabFilteredData.length)}</span> of{" "}
                    <span className="font-semibold">{totalCount}</span> results
                  </div>
                  <div className="h-5 w-0.5 bg-black sm:block hidden" />
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Row per page:</span>
                    <select
                      className="border rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600 bg-white"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize &&  setPageSize(Number(e.target.value));
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                {/* Right: Page navigation */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage <= 1}
                    className="w-6 h-6 flex items-center justify-center border rounded text-sm disabled:opacity-30 hover:bg-gray-100 bg-[#9333EA1A]"
                  >
                    <ChevronsLeft className="w-4 h-4" color="#7522BB" />
                  </button>
                  <button
                    onClick={() => goToPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="w-6 h-6 flex items-center justify-center border rounded text-sm disabled:opacity-30 hover:bg-gray-100 bg-[#9333EA1A]"
                  >
                    <ChevronLeft className="w-4 h-4" color="#7522BB" />
                  </button>
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => goToPage(Number(tab))}
                      className={`w-6 h-6 rounded text-xs font-medium ${currentPage === Number(tab)
                        ? "bg-purple-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="w-6 h-6 flex items-center justify-center border rounded text-sm disabled:opacity-30 hover:bg-gray-100 bg-[#9333EA1A]"
                  >
                    <ChevronRight className="w-4 h-4" color="#7522BB" />
                  </button>
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    className="w-6 h-6 flex items-center justify-center border rounded text-sm disabled:opacity-30 hover:bg-gray-100 bg-[#9333EA1A]"
                  >
                    <ChevronsRight className="w-4 h-4" color="#7522BB" />
                  </button>
                </div>
              </div>
            )
          }

        </>
      )}

    </div >
  );
}

export default GenericDataTable;
