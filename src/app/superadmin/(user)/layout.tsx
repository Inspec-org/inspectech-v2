"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import DashboardAppHeader from "@/layout/DashboardAppHeader";
import { usePathname, useRouter } from "next/navigation";
import React, { useContext, useEffect } from "react";
import { UserContext } from "@/context/authContext";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useContext(UserContext);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/signin");
      return;
    }
    if (user.role !== "superadmin") {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "superadmin") return null;

  const isDepartmentsPage = (pathname === "/admin/departments" || pathname === "/user/departments" || pathname === "/superadmin/departments");

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[280px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      {!isDepartmentsPage && <AppSidebar />}
      {!isDepartmentsPage && <Backdrop />}

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${!isDepartmentsPage ? mainContentMargin : ""
          }`}
      >
        {/* Header */}
        {isDepartmentsPage ? <AppHeader /> : <DashboardAppHeader />}

        {/* {!isDepartmentsPage && (
          <div className="fixed top-4 right-4 z-50 lg:hidden">
            <button
              className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${isMobileOpen ? "" : "border border-gray-200 bg-white"}  text-gray-700 shadow-sm`}
              onClick={handleToggle}
              aria-label="Toggle Sidebar"
            >
              {isMobileOpen ? null : (
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor" />
                </svg>
              )}
            </button>
          </div>
        )} */}

        {/* Page Content */}
        <div className="p-4 mx-auto max-w-6xl md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}