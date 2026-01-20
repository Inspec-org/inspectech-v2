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
        console.log(json);
        // Map departments with images and assign unique colors per page
        const palette = ['#7C3AED','#3B82F6','#059669','#E96513','#14B8A6','#F43F5E','#9333EA','#0EA5E9','#EF4444','#22C55E','#2563EB','#A855F7','#0EA5E9','#F59E0B'];
        const namedMap: Record<string,string> = { purple:'#7C3AED', blue:'#3B82F6', red:'#E96513', green:'#059669' };
        const cssColorRegex = /^(#([0-9a-f]{3}){1,2}|rgb[a]?\([\s\S]*\)|hsl[a]?\([\s\S]*\))$/i;
        const hash = (key: string) => { let h=0; for (let i=0;i<key.length;i++){ h=(h*31+key.charCodeAt(i))>>>0; } return h; };
        const used = new Set<number>();
        const assignColor = (dept: Department): string => {
          const raw = (dept.color || '').trim();
          const named = raw ? namedMap[raw.toLowerCase()] : undefined;
          if (named) return named;
          if (raw && cssColorRegex.test(raw)) return raw;
          let idx = hash(dept.id || dept.name || '') % palette.length;
          if (!used.has(idx)) { used.add(idx); return palette[idx]; }
          const step = 1 + (idx % (palette.length - 1));
          for (let a=0; a<palette.length; a++) { const cand = (idx + a*step) % palette.length; if (!used.has(cand)) { used.add(cand); return palette[cand]; } }
          return palette[idx];
        };
        const departmentsWithImages = json.departments.map((dept: Department) => {
          const lowerName = dept.name.toLowerCase();
          const base = lowerName.includes('trailer') ? { image: '/images/departments/van.svg', imageType: 'svg' } :
                       lowerName.includes('maintenance') ? { image: 'wrench', imageType: 'icon' } :
                       lowerName.includes('campaign') ? { image: 'bar-chart', imageType: 'icon' } :
                       { image: '/images/departments/van.svg', imageType: 'svg' };
          return { ...dept, ...base, color: assignColor(dept) };
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