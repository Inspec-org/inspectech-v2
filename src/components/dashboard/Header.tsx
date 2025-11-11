'use client';
import React, { useState } from 'react';
import { ChevronDown, Folder, Building2 } from 'lucide-react';

function Header() {
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);

  return (
    <div className="w-full flex items-center gap-6 bg-purple-50/60 px-6 py-3 border-b border-purple-100">
      {/* Department Section */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-purple-900 tracking-wide">
          DEPARTMENT
        </span>
        <div className="relative">
          <button
            onClick={() => setDepartmentOpen(!departmentOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-colors min-w-[220px]"
          >
            <Folder className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-gray-700 flex-1 text-left">
              US Purchase Trailers
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {departmentOpen && (
            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="py-1">
                <button className="w-full px-4 py-2 text-sm text-left hover:bg-purple-50 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-purple-600" />
                  US Purchase Trailers
                </button>
                <button className="w-full px-4 py-2 text-sm text-left hover:bg-purple-50 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-purple-600" />
                  Canada Trailers
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-purple-200"></div>

      {/* Vendor Section */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-purple-900 tracking-wide">
          VENDOR
        </span>
        <div className="relative">
          <button
            onClick={() => setVendorOpen(!vendorOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-colors min-w-[200px]"
          >
            <Building2 className="w-4 h-4 text-purple-600" />
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-700 flex-1 text-left">
              Current Company
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {vendorOpen && (
            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="py-1">
                <button className="w-full px-4 py-2 text-sm text-left hover:bg-purple-50 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Current Company
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;