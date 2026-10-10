"use client";

import { usePathname } from "next/navigation";
import { Avatar, Button, Dropdown, Layout, Skeleton, Space, Tag, Typography, theme } from "antd";
import { BankOutlined, LogoutOutlined, MenuOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { findNavItem } from "@/app/lib/nav";

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
  const { user, loading, logout } = useSession();
  const { token } = theme.useToken();
  const title = findNavItem(pathname)?.label ?? "Hotel Portal";

  return (
    <Layout.Header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 12,
        paddingInline: "clamp(12px, 3vw, 28px)",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Button
        type="text"
        aria-label={isMobile ? "Open menu" : collapsed ? "Expand menu" : "Collapse menu"}
        icon={isMobile ? <MenuOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
      />

      <Typography.Title level={4} style={{ margin: 0, flex: 1, minWidth: 0 }} ellipsis>
        {title}
      </Typography.Title>

      {loading || !user ? (
        <Skeleton.Button active size="small" style={{ width: 140 }} />
      ) : (
        <Space size={12}>
          {!isMobile && (
            <Tag icon={<BankOutlined />} color={user.scopeLevel === "CHAIN" ? "blue" : "default"}>
              {user.scopeLevel === "CHAIN" ? "All branches" : user.branchName}
            </Tag>
          )}
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
            <Button type="text" style={{ height: 40, paddingInline: 6 }}>
              <Space size={8}>
                <Avatar size={30} style={{ background: token.colorPrimary }}>
                  {initials(user.name)}
                </Avatar>
                {!isMobile && <span>{user.name}</span>}
              </Space>
            </Button>
          </Dropdown>
        </Space>
      )}
    </Layout.Header>
  );
}
