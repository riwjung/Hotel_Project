"use client";

import type { ReactNode } from "react";
import { App as AntdApp, ConfigProvider, theme as antdTheme, type ThemeConfig } from "antd";
import enUS from "antd/locale/en_US";

// docs/04-standards/ui-standard.md §2 — tune antd through tokens first,
// hand-written CSS is the last resort.
const themeConfig: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: "#2f6bff",
    colorInfo: "#2f6bff",
    borderRadius: 8,
    fontFamily: "var(--font-body), var(--font-thai), system-ui, sans-serif",
  },
  components: {
    Layout: { headerBg: "#ffffff", siderBg: "#ffffff", bodyBg: "#f4f6fb" },
    Menu: { itemSelectedBg: "rgba(47, 107, 255, 0.12)", itemSelectedColor: "#1f4fd6" },
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
