'use client'
import React, { Suspense, useContext, useEffect } from 'react'
import { LayoutDashboard } from 'lucide-react';
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
import Cookies from 'js-cookie';

export interface Vendor {
    _id: string;
    name: string;
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
    const readCache = (key: string) => {
      try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (!obj || typeof obj !== 'object') return null;
        if (!obj.ts || obj.ts + 300000 < Date.now()) return null;
        return obj.data;
      } catch { return null; }
    };
    const writeCache = (key: string, data: any) => {
      try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
    };
    const [vendors, setVendors] = React.useState<Vendor[]>([]);
    const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null);
    const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(null);
    const [dashboardData, setDashboardData] = React.useState<dashboadrData>();
    const [recentData, setRecentData] = React.useState<recentData>();
    const [loading, setLoading] = React.useState(true);
    const [recentloading, setRecentLoading] = React.useState(true);
    const { user } = useContext(UserContext);

    useEffect(() => {
        const vendorId = Cookies.get('selectedVendorId') || '';
        const departmentId = Cookies.get('selectedDepartmentId') || '';
        if (vendorId && departmentId) {
            const cachedStats = readCache(`stats:${vendorId}:${departmentId}`);
            if (cachedStats) {
                setDashboardData(cachedStats);
                setLoading(false);
            }
            const cachedRecent = readCache(`recent:${vendorId}:${departmentId}`);
            if (cachedRecent) {
                setRecentData(cachedRecent);
                setRecentLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const department = Cookies.get("selectedDepartment");
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
        if (!vendors.length) return;

        const cookieVendorId = Cookies.get('selectedVendorId');
        const cookieVendorName = Cookies.get('selectedVendor');

        const byId = cookieVendorId
            ? vendors.find(v => String(v._id) === String(cookieVendorId))
            : undefined;

        const byName = !byId && cookieVendorName
            ? vendors.find(v => v.name === cookieVendorName)
            : undefined;

        const nextSelected = byId || byName || vendors[0];

        setSelectedVendor(nextSelected);
        Cookies.set('selectedVendor', nextSelected?.name || '');
        Cookies.set('selectedVendorId', nextSelected?._id || '');
    }, [vendors])

    useEffect(() => {
        const handleDept = () => {
            const departmentId = Cookies.get('selectedDepartmentId') || '';
            const dep = departments.find(d => String(d._id) === String(departmentId)) || null;
            setSelectedDepartment(dep);
        };
        const handleVendor = () => {
            const vendorId = Cookies.get('selectedVendorId') || '';
            const v = vendors.find(v => String(v._id) === String(vendorId)) || null;
            setSelectedVendor(v);
        };
        window.addEventListener('selectedDepartmentChanged', handleDept as EventListener);
        window.addEventListener('selectedVendorChanged', handleVendor as EventListener);
        return () => {
            window.removeEventListener('selectedDepartmentChanged', handleDept as EventListener);
            window.removeEventListener('selectedVendorChanged', handleVendor as EventListener);
        };
    }, [departments, vendors])

    const getRecent = async () => {
        const vendorId = Cookies.get('selectedVendorId') || ''
        const departmentId = Cookies.get('selectedDepartmentId') || ''
        const key = `recent:${vendorId}:${departmentId}`;
        const cached = readCache(key);
        if (cached) {
            setRecentData(cached);
            setRecentLoading(false);
            return;
        }
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
                setRecentData(json.dashboard);
                writeCache(key, json.dashboard);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            toast.error(errorMessage);
        }
        finally {
            setRecentLoading(false)
        }
    }

    useEffect(() => {
        const getStats = async () => {
            const vendorId = Cookies.get('selectedVendorId') || ''
            const departmentId = Cookies.get('selectedDepartmentId') || ''
            const key = `stats:${vendorId}:${departmentId}`;
            const cached = readCache(key);
            if (cached) {
                setDashboardData(cached);
                setLoading(false);
                return;
            }
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
                    setDashboardData(json.dashboard);
                    writeCache(key, json.dashboard);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An error occurred';
                toast.error(errorMessage);
            }
            finally {
                setLoading(false)
            }
        }
        console.log(selectedDepartment, selectedVendor)
        if (selectedDepartment && selectedVendor) {
            getStats();
            getRecent();
        }
    }, [selectedDepartment, selectedVendor]);

    return (
        <Suspense fallback={<div>Loading...</div>}>

            <div className='w-full bg-white space-y-4 p-4 shadow-2xl rounded-2xl'>
                <div className="flex items-center gap-3 p-2 border-b border-purple-100 bg-gradient-to-r from-[#FAF5FF] from-[0%] to-[#ded1eb] to-[100%] rounded-xl">
                    <div className="p-1.5 rounded-md ">
                        <LayoutDashboard className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-semibold text-gray-900">Dashboard</h1>
                       
                    </div>
                </div>
                {/* <Header departments={departments} setSelectedDepartment={setSelectedDepartment} selectedDepartment={departments.find(d => d.name === selectedDepartment?.name)} vendors={vendors} setSelectedVendor={setSelectedVendor} selectedVendor={vendors.find(v => v.name === selectedVendor?.name)}
                /> */}
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
                <div className=" items-stretch">
                    {/* <div className="xl:col-span-8 col-span-12 h-full">
                        <div className="">
                            <Inspections recentInspections={recentData?.recent || []} loading={recentloading} onRefresh={getRecent} />
                        </div>
                    </div> */}
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
