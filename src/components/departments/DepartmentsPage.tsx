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
      const res = await apiRequest("/api/departments/get-departments");
      if (res.ok) {
        const json = await res.json();
        // Map departments with images based on name
        const departmentsWithImages = json.departments.map((dept: Department) => {
          const lowerName = dept.name.toLowerCase();
          if (lowerName.includes('trailer')) {
            return { ...dept, image: '/images/departments/van.svg', imageType: 'svg' };
          } else if (lowerName.includes('maintenance')) {
            return { ...dept, image: 'wrench', imageType: 'icon' };
          } else if (lowerName.includes('campaign')) {
            return { ...dept, image: 'bar-chart', imageType: 'icon' };
          }
          return { ...dept, image: '/images/departments/van.svg', imageType: 'svg' }; // default
        });
        setDepartments(departmentsWithImages);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(errorMessage);
      setDepartments([]);
    }
  };

  useEffect(() => {
    getDepartments();
  }, []);

  const handleDepartmentSelect = (department: Department) => {
    console.log('Selected department:', department);
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