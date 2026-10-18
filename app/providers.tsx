"use client";

import type { ReactNode } from "react";
import { App as AntdApp, ConfigProvider, theme as antdTheme, type ThemeConfig } from "antd";
import enUS from "antd/locale/en_US";

// docs/04-standards/ui-standard.md §2 — tune antd through tokens first,
// hand-written CSS is the last resort.
const themeConfig: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    // Sand & Sky deep champagne gold — 4.9:1 on white, so white button text and gold links pass AA.
    colorPrimary: "#8a6c37",
    // Info stays blue: it carries meaning (Alert info, notices), not brand.
    colorInfo: "#2f6bff",
    colorLink: "#8a6c37",
    borderRadius: 8,
    fontFamily: "var(--font-body), var(--font-thai), system-ui, sans-serif",
  },
  components: {
    // Shell uses the Sand & Sky palette (globals.css): ivory "sand" Sider over the
    // soft blue-grey "sky" body, champagne-gold accents taken from the logo.
    Layout: { headerBg: "rgba(251, 248, 242, 0.82)", siderBg: "#fbf8f2", bodyBg: "#f4f6fb" },
    Menu: {
      itemBg: "transparent",
      itemColor: "#5f5646",
      itemHoverBg: "rgba(184, 151, 90, 0.08)",
      itemHoverColor: "#3a3328",
      itemSelectedBg: "rgba(184, 151, 90, 0.15)",
      itemSelectedColor: "#7a5e2c",
      groupTitleColor: "#b8975a",
      groupTitleFontSize: 11,
      itemHeight: 42,
      itemBorderRadius: 10,
      itemMarginInline: 12,
    },
  },
};

export default function Providers({ children }: { children: ReactNode }) {
  return (
    // locale drives every string antd renders itself (OK/Cancel, pagination,
    // "(optional)", Empty …) — keep it in the same language as our own copy.
    <ConfigProvider locale={enUS} theme={themeConfig}>
      {/* <App> gives message/modal/notification the theme — always use App.useApp() */}
      <AntdApp style={{ minHeight: "100dvh" }}>{children}</AntdApp>
    </ConfigProvider>
  );
}
