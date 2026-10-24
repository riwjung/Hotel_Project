"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Alert, Drawer, Grid, Layout } from "antd";
import { useSession } from "@/app/lib/auth-client";
import PortalHeader from "./PortalHeader";
import PortalNav from "./PortalNav";
import styles from "./portal-shell.module.css";

// Layout + Sider shell (ui-standard.md §4). Below md the Sider becomes a Drawer —
// never a squeezed narrow sidebar.
export default function PortalShell({ children }: { children: ReactNode }) {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { error } = useSession();

  return (
    <Layout style={{ minHeight: "100dvh", background: "var(--ivory)" }}>
      {!isMobile && (
        <Layout.Sider
          width={248}
          collapsedWidth={72}
          collapsed={collapsed}
          trigger={null}
          style={{
            alignSelf: "stretch",
            background: "var(--ivory)",
            borderInlineEnd: "1px solid var(--hairline)",
            boxShadow: "4px 0 24px rgba(138, 108, 55, 0.06)",
            zIndex: 11,
          }}
        >
          <div className={styles.sidebarViewport}>
            <PortalNav collapsed={collapsed} />
          </div>
        </Layout.Sider>
      )}

      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          size={280}
          closable={false}
          styles={{ body: { padding: 0, background: "var(--ivory)" } }}
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
        <Layout.Content className={styles.content}>
          <Image
            src="/images/WebHotelBG.png"
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            className={styles.backdrop}
          />
          <div className={styles.pageBody}>
            {error ? <Alert type="error" showIcon title="Could not load your session" description={error} /> : children}
          </div>
          <div className={styles.landscape} aria-hidden="true">
            <Image
              src="/images/Bottom.png"
              alt=""
              width={2508}
              height={627}
              sizes={isMobile ? "100vw" : collapsed ? "calc(100vw - 104px)" : "calc(100vw - 280px)"}
              className={styles.landscapeImage}
            />
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
