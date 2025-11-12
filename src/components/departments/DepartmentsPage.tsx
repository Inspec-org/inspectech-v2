'use client'
import { Department } from "@/components/departments/DepartmentCard";
import { DepartmentSelector } from "@/components/departments/DepartmentSelector";
import { useRouter } from "next/navigation";


export default function DepartmentsPage() {
  const departments: Department[] = [
    {
      id: '1',
      name: 'US Purchase Trailers',
      description: 'ACCESS DASHBOARD',
      icon: 'document',
      color: 'purple',
      isActive: true,
    },
    {
      id: '2',
      name: 'Canada Trailers',
      description: 'ACCESS DASHBOARD',
      icon: 'document',
      color: 'blue',
      isActive: true,
    },
    // {
    //   id: '3',
    //   name: 'Maintenance',
    //   description: 'ACCESS DASHBOARD',
    //   icon: 'document',
    //   color: 'red',
    //   isActive: true,
    // },
    // {
    //   id: '4',
    //   name: 'Campaign',
    //   description: 'ACCESS DASHBOARD',
    //   icon: 'document',
    //   color: 'green',
    //   isActive: true,
    // },
  ];
  const router=useRouter()

  const handleDepartmentSelect = (department: Department) => {
    console.log('Selected department:', department);
    router.push(`/dashboard`);
    // Navigate to department dashboard
  };

  return (
    <DepartmentSelector
      company="Amazon.com, Inc."
      departments={departments}
      onDepartmentSelect={handleDepartmentSelect}
    />
  );
}