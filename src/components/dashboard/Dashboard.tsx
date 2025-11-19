'use client'
import React, { Suspense, useEffect } from 'react'
import Header from './Header'
import { StatsGrid } from './StatCard';
import MonthlyInspectionChart from './MonthlyInspection';
import PassRateCard from './PassRateCard';
import Inspections from './Inspections';
import QuickActions from './QuickAction';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';
import { Department } from '../departments/DepartmentCard';
import { useSearchParams } from 'next/navigation';

function Dashboard() {
    const searchParams = useSearchParams()
    const statsData = {
        totalInspections: 40,
        passRate: '32.5%',
        failRate: '0%',
        needsReview: '20%',
    };
    const [departments, setDepartments] = React.useState<Department[]>([]);
    const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null);

    useEffect(() => {
        const departmentName = searchParams.get("department");
        if (departments.length > 0) {
            if (departmentName) {
                const dept = departments.find(d => d.name === departmentName) ?? null;
                setSelectedDepartment(dept);
            } else if (!selectedDepartment) {
                const defaultDept = departments.find(d => d.name === 'US Purchase Trailers') ?? null;
                setSelectedDepartment(defaultDept);
            }
        }
    }, [departments, searchParams, selectedDepartment]);
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
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <h1 className='font-bold text-2xl px-2 py-3'>Dashboard</h1>
            <div className='w-full bg-white space-y-4 p-4 shadow-2xl rounded-2xl'>
                <Header departments={departments} setSelectedDepartment={setSelectedDepartment} selectedDepartment={departments.find(d => d.name === selectedDepartment?.name)}
                />
                <StatsGrid data={statsData} />
                <div className="grid grid-cols-12 gap-4 items-stretch">
                    <div className="xl:col-span-8 col-span-12 h-full">
                        <div className="h-full">
                            <MonthlyInspectionChart />
                        </div>
                    </div>
                    <div className="xl:col-span-4 col-span-12 h-full">
                        <div className="h-full">
                            <PassRateCard passRate={100} passed={13} failed={0} />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-12 gap-4 items-stretch">
                    <div className="xl:col-span-8 col-span-12 h-full">
                        <div className="h-full">
                            <Inspections />
                        </div>
                    </div>
                    <div className="xl:col-span-4 col-span-12 h-full">
                        <div className="h-full">
                            <QuickActions onActionClick={(id) => console.log('Clicked:', id)} />
                        </div>
                    </div>
                </div>


            </div>
        </Suspense>
    )
}

export default Dashboard
