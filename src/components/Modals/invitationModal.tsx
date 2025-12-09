import React, { useEffect, useState } from 'react';
import { ArrowRight, Briefcase, Home } from 'lucide-react';
import { Modal } from '../ui/modal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';
import Image from 'next/image';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  role: string
};

type Department = {
  _id: string;
  name: string;
};

const InvitationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onUpdated,
  role
}) => {

  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [vendor, setVendor] = useState('');
  const handleSendInvitation = async () => {
    if (!firstName || !lastName || !email || !vendor) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/api/invitations', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          vendor,
          role: 'vendor_user'
        })
      });
      toast.success('Invitation sent successfully');
      onUpdated?.();
      onClose();
    } catch (error) {
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[450px]">
      <div className="p-6">
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-start gap-3">
            <Image src="/images/users/house.svg" alt='' width="26" height="26" />
            <h2 className="text-lg font-semibold text-gray-900">{role.charAt(0).toUpperCase() + role.slice(1)} User Invitation</h2>
          </div>
          <div className="flex-1">

            <p className="text-sm text-gray-600 mt-1">
              Send an email invitation for someone to join your organization as a {role} user. They will receive instructions to create their account.
            </p>
          </div>
        </div>

        {/* Vendor ID Badge */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-50 text-purple-700 text-sm font-medium">
            <span className="text-xs">{role} ID: 15</span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-600 text-white text-xs">
              <Briefcase className="w-3 h-3" />
              {role} User
            </span>
          </span>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              This will be their username for logging in to the system. Please use a valid company email.
            </p>
          </div>

          {/* Vendor Field */}
          {role != "admin" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Vendor
              </label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="US Purchase Trailers"
                className="w-full px-3 py-2 border border-purple-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm bg-purple-50"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                The vendor name will be displayed in inspection records.
              </p>
            </div>
          )}
          {/* User Role Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              User Role
            </label>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-3">
                <div className="w">
                  <Image src="/images/users/house.svg" alt='' width="33" height="33" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{role} User</div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {role==="admin"? "Will have access to data from vendors assigned to them": "Will only have access to their company data"}
                    {/* Will only have access to their company data */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invitation Process Info */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm mb-1">
                  Invitation Process
                </div>
                <div className="text-xs text-gray-600 leading-relaxed">
                  The user will receive an email with instructions to create their account.
                  This invitation will expire in <span className="font-semibold">48 hours</span> if not accepted.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendInvitation}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight className="w-4 h-4" />
            Send Invitation
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InvitationModal;