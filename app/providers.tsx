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
    // antd derives these from colorPrimary, but for a dark gold the derived tints turn
    // muddy taupe (e.g. the Availability "today" column) — pin the whole gold scale.
    colorPrimaryHover: "#a08048",
    colorPrimaryActive: "#6f5629",
    colorPrimaryBg: "#f7f0e2",
    colorPrimaryBgHover: "#f0e4cc",
    colorPrimaryBorder: "#e4d3ae",
    colorPrimaryBorderHover: "#d4bd8c",
    colorPrimaryText: "#8a6c37",
    colorPrimaryTextHover: "#a08048",
    colorPrimaryTextActive: "#6f5629",
    // Info stays blue: it carries meaning (Alert info, notices), not brand.
    colorInfo: "#2f6bff",
    colorLink: "#8a6c37",
    colorLinkHover: "#a08048",
    colorLinkActive: "#6f5629",
    // Warm neutrals so greys, fills and borders sit with the ivory shell instead of cool blue-grey.
    colorTextBase: "#2b261e",
    colorBgLayout: "#f6f4ef",
    colorBorder: "#e3dccd",
    colorBorderSecondary: "#eee8dc",
    borderRadius: 8,
    borderRadiusLG: 12,
    fontFamily: "var(--font-body), var(--font-thai), system-ui, sans-serif",
  },
  components: {
    // Sand & Sky palette (globals.css): ivory Sider/Header, warm sand page, champagne gold accents.
    Layout: { headerBg: "rgba(251, 248, 242, 0.82)", siderBg: "#fbf8f2", bodyBg: "#f6f4ef" },
    Table: {
      headerBg: "#faf6ee",
      headerColor: "#4a4234",
      headerSplitColor: "#ebe2d1",
      headerSortActiveBg: "#f3ead8",
      headerSortHoverBg: "#f5eee0",
      bodySortBg: "#fcf9f3",
      rowHoverBg: "#fbf7ef",
      borderColor: "#efe8db",
    },
    Card: { headerFontSize: 17 },
    Segmented: { trackBg: "#f1ebdf", itemSelectedColor: "#6f5629" },
    Tabs: { itemColor: "#6b6252" },
    Rate: { starColor: "#c9a45c" },
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

// Card / Modal / Drawer titles share the Sand & Sky wordmark font (Marcellus, --font-brand).
const brandTitle = {
  fontFamily: "var(--font-brand), var(--font-thai), Georgia, serif",
  fontWeight: 400,
  letterSpacing: "0.02em",
} as const;

export default function Providers({ children }: { children: ReactNode }) {
  return (
    // locale drives every string antd renders itself (OK/Cancel, pagination,
    // "(optional)", Empty …) — keep it in the same language as our own copy.
    <ConfigProvider
      locale={enUS}
      theme={themeConfig}
      // Brand serif on titles everywhere — no token covers fontFamily per part, semantic styles do.
      card={{ styles: { title: brandTitle } }}
      modal={{ styles: { title: { ...brandTitle, fontSize: 18 } } }}
      drawer={{ styles: { title: brandTitle } }}
    >
      {/* <App> gives message/modal/notification the theme — always use App.useApp() */}
      <AntdApp style={{ minHeight: "100dvh" }}>{children}</AntdApp>
    </ConfigProvider>
  );
}
