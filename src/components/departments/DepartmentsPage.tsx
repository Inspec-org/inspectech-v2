'use client'
import { Department, DepartmentCard } from "@/components/departments/DepartmentCard";
import { DepartmentSelector } from "@/components/departments/DepartmentSelector";
import { UserContext } from "@/context/authContext";
import { apiRequest } from "@/utils/apiWrapper";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Cookies from 'js-cookie';

interface VendorGroup {
  vendorId: string;
  vendorName: string;
  departments: Department[];
}

export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsByVendor, setDepartmentsByVendor] = useState<VendorGroup[]>([]);
  const { user } = useContext(UserContext)

  const getDepartments = async () => {
    try {
      const selectedVendorId = Cookies.get('selectedVendorId') || '';
      // For admin users, always show grouped departments (all vendors)
      // For superadmin/owner, show specific vendor's departments if vendorId is selected
      const endpoint = (user?.role === 'admin') 
        ? "/api/departments/get-departments"
        : selectedVendorId && (user?.role === 'superadmin' || user?.role === 'owner')
        ? `/api/departments/get-departments?vendorId=${encodeURIComponent(selectedVendorId)}`
        : "/api/departments/get-departments";
      const res = await apiRequest(endpoint);
      if (res.ok) {
        const json = await res.json();
        
        // Handle grouped response for admin/superadmin/owner users
        if (json.grouped && json.departmentsByVendor) {
          const processedGroups = json.departmentsByVendor.map((group: any) => ({
            vendorId: group.vendorId,
            vendorName: group.vendorName,
            departments: group.departments.map((dept: any) => {
              const icon = String(dept.icon || '');
              const base = icon === 'wrench' ? { image: 'wrench', imageType: 'icon' }
                : icon === 'bar-chart' ? { image: 'bar-chart', imageType: 'icon' }
                : icon === 'truck' ? { image: 'truck', imageType: 'icon' }
                : icon === 'building' ? { image: 'building', imageType: 'icon' }
                : icon === 'clipboard-list' ? { image: 'clipboard-list', imageType: 'icon' }
                : icon === 'cog' ? { image: 'cog', imageType: 'icon' }
                : icon === 'camera' ? { image: 'camera', imageType: 'icon' }
                : icon === 'package' ? { image: 'package', imageType: 'icon' }
                : icon === 'shield' ? { image: 'shield', imageType: 'icon' }
                : icon === 'layers' ? { image: 'layers', imageType: 'icon' }
                : { image: '/images/departments/van.svg', imageType: 'svg' };
              const color = String((dept.color || '').trim() || '#7C3AED');
              return { ...dept, ...base, color };
            })
          }));
          setDepartmentsByVendor(processedGroups);
          
          // Flatten all departments for backward compatibility
          const allDepartments = processedGroups.flatMap((group: any) => group.departments);
          setDepartments(allDepartments);
        } else {
          // Handle regular response when vendorId is provided
          const departmentsWithImages = json.departments.map((dept: any) => {
            const icon = String(dept.icon || '');
            const base = icon === 'wrench' ? { image: 'wrench', imageType: 'icon' }
              : icon === 'bar-chart' ? { image: 'bar-chart', imageType: 'icon' }
              : icon === 'truck' ? { image: 'truck', imageType: 'icon' }
              : icon === 'building' ? { image: 'building', imageType: 'icon' }
              : icon === 'clipboard-list' ? { image: 'clipboard-list', imageType: 'icon' }
              : icon === 'cog' ? { image: 'cog', imageType: 'icon' }
              : icon === 'camera' ? { image: 'camera', imageType: 'icon' }
              : icon === 'package' ? { image: 'package', imageType: 'icon' }
              : icon === 'shield' ? { image: 'shield', imageType: 'icon' }
              : icon === 'layers' ? { image: 'layers', imageType: 'icon' }
              : { image: '/images/departments/van.svg', imageType: 'svg' };
            const color = String((dept.color || '').trim() || '#7C3AED');
            return { ...dept, ...base, color };
          });
          setDepartments(departmentsWithImages);
          setDepartmentsByVendor([]);
        }
      }
    } catch (error) {
      ;
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(errorMessage);
      setDepartments([]);
      setDepartmentsByVendor([]);
    }
  };

  useEffect(() => {
    getDepartments();
  }, []);

  const handleDepartmentSelect = (department: Department, vendorId?: string) => {
    const role = String(user?.role || 'superadmin');
    const target = (role === "superadmin" || role === "owner") ? "/superadmin/dashboard" : `/${role}/dashboard`;
    Cookies.set('selectedDepartment', department.name || '');
    Cookies.set('selectedDepartmentId', department._id || '');
    if (vendorId) {
      Cookies.set('selectedVendorId', vendorId);
    }
    window.dispatchEvent(new CustomEvent("selectedDepartmentChanged", { detail: department.name }));
    router.push(target);
  };

  // For admin and superadmin users with grouped departments, render grouped view
  if ((user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'owner') && departmentsByVendor.length > 0) {
    return (
      <div className="mt-4">
        <div className="max-w-6xl mx-auto h-full flex flex-col justify-center">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FAF5FF] from-[0%] to-[#FAF5FF] to-[60%] p-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-0 justify-between mb-8 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 rounded-lg">
                <div className="w-12 h-12 flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-purple-900">
                  Select Department
                </h1>
                <p className="text-sm text-purple-800 mt-1">
                  Choose a department to access its dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Vendor Groups */}
          {departmentsByVendor.map((group) => (
            <div key={group.vendorId} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{group.vendorName}</h2>
                <span className="flex-1 border-t border-gray-300"></span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {group.departments.map((department) => (
                  <div
                    key={department._id}
                    onClick={() => handleDepartmentSelect(department, group.vendorId)}
                    className="cursor-pointer"
                  >
                    <DepartmentCard department={department} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // For non-admin users or when no grouped data, use regular selector
  return (
    <DepartmentSelector
      company="Amazon.com, Inc."
      departments={departments}
      onDepartmentSelect={handleDepartmentSelect}
      getDepartments={getDepartments}
    />
  );
}