'use client'
import { Department } from "@/components/departments/DepartmentCard";
import { DepartmentSelector } from "@/components/departments/DepartmentSelector";
import { UserContext } from "@/context/authContext";
import { apiRequest } from "@/utils/apiWrapper";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Cookies from 'js-cookie';

export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const { user } = useContext(UserContext)

  const getDepartments = async () => {
    try {
      const selectedVendorId = Cookies.get('selectedVendorId') || '';
      const endpoint = selectedVendorId && user?.role === 'superadmin'
        ? `/api/departments/get-departments?vendorId=${encodeURIComponent(selectedVendorId)}`
        : "/api/departments/get-departments";
      const res = await apiRequest(endpoint);
      if (res.ok) {
        const json = await res.json();
        // Use color and icon from DB; apply minimal fallback only if missing
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
      }
    } catch (error) {
      ;
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(errorMessage);
      setDepartments([]);
    }
  };

  useEffect(() => {
    getDepartments();
  }, []);

  const handleDepartmentSelect = (department: Department) => {
    ;
    router.push(`dashboard?department=${department.name}`);
    Cookies.set('selectedDepartment', department.name || '');
    Cookies.set('selectedDepartmentId', department._id || '');
    window.dispatchEvent(new CustomEvent("selectedDepartmentChanged", { detail: department.name }));
  };

  return (
    <DepartmentSelector
      company="Amazon.com, Inc."
      departments={departments}
      onDepartmentSelect={handleDepartmentSelect}
      getDepartments={getDepartments}
    />
  );
}