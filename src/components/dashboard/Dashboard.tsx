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
import { set } from 'mongoose';

export interface Vendor {
    _id: string;
    username: string;
}

function Dashboard() {
    const searchParams = useSearchParams()
    const statsData = {
        totalInspections: 40,
        passRate: '32.5%',
        failRate: '0%',
        needsReview: '20%',
    };
    const [departments, setDepartments] = React.useState<Department[]>([]);
    const [vendors, setVendors] = React.useState<Vendor[]>([]);
    const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null);
    const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(vendors[0]);

    useEffect(() => {
        const department = sessionStorage.getItem("selectedDepartment");
        if (departments.length > 0) {
            console.log(department)
            const dept = departments.find(d => d.name === department) ?? null;
            console.log(dept);
            setSelectedDepartment(dept);

        }
    }, [departments]);
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

    const getVendors = async () => {
        try {
            const res = await apiRequest("/api/vendors/get-vendors");
            if (res.ok) {
                const json = await res.json();
                console.log(json)
                setVendors(json.vendors);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            toast.error(errorMessage);
            setDepartments([]);
        }
    };

    useEffect(() => {
        getVendors();
        getDepartments();
    }, []);
    useEffect(() => {
        setSelectedVendor(vendors[0]);
        sessionStorage.setItem('selectedVendor', vendors[0]?.username);
        sessionStorage.setItem('selectedVendorId', vendors[0]?._id || '');
    }, [vendors])
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <h1 className='font-bold text-2xl px-2 py-3'>Dashboard</h1>
            <div className='w-full bg-white space-y-4 p-4 shadow-2xl rounded-2xl'>
                <Header departments={departments} setSelectedDepartment={setSelectedDepartment} selectedDepartment={departments.find(d => d.name === selectedDepartment?.name)} vendors={vendors} setSelectedVendor={setSelectedVendor} selectedVendor={vendors.find(v => v.username === selectedVendor?.username)}
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
