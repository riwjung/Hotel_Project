"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Skeleton, Tag, type MenuProps } from "antd";
import BrandLogo from "@/app/components/brand/BrandLogo";
import { useSession } from "@/app/lib/auth-client";
import { NAV, findNavItem } from "@/app/lib/nav";
import { NAV_ICONS } from "./nav-icons";

type Props = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

/** Gold shoreline lines under the menu — echoes the wave in the logo. Purely decorative. */
function Shoreline({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 248 80"
      preserveAspectRatio="none"
      fill="none"
      stroke="var(--gold)"
      style={{ display: "block", width: "100%", height: collapsed ? 40 : 80, marginTop: "auto", pointerEvents: "none" }}
    >
      <path d="M0 38 C 40 26, 80 50, 124 38 S 208 26, 248 38" strokeOpacity="0.35" />
      <path d="M0 52 C 50 42, 90 64, 140 52 S 220 44, 248 50" strokeOpacity="0.22" />
      <path d="M0 66 C 60 58, 110 74, 160 66 S 228 60, 248 64" strokeOpacity="0.12" />
    </svg>
  );
}

/** Brand + menu. Rendered inside the desktop Sider and the mobile Drawer. */
export default function PortalNav({ collapsed = false, onNavigate }: Props) {
  const pathname = usePathname();
  const { user, loading, can } = useSession();
  const selected = findNavItem(pathname)?.path;

  // Hide what the role cannot open; drop groups that end up empty.
  const groups = NAV.map((group) => {
    const children = group.items
      .filter((item) => can(item.permission))
      .map((item) => ({
        key: item.path,
        icon: NAV_ICONS[item.icon],
        label: (
          <Link href={item.path} onClick={onNavigate} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
            {item.status === "planned" && !collapsed && (
              <Tag
                variant="filled"
                style={{
                  marginInlineEnd: 0,
                  fontSize: 10,
                  lineHeight: "16px",
                  letterSpacing: "0.04em",
                  background: "var(--sand-paper)",
                  color: "var(--ink-muted)",
                }}
              >
                soon
              </Tag>
            )}
            {item.path === selected && (
              <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} />
            )}
          </Link>
        ),
      }));
    return children.length
      ? {
          type: "group" as const,
          key: group.module,
          label: <span style={{ textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>{group.label}</span>,
          children,
        }
      : null;
  }).filter((g) => g !== null);

  // Collapsed rail: group titles would truncate to "OVERVI…", so swap them for thin dividers.
  const items: MenuProps["items"] = collapsed
    ? groups.flatMap((g, i) => [...(i ? [{ type: "divider" as const, key: `d-${g.key}` }] : []), ...g.children])
    : groups;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--ivory)" }}>
      <div
        style={{
          height: 80,
          display: "flex",
          alignItems: "center",
          paddingInline: collapsed ? 0 : 22,
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid var(--hairline)",
          flexShrink: 0,
        }}
      >
        <BrandLogo markOnly={collapsed} />
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
          style={{ borderInlineEnd: "none", paddingBlock: 12, background: "transparent" }}
        />
      )}

      <Shoreline collapsed={collapsed} />
    </div>
  );
}
