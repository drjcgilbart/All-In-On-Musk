import type { Metadata } from "next";
import { LoginDesk } from "@/components/login-desk";

export const metadata: Metadata = {
  title: "Login",
  description: "Request a free membership, or sign in to the admin desk.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return <LoginDesk />;
}
