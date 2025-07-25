"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { buildRequestBody } from "@/utils/apiWrapper";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";


export default function ForgetForm() {
    const [isApiSent, setIsApiSent] = useState(false);
    const [otp, setOtp] = useState(Array(5).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("")
    const router = useRouter();



    const handleOtpChange = (index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return; // only allow single digit numbers

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        const length = 5
        // Move to next input if not last and input is not empty
        if (value && index < length - 1) {
            // Use setTimeout to ensure state update is complete before focusing
            setTimeout(() => {
                inputRefs.current[index + 1]?.focus();
            }, 0);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (otp[index]) {
                // Clear current field
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            } else if (index > 0) {
                // Move focus to previous field and clear it
                const newOtp = [...otp];
                newOtp[index - 1] = "";
                setOtp(newOtp);
                setTimeout(() => {
                    inputRefs.current[index - 1]?.focus();
                }, 0);
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

        const newOtp = [...otp];
        const pasteArray = paste.split("");

        // Fill the OTP array with pasted digits
        for (let i = 0; i < length; i++) {
            newOtp[i] = pasteArray[i] || "";
        }

        setOtp(newOtp);

        // Focus the next empty field or the last field
        const nextEmptyIndex = newOtp.findIndex((digit, idx) => !digit && idx > 0);
        const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(paste.length, length - 1);

        setTimeout(() => {
            inputRefs.current[focusIndex]?.focus();
        }, 0);
    };

    // Handle input focus on click
    const handleInputClick = (index: number) => {
        // Focus the first empty field or the clicked field
        const firstEmptyIndex = otp.findIndex(digit => !digit);
        if (firstEmptyIndex !== -1 && firstEmptyIndex < index) {
            inputRefs.current[firstEmptyIndex]?.focus();
        }
    };


    const sendOTP = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = buildRequestBody({ email });

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
            setIsApiSent(true)


        } catch (error) {
            console.error("Network Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOTP = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const token = otp.join('')

        const payload = buildRequestBody({ email, token });

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
            console.log(result)
            router.push("/reset-password")


        } catch (error) {
            console.error("Network Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 lg:w-1/2 w-full">
            <div className="w-full max-w-md sm:pt-10 mx-auto my-5">
                <Link
                    href="/signin"
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
                                    <Input placeholder="info@gmail.com" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                {/* && !isOtpVerified */}
                                {isApiSent ? (
                                    <>
                                        <div className="text-right mb-6">
                                            <button
                                                onClick={sendOTP}
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
                                                        inputMode="numeric"
                                                        value={digit}
                                                        onPaste={handlePaste}
                                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                                        onClick={() => handleInputClick(index)}
                                                        className="w-12 h-12 text-secondary text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium disabled:opacity-50"
                                                        maxLength={1}
                                                        required
                                                        autoComplete="off"
                                                    />
                                                ))}
                                            </div>


                                        </div>

                                        <Button className="w-full mt-10" size="sm" onClick={verifyOTP}>

                                            {isLoading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Verifying...
                                                </>
                                            ) : (
                                                'Verify OTP'
                                            )}
                                        </Button>
                                    </>
                                ) : (
                                    <div>
                                        <Button className="w-full mt-10" size="sm" onClick={sendOTP}>
                                            {isLoading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Sending OTP Link
                                                </>
                                            ) : (
                                                'Send Reset Link'
                                            )}
                                        </Button>
                                    </div>
                                )}

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
