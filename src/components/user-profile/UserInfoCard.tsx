"use client";
import React from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import {User} from "../interfaces/types"

interface Props {
  user: User | null;
}

export default function UserInfoCard({ user }: Props) {
  const { isOpen, openModal, closeModal } = useModal();

  const handleSave = () => {
    ;
    closeModal();
  };
  if (!user) return null;
  return (
    <div className="p-5 border border-gray-200 rounded-2xl  lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800  lg:mb-6 font-raleway">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-md text-gray-500  font-raleway">User Name</p>
              <p className="text-sm font-medium text-gray-800  font-raleway">
                {user.full_name} 
              </p>
            </div>

            <div>
              <p className="mb-2 text-md text-gray-500 ">Email address</p>
              <p className="text-sm font-medium text-gray-800 ">
                {user.email}
              </p>
            </div>

            <div>
              <p className="mb-2 text-md text-gray-500 ">Phone</p>
              <p className="text-sm font-medium text-gray-800 ">
                {user.phone}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4  lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800  font-raleway">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500  lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>

          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">



            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
