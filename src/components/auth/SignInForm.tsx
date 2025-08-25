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
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm  sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 ">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
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
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formdata.password}
                      onChange={handleChange}
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <div className="opacity-50">
                          <EyeIcon />
                        </div>
                      ) : (
                        <div className="opacity-50">
                          <EyeCloseIcon />
                        </div>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <Link
                    href="/forget-password"
                    className="text-sm text-brand-500 hover:text-brand-600 "
                  >
                    Forgot password?
                  </Link>
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
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}