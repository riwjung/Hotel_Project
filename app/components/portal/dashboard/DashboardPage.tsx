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
import BranchPhotoCarousel from "./BranchPhotoCarousel";
import type { DashboardBranchRow, DashboardTotals } from "./types";
import styles from "./dashboard.module.css";

type Metric = {
  title: string;
  tone: keyof typeof METRIC_TONES;
  icon: ReactNode;
  value: (t: DashboardTotals) => number;
  suffix?: string;
  caption?: (t: DashboardTotals) => string;
  /** the tile opens this page when the user may see it */
  link?: { href: string; permission: PermissionCode };
};

const bookings = { href: "/bookings", permission: "BOOKING_VIEW" as const };

// Muted Sand & Sky companions: each labelled metric keeps its own visual cue.
const METRIC_TONES = {
  sage: { background: "#edf5ef", border: "#d3e4d8", accent: "#3f6b50", icon: "#dcece0" },
  sky: { background: "#edf3fa", border: "#d6e2ef", accent: "#43678c", icon: "#dce7f4" },
  sand: { background: "#faf3e6", border: "#eadcbd", accent: "#80602b", icon: "#f0e2c5" },
  sea: { background: "#eaf4f3", border: "#cfe3df", accent: "#386d65", icon: "#d4e9e5" },
  clay: { background: "#fbefea", border: "#eed7cc", accent: "#975838", icon: "#f4ded2" },
  lavender: { background: "#f2eff7", border: "#e0d8ec", accent: "#715c8c", icon: "#e6dff0" },
} as const;

const METRICS: Metric[] = [
  { title: "Arrivals today", tone: "sage", icon: <LoginOutlined />, value: (t) => t.arrivalsToday, link: bookings },
  { title: "Departures today", tone: "sky", icon: <LogoutOutlined />, value: (t) => t.departuresToday, link: bookings },
  { title: "In-house bookings", tone: "sand", icon: <UserOutlined />, value: (t) => t.inHouse, link: bookings },
  {
    title: "Occupancy",
    tone: "sea",
    icon: <PieChartOutlined />,
    value: (t) => percent(t.roomsOccupied, t.roomsTotal),
    suffix: "%",
    caption: (t) => `${t.roomsOccupied}/${t.roomsTotal} occupied · ${t.roomsAvailable} free`,
  },
  {
    title: "Open maintenance",
    tone: "clay",
    icon: <ToolOutlined />,
    value: (t) => t.openMaintenance,
    link: { href: "/maintenance", permission: "MAINTENANCE_VIEW" },
  },
  {
    title: "Housekeeping pending",
    tone: "lavender",
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
  // Keep the postcard's column while the first load runs so the metrics don't jump.
  const showPhotos = data ? data.photos.length > 0 : loading;

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

      <div className={showPhotos ? `${styles.overview} ${styles.withPhotos}` : styles.overview}>
        <div className={styles.metricGrid}>
          {METRICS.map((m) => {
            const linked = m.link && can(m.link.permission);
            const tone = METRIC_TONES[m.tone];
            const card = (
              <Card
                key={m.title}
                variant="outlined"
                loading={!data && loading}
                size="small"
                hoverable={linked}
                style={{ height: "100%", minHeight: 132, background: tone.background, borderColor: tone.border, borderTop: `3px solid ${tone.accent}`, boxShadow: "none" }}
                styles={{ body: { padding: 16 } }}
              >
                <Statistic
                  title={m.title}
                  prefix={<span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, marginRight: 6, borderRadius: 10, background: tone.icon, fontSize: 21 }}>{m.icon}</span>}
                  value={data ? m.value(data.totals) : 0}
                  suffix={m.suffix}
                  styles={{ title: { color: "#5f5646", fontSize: 13, marginBottom: 10 }, content: { color: tone.accent, fontSize: 28, fontWeight: 600 } }}
                />
                {data && m.caption && (
                  <Typography.Text style={{ color: "#5f6662", fontSize: 12, display: "block", marginTop: 8 }}>
                    {m.caption(data.totals)}
                  </Typography.Text>
                )}
              </Card>
            );
            return linked && m.link ? (
              <Link key={m.title} className={styles.metricLink} href={m.link.href} aria-label={`${m.title}: open ${m.link.href.slice(1)}`}>
                {card}
              </Link>
            ) : (
              card
            );
          })}
        </div>
        {showPhotos && (
          <BranchPhotoCarousel
            key={data?.photos.map((photo) => photo.imageId).join(",") ?? "loading"}
            photos={data?.photos ?? []}
          />
        )}
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
