"use client";

import { usePathname } from "next/navigation";
import { Avatar, Button, Dropdown, Layout, Select, Skeleton, Space, Typography, theme } from "antd";
import { EnvironmentOutlined, LogoutOutlined, MenuOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { findNavItem } from "@/app/lib/nav";
import { useBranchOptions } from "./branch/useBranchOptions";

type Props = {
  isMobile: boolean;
  collapsed: boolean;
  onToggle: () => void;
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function PortalHeader({ isMobile, collapsed, onToggle }: Props) {
  const pathname = usePathname();
  const { user, loading, selectedBranchId, selectBranch, logout } = useSession();
  const branchOptions = useBranchOptions({ activeOnly: false, forSwitcher: true });
  const { token } = theme.useToken();
  const navItem = findNavItem(pathname);
  const title = navItem?.label ?? "Hotel Portal";
  const groupLabel = navItem?.group.label;

  return (
    <Layout.Header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        height: 80,
        display: "flex",
        alignItems: "center",
        gap: 14,
        paddingInline: "clamp(12px, 3vw, 28px)",
        backdropFilter: "saturate(160%) blur(14px)",
        WebkitBackdropFilter: "saturate(160%) blur(14px)",
        borderBottom: "1px solid var(--hairline)",
        lineHeight: "normal",
      }}
    >
      <Button
        type="text"
        shape="circle"
        aria-label={isMobile ? "Open menu" : collapsed ? "Expand menu" : "Collapse menu"}
        icon={isMobile ? <MenuOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
        style={{ color: "var(--gold-deep)" }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        {groupLabel && (
          <Typography.Text
            style={{
              display: "block",
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--gold)",
            }}
          >
            {groupLabel}
          </Typography.Text>
        )}
        <Typography.Title
          level={4}
          ellipsis
          // inline: antd's Typography font-family outranks a utility class
          style={{ margin: 0, fontFamily: "var(--font-brand), Georgia, serif", fontWeight: 400, color: "var(--ink)", letterSpacing: "0.02em" }}
        >
          {title}
        </Typography.Title>
      </div>

      {loading || !user ? (
        <Skeleton.Button active size="small" style={{ width: 140 }} />
      ) : (
        <Space size={12}>
          {/* CHAIN users pick a working branch; branch-scoped users just see theirs. */}
          {user.scopeLevel === "CHAIN" ? (
            <Select
              aria-label="Working branch"
              value={selectedBranchId}
              loading={branchOptions.loading}
              placeholder="All branches"
              prefix={isMobile ? undefined : <EnvironmentOutlined style={{ color: "var(--gold)" }} />}
              variant="filled"
              style={{ width: isMobile ? 126 : 220 }}
              styles={{ root: { borderRadius: 999, background: "var(--sand-paper)" } }}
              options={[{ value: 0, label: "All branches" }, ...branchOptions.options]}
              onChange={(value) => selectBranch(value || undefined)}
            />
          ) : !isMobile ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 30,
                paddingInline: 12,
                borderRadius: 999,
                fontSize: 12.5,
                color: "var(--ink)",
                background: "var(--sand-paper)",
                border: "1px solid rgba(217, 183, 121, 0.45)",
              }}
            >
              <EnvironmentOutlined style={{ color: "var(--gold)" }} />
              {user.branchName}
            </span>
          ) : null}
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "who",
                  disabled: true,
                  label: (
                    <div style={{ lineHeight: 1.4 }}>
                      <div style={{ color: token.colorText, fontWeight: 600 }}>{user.name}</div>
                      <div>{user.email}</div>
                      <div>
                        {user.roleName}
                        {user.branchCode ? ` · ${user.branchCode}` : ""}
                      </div>
                    </div>
                  ),
                },
                { type: "divider" },
                { key: "logout", icon: <LogoutOutlined />, label: "Sign out", danger: true },
              ],
              onClick: ({ key }) => {
                if (key === "logout") void logout();
              },
            }}
          >
            <Button type="text" style={{ height: 44, paddingInline: 6, borderRadius: 999 }}>
              <Space size={10}>
                <Avatar
                  size={32}
                  style={{
                    background: "linear-gradient(150deg, var(--gold), var(--gold-deep))",
                    boxShadow: "0 0 0 2px #fff, 0 0 0 3px rgba(217, 183, 121, 0.6)",
                    fontSize: 12.5,
                    letterSpacing: "0.04em",
                  }}
                >
                  {initials(user.name)}
                </Avatar>
                {!isMobile && (
                  <span style={{ textAlign: "start", lineHeight: 1.2 }}>
                    <span style={{ display: "block", fontWeight: 600, color: "var(--ink)" }}>{user.name}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: token.colorTextTertiary }}>{user.roleName}</span>
                  </span>
                )}
              </Space>
            </Button>
          </Dropdown>
        </Space>
      )}
    </Layout.Header>
  );
}
