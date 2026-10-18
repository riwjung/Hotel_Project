"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs, { type Dayjs } from "dayjs";
import { Button, Space, Table, Tag, Tooltip, Typography, theme, type TableColumnsType } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { formatDate } from "@/app/lib/format";
import { BOOKING_STATUS, ROOM_STATUS } from "@/app/lib/status";
import StatusTag from "../StatusTag";
import type { GridRoom, GridStay } from "./types";

type Props = {
  rooms: GridRoom[];
  loading: boolean;
  /** First night shown */
  from: Dayjs;
  days: number;
  showBranch: boolean;
  /** BOOKING_MANAGE — free nights from today on link to /bookings/new */
  canBook: boolean;
};

type Row = GridRoom & {
  /** nights[i] = the stay holding the room on night from + i, or null when it is free */
  nights: (GridStay | null)[];
};

const ISO = "YYYY-MM-DD";
const LEGEND = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] as const;

function StayBar({ stay }: { stay: GridStay }) {
  const meta = BOOKING_STATUS[stay.bookingStatus];
  const nights = dayjs(stay.checkOutDate).diff(stay.checkInDate, "day");
  return (
    <Tooltip
      title={
        <>
          <div>{stay.bookingCode} · {meta.label}</div>
          <div>{stay.customerName} · {stay.guestCount} guest(s)</div>
          <div>{formatDate(stay.checkInDate)} → {formatDate(stay.checkOutDate)} · {nights} night(s)</div>
        </>
      }
    >
      <Link
        href={`/bookings/${stay.bookingId}`}
        aria-label={`Booking ${stay.bookingCode}, ${stay.customerName}, ${meta.label}`}
        style={{ display: "block" }}
      >
        <Tag
          color={meta.color}
          icon={meta.icon}
          style={{ display: "block", margin: 0, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {stay.bookingCode} · {stay.customerName}
        </Tag>
      </Link>
    </Tooltip>
  );
}

/** Rooms × nights. A stay is one cell spanning its nights (colSpan), so it reads as a bar. */
export default function AvailabilityGrid({ rooms, loading, from, days, showBranch, canBook }: Props) {
  const router = useRouter();
  const { token } = theme.useToken();
  const today = dayjs().format(ISO);
  const dates = Array.from({ length: days }, (_, i) => from.add(i, "day"));
  const nightKeys = dates.map((d) => d.format(ISO));

  const rows: Row[] = rooms.map((room) => ({
    ...room,
    // check-in ≤ night < check-out — ISO dates compare correctly as strings
    nights: nightKeys.map((night) => room.stays.find((s) => s.checkInDate <= night && night < s.checkOutDate) ?? null),
  }));

  const sellable = (row: Row) => row.roomStatus !== "OUT_OF_SERVICE" && row.branchStatus === "ACTIVE";
  const bookable = (row: Row, i: number) => canBook && sellable(row) && nightKeys[i] >= today;
  const shade = (i: number) =>
    nightKeys[i] === today ? token.colorPrimaryBg : [0, 6].includes(dates[i].day()) ? token.colorFillQuaternary : undefined;

  const book = (row: Row, i: number) => {
    const query = new URLSearchParams({
      branchId: String(row.branchId),
      roomId: String(row.roomId),
      checkIn: nightKeys[i],
      checkOut: dates[i].add(1, "day").format(ISO),
    });
    router.push(`/bookings/new?${query}`);
  };

  const columns: TableColumnsType<Row> = [
    {
      title: "Room",
      key: "room",
      fixed: "left",
      width: 150,
      render: (_, r) => (
        <div style={{ lineHeight: 1.35 }}>
          <Typography.Text strong>{showBranch ? `${r.branchCode} · ${r.roomNumber}` : r.roomNumber}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>{r.typeName}</Typography.Text>
          {r.roomStatus !== "AVAILABLE" && r.roomStatus !== "OCCUPIED" && (
            <div style={{ marginTop: 4 }}>
              <StatusTag value={r.roomStatus} palette={ROOM_STATUS} />
            </div>
          )}
        </div>
      ),
    },
    ...dates.map((date, i): TableColumnsType<Row>[number] => ({
      key: nightKeys[i],
      width: 64,
      align: "center",
      title: (
        <span style={{ display: "inline-block", lineHeight: 1.25 }}>
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>{date.format("ddd")}</Typography.Text>
          <br />
          <Typography.Text strong={nightKeys[i] === today}>{date.format("D")}</Typography.Text>
          {(i === 0 || date.date() === 1) && (
            <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}> {date.format("MMM")}</Typography.Text>
          )}
        </span>
      ),
      onHeaderCell: () => ({ style: { background: shade(i), paddingInline: 4 } }),
      onCell: (row) => {
        const stay = row.nights[i];
        // the first visible night of a stay spans the rest of it; the nights it covers render nothing
        if (stay && i > 0 && row.nights[i - 1] === stay) return { colSpan: 0 };
        let span = 1;
        while (stay && i + span < days && row.nights[i + span] === stay) span += 1;
        return {
          colSpan: span,
          style: { padding: 3, background: stay ? undefined : sellable(row) ? shade(i) : token.colorFillSecondary },
        };
      },
      render: (_, row) => {
        const stay = row.nights[i];
        if (stay) return <StayBar stay={stay} />;
        if (!bookable(row, i)) return null;
        return (
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            style={{ color: token.colorTextQuaternary }}
            aria-label={`Book room ${row.roomNumber} from ${date.format("D MMM")}`}
            onClick={() => book(row, i)}
          />
        );
      },
    })),
  ];

  return (
    <Table<Row>
      rowKey="roomId"
      size="small"
      bordered
      loading={loading}
      columns={columns}
      dataSource={rows}
      pagination={false}
      scroll={{ x: "max-content" }}
      title={() => (
        <Space wrap size={[8, 8]}>
          {LEGEND.map((status) => (
            <StatusTag key={status} value={status} palette={BOOKING_STATUS} />
          ))}
          <Typography.Text type="secondary">
            {canBook ? "Click a stay to open the booking, or + on a free night to book it." : "Click a stay to open the booking."}
          </Typography.Text>
        </Space>
      )}
      summary={() => (
        <Table.Summary.Row>
          <Table.Summary.Cell index={0}>
            <Typography.Text type="secondary">Free rooms</Typography.Text>
          </Table.Summary.Cell>
          {nightKeys.map((night, i) => {
            const free = rows.filter((r) => sellable(r) && !r.nights[i]).length;
            return (
              <Table.Summary.Cell key={night} index={i + 1} align="center">
                <Typography.Text strong type={free === 0 ? "danger" : undefined}>{free}</Typography.Text>
              </Table.Summary.Cell>
            );
          })}
        </Table.Summary.Row>
      )}
    />
  );
}
