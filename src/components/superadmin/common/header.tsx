import { UserContext } from '@/context/authContext';
import { LogOut } from 'lucide-react';
import React, { useContext } from 'react'
import Swal from 'sweetalert2';

const Header: React.FC = () => {
    const {logout} = useContext(UserContext);
    return (
        <header className="bg-linear-to-r from-[#6D28D9] to-[#3730A3] text-white py-4 px-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className=''>
                    <h1 className="text-xl font-bold">InspecTech Onboarding Console</h1>
                    <p className="text-[#F3E8FF] text-xs font-light mt-1">Advanced Inventory Monitoring & Analytics Suite</p>
                </div>
                <button className="flex items-center gap-2 text-white hover:text-purple-200 transition-colors" onClick={async () => {
                    const result = await Swal.fire({
                        title: 'Logout?',
                        text: 'Are you sure you want to logout?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#EF4444',
                        cancelButtonColor: '#6B7280',
                        confirmButtonText: 'Logout',
                        cancelButtonText: 'Cancel'
                    });
                    if (result.isConfirmed) logout();
                }}>
                    <LogOut size={18} />
                    <span className="text-sm">Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header
