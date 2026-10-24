import type { Metadata } from "next";
import Image from "next/image";
import LoginForm from "@/app/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main
      style={{
        position: "relative",
        isolation: "isolate",
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 16,
        background: "var(--ivory)",
      }}
    >
      {/* Same watercolor backdrop as the portal shell; its empty centre sits behind the card. */}
      <Image
        src="/images/WebHotelBG.png"
        alt=""
        fill
        sizes="100vw"
        loading="eager"
        style={{ zIndex: -1, objectFit: "cover", objectPosition: "center", pointerEvents: "none" }}
      />
      <LoginForm />
    </main>
  );
}
