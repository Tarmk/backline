import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Header } from "@/components/header";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await getUser()) redirect("/dashboard");
  return (
    <>
      <Header />
      <main className="flex-1 px-4">
        <AuthForm mode="login" />
      </main>
    </>
  );
}
