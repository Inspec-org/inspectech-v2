"use client";
import React from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

type Property = {
  id: number;
  property_name: string;
  host_name: string;
  kbs_email: string;
  kbs_password: string;
  created_at: string;
  Action: string;
};

interface Props {
  propertyDetails: Property | null;
}

export default function UserKBSCred({ propertyDetails }: Props) {
  const { isOpen, openModal, closeModal } = useModal();

  const handleSave = () => {
    console.log("Saving changes...");
    closeModal();
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl  lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center lg:mb-6 gap-5">
              <h4 className="text-xl font-semibold text-gray-800  ">
                Property Name
              </h4>
              <p className="text-lg font-medium text-gray-800 ">
                {propertyDetails?.property_name}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium ">Host Name</p>
                <p className="text-sm font-medium text-gray-500">{propertyDetails?.host_name}</p>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm font-medium ">Added on</p>
                <p className="text-sm font-medium text-gray-500">{propertyDetails?.created_at}</p>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm font-medium ">KBS Email</p>
                <p className="text-sm font-medium text-gray-500">{propertyDetails?.kbs_email}</p>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm font-medium ">Password</p>
                <p className="text-sm font-medium ">*********</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
