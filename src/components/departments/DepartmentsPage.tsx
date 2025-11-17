'use client'
import { Department } from "@/components/departments/DepartmentCard";
import { DepartmentSelector } from "@/components/departments/DepartmentSelector";
import { apiRequest } from "@/utils/apiWrapper";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";


export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const getDepartments = async () => {
    try {
      const res = await apiRequest("/api/departments/get-departments");
      if (res.ok) {
        const json = await res.json();
        setDepartments(json.departments);
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
    router.push(`/dashboard?department=${department.name}`);
    // Navigate to department dashboard
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