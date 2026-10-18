import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, Marcellus, Noto_Sans_Thai } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import Providers from "./providers";
import "./globals.css";

const fontBody = Hanken_Grotesk({ variable: "--font-body", subsets: ["latin"] });
const fontDisplay = Fraunces({ variable: "--font-display", subsets: ["latin"] });
const fontThai = Noto_Sans_Thai({ variable: "--font-thai", subsets: ["thai"] });
// Brand lettering only (Sand & Sky wordmark + page titles in the shell).
const fontBrand = Marcellus({ variable: "--font-brand", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: { default: "Sand & Sky Hotel", template: "%s · Sand & Sky" },
  description: "Multi-branch hotel management — Advanced Database project",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontBody.variable} ${fontDisplay.variable} ${fontThai.variable} ${fontBrand.variable}`}>
      <body>
        {/* Extracts antd's CSS-in-JS during SSR so pages don't flash unstyled */}
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
