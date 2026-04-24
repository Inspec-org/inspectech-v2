export interface AccountCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconbgColor: string;
  content: string;
  buttonText?: string;
  buttonDisabled?: boolean;
  warningText?: string;
  onButtonClick?: () => void;
  isActive?: boolean;
  borderColor?: string;
}

export interface ManagementCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  borderColor?: string;
}

export interface AlertBannerProps {
  type: 'warning' | 'info';
  message: string;
}

export interface Department {
  _id?: string;
  id: string;
  name: string;
  company?: string;
  checked?: boolean;
  status?: 'Active' | 'Inactive' | 'active' | 'inactive';
}

export interface User {
  id: number;
  name: string;
  email: string;
  added: string;
  status: 'Active' | 'Inactive';
}

export interface Vendor {
  _id: string;
  name: string;
  status: 'Active' | 'Inactive';
}

export interface VendorCompany {
  id: number;
  name: string;
  vendorId: number;
  status: 'Active' | 'Inactive';
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  secondaryEmail: string;
  vendor?: string;
  vendorNames?: string[];
  departments?: string[];
  department?: string;
}

export type TablePaginationProps = {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};
