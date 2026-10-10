import type { Metadata } from "next";
import LoginForm from "@/app/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 16,
        background: "var(--bg)",
      }}
    >
      <LoginForm />
    </main>
  );
}
