'use client';

import React from 'react';
import Header from '@/components/dashboard/Header';
import { Department } from '@/components/departments/DepartmentCard';
import { Vendor } from '@/components/dashboard/Dashboard';
import { apiRequest } from '@/utils/apiWrapper';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

export default function DashboardAppHeader() {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null);
  const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(null);
  

  const getDepartments = async () => {
    try {
      const res = await apiRequest('/api/departments/get-departments');
      if (res.ok) {
        const json = await res.json();
        setDepartments(json.departments || []);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch departments';
      toast.error(msg);
      setDepartments([]);
    }
  };

  const getVendors = async () => {
    try {
      const res = await apiRequest('/api/vendors/get-vendors');
      if (res.ok) {
        const json = await res.json();
        setVendors(json.vendors || []);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch vendors';
      toast.error(msg);
      setVendors([]);
    }
  };

  React.useEffect(() => {
    getDepartments();
    getVendors();
  }, []);

  React.useEffect(() => {
    if (!departments.length) return;
    const isActive = (d: Department) => String(d.status ?? (d.isActive ? 'active' : 'inactive')).toLowerCase() === 'active';
    const active = departments.filter(isActive);
    const cookieId = Cookies.get('selectedDepartmentId');
    const cookieName = Cookies.get('selectedDepartment');
    const byId = cookieId ? active.find(d => String(d._id) === String(cookieId)) : undefined;
    const byName = !byId && cookieName ? active.find(d => d.name === cookieName) : undefined;
    const next = byId || byName || active[0] || null;
    setSelectedDepartment(next);
    if (next) {
      Cookies.set('selectedDepartment', next.name || '');
      Cookies.set('selectedDepartmentId', next._id || '');
    }
  }, [departments]);

  React.useEffect(() => {
    if (!vendors.length) return;
    const cookieId = Cookies.get('selectedVendorId');
    const cookieName = Cookies.get('selectedVendor');
    const byId = cookieId ? vendors.find(v => String(v._id) === String(cookieId)) : undefined;
    const byName = !byId && cookieName ? vendors.find(v => v.name === cookieName) : undefined;
    const next = byId || byName || vendors[0] || null;
    setSelectedVendor(next);
    if (next) {
      Cookies.set('selectedVendor', next.name || '');
      Cookies.set('selectedVendorId', next._id || '');
    }
  }, [vendors]);

  return (
    <div className="sticky top-0 flex w-full z-40 ">
      <Header
        departments={departments}
        setSelectedDepartment={setSelectedDepartment}
        selectedDepartment={selectedDepartment || null}
        vendors={vendors}
        setSelectedVendor={setSelectedVendor}
        selectedVendor={selectedVendor || null}
      />
    </div>
  );
}