'use client'
import React from 'react'
import Header from './Header'
import { StatsGrid } from './StatCard';
import MonthlyInspectionChart from './MonthlyInspection';
import PassRateCard from './PassRateCard';
import Inspections from './Inspections';
import QuickActions from './QuickAction';

function Dashboard() {
    const statsData = {
        totalInspections: 40,
        passRate: '32.5%',
        failRate: '0%',
        needsReview: '20%',
    };
    return (
        <div className='w-full bg-white space-y-4 p-4 shadow-2xl rounded-2xl'>
            <Header />
            <StatsGrid data={statsData} />
            <div className="grid grid-cols-12 gap-4 items-stretch">
                <div className="lg:col-span-8 col-span-12 h-full">
                    <div className="h-full">
                        <MonthlyInspectionChart />
                    </div>
                </div>
                <div className="lg:col-span-4 col-span-12 h-full">
                    <div className="h-full">
                        <PassRateCard passRate={100} passed={13} failed={0} />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-12 gap-4 items-stretch">
                <div className="lg:col-span-8 col-span-12 h-full">
                    <div className="h-full">
                        <Inspections />
                    </div>
                </div>
                <div className="lg:col-span-4 col-span-12 h-full">
                    <div className="h-full">
                        <QuickActions onActionClick={(id) => console.log('Clicked:', id)} />
                    </div>
                </div>
            </div>


        </div>
    )
}

export default Dashboard
