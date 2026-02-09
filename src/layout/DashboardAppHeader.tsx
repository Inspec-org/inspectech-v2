'use client';

import React, { useContext } from 'react';
import Header from '@/components/dashboard/Header';
import { Department } from '@/components/departments/DepartmentCard';
import { Vendor } from '@/components/dashboard/Dashboard';
import { apiRequest } from '@/utils/apiWrapper';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { UserContext } from '@/context/authContext';

export default function DashboardAppHeader() {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null);
  const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(null);
  const [vendorEnabledMap, setVendorEnabledMap] = React.useState<Record<string, boolean>>({});
  const { user } = useContext(UserContext)


  const getDepartments = async () => {
    try {
      const selectedVendorId = Cookies.get('selectedVendorId') || '';
      const endpoint = selectedVendorId && (user?.role === 'admin' || user?.role === 'superadmin')
        ? `/api/departments/get-departments?vendorId=${encodeURIComponent(selectedVendorId)}`
        : "/api/departments/get-departments";
      const res = await apiRequest(endpoint);
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
      const res1 = await apiRequest('/api/vendors/get-vendors?page=1&limit=1');
      if (!res1.ok) {
        setVendors([]);
        return;
      }
      const json1 = await res1.json();
      const total = Number(json1?.total ?? json1?.totalCount ?? (Array.isArray(json1?.vendors) ? json1.vendors.length : 0));
      const limit = Math.max(total, 1);
      const res2 = await apiRequest(`/api/vendors/get-vendors?page=1&limit=${limit}`);
      if (res2.ok) {
        const json2 = await res2.json();
        setVendors(Array.isArray(json2?.vendors) ? json2.vendors : []);
      } else {
        setVendors([]);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'An error occurred';
      toast.error(msg);
      setVendors([]);
    }
  };

  React.useEffect(() => {
    getDepartments();
    getVendors();
  }, []);

  React.useEffect(() => {
    if (!departments.length) {
      return;
    }
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
    console.log(cookieId, cookieName)
    console.log(vendors)
    const byId = cookieId ? vendors.find(v => String(v._id) === String(cookieId)) : undefined;
    console.log(byId)
    const byName = !byId && cookieName ? vendors.find(v => v.name === cookieName) : undefined;
    const next = byId || byName || vendors[0] || null;
    setSelectedVendor(next);
    if (next) {
      Cookies.set('selectedVendor', next.name || '');
      Cookies.set('selectedVendorId', next._id || '');
    }
  }, [vendors]);

  React.useEffect(() => {
    if (!(user?.role === 'admin' || user?.role === 'superadmin')) { setVendorEnabledMap({}); return; }
    if (!vendors.length) { setVendorEnabledMap({}); return; }
    (async () => {
      try {
        const entries = await Promise.all(vendors.map(async (v) => {
          const res = await apiRequest(`/api/departments/get-departments?vendorId=${encodeURIComponent(v._id)}&limit=1`);
          if (!res.ok) return [String(v._id), false] as [string, boolean];
          const j = await res.json().catch(() => ({}));
          const has = Array.isArray(j.departments) && j.departments.length > 0;
          return [String(v._id), has] as [string, boolean];
        }));
        setVendorEnabledMap(Object.fromEntries(entries));
      } catch {
        setVendorEnabledMap({});
      }
    })();
  }, [vendors, user]);

  React.useEffect(() => {
    if (!selectedVendor) return;
    getDepartments();
  }, [selectedVendor]);

  return (
    <div className="sticky top-0 flex w-full z-40 ">
      <Header
        departments={departments}
        setSelectedDepartment={setSelectedDepartment}
        selectedDepartment={selectedDepartment || null}
        vendors={vendors}
        setSelectedVendor={setSelectedVendor}
        selectedVendor={selectedVendor || null}
        vendorEnabledMap={vendorEnabledMap}
      />
    </div>
  );
}