"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button, Card, Statistic, Table, Typography, type TableColumnsType } from "antd";
import {
  ClearOutlined,
  LoginOutlined,
  LogoutOutlined,
  PieChartOutlined,
  ReloadOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { formatDate, percent } from "@/app/lib/format";
import type { PermissionCode } from "@/app/lib/permissions";
import { sortNumber, sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import LoadError from "../LoadError";
import { fetchDashboard } from "./dashboard.api";
import type { DashboardBranchRow, DashboardTotals } from "./types";
import styles from "./dashboard.module.css";

type Metric = {
  title: string;
  icon: ReactNode;
  value: (t: DashboardTotals) => number;
  suffix?: string;
  caption?: (t: DashboardTotals) => string;
  /** the tile opens this page when the user may see it */
  link?: { href: string; permission: PermissionCode };
};

const bookings = { href: "/bookings", permission: "BOOKING_VIEW" as const };

const METRICS: Metric[] = [
  { title: "Arrivals today", icon: <LoginOutlined />, value: (t) => t.arrivalsToday, link: bookings },
  { title: "Departures today", icon: <LogoutOutlined />, value: (t) => t.departuresToday, link: bookings },
  { title: "In-house bookings", icon: <UserOutlined />, value: (t) => t.inHouse, link: bookings },
  {
    title: "Occupancy",
    icon: <PieChartOutlined />,
    value: (t) => percent(t.roomsOccupied, t.roomsTotal),
    suffix: "%",
    caption: (t) => `${t.roomsOccupied}/${t.roomsTotal} occupied · ${t.roomsAvailable} free`,
  },
  {
    title: "Open maintenance",
    icon: <ToolOutlined />,
    value: (t) => t.openMaintenance,
    link: { href: "/maintenance", permission: "MAINTENANCE_VIEW" },
  },
  {
    title: "Housekeeping pending",
    icon: <ClearOutlined />,
    value: (t) => t.housekeepingPending,
    link: { href: "/housekeeping", permission: "HOUSEKEEPING_VIEW" },
  },
];

const num = (key: keyof DashboardTotals, title: string) => ({
  title,
  dataIndex: key,
  align: "right" as const,
  sorter: sortNumber<DashboardBranchRow>((r) => r[key]),
});

const columns: TableColumnsType<DashboardBranchRow> = [
  {
    title: "Branch",
    key: "branch",
    fixed: "left",
    sorter: sortText<DashboardBranchRow>((r) => r.branchCode),
    render: (_, r) => (
      <>
        <Typography.Text strong>{r.branchCode}</Typography.Text>{" "}
        <Typography.Text type="secondary">{r.branchName}</Typography.Text>
      </>
    ),
  },
  num("roomsTotal", "Rooms"),
  num("roomsAvailable", "Available"),
  num("roomsOccupied", "Occupied"),
  num("roomsCleaning", "Cleaning"),
  num("roomsMaintenance", "Maintenance"),
  num("arrivalsToday", "Arrivals"),
  num("departuresToday", "Departures"),
  num("inHouse", "In-house"),
  num("openMaintenance", "Open repairs"),
];

export default function DashboardPage() {
  const { data, loading, error, reload } = useApiData(fetchDashboard, "dashboard");
  const { can } = useSession();

  return (
    <>
      {error && <LoadError error={error} onRetry={reload} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
        <Typography.Text type="secondary">
          {data ? `Today · ${formatDate(data.today)}` : "Today"}
        </Typography.Text>
        <Button icon={<ReloadOutlined />} onClick={reload} loading={loading && !!data}>
          Refresh
        </Button>
      </div>

      <div className={styles.metricGrid}>
        {METRICS.map((m) => {
          const linked = m.link && can(m.link.permission);
          const card = (
            <Card key={m.title} variant="outlined" loading={!data && loading} size="small" hoverable={linked}>
              <Statistic title={m.title} prefix={m.icon} value={data ? m.value(data.totals) : 0} suffix={m.suffix} />
              {data && m.caption && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {m.caption(data.totals)}
                </Typography.Text>
              )}
            </Card>
          );
          return linked && m.link ? (
            <Link key={m.title} href={m.link.href} aria-label={`${m.title}: open ${m.link.href.slice(1)}`}>
              {card}
            </Link>
          ) : (
            card
          );
        })}
      </div>

      <Card variant="outlined" title="By branch" styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="branchId"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={data?.branches ?? []}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
        />
      </Card>
    </>
  );
}
