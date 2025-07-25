"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { buildRequestBody } from "@/utils/apiWrapper";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "react-toastify";
import Button from "../ui/button/Button";
import { useRouter } from "next/navigation";


export default function ResetPassword() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true);
        const email = sessionStorage.getItem("email")
        const token = sessionStorage.getItem("token")

        const payload = buildRequestBody({ email, token, "new_password": password });
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        try {
            const response = await fetch("/api/auth/forget", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Server Error:", result.message);
                return;
            }
            router.push("/signin")
            // setIsApiSe  nt(true)
            // setCooldown(30);

        } catch (error) {
            console.error("Network Error:", error);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
            <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
                <Link
                    href="/signin"
                    className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700  "
                >
                    <ChevronLeftIcon />
                    Go Back
                </Link>
            </div>
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm  sm:text-title-md">
                            Reset Password?
                        </h1>
                        <p className="text-sm text-gray-500 ">
                            Enter your new password & confirm password to reset your password
                        </p>
                    </div>
                    <div className="mt-3">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5">
                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium">
                                        Password <span className="text-error-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 border rounded-lg"
                                        />
                                        <span
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute z-30 right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                                        >
                                            {showPassword ? (
                                                <EyeIcon className="fill-gray-500" />
                                            ) : (
                                                <EyeCloseIcon className="fill-gray-500" />
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium">
                                        Confirm Password <span className="text-error-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm your password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 border rounded-lg"
                                        />
                                        <span
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                            className="absolute z-30 right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeIcon className="fill-gray-500" />
                                            ) : (
                                                <EyeCloseIcon className="fill-gray-500" />
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="mt-20">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isLoading}
                                        onClick={() => console.log("jhgf")}
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Reseting...
                                            </>
                                        ) : (
                                            'Continue'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>


                    </div>
                </div>
            </div>
        </div>
    );
}
