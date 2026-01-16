"use client";

import Header from "@/components/superadmin/common/header";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import DashboardAppHeader from "@/layout/DashboardAppHeader";
import { usePathname } from "next/navigation";
import React from "react";
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <div className="min-h-screen ">
            <Header />
            {/* Page Content */}
            <div className="pt-4 mx-auto max-w-7xl lg:px-4 xl:px-0">
                {children}
            </div>
        </div>
    );
}