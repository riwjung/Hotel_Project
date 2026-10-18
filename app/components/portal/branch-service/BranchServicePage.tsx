"use client";

import { useState } from "react";
import { App, Button, Card, Empty, Select, Space, Switch, Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { formatMoney } from "@/app/lib/format";
import { sortNumber, sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import { useCrudEditor } from "@/app/lib/use-crud-editor";
import BranchFilter from "../BranchFilter";
import LoadError from "../LoadError";
import { fetchServices } from "../service/service.api";
import {
  createBranchService,
  deleteBranchService,
  fetchBranchServices,
  updateBranchService,
} from "./branch-service.api";
import BranchServiceModal from "./BranchServiceModal";
import type { BranchService, BranchServiceFilter, BranchServiceInput } from "./types";

export default function BranchServicePage() {
  const { message } = App.useApp();
  const { user, can } = useSession();
  const canManage = can("SERVICE_MANAGE");
  const [filter, setFilter] = useState<BranchServiceFilter>({});
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const rows = useApiData((signal) => fetchBranchServices(filter, signal), JSON.stringify(filter));
  const services = useApiData((signal) => (canManage ? fetchServices(signal) : Promise.resolve([])), `bs-catalog:${canManage}`);
  const editor = useCrudEditor<BranchService, BranchServiceInput>({
    noun: "service",
    label: (r) => `${r.serviceName} at ${r.branchCode}`,
    create: createBranchService,
    update: (r, input) => updateBranchService(r.branchServiceId, input),
    remove: (r) => deleteBranchService(r.branchServiceId),
    removeWarning: "This cannot be undone. A service that guests have already ordered cannot be removed — mark it unavailable instead.",
    onChanged: () => rows.reload(),
  });

  const toggle = async (r: BranchService, isAvailable: boolean) => {
    setTogglingId(r.branchServiceId);
    try {
      await updateBranchService(r.branchServiceId, {
        serviceId: r.serviceId,
        branchPrice: r.branchPrice,
        isAvailable,
        openTime: r.openTime,
        closeTime: r.closeTime,
      });
      message.success(`${r.serviceName} is ${isAvailable ? "available" : "unavailable"} at ${r.branchCode}`);
      rows.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update the service");
    } finally {
      setTogglingId(null);
    }
  };

  const columns: TableColumnsType<BranchService> = [
    ...(user?.scopeLevel === "CHAIN" ? [{ title: "Branch", dataIndex: "branchCode", sorter: sortText<BranchService>((r) => r.branchCode) }] : []),
    {
      title: "Service",
      dataIndex: "serviceName",
      sorter: sortText<BranchService>((r) => r.serviceName),
      render: (v: string, r) => (
        <>
          <Typography.Text strong>{v}</Typography.Text> <Typography.Text type="secondary">{r.categoryName}</Typography.Text>
        </>
      ),
    },
    {
      title: "Branch price",
      key: "price",
      align: "right",
      sorter: sortNumber<BranchService>((r) => r.branchPrice),
      render: (_, r) => `${formatMoney(r.branchPrice)} / ${r.unit}`,
    },
    {
      title: "Catalog price",
      dataIndex: "defaultPrice",
      align: "right",
      sorter: sortNumber<BranchService>((r) => r.defaultPrice),
      render: formatMoney,
    },
    {
      title: "Hours",
      key: "hours",
      sorter: sortText<BranchService>((r) => r.openTime),
      render: (_, r) => (r.openTime ? `${r.openTime} – ${r.closeTime}` : <Typography.Text type="secondary">Any time</Typography.Text>),
    },
    { title: "Orders", dataIndex: "orderCount", align: "right", sorter: sortNumber<BranchService>((r) => r.orderCount) },
    {
      title: "Available",
      dataIndex: "isAvailable",
      align: "center",
      sorter: sortNumber<BranchService>((r) => Number(r.isAvailable)),
      render: (v: boolean, r) =>
        canManage ? (
          <Switch
            checked={v}
            loading={togglingId === r.branchServiceId}
            aria-label={`${r.serviceName} available`}
            onClick={(checked, e) => {
              e.stopPropagation();
              void toggle(r, checked);
            }}
          />
        ) : v ? "Yes" : <Typography.Text type="secondary">No</Typography.Text>,
    },
  ];
  if (canManage) {
    columns.push({
      title: "",
      key: "actions",
      fixed: "right",
      width: 96,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} aria-label={`Edit ${r.serviceName}`} onClick={(e) => { e.stopPropagation(); editor.openEdit(r); }} />
          </Tooltip>
          <Tooltip title={r.orderCount ? "Already ordered — mark it unavailable" : "Remove"}>
            <Button type="text" danger disabled={r.orderCount > 0} icon={<DeleteOutlined />} aria-label={`Remove ${r.serviceName}`} onClick={(e) => { e.stopPropagation(); editor.remove(r); }} />
          </Tooltip>
        </Space>
      ),
    });
  }

  const data = rows.data ?? [];
  return (
    <>
      {rows.error && <LoadError error={rows.error} onRetry={rows.reload} />}
      <Card
        variant="outlined"
        title="Branch services"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <BranchFilter value={filter.branchId} onChange={(branchId) => setFilter((f) => ({ ...f, branchId }))} />
            <Select
              allowClear
              placeholder="Available or not"
              style={{ width: 160 }}
              value={filter.available === undefined ? undefined : String(filter.available)}
              onChange={(v?: string) => setFilter((f) => ({ ...f, available: v === undefined ? undefined : v === "true" }))}
              options={[
                { value: "true", label: "Available" },
                { value: "false", label: "Unavailable" },
              ]}
            />
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={editor.openCreate}>
                Offer a service
              </Button>
            )}
          </Space>
        }
      >
        {!rows.loading && !rows.error && data.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No services offered here yet." style={{ padding: 32 }} />
        ) : (
          <Table<BranchService>
            rowKey="branchServiceId"
            size="middle"
            loading={rows.loading}
            columns={columns}
            dataSource={data}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
            onRow={(r) => (canManage ? { onClick: () => editor.openEdit(r), style: { cursor: "pointer" } } : {})}
          />
        )}
      </Card>
      <BranchServiceModal
        open={editor.open}
        row={editor.editing}
        services={services.data ?? []}
        saving={editor.saving}
        onCancel={editor.close}
        onSubmit={editor.save}
      />
    </>
  );
}
