"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Skeleton, Tag, Typography, theme, type MenuProps } from "antd";
import { useSession } from "@/app/lib/auth-client";
import { NAV, findNavItem } from "@/app/lib/nav";
import { NAV_ICONS } from "./nav-icons";

type Props = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

/** Brand + menu. Rendered inside the desktop Sider and the mobile Drawer. */
export default function PortalNav({ collapsed = false, onNavigate }: Props) {
  const pathname = usePathname();
  const { user, loading, can } = useSession();
  const { token } = theme.useToken();

  // Hide what the role cannot open; drop groups that end up empty.
  const items: MenuProps["items"] = NAV.map((group) => {
    const children = group.items
      .filter((item) => can(item.permission))
      .map((item) => ({
        key: item.path,
        icon: NAV_ICONS[item.icon],
        label: (
          <Link href={item.path} onClick={onNavigate}>
            {item.label}
            {item.status === "planned" && !collapsed && (
              <Tag variant="filled" style={{ marginInlineStart: 8, fontSize: 11 }}>
                soon
              </Tag>
            )}
          </Link>
        ),
      }));
    return children.length ? { type: "group" as const, key: group.module, label: group.label, children } : null;
  }).filter((g) => g !== null);

  const selected = findNavItem(pathname)?.path;

  return (
    <>
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingInline: collapsed ? 0 : 20,
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: token.colorPrimary,
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          H
        </div>
        {!collapsed && (
          <Typography.Text strong className="font-display" style={{ fontSize: 18 }}>
            Hotel Portal
          </Typography.Text>
        )}
      </div>

      {loading || !user ? (
        <div style={{ padding: 20 }}>
          <Skeleton active title={false} paragraph={{ rows: 8 }} />
        </div>
      ) : (
        <Menu
          mode="inline"
          items={items}
          selectedKeys={selected ? [selected] : []}
          style={{ borderInlineEnd: "none", paddingBlock: 8 }}
        />
      )}
    </>
  );
}
