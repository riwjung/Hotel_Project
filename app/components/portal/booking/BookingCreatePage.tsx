"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dayjs, { type Dayjs } from "dayjs";
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import { ArrowLeftOutlined, UserAddOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { codeLabel, formatMoney } from "@/app/lib/format";
import { useApiData } from "@/app/lib/use-api-data";
import LoadError from "../LoadError";
import { fetchBranches } from "../branch/branch.api";
import { fetchCustomers, fetchMemberTiers } from "../customer/customer.api";
import CustomerModal from "../customer/CustomerModal";
import { useCustomerEditor } from "../customer/useCustomerEditor";
import AvailableRoomTable from "./AvailableRoomTable";
import { createBooking, fetchAvailableRooms } from "./booking.api";
import type { BookingPrefill } from "./prefill";
import { BOOKING_CHANNELS, type BookingChannel } from "./types";

type FormValues = {
  customerId: number;
  branchId?: number;
  stay: [Dayjs, Dayjs];
  guestCount: number;
  bookingChannel: BookingChannel;
  promotionCode?: string;
  confirm: boolean;
};

const noRooms: never[] = [];

export default function BookingCreatePage({ prefill = {} }: { prefill?: BookingPrefill }) {
  const router = useRouter();
  const { message } = App.useApp();
  const { user, can, selectedBranchId } = useSession();
  const chainWide = user?.scopeLevel === "CHAIN" && !selectedBranchId;
  const canAddCustomer = can("CUSTOMER_MANAGE");
  const [form] = Form.useForm<FormValues>();
  const [roomIds, setRoomIds] = useState<number[]>(prefill.roomId ? [prefill.roomId] : []);
  const [saving, setSaving] = useState(false);
  // Dates from the availability grid; a past check-in is dropped (the picker disallows it too).
  const prefillStay: [Dayjs, Dayjs] | undefined =
    prefill.checkIn && prefill.checkOut && !dayjs(prefill.checkIn).isBefore(dayjs().startOf("day"))
      ? [dayjs(prefill.checkIn), dayjs(prefill.checkOut)]
      : undefined;

  const pickedBranch = Form.useWatch("branchId", form);
  const customerId = Form.useWatch("customerId", form);
  const stay = Form.useWatch("stay", form);
  const guestCount = Form.useWatch("guestCount", form) ?? 1;
  const branchId = chainWide ? pickedBranch : (selectedBranchId ?? user?.branchId ?? undefined);
  const checkIn = stay?.[0]?.format("YYYY-MM-DD");
  const checkOut = stay?.[1]?.format("YYYY-MM-DD");
  const nights = stay?.[0] && stay?.[1] ? stay[1].startOf("day").diff(stay[0].startOf("day"), "day") : 0;
  const ready = Boolean(branchId && checkIn && checkOut && nights > 0);

  const customers = useApiData(fetchCustomers, "booking-customers");
  const customer = customers.data?.find((c) => c.customerId === customerId);
  const tiers = useApiData(
    (signal) => (canAddCustomer ? fetchMemberTiers(signal) : Promise.resolve([])),
    `booking-tiers:${canAddCustomer}`,
  );
  const branches = useApiData(
    (signal) => (chainWide ? fetchBranches(signal) : Promise.resolve([])),
    `booking-branches:${chainWide}`,
  );
  const rooms = useApiData(
    (signal) => (ready ? fetchAvailableRooms({ branchId, checkIn: checkIn!, checkOut: checkOut! }, signal) : Promise.resolve(noRooms)),
    JSON.stringify({ branchId, checkIn, checkOut }),
  );
  const available = ready ? (rooms.data ?? noRooms) : noRooms;

  // Selections that are no longer available (dates/branch changed) simply drop out.
  const selectedRooms = available.filter((room) => roomIds.includes(room.roomId) && nights >= room.minNights);
  const selected = selectedRooms.map((room) => room.roomId);
  const capacity = selectedRooms.reduce((sum, room) => sum + room.capacity, 0);
  const roomTotal = selectedRooms.reduce((sum, room) => sum + room.pricePerNight * nights, 0);
  const overCapacity = selectedRooms.length > 0 && guestCount > capacity;

  const customerEditor = useCustomerEditor((saved) => {
    customers.reload();
    if (saved) form.setFieldValue("customerId", saved.customerId);
  });

  const submit = async (values: FormValues) => {
    if (!selected.length) {
      message.error("Select at least one room");
      return;
    }
    if (overCapacity) {
      message.error(`The selected rooms sleep ${capacity}; add a room or reduce the guests`);
      return;
    }
    setSaving(true);
    try {
      const created = await createBooking({
        customerId: values.customerId,
        branchId: chainWide ? values.branchId : null,
        checkInDate: values.stay[0].format("YYYY-MM-DD"),
        checkOutDate: values.stay[1].format("YYYY-MM-DD"),
        guestCount: values.guestCount,
        bookingChannel: values.bookingChannel,
        promotionCode: values.promotionCode?.trim() || null,
        roomIds: selected,
        confirm: values.confirm,
      });
      message.success(`Booking ${created.bookingCode} created`);
      router.push(`/bookings/${created.bookingId}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not create the booking");
      setSaving(false);
    }
  };

  const loadError = customers.error ?? branches.error ?? (ready ? rooms.error : null);

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Space wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/bookings")}>Back to bookings</Button>
        <Typography.Title level={3} style={{ margin: 0 }}>New booking</Typography.Title>
      </Space>
      {loadError && <LoadError error={loadError} onRetry={() => { customers.reload(); branches.reload(); rooms.reload(); }} />}

      <Form<FormValues>
        form={form}
        layout="vertical"
        requiredMark="optional"
        initialValues={{ guestCount: 1, bookingChannel: "WALK_IN", confirm: true, branchId: prefill.branchId, stay: prefillStay }}
        onFinish={submit}
        disabled={saving}
      >
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <Card variant="outlined" title="Guest & stay">
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <Form.Item label="Customer" required>
                  <Space.Compact style={{ width: "100%" }}>
                    <Form.Item name="customerId" noStyle rules={[{ required: true, message: "Select a customer" }]}>
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="Search name or email"
                        loading={customers.loading}
                        style={{ width: "100%" }}
                        options={(customers.data ?? []).map((c) => ({
                          value: c.customerId,
                          label: `${c.firstName} ${c.lastName} · ${c.email} · ${c.tierName}`,
                        }))}
                      />
                    </Form.Item>
                    {canAddCustomer && (
                      <Button icon={<UserAddOutlined />} onClick={customerEditor.openCreate}>
                        New
                      </Button>
                    )}
                  </Space.Compact>
                </Form.Item>
              </Col>
              {chainWide && (
                <Col xs={24} sm={12} lg={6}>
                  <Form.Item label="Branch" name="branchId" rules={[{ required: true, message: "Select a branch" }]}>
                    <Select
                      placeholder="Select a branch"
                      loading={branches.loading}
                      options={(branches.data ?? [])
                        .filter((b) => b.branchStatus === "ACTIVE")
                        .map((b) => ({ value: b.branchId, label: `${b.branchCode} · ${b.branchName}` }))}
                    />
                  </Form.Item>
                </Col>
              )}
              <Col xs={24} sm={12} lg={chainWide ? 6 : 12}>
                <Form.Item label="Channel" name="bookingChannel" rules={[{ required: true }]}>
                  <Select options={BOOKING_CHANNELS.map((value) => ({ value, label: codeLabel(value) }))} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={16} lg={12}>
                <Form.Item
                  label="Stay"
                  name="stay"
                  rules={[{ required: true, message: "Choose check-in and check-out dates" }]}
                  extra={nights > 0 ? `${nights} night(s)` : undefined}
                >
                  <DatePicker.RangePicker
                    style={{ width: "100%" }}
                    format="D MMM YYYY"
                    disabledDate={(day) => day.isBefore(dayjs().startOf("day"))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8} lg={6}>
                <Form.Item label="Guests" name="guestCount" rules={[{ required: true, message: "Enter the guests" }]}>
                  <InputNumber min={1} max={50} precision={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            variant="outlined"
            title="Available rooms"
            styles={{ body: { padding: ready && available.length ? 0 : 24 } }}
            extra={ready ? <Typography.Text type="secondary">{available.length} available</Typography.Text> : null}
          >
            {!ready ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={chainWide ? "Choose a branch and the stay dates to see free rooms." : "Choose the stay dates to see free rooms."}
              />
            ) : !rooms.loading && available.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Every room is taken for these dates. Try other dates." />
            ) : (
              <AvailableRoomTable
                rooms={available}
                loading={rooms.loading}
                nights={nights}
                selected={selected}
                onChange={setRoomIds}
              />
            )}
          </Card>

          <Card variant="outlined" title="Summary">
            <Descriptions
              bordered
              size="small"
              column={{ xs: 1, sm: 2, lg: 3 }}
              styles={{ label: { fontWeight: 600 } }}
              items={[
                { key: "rooms", label: "Rooms", children: selectedRooms.map((r) => r.roomNumber).join(", ") || "—" },
                { key: "sleeps", label: "Sleeps / guests", children: `${capacity} / ${guestCount}` },
                { key: "total", label: "Room total (before discounts)", children: formatMoney(roomTotal) },
                {
                  key: "member",
                  label: "Member discount",
                  span: "filled",
                  children: !customer
                    ? "—"
                    : customer.discountRate > 0
                      ? `${customer.tierName} · ${customer.discountRate}% off, applied after any promotion`
                      : `${customer.tierName} · no member discount`,
                },
              ]}
            />
            {overCapacity && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
                title={`${guestCount} guests but the selected rooms sleep ${capacity}`}
                description="Add another room or reduce the guests. The database rejects bookings over capacity."
              />
            )}
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Promotion code"
                  name="promotionCode"
                  extra="Checked when you save: active, in date and under its usage limit."
                >
                  <Input maxLength={30} style={{ textTransform: "uppercase" }} placeholder="e.g. EARLYBIRD" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Status" name="confirm" valuePropName="checked">
                  <Checkbox>Confirm now (otherwise the booking stays Pending)</Checkbox>
                </Form.Item>
              </Col>
            </Row>
            <Typography.Paragraph type="secondary">
              Discounts and the grand total are calculated by the database when the booking is saved.
            </Typography.Paragraph>
            <Space wrap>
              <Button onClick={() => router.push("/bookings")}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                Create booking
              </Button>
            </Space>
          </Card>
        </Space>
      </Form>

      <CustomerModal
        open={customerEditor.open}
        customer={null}
        tiers={tiers.data ?? []}
        saving={customerEditor.saving}
        onCancel={customerEditor.close}
        onSubmit={customerEditor.save}
      />
    </Space>
  );
}
