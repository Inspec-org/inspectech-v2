export interface AccountCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
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
  id: string;
  name: string;
  company?: string;
  checked?: boolean;
  status?: 'Active' | 'Inactive';
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
  department: string;
}

