"use client";

import { useState, type ReactNode } from "react";
import { Alert, Drawer, Grid, Layout, theme } from "antd";
import { useSession } from "@/app/lib/auth-client";
import PortalHeader from "./PortalHeader";
import PortalNav from "./PortalNav";

// Layout + Sider shell (ui-standard.md §4). Below md the Sider becomes a Drawer —
// never a squeezed narrow sidebar.
export default function PortalShell({ children }: { children: ReactNode }) {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { error } = useSession();
  const { token } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100dvh" }}>
      {!isMobile && (
        <Layout.Sider
          width={248}
          collapsedWidth={72}
          collapsed={collapsed}
          trigger={null}
          style={{
            position: "sticky",
            top: 0,
            height: "100dvh",
            overflow: "auto",
            borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <PortalNav collapsed={collapsed} />
        </Layout.Sider>
      )}

      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          size={280}
          closable={false}
          styles={{ body: { padding: 0 } }}
        >
          <PortalNav onNavigate={() => setDrawerOpen(false)} />
        </Drawer>
      )}

      {/* minWidth: 0 lets wide tables scroll inside their card instead of stretching the page */}
      <Layout style={{ minWidth: 0 }}>
        <PortalHeader
          isMobile={isMobile}
          collapsed={collapsed}
          onToggle={() => (isMobile ? setDrawerOpen(true) : setCollapsed((c) => !c))}
        />
        <Layout.Content style={{ padding: "clamp(16px, 3vw, 28px)", minWidth: 0 }}>
          {error ? <Alert type="error" showIcon title="Could not load your session" description={error} /> : children}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
