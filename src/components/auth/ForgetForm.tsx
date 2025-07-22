"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useRef, useState } from "react";

export default function ForgetForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [isApiSent, setIsApiSent] = useState(true);
    const [otp, setOtp] = useState(Array(5).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleOtpChange = (index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return; // only allow single digit numbers

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input if not last and input is not empty
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (otp[index]) {
                // clear current field
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            } else if (index > 0) {
                // move focus to previous field
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const paste = e.clipboardData.getData("text").slice(0, length);
        if (!/^\d+$/.test(paste)) return; // allow only digits

        const newOtp = paste.split("");
        for (let i = 0; i < length; i++) {
            otp[i] = newOtp[i] || "";
        }
        setOtp([...otp]);

        // Focus last filled input
        const lastIndex = Math.min(paste.length, length - 1);
        inputRefs.current[lastIndex]?.focus();
    };

    return (
        <div className="flex flex-col flex-1 lg:w-1/2 w-full">
            {/* <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div> */}
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                            Forgot Password?
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Enter the email address linked to your account, and we’ll send you a link to reset your password.
                        </p>
                    </div>
                    <div>

                        <form>
                            <div className="space-y-4">
                                <div>
                                    <Label>
                                        Email <span className="text-error-500">*</span>{" "}
                                    </Label>
                                    <Input placeholder="info@gmail.com" type="email" />
                                </div>
                                {/* && !isOtpVerified */}
                                {isApiSent && (
                                    <>
                                        <div className="text-right mb-6">
                                            <button
                                                // onClick={handleSendOtp}
                                                // disabled={isLoading}
                                                className="text-brand-500 font-medium underline hover:text-blue-700 transition-colors disabled:opacity-50"
                                            >
                                                Send OTP
                                            </button>
                                        </div>
                                        <div className="mb-8">
                                            <div className="flex justify-center space-x-4 mb-6">
                                                {otp.map((digit, index) => (
                                                    <input
                                                        key={index}
                                                        id={`otp-${index}`}
                                                        ref={(el) => {
                                                            inputRefs.current[index] = el;
                                                        }}
                                                        type="text"
                                                        value={digit}
                                                        onPaste={handlePaste}
                                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                                        className="w-12 h-12 text-secondary text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium disabled:opacity-50"
                                                        maxLength={1}
                                                    // disabled={isLoading}
                                                    />
                                                ))}
                                            </div>


                                        </div>

                                        <button
                                            // onClick={handleVerifyOtp}
                                            // disabled={isLoading || otp.join('').length !== 5}
                                            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                        >
                                            {/* {isLoading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Verifying...
                                                </>
                                            ) : (
                                                'Verify OTP'
                                            )} */}
                                        </button>
                                    </>
                                )}
                                <div>
                                    <Button className="w-full" size="sm">
                                        Send Reset Link
                                    </Button>
                                </div>
                            </div>
                        </form>
                        <div className="mt-5">
                            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                                Wait, I remember my password.
                                <Link
                                    href="/signin"
                                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                >
                                    Click Here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
