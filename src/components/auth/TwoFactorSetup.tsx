"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

export default function TwoFactorSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Credentials & Option, 2: OTP Verification
  const [isLoading, setIsLoading] = useState(false);
  const [formdata, setFormdata] = useState({
    email: "",
    password: "",
    enable: true
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormdata((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/toggle-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formdata)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send OTP");
      }

      toast.success(result.message);
      setStep(2);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
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

      toast.success(result.message);
      router.push("/signin");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative p-6 rounded-2xl shadow-2xl bg-bg-grey">
      <div className="mb-5 sm:mb-8">
        <div className="flex items-center gap-2">
          <Image
            width={28}
            height={28}
            src="/images/auth/welcome.svg"
            alt="Logo"
          />
          <h1 className="font-normal text-text-blue text-3xl">
            2FA Security
          </h1>
        </div>
        <p className="text-sm text-gray-500">
          {step === 1 
            ? "Configure two-factor authentication for your account" 
            : "Enter the verification code sent to your email"}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleSendOtp}>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Image width={14} height={14} src="/images/auth/email.svg" alt="Email" />
                <Label>Email Address <span className="text-error-500">*</span></Label>
              </div>
              <Input
                name="email"
                placeholder="info@gmail.com"
                type="email"
                value={formdata.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Image width={14} height={14} src="/images/auth/password.svg" alt="Password" />
                <Label>Confirm Password <span className="text-error-500">*</span></Label>
              </div>
              <Input
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formdata.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex flex-col gap-4 p-4 bg-white rounded-xl border border-gray-100">
              <Label className="text-base font-semibold">2FA Option</Label>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="enable"
                    name="enable"
                    checked={formdata.enable === true}
                    onChange={() => setFormdata(prev => ({ ...prev, enable: true }))}
                    className="w-4 h-4 text-purple-600"
                  />
                  <label htmlFor="enable" className="text-sm font-medium text-gray-700">Enable 2FA</label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="disable"
                    name="enable"
                    checked={formdata.enable === false}
                    onChange={() => setFormdata(prev => ({ ...prev, enable: false }))}
                    className="w-4 h-4 text-purple-600"
                  />
                  <label htmlFor="disable" className="text-sm font-medium text-gray-700">Disable 2FA</label>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="sm" disabled={isLoading}>
              {isLoading ? "Processing..." : "Continue"}
            </Button>

            <div className="text-center py-2">
              <Link href="/signin" className="text-sm text-gray-500 hover:text-text-blue hover:underline">
                Back to Sign In
              </Link>
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
                  onKeyDown={(e) => handleKeyDown(index, e)}
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
                Change configuration
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
