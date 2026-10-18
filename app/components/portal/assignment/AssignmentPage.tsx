"use client";

import { useState } from "react";
import Link from "next/link";
import { App, Button, Card, Empty, Rate, Select, Space, Table, Typography, type TableColumnsType } from "antd";
import { UserSwitchOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { formatDateTime } from "@/app/lib/format";
import { ASSIGNMENT_STATUS, ORDER_STATUS, statusOptions } from "@/app/lib/status";
import { sortByOrder, sortDate, sortNumber, sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import BranchFilter from "../BranchFilter";
import LoadError from "../LoadError";
import AssignModal from "../service-order/AssignModal";
import { assignOrder, fetchOrders } from "../service-order/service-order.api";
import type { AssignInput, ServiceOrder } from "../service-order/types";
import StatusTag from "../StatusTag";
import { fetchAssignments, fetchQuality, rateAssignment } from "./assignment.api";
import { ASSIGNMENT_STATUSES, type Assignment, type AssignmentFilter, type QualityRow } from "./types";

const dash = <Typography.Text type="secondary">—</Typography.Text>;

// ASSIGNMENT_MANAGE reaches this page.
export default function AssignmentPage() {
  const { message } = App.useApp();
  const { user } = useSession();
  const showBranch = user?.scopeLevel === "CHAIN";
  const [filter, setFilter] = useState<AssignmentFilter>({});
  const [assigning, setAssigning] = useState<ServiceOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const history = useApiData((signal) => fetchAssignments(filter, signal), JSON.stringify(filter));
  const quality = useApiData(fetchQuality, "assignment-quality");
  const orders = useApiData((signal) => fetchOrders({}, signal), "assignment-orders");
  const waiting = (orders.data ?? []).filter(
    (o) => o.needAssignment && !o.assignmentId && (o.orderStatus === "REQUESTED" || o.orderStatus === "SCHEDULED" || o.orderStatus === "IN_PROGRESS"),
  );
  const reloadAll = () => {
    history.reload();
    quality.reload();
    orders.reload();
  };

  const assign = async (input: AssignInput) => {
    if (!assigning) return;
    setSaving(true);
    try {
      await assignOrder(assigning.bookingServiceId, input);
      message.success(`${assigning.serviceName} assigned`);
      setAssigning(null);
      reloadAll();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not assign the order");
    } finally {
      setSaving(false);
    }
  };

  const score = async (a: Assignment, value: number) => {
    try {
      await rateAssignment(a.assignmentId, value);
      message.success(`${a.employeeName} scored ${value}/5 for ${a.serviceName}`);
      history.reload();
      quality.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not save the score");
    }
  };

  const waitingColumns: TableColumnsType<ServiceOrder> = [
    { title: "Booking", dataIndex: "bookingCode", sorter: sortText<ServiceOrder>((o) => o.bookingCode), render: (v: string, o) => <Link href={`/bookings/${o.bookingId}`}>{v}</Link> },
    ...(showBranch ? [{ title: "Branch", dataIndex: "branchCode", sorter: sortText<ServiceOrder>((o) => o.branchCode) }] : []),
    { title: "Service", dataIndex: "serviceName", sorter: sortText<ServiceOrder>((o) => o.serviceName) },
    { title: "Scheduled", dataIndex: "scheduledAt", sorter: sortDate<ServiceOrder>((o) => o.scheduledAt), render: formatDateTime },
    { title: "Status", dataIndex: "orderStatus", sorter: sortText<ServiceOrder>((o) => o.orderStatus), render: (v: ServiceOrder["orderStatus"]) => <StatusTag value={v} palette={ORDER_STATUS} /> },
    {
      title: "",
      key: "assign",
      fixed: "right",
      render: (_, o) => (
        <Button size="small" type="primary" icon={<UserSwitchOutlined />} onClick={() => setAssigning(o)}>
          Assign
        </Button>
      ),
    },
  ];

  const qualityColumns: TableColumnsType<QualityRow> = [
    { title: "Employee", dataIndex: "employeeName", sorter: sortText<QualityRow>((q) => q.employeeName) },
    ...(showBranch ? [{ title: "Branch", dataIndex: "branchCode", sorter: sortText<QualityRow>((q) => q.branchCode) }] : []),
    { title: "Completed", dataIndex: "completedCount", align: "right", sorter: sortNumber<QualityRow>((q) => q.completedCount) },
    { title: "Open", dataIndex: "openCount", align: "right", sorter: sortNumber<QualityRow>((q) => q.openCount) },
    { title: "Scored", dataIndex: "ratedCount", align: "right", sorter: sortNumber<QualityRow>((q) => q.ratedCount) },
    {
      title: "Average score",
      dataIndex: "averageScore",
      align: "right",
      defaultSortOrder: "descend",
      sorter: sortNumber<QualityRow>((q) => q.averageScore),
      render: (v: number | null) => (v === null ? dash : `${v.toFixed(2)} / 5`),
    },
  ];

  const historyColumns: TableColumnsType<Assignment> = [
    { title: "Assigned", dataIndex: "assignedAt", sorter: sortDate<Assignment>((a) => a.assignedAt), render: formatDateTime },
    { title: "Booking", dataIndex: "bookingCode", sorter: sortText<Assignment>((a) => a.bookingCode), render: (v: string, a) => <Link href={`/bookings/${a.bookingId}`}>{v}</Link> },
    ...(showBranch ? [{ title: "Branch", dataIndex: "branchCode", sorter: sortText<Assignment>((a) => a.branchCode) }] : []),
    { title: "Service", dataIndex: "serviceName", sorter: sortText<Assignment>((a) => a.serviceName) },
    { title: "Employee", dataIndex: "employeeName", sorter: sortText<Assignment>((a) => a.employeeName) },
    { title: "Assigned by", dataIndex: "assignedByName", sorter: sortText<Assignment>((a) => a.assignedByName), render: (v: string | null) => v ?? dash },
    { title: "Started", dataIndex: "startedAt", sorter: sortDate<Assignment>((a) => a.startedAt), render: formatDateTime },
    { title: "Completed", dataIndex: "completedAt", sorter: sortDate<Assignment>((a) => a.completedAt), render: formatDateTime },
    {
      title: "Status",
      dataIndex: "assignmentStatus",
      sorter: sortByOrder<Assignment>((a) => a.assignmentStatus, ASSIGNMENT_STATUSES),
      render: (v: Assignment["assignmentStatus"]) => <StatusTag value={v} palette={ASSIGNMENT_STATUS} />,
    },
    {
      title: "Quality",
      dataIndex: "qualityScore",
      sorter: sortNumber<Assignment>((a) => a.qualityScore),
      render: (v: number | null, a) =>
        a.assignmentStatus === "COMPLETED" ? (
          <Rate allowClear={false} value={v ?? 0} onChange={(value) => void score(a, value)} style={{ fontSize: 14 }} aria-label={`Score ${a.employeeName}`} />
        ) : (
          dash
        ),
    },
    {
      title: "Note",
      dataIndex: "note",
      sorter: sortText<Assignment>((a) => a.note),
      render: (v: string | null) => v ?? dash,
    },
  ];

  const error = history.error ?? quality.error ?? orders.error;

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      {error && <LoadError error={error} onRetry={reloadAll} />}
      <Card variant="outlined" title={`Waiting for someone (${waiting.length})`} styles={{ body: { padding: waiting.length ? 0 : 24 } }}>
        {waiting.length || orders.loading ? (
          <Table<ServiceOrder>
            rowKey="bookingServiceId"
            size="middle"
            loading={orders.loading}
            columns={waitingColumns}
            dataSource={waiting}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Every open order that needs staff has someone assigned." />
        )}
      </Card>
      <Card variant="outlined" title="Quality by employee" styles={{ body: { padding: 0 } }}>
        <Table<QualityRow>
          rowKey="employeeId"
          size="middle"
          loading={quality.loading}
          columns={qualityColumns}
          dataSource={quality.data ?? []}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
        />
      </Card>
      <Card
        variant="outlined"
        title="Assignment history"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <BranchFilter value={filter.branchId} onChange={(branchId) => setFilter((f) => ({ ...f, branchId }))} />
            <Select
              allowClear
              placeholder="All statuses"
              style={{ width: 150 }}
              value={filter.status}
              onChange={(status) => setFilter((f) => ({ ...f, status }))}
              options={statusOptions(ASSIGNMENT_STATUS)}
            />
          </Space>
        }
      >
        <Table<Assignment>
          rowKey="assignmentId"
          size="middle"
          loading={history.loading}
          columns={historyColumns}
          dataSource={history.data ?? []}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
        />
      </Card>
      <AssignModal order={assigning} saving={saving} onCancel={() => setAssigning(null)} onSubmit={assign} />
    </Space>
  );
}
