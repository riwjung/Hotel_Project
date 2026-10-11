"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Space,
  Table,
  Timeline,
  Typography,
  type TableColumnsType,
} from "antd";
import { ArrowLeftOutlined, CheckOutlined, CreditCardOutlined, LoginOutlined, LogoutOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { formatDate, formatDateTime, formatMoney } from "@/app/lib/format";
import { BOOKING_STATUS, PAYMENT_STATUS } from "@/app/lib/status";
import { sortDate, sortNumber, sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import LoadError from "../LoadError";
import StatusTag from "../StatusTag";
import { changeBookingStatus, checkInBooking, checkOutBooking, fetchBooking, recordBookingPayment } from "./booking.api";
import CheckInModal from "./CheckInModal";
import CheckOutModal from "./CheckOutModal";
import PaymentModal from "./PaymentModal";
import type {
  BookingGuest,
  BookingPayment,
  BookingRoomDetail,
  BookingService,
  BookingStatus,
  CheckInInput,
  CheckOutInput,
  PaymentInput,
} from "./types";

const codeLabel = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

export default function BookingDetailPage({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const { can } = useSession();
  const bookingState = useApiData((signal) => fetchBooking(bookingId, signal), String(bookingId));
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const booking = bookingState.data;

  const run = async (work: () => Promise<unknown>, success: string, close?: () => void) => {
    setSaving(true);
    try {
      await work();
      message.success(success);
      close?.();
      bookingState.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = (toStatus: BookingStatus) => {
    const work = () => run(
      () => changeBookingStatus(bookingId, toStatus),
      `Booking ${codeLabel(toStatus)}`,
    );
    if (toStatus === "CANCELLED" || toStatus === "NO_SHOW") {
      modal.confirm({
        title: `${toStatus === "CANCELLED" ? "Cancel" : "Mark no-show for"} ${booking?.bookingCode}?`,
        content: "This is a final status and cannot be reversed.",
        okText: toStatus === "CANCELLED" ? "Cancel booking" : "Mark no-show",
        okButtonProps: { danger: true },
        onOk: work,
      });
    } else void work();
  };

  if (bookingState.error) return <LoadError error={bookingState.error} onRetry={bookingState.reload} />;
  if (!booking) return <Card variant="outlined" loading />;

  const roomColumns: TableColumnsType<BookingRoomDetail> = [
    { title: "Room", dataIndex: "roomNumber", sorter: sortText<BookingRoomDetail>((row) => row.roomNumber) },
    { title: "Type", dataIndex: "typeName", sorter: sortText<BookingRoomDetail>((row) => row.typeName) },
    { title: "Rate", dataIndex: "rateName", sorter: sortText<BookingRoomDetail>((row) => row.rateName) },
    { title: "Nightly", dataIndex: "pricePerNight", align: "right", sorter: sortNumber<BookingRoomDetail>((row) => row.pricePerNight), render: formatMoney },
    { title: "Nights", dataIndex: "nightCount", align: "right", sorter: sortNumber<BookingRoomDetail>((row) => row.nightCount) },
    { title: "Subtotal", dataIndex: "subtotal", align: "right", sorter: sortNumber<BookingRoomDetail>((row) => row.subtotal), render: formatMoney },
    { title: "Checked in", dataIndex: "actualCheckIn", sorter: sortDate<BookingRoomDetail>((row) => row.actualCheckIn), render: formatDateTime },
    { title: "Checked out", dataIndex: "actualCheckOut", sorter: sortDate<BookingRoomDetail>((row) => row.actualCheckOut), render: formatDateTime },
    { title: "Key card", dataIndex: "keyCardNo", sorter: sortText<BookingRoomDetail>((row) => row.keyCardNo), render: (value) => value ?? "—" },
  ];
  const guestColumns: TableColumnsType<BookingGuest> = [
    { title: "Guest", dataIndex: "fullName", sorter: sortText<BookingGuest>((row) => row.fullName), render: (value, row) => <>{value}{row.isPrimary && <Typography.Text type="secondary"> · Primary</Typography.Text>}</> },
    { title: "Room", dataIndex: "roomNumber", sorter: sortText<BookingGuest>((row) => row.roomNumber) },
    { title: "ID / passport", dataIndex: "idCardNo", sorter: sortText<BookingGuest>((row) => row.idCardNo), render: (value) => value ?? "—" },
    { title: "Nationality", dataIndex: "nationality", sorter: sortText<BookingGuest>((row) => row.nationality), render: (value) => value ?? "—" },
  ];
  const serviceColumns: TableColumnsType<BookingService> = [
    { title: "Service", dataIndex: "serviceName", sorter: sortText<BookingService>((row) => row.serviceName) },
    { title: "Quantity", dataIndex: "quantity", align: "right", sorter: sortNumber<BookingService>((row) => row.quantity) },
    { title: "Unit price", dataIndex: "unitPrice", align: "right", sorter: sortNumber<BookingService>((row) => row.unitPrice), render: formatMoney },
    { title: "Subtotal", dataIndex: "subtotal", align: "right", sorter: sortNumber<BookingService>((row) => row.subtotal), render: formatMoney },
    { title: "Scheduled", dataIndex: "scheduledAt", sorter: sortDate<BookingService>((row) => row.scheduledAt), render: formatDateTime },
    { title: "Status", dataIndex: "orderStatus", sorter: sortText<BookingService>((row) => row.orderStatus), render: codeLabel },
  ];
  const paymentColumns: TableColumnsType<BookingPayment> = [
    { title: "Date", dataIndex: "paymentDate", sorter: sortDate<BookingPayment>((row) => row.paymentDate), render: formatDateTime },
    { title: "Type", dataIndex: "paymentType", sorter: sortText<BookingPayment>((row) => row.paymentType), render: codeLabel },
    { title: "Method", dataIndex: "paymentMethod", sorter: sortText<BookingPayment>((row) => row.paymentMethod), render: codeLabel },
    { title: "Amount", dataIndex: "amount", align: "right", sorter: sortNumber<BookingPayment>((row) => row.amount), render: formatMoney },
    { title: "Reference", dataIndex: "transactionRef", sorter: sortText<BookingPayment>((row) => row.transactionRef), render: (value) => value ?? "—" },
    { title: "Received by", dataIndex: "receivedByName", sorter: sortText<BookingPayment>((row) => row.receivedByName), render: (value) => value || "Online" },
    { title: "Status", dataIndex: "paymentStatus", sorter: sortText<BookingPayment>((row) => row.paymentStatus), render: (value: BookingPayment["paymentStatus"]) => <StatusTag value={value} palette={PAYMENT_STATUS} /> },
  ];

  const tableProps = { size: "middle" as const, pagination: false as const, scroll: { x: "max-content" as const } };

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Space wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/bookings")}>Back to bookings</Button>
        <Typography.Title level={3} style={{ margin: 0 }}>{booking.bookingCode}</Typography.Title>
        <StatusTag value={booking.bookingStatus} palette={BOOKING_STATUS} />
      </Space>

      {(can("BOOKING_MANAGE") || can("PAYMENT_MANAGE")) && (
        <Space wrap>
          {can("BOOKING_MANAGE") && booking.bookingStatus === "PENDING" && (
            <Button type="primary" icon={<CheckOutlined />} loading={saving} onClick={() => changeStatus("CONFIRMED")}>Confirm booking</Button>
          )}
          {can("BOOKING_MANAGE") && booking.bookingStatus === "CONFIRMED" && (
            <Button type="primary" icon={<LoginOutlined />} onClick={() => setCheckInOpen(true)}>Check in</Button>
          )}
          {can("PAYMENT_MANAGE") && booking.balance > 0 && !["CANCELLED", "NO_SHOW"].includes(booking.bookingStatus) && (
            <Button icon={<CreditCardOutlined />} onClick={() => setPaymentOpen(true)}>Record payment</Button>
          )}
          {can("BOOKING_MANAGE") && booking.bookingStatus === "CHECKED_IN" && (
            <Button type="primary" icon={<LogoutOutlined />} onClick={() => setCheckOutOpen(true)}>Check out</Button>
          )}
          {can("BOOKING_MANAGE") && booking.bookingStatus === "PENDING" && (
            <Button danger onClick={() => changeStatus("CANCELLED")}>Cancel booking</Button>
          )}
          {can("BOOKING_MANAGE") && booking.bookingStatus === "CONFIRMED" && (
            <>
              <Button danger onClick={() => changeStatus("CANCELLED")}>Cancel booking</Button>
              <Button danger onClick={() => changeStatus("NO_SHOW")}>Mark no-show</Button>
            </>
          )}
        </Space>
      )}

      <Card variant="outlined" title="Stay summary">
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2, lg: 3 }}
          styles={{ label: { fontWeight: 600 } }}
          items={[
            { key: "customer", label: "Customer", children: `${booking.customerName} · ${booking.tierName}` },
            { key: "branch", label: "Branch", children: booking.branchCode },
            { key: "channel", label: "Channel", children: codeLabel(booking.bookingChannel) },
            { key: "stay", label: "Stay", children: `${formatDate(booking.checkInDate)} – ${formatDate(booking.checkOutDate)}` },
            { key: "rooms", label: "Rooms / guests", children: `${booking.roomCount} room(s) · ${booking.guestCount} guest(s)` },
            { key: "promotion", label: "Promotion", children: booking.promotionCode ? `${booking.promotionCode} · ${booking.promotionName}` : "—" },
            { key: "roomTotal", label: "Room total", children: formatMoney(booking.roomTotal) },
            { key: "serviceTotal", label: "Service total", children: formatMoney(booking.serviceTotal) },
            { key: "discount", label: "Discount", children: formatMoney(booking.discountAmount) },
            { key: "grand", label: "Grand total", children: formatMoney(booking.grandTotal) },
            { key: "paid", label: "Paid", children: formatMoney(booking.paidTotal) },
            { key: "balance", label: "Balance", children: <Typography.Text strong type={booking.balance > 0 ? "danger" : undefined}>{formatMoney(booking.balance)}</Typography.Text> },
          ]}
        />
      </Card>

      <Card variant="outlined" title="Rooms" styles={{ body: { padding: 0 } }}>
        <Table rowKey="bookingRoomId" columns={roomColumns} dataSource={booking.rooms} {...tableProps} />
      </Card>
      <Card variant="outlined" title="Guests" styles={{ body: { padding: booking.guests.length ? 0 : 24 } }}>
        {booking.guests.length ? <Table rowKey="guestId" columns={guestColumns} dataSource={booking.guests} {...tableProps} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Guest details are recorded at check-in." />}
      </Card>
      <Card variant="outlined" title="Services" styles={{ body: { padding: booking.services.length ? 0 : 24 } }}>
        {booking.services.length ? <Table rowKey="bookingServiceId" columns={serviceColumns} dataSource={booking.services} {...tableProps} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No services ordered for this booking." />}
      </Card>
      <Card variant="outlined" title="Payments" styles={{ body: { padding: booking.payments.length ? 0 : 24 } }}>
        {booking.payments.length ? <Table rowKey="paymentId" columns={paymentColumns} dataSource={booking.payments} {...tableProps} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No payments recorded yet." />}
      </Card>
      <Card variant="outlined" title="Status timeline">
        <Timeline
          items={booking.statusLog.map((entry) => ({
            color: BOOKING_STATUS[entry.toStatus].color,
            children: (
              <>
                <Typography.Text strong>{BOOKING_STATUS[entry.toStatus].label}</Typography.Text>
                <br />
                <Typography.Text type="secondary">{formatDateTime(entry.changedAt)} · {entry.changedByName || "System"}</Typography.Text>
                {entry.remark && <><br /><Typography.Text>{entry.remark}</Typography.Text></>}
              </>
            ),
          }))}
        />
      </Card>

      <CheckInModal
        open={checkInOpen}
        booking={booking}
        saving={saving}
        onCancel={() => setCheckInOpen(false)}
        onSubmit={(input: CheckInInput) => void run(() => checkInBooking(bookingId, input), "Guest checked in", () => setCheckInOpen(false))}
      />
      <PaymentModal
        open={paymentOpen}
        balance={booking.balance}
        saving={saving}
        onCancel={() => setPaymentOpen(false)}
        onSubmit={(input: PaymentInput) => void run(() => recordBookingPayment(bookingId, input), "Payment recorded", () => setPaymentOpen(false))}
      />
      <CheckOutModal
        open={checkOutOpen}
        assignees={booking.housekeepingAssignees}
        saving={saving}
        onCancel={() => setCheckOutOpen(false)}
        onSubmit={(input: CheckOutInput) => void run(() => checkOutBooking(bookingId, input), "Guest checked out and cleaning tasks created", () => setCheckOutOpen(false))}
      />
    </Space>
  );
}
