import { LogOut } from 'lucide-react';
import React from 'react'

const Header: React.FC = () => {
    return (
        <header className="bg-linear-to-r from-[#6D28D9] to-[#3730A3] text-white py-4 px-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className=''>
                    <h1 className="text-xl font-bold">InspecTech Onboarding Console</h1>
                    <p className="text-[#F3E8FF] text-xs font-light mt-1">Advanced Inventory Monitoring & Analytics Suite</p>
                </div>
                <button className="flex items-center gap-2 text-white hover:text-purple-200 transition-colors">
                    <LogOut size={18} />
                    <span className="text-sm">Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header
