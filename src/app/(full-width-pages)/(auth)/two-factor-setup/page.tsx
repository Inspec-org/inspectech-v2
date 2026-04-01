import TwoFactorSetup from "@/components/auth/TwoFactorSetup";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup Two-Factor Authentication | InspecTech",
  description: "Secure your account with two-factor authentication.",
};

export default function TwoFactorSetupPage() {
  return <TwoFactorSetup />;
}
