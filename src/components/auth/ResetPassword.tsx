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
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const commonPasswords = [
        'password', 'password123', '123456', '12345678', 'qwerty',
        'abc123', 'monkey', '1234567', 'letmein', 'trustno1',
        'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
        'ashley', 'bailey', 'shadow', '123123', '654321', "", " "
    ];

    const requirements = [
        { label: "At least 10 characters", valid: password.length >= 10 },
        { label: "At least one uppercase letter", valid: /[A-Z]/.test(password) },
        { label: "At least one lowercase letter", valid: /[a-z]/.test(password) },
        { label: "At least one number", valid: /\d/.test(password) },
        { label: "At least one special character (!@#$%^&*)", valid: /[!@#$%^&*]/.test(password) },
        { label: "Must not be a common password", valid: !commonPasswords.includes(password.toLowerCase()) },
    ];

    const satisfiedCount = requirements.filter(r => r.valid).length;
    const isPasswordValid = satisfiedCount >= 5;

    const calculatePasswordStrength = (pwd: string) => {
        let strength = 0;
        if (pwd.length >= 10) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/[a-z]/.test(pwd)) strength++;
        if (/\d/.test(pwd)) strength++;
        if (/[!@#$%^&*]/.test(pwd)) strength++;
        if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd) && /[!@#$%^&*]/.test(pwd)) strength++;
        return strength;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (!isPasswordValid) {
            toast.error("Please satisfy password requirements");
            return;
        }

        setIsLoading(true);
        const email = sessionStorage.getItem("email")
        const token = sessionStorage.getItem("token")
        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, newPassword: password })
            });

            const result = await response.json();

            if (!response.ok) {
                ;
                return;
            }
            toast.success(result.message)
            router.push("/signin")
            // setIsApiSe  nt(true)
            // setCooldown(30);

        } catch (error) {
            ;
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="elative p-6 rounded-2xl shadow-2xl bg-bg-grey">
            {/* <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
                <Link
                    href="/signin"
                    className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700  "
                >
                    <ChevronLeftIcon />
                    Go Back
                </Link>
            </div> */}
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-bold text-gray-800 text-xl">
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
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                setPasswordStrength(calculatePasswordStrength(e.target.value));
                                            }}
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

                                    {/* Password Strength & Requirements */}
                                    <div className="mt-4">
                                        {/* Strength Bars */}
                                        {password.length > 0 && (
                                            <>
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-sm font-semibold text-gray-800">Password Strength</span>
                                                    {passwordStrength >= 1 && (
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${passwordStrength === 1 ? 'bg-red-100 text-red-700' :
                                                            passwordStrength === 2 ? 'bg-orange-100 text-orange-700' :
                                                                passwordStrength === 3 ? 'bg-yellow-100 text-yellow-700' :
                                                                    passwordStrength === 4 ? 'bg-lime-100 text-lime-700' :
                                                                        'bg-green-100 text-green-700'
                                                            }`}>
                                                            {passwordStrength === 1 ? 'Weak' :
                                                                passwordStrength === 2 ? 'Weak' :
                                                                    passwordStrength === 3 ? 'Fair' :
                                                                        passwordStrength === 4 ? 'Good' :
                                                                            'Strong'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 mb-4">
                                                    <div className={`h-1.5 flex-1 rounded-full ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                                                    <div className={`h-1.5 flex-1 rounded-full ${passwordStrength >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                                                    <div className={`h-1.5 flex-1 rounded-full ${passwordStrength >= 3 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                                                    <div className={`h-1.5 flex-1 rounded-full ${passwordStrength >= 4 ? 'bg-lime-500' : 'bg-gray-200'}`}></div>
                                                    <div className={`h-1.5 flex-1 rounded-full ${passwordStrength >= 5 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-gray-800">Password Requirements:</span>
                                            <span className="text-xs text-gray-600">
                                                <span className="font-bold text-gray-900">{satisfiedCount}</span>/6 satisfied
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {requirements.map((req, index) => (
                                                <div key={index} className="flex items-center gap-2 text-xs text-gray-700">
                                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${req.valid ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                                        {req.valid && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                    </div>
                                                    <span className={req.valid ? 'text-gray-700 font-medium' : 'text-gray-500'}>{req.label}</span>
                                                </div>
                                            ))}
                                        </div>
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
                                        disabled={isLoading || !isPasswordValid || password !== confirmPassword}
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
