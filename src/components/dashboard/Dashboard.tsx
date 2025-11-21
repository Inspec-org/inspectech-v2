'use client'
import React, { Suspense, useContext, useEffect } from 'react'
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
import { UserContext } from '@/context/authContext';

export interface Vendor {
    _id: string;
    username: string;
}

export interface stats {
    total: number;
    passPercentage: string;
    failPercentage: string;
    needsReviewPercentage: string;
}
interface monthlyData {
    pass: number,
    fail: number
}
export interface monthlyInspection {
    monthly: monthlyData[];
    quarterly: monthlyData[];
    annually: monthlyData[];
}

interface overallInspection {
    passRate: string;
    passCount: number;
    failCount: number;
}

export interface recentInspection {
    id: string;
    unitId: string;
    inspectionStatus: string;
    vendor: string;
    type: string;
    location: string;
    inspector: string;
    date: string;
    duration: string;
}

interface dashboadrData {
    stats: stats;
    monthlyInspection: monthlyInspection;
    overall: overallInspection;
}
interface recentData {
    recent: recentInspection[]
}

function Dashboard() {

    const [departments, setDepartments] = React.useState<Department[]>([]);
    const [vendors, setVendors] = React.useState<Vendor[]>([]);
    const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null);
    const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(vendors[0]);
    const [dashboardData, setDashboardData] = React.useState<dashboadrData>();
    const [recentData, setRecentData] = React.useState<recentData>();
    const [loading, setLoading] = React.useState(true);
    const [recentloading, setRecentLoading] = React.useState(true);
    const { user } = useContext(UserContext);

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

    const getRecent = async () => {
        const vendorId = sessionStorage.getItem('selectedVendorId')
        const departmentId = sessionStorage.getItem('selectedDepartmentId')
        try {
            setRecentLoading(true)
            const res = await apiRequest(("/api/dashboard/get_recent_inspections"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ vendorId, departmentId })
            });
            if (res.ok) {
                const json = await res.json();
                console.log(json)
                setRecentData(json.dashboard);
            }
        } catch (error) {
            console.error('Error fetching recent inspections', error);
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            toast.error(errorMessage);
        }
        finally {
            setRecentLoading(false)
        }
    }

    useEffect(() => {
        const getStats = async () => {
            const vendorId = sessionStorage.getItem('selectedVendorId')
            const departmentId = sessionStorage.getItem('selectedDepartmentId')
            try {
                const res = await apiRequest(("/api/dashboard/allData"), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ vendorId, departmentId })
                });
                if (res.ok) {
                    const json = await res.json();
                    console.log(json)
                    setDashboardData(json.dashboard);
                }
            } catch (error) {
                console.error('Error fetching dashboard Data:', error);
                const errorMessage = error instanceof Error ? error.message : 'An error occurred';
                toast.error(errorMessage);
            }
            finally {
                setLoading(false)
            }
        }

        if (selectedDepartment && selectedVendor) {
            getStats();
            getRecent();
        }
    }, [selectedDepartment, selectedVendor]);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <h1 className='font-bold text-2xl px-2 py-3'>Dashboard</h1>
            <div className='w-full bg-white space-y-4 p-4 shadow-2xl rounded-2xl'>
                <Header departments={departments} setSelectedDepartment={setSelectedDepartment} selectedDepartment={departments.find(d => d.name === selectedDepartment?.name)} vendors={vendors} setSelectedVendor={setSelectedVendor} selectedVendor={vendors.find(v => v.username === selectedVendor?.username)}
                />
                <StatsGrid data={dashboardData?.stats || null} loading={loading} />
                <div className="grid grid-cols-12 gap-4 items-stretch">
                    <div className="xl:col-span-8 col-span-12 h-full">
                        <div className="h-full">
                            <MonthlyInspectionChart data={dashboardData?.monthlyInspection} loading={loading} />
                        </div>
                    </div>
                    <div className="xl:col-span-4 col-span-12 h-full">
                        <div className="h-full">
                            <PassRateCard
                                passRate={Number(dashboardData?.overall?.passRate) || 0}
                                passed={Number(dashboardData?.overall?.passCount) || 0}
                                failed={Number(dashboardData?.overall?.failCount) || 0}
                                loading={loading}
                            />

                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-12 gap-4 items-stretch">
                    <div className="xl:col-span-8 col-span-12 h-full">
                        <div className="h-full">
                            <Inspections recentInspections={recentData?.recent || []} loading={recentloading} onRefresh={getRecent} />
                        </div>
                    </div>
                    <div className="xl:col-span-4 col-span-12 h-full">
                        <div className="h-full">
                            <QuickActions role={user?.role || ''}/>
                        </div>
                    </div>
                </div>


            </div>
        </Suspense>
    )
}

export default Dashboard
