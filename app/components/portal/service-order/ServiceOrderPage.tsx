"use client";

import { useState } from "react";
import { App, Button, Card, Empty, Input, Select, Space } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { formatMoney } from "@/app/lib/format";
import { ORDER_STATUS, statusOptions } from "@/app/lib/status";
import { useApiData } from "@/app/lib/use-api-data";
import BranchFilter from "../BranchFilter";
import LoadError from "../LoadError";
import AssignModal from "./AssignModal";
import OrderModal from "./OrderModal";
import ScheduleModal from "./ScheduleModal";
import { assignOrder, changeOrderStatus, createOrder, fetchOrders } from "./service-order.api";
import ServiceOrderTable from "./ServiceOrderTable";
import type { AssignInput, OrderStatusInput, ServiceOrder, ServiceOrderFilter, ServiceOrderInput } from "./types";

export default function ServiceOrderPage() {
  const { message, modal } = App.useApp();
  const { user, can } = useSession();
  const canProgress = can("SERVICE_ORDER_MANAGE");
  const canAssign = can("ASSIGNMENT_MANAGE");
  const [filter, setFilter] = useState<ServiceOrderFilter>({});
  const [actingId, setActingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [scheduling, setScheduling] = useState<ServiceOrder | null>(null);
  const [assigning, setAssigning] = useState<ServiceOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const orders = useApiData((signal) => fetchOrders(filter, signal), JSON.stringify(filter));
  const data = orders.data ?? [];

  const act = async (o: ServiceOrder, input: OrderStatusInput, done: string, close?: () => void) => {
    setActingId(o.bookingServiceId);
    setSaving(true);
    try {
      await changeOrderStatus(o.bookingServiceId, input);
      message.success(done);
      close?.();
      orders.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update the order");
    } finally {
      setActingId(null);
      setSaving(false);
    }
  };

  const cancelOrder = (o: ServiceOrder) =>
    modal.confirm({
      title: `Cancel ${o.serviceName} for ${o.bookingCode}?`,
      content: `The order is closed for good and ${formatMoney(o.subtotal)} comes off the booking total.`,
      okText: "Cancel order",
      cancelText: "Keep it",
      okButtonProps: { danger: true },
      onOk: () => act(o, { toStatus: "CANCELLED" }, "Order cancelled"),
    });

  const place = async (input: ServiceOrderInput) => {
    setSaving(true);
    try {
      const order = await createOrder(input);
      message.success(`${order.serviceName} ordered for ${order.bookingCode}`);
      setCreating(false);
      orders.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not place the order");
    } finally {
      setSaving(false);
    }
  };

  const assign = async (input: AssignInput) => {
    if (!assigning) return;
    setSaving(true);
    try {
      await assignOrder(assigning.bookingServiceId, input);
      message.success(`${assigning.serviceName} ${assigning.assignmentId ? "reassigned" : "assigned"}`);
      setAssigning(null);
      orders.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not assign the order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {orders.error && <LoadError error={orders.error} onRetry={orders.reload} />}
      <Card
        variant="outlined"
        title="Service orders"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Booking, guest or service"
              value={filter.q}
              onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value || undefined }))}
              style={{ width: 220 }}
            />
            <BranchFilter value={filter.branchId} onChange={(branchId) => setFilter((f) => ({ ...f, branchId }))} />
            <Select
              allowClear
              placeholder="All statuses"
              style={{ width: 150 }}
              value={filter.status}
              onChange={(status) => setFilter((f) => ({ ...f, status }))}
              options={statusOptions(ORDER_STATUS)}
            />
            {canProgress && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
                New order
              </Button>
            )}
          </Space>
        }
      >
        {!orders.loading && !orders.error && data.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={filter.branchId || filter.status || filter.q ? "No orders match these filters." : "No service orders yet."}
            style={{ padding: 32 }}
          />
        ) : (
          <ServiceOrderTable
            orders={data}
            loading={orders.loading}
            showBranch={user?.scopeLevel === "CHAIN"}
            canProgress={canProgress}
            canAssign={canAssign}
            actingId={actingId}
            onSchedule={setScheduling}
            onStart={(o) => act(o, { toStatus: "IN_PROGRESS" }, `${o.serviceName} started`)}
            onComplete={(o) => act(o, { toStatus: "COMPLETED" }, `${o.serviceName} completed`)}
            onCancelOrder={cancelOrder}
            onAssign={setAssigning}
          />
        )}
      </Card>
      <OrderModal open={creating} booking={null} saving={saving} onCancel={() => setCreating(false)} onSubmit={place} />
      <ScheduleModal
        order={scheduling}
        saving={saving}
        onCancel={() => setScheduling(null)}
        onSubmit={(scheduledAt) =>
          scheduling && act(scheduling, { toStatus: "SCHEDULED", scheduledAt }, "Order scheduled", () => setScheduling(null))
        }
      />
      <AssignModal order={assigning} saving={saving} onCancel={() => setAssigning(null)} onSubmit={assign} />
    </>
  );
}
