"use client";

import Header from "@/components/superadmin/common/header";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import DashboardAppHeader from "@/layout/DashboardAppHeader";
import { useRouter } from "next/navigation";
import React, { useContext, useEffect } from "react";
import { UserContext } from "@/context/authContext";
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, loading } = useContext(UserContext);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace("/signin");
            return;
        }
        if (user.role !== "superadmin" && user.role !== "owner") {
            router.replace(`/${user.role}/dashboard`);
        }
    }, [user, loading, router]);

    if (loading || !user || (user.role !== "superadmin" && user.role !== "owner")) {
        return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-600">Redirecting...</div></div>;
    }

    return (
        <div className="min-h-screen ">
            <Header />
            <div className="pt-4 mx-auto max-w-7xl lg:px-4 xl:px-0">
                {children}
            </div>
        </div>
    );
}
