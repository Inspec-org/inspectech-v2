"use client";
import React from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Image from "next/image";

type User = {
  id: number;
  user: {
    image: string;
    name: string;
    role: string;
  };
  userName: string;
  emailAddress: string;
  PhoneNumber: number;
  AddedRooms: number;
  AddedGuests: number;
  Date:string;
  Action: string;
};

interface Props {
  user: User;
}

export default function UserMetaCard({ user }: Props) {
  const { isOpen, openModal, closeModal } = useModal();

  const handleSave = () => {
    console.log("Saving changes...");
    closeModal();
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl  lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full ">
              <Image
                width={80}
                height={80}
                src={user.user.image}
                alt={user.user.name}
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 font-raleway  xl:text-left">
                {user.user.name}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-md text-gray-500  font-raleway ">
                  #{user.id}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300  xl:block"></div>
                <p className="text-md text-gray-500  font-raleway ">
                  {user.Date}
                </p>
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              <button className="bg-red-500 hover:bg-red-600 w-[150px] text-white font-semibold px-4 py-2 rounded-md font-raleway " >
                Delete User
              </button>
            
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4  lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800  font-raleway ">
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
    </>
  );
}
