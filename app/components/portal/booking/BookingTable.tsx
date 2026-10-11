"use client";

import { Table, Typography, type TableColumnsType } from "antd";
import { useRouter } from "next/navigation";
import { formatDate, formatMoney } from "@/app/lib/format";
import { BOOKING_STATUS } from "@/app/lib/status";
import { sortByOrder, sortDate, sortNumber, sortText } from "@/app/lib/table-sort";
import StatusTag from "../StatusTag";
import { BOOKING_STATUSES, type BookingListItem } from "./types";

type Props = { bookings: BookingListItem[]; loading: boolean; showBranch: boolean };
const channelLabel = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

export default function BookingTable({ bookings, loading, showBranch }: Props) {
  const router = useRouter();
  const columns: TableColumnsType<BookingListItem> = [
    {
      title: "Booking",
      dataIndex: "bookingCode",
      sorter: sortText<BookingListItem>((row) => row.bookingCode),
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: "Customer",
      key: "customer",
      sorter: sortText<BookingListItem>((row) => row.customerName),
      render: (_, row) => (
        <>
          {row.customerName} <Typography.Text type="secondary">· {row.tierName}</Typography.Text>
        </>
      ),
    },
    ...(showBranch
      ? [{ title: "Branch", dataIndex: "branchCode", sorter: sortText<BookingListItem>((row) => row.branchCode) }]
      : []),
    {
      title: "Check-in",
      dataIndex: "checkInDate",
      sorter: sortDate<BookingListItem>((row) => row.checkInDate),
      render: formatDate,
    },
    {
      title: "Check-out",
      dataIndex: "checkOutDate",
      sorter: sortDate<BookingListItem>((row) => row.checkOutDate),
      render: formatDate,
    },
    { title: "Nights", dataIndex: "nights", align: "right", sorter: sortNumber<BookingListItem>((row) => row.nights) },
    { title: "Rooms", dataIndex: "roomCount", align: "right", sorter: sortNumber<BookingListItem>((row) => row.roomCount) },
    { title: "Guests", dataIndex: "guestCount", align: "right", sorter: sortNumber<BookingListItem>((row) => row.guestCount) },
    {
      title: "Total",
      dataIndex: "grandTotal",
      align: "right",
      sorter: sortNumber<BookingListItem>((row) => row.grandTotal),
      render: formatMoney,
    },
    {
      title: "Balance",
      key: "balance",
      align: "right",
      sorter: sortNumber<BookingListItem>((row) => row.grandTotal - row.paidTotal),
      render: (_, row) => formatMoney(row.grandTotal - row.paidTotal),
    },
    {
      title: "Channel",
      dataIndex: "bookingChannel",
      sorter: sortText<BookingListItem>((row) => row.bookingChannel),
      render: channelLabel,
    },
    {
      title: "Status",
      dataIndex: "bookingStatus",
      sorter: sortByOrder<BookingListItem>((row) => row.bookingStatus, BOOKING_STATUSES),
      render: (value: BookingListItem["bookingStatus"]) => <StatusTag value={value} palette={BOOKING_STATUS} />,
    },
  ];

  return (
    <Table<BookingListItem>
      rowKey="bookingId"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={bookings}
      scroll={{ x: "max-content" }}
      pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
      onRow={(row) => ({
        onClick: () => router.push(`/bookings/${row.bookingId}`),
        style: { cursor: "pointer" },
      })}
    />
  );
}
