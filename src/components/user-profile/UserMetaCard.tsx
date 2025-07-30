"use client";
import React from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Image from "next/image";

type User = {
  id: string;
  profile_image_url: string;
  full_name: string;
  email: string;
  phone: number;
};

interface Props {
  user: User | null;
  handleDelete: (id: string) => void;
}

export default function UserMetaCard({ user, handleDelete }: Props) {
  const { isOpen, openModal, closeModal } = useModal();
  if (!user) return null;
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl  lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full ">
              <Image
                width={80}
                height={80}
                src={user.profile_image_url || "/images/avatar.png"}
                alt={user.full_name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 font-raleway  xl:text-left">
                {user.full_name}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">

                {/* <div className="hidden h-3.5 w-px bg-gray-300  xl:block"></div> */}
                <p className="text-md text-gray-500  font-raleway ">
                  {/* {user.Date} */}
                </p>
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              <button onClick={openModal} className="bg-red-500 hover:bg-red-600 w-[150px] text-white font-semibold px-4 py-2 rounded-md font-raleway " >
                Delete User
              </button>

            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4  lg:p-11">
          <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
          <p className="mb-6">Are you sure you want to delete this item?</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={()=>handleDelete(user.id)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
