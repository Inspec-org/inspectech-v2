"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useContext, useState, useRef } from "react";
import { buildRequestBody } from "@/utils/apiWrapper";
import { UserContext } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Login, 2: OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { login } = useContext(UserContext);
  const router = useRouter();
  const [formdata, setFormdata] = useState({
    email: "",
    password: ""
  });

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const otpString = otp.join("");
      if (otpString.length < 6) {
        throw new Error("Please enter a 6-digit OTP");
      }

      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formdata.email,
          otp: otpString
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Invalid OTP");
      }

      const role = result.user.role;
      login(result.token);
      toast.success(result.message);

      if (role === "superadmin") {
        router.push(`/${role}`);
      } else {
        router.push(`/${role}/departments`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormdata((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // const payload = buildRequestBody(formdata);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: formdata.email, password: formdata.password })
      });

      const result = await response.json();
      

      if (!response.ok) {
        throw new Error(result?.message || result.error)
      }

      if (result.twoFactorRequired) {
        toast.info(result.message);
        setStep(2);
        return;
      }

      const role=result.user.role
      login(result.token)
      
      if(role==="superadmin")
      {
        router.push(`/${role}`);
      }
      else
        router.push(`/${role}/departments`);

      // const sessionId = result.data.data.session_id;
      // if (sessionId) {
      //   // login(sessionId);

      //   setFormdata({
      //     email: "",
      //     password: ""
      //   });

      //   // Redirect after successful login
      //   // router.push("/");

      //   ;
      // } else {
      //   ;
      // }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
      ;
    } finally {
      setIsLoading(false);
    }
    // 
  };

  return (


    <div className="relative p-6 rounded-2xl shadow-2xl bg-bg-grey">
      <div className="mb-5 sm:mb-8">
        <div className="flex items-center gap-2">
          <div className="">
            <Image
              width={28}
              height={28}
              className=""
              src="/images/auth/welcome.svg"
              alt="Logo"
            />
          </div>
          <h1 className="font-normal text-text-blue text-3xl">
            Welcome Back
          </h1>
        </div>
        <p className="text-sm text-gray-500 ">
        {step === 1 ? "Sign in to access your secure dashboard" : "Enter the 6-digit code sent to your email"}
      </p>
    </div>
    <div>
      {step === 1 ? (
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="">
                  <Image
                    width={14}
                    height={14}
                    className=""
                    src="/images/auth/email.svg"
                    alt="Logo"
                  />
                </div>
                <Label>
                  Email Address <span className="text-error-500">*</span>{" "}
                </Label>
              </div>
              <div className="relative">
                <span
                  className="absolute z-30 -translate-y-1/2 cursor-pointer left-4 top-1/2"
                >
                  <Image
                    width={14}
                    height={14}
                    className=""
                    src="/images/auth/email.svg"
                    alt="Logo"
                  />
                </span>
                <Input
                  name="email"
                  placeholder="info@gmail.com"
                  type="email"
                  value={formdata.email}
                  onChange={handleChange}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="">
                  <Image
                    width={14}
                    height={14}
                    className=""
                    src="/images/auth/password.svg"
                    alt="Logo"
                  />
                </div>
                <Label>
                  Password <span className="text-error-500">*</span>{" "}
                </Label>
              </div>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formdata.password}
                  onChange={handleChange}
                  required
                  className="pl-10"
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer left-4 top-1/2"
                >
                  <Image
                    width={14}
                    height={14}
                    className=""
                    src="/images/auth/password.svg"
                    alt="Logo"
                  />
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <Link
                href="/forget-password"
                className="text-sm  hover:text-text-blue hover:underline "
              >
                Forgot password?
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-start gap-2">
                <div className="">
                  <input
                    name="email"
                    placeholder="info@gmail.com"
                    type="checkbox"
                    className="pl-10"
                  />
                </div>
                <Label>
                  Remember Me
                </Label>
              </div>
              <Link
                href="/two-factor-setup"
                className="text-sm font-medium text-text-blue hover:underline"
              >
                Setup 2FA
              </Link>
            </div>
            <div>
              <Button
                type="submit"
                className="w-full"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...</> : "Sign in"}
              </Button>
            </div>
            <div className="text-center py-2 text-sm">
              Need an account? Contact your administrator
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <div className="space-y-6">
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  required
                />
              ))}
            </div>

            <Button type="submit" className="w-full" size="sm" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>

            <div className="text-center py-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-text-blue hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
    </div>

  );
}