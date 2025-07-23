"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";

export default function ResetPassword() {
    const [showPassword, setShowPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    return (
        <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
            <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                    <ChevronLeftIcon />
                    Go Back
                </Link>
            </div>
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                            Reset Password?
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Enter your new password & confirm password to reset your password
                        </p>
                    </div>
                    <div className="mt-3">
                        <form>
                            <div className="space-y-5">
                                {/* <!-- Password --> */}
                                <div>
                                    <Label>
                                        Password<span className="text-error-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            placeholder="Enter your password"
                                            type={showPassword ? "text" : "password"}
                                        />
                                        <span
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                        >
                                            {showPassword ? (
                                                <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                                            ) : (
                                                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                                            )}
                                        </span>
                                    </div>
                                </div>
                                {/* <!-- Confirm Password --> */}
                                <div>
                                    <Label>
                                        Confirm Password<span className="text-error-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            placeholder="Enter your password"
                                            type={showPassword ? "text" : "password"}
                                        />
                                        <span
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                        >
                                            {showPassword ? (
                                                <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                                            ) : (
                                                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                                            )}
                                        </span>
                                    </div>
                                </div>
                                {/* <!-- Button --> */}
                                <div className="mt-20">
                                    <button className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
                                        Continue
                                    </button>
                                </div>
                            </div>
                        </form>

                        
                    </div>
                </div>
            </div>
        </div>
    );
}
