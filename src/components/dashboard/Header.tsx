'use client';
import React, { useContext, useState } from 'react';
import { ChevronDown, Folder, Building2 } from 'lucide-react';
import { Department } from '../departments/DepartmentCard';
import { Vendor } from './Dashboard';
import { UserContext } from '@/context/authContext';
import Cookies from 'js-cookie';

function Header({
  departments,
  setSelectedDepartment,
  selectedDepartment,
  vendors,
  setSelectedVendor,
  selectedVendor,
}: {
  departments: Department[];
  setSelectedDepartment: React.Dispatch<React.SetStateAction<Department | null>>;
  selectedDepartment?: Department | null;
  vendors?: Vendor[] | null;
  setSelectedVendor: React.Dispatch<React.SetStateAction<Vendor | null>>;
  selectedVendor?: Vendor | null;
}) {
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);
  const { user } = useContext(UserContext);

  return (
    <div className="w-full flex flex-col md:flex-row flex-wrap md:items-center gap-6 bg-purple-50/60 px-6 py-3 border-b border-purple-100">
      {/* Department Section */}
      <div className="flex xl:flex-row flex-col xl:items-center gap-3">
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
              {selectedDepartment?.name || 'Select Department'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {departmentOpen && (
            <div className="absolute top-full mt-1 min-w-[220px] bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="py-1">
                {departments.map((dept) => (
                  <button
                    key={dept._id}
                    onClick={() => {
                      console.log('Selected department:', dept);
                      setSelectedDepartment(dept);
                      setDepartmentOpen(false);
                      Cookies.set('selectedDepartment', dept.name || '');
                      Cookies.set('selectedDepartmentId', dept._id || '');
                      window.dispatchEvent(new CustomEvent("selectedDepartmentChanged", { detail: dept.name }));
                    }}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-purple-50 flex items-center gap-2"
                  >
                    <Folder className="w-4 h-4 text-purple-600" />
                    {dept.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block h-8 w-px bg-purple-200"></div>

      {/* Vendor Section */}
      <div className="flex xl:flex-row flex-col xl:items-center gap-3">
        <span className="text-sm font-semibold text-purple-900 tracking-wide">
          VENDOR
        </span>
        <div className="relative">
          <button
            onClick={() => user?.role === 'admin' && setVendorOpen(!vendorOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-colors min-w-[200px] ${user?.role === 'admin' ? 'cursor-pointer' : 'cursor-auto'}`}
          >
            <Building2 className="w-4 h-4 text-purple-600" />
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-700 flex-1 text-left">
              {selectedVendor?.name || 'ABC Vendor'}
            </span>
            {user?.role === 'admin' && (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {vendorOpen && (
            <div className="absolute top-full mt-1 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="py-1">
                {vendors?.map((vendor) => (
                  <button
                    key={vendor._id}
                    onClick={() => {
                      console.log('Selected vendor:', vendor);
                      setSelectedVendor(vendor);
                      setVendorOpen(false);
                      console.log('Vendor ID:', vendor._id);
                      Cookies.set('selectedVendor', vendor.name || '');
                      Cookies.set('selectedVendorId', vendor._id || '');
                    }}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-purple-50 flex items-center gap-2"
                  >
                    <Building2 className="w-4 h-4 text-purple-600" />
                    {vendor.name}
                  </button>
                ))}
                {/* <button className="w-full px-4 py-2 text-sm text-left hover:bg-purple-50 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Current Company
                </button> */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;