"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useContext, useState } from "react";
import { buildRequestBody } from "@/utils/apiWrapper";
import { UserContext } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(UserContext);
  const router = useRouter();
  const [formdata, setFormdata] = useState({
    email: "",
    password: ""
  });

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

    const payload = buildRequestBody(formdata);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log(result.data)

      if (!response.ok || result.data.status === false) {
        throw new Error(result.data?.message || result.error)
      }

      const sessionId = result.data.data.session_id;
      if (sessionId) {
        login(sessionId);

        setFormdata({
          email: "",
          password: ""
        });

        // Redirect after successful login
        router.push("/");

        console.log("Login successful");
      } else {
        console.error("No session_id found in response");
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
      console.error("Network Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="relative rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-[8px] bg-gradient-to-r from-[#312E81] to-[#7E22CE] rounded-t-2xl z-50"></div>
          <div className="absolute top-0 left-0 w-[8px] h-full bg-gradient-to-b from-[#312E81] to-[#7E22CE] rounded-l-2xl z-50"></div>

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
                <h1 className="font-normal text-text-blue text-title-sm  sm:text-title-md">
                  Welcome Back
                </h1>
              </div>
              <p className="text-sm text-gray-500 ">
                Sign in to access your secure dashboard
              </p>
            </div>
            <div>
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
                  <div>
                    <Button
                      type="submit"
                      className="w-full"
                      size="sm"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                  </div>
                  <div className="text-center py-2 text-sm">
                    Need an account? Contact your administrator
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div >
      </div >
    </div >
  );
}