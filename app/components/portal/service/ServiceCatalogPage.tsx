"use client";

import { Button, Card, Empty, Space, Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { CheckOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { formatMoney } from "@/app/lib/format";
import { ACTIVE_STATUS } from "@/app/lib/status";
import { sortByOrder, sortNumber, sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import { useCrudEditor } from "@/app/lib/use-crud-editor";
import LoadError from "../LoadError";
import StatusTag from "../StatusTag";
import CategoryModal from "./CategoryModal";
import {
  createCategory,
  createService,
  deleteCategory,
  deleteService,
  fetchCategories,
  fetchServices,
  updateCategory,
  updateService,
} from "./service.api";
import ServiceModal from "./ServiceModal";
import { ACTIVE_STATUSES, type Service, type ServiceCategory, type ServiceCategoryInput, type ServiceInput } from "./types";

const yes = <CheckOutlined aria-label="Yes" />;
const no = <Typography.Text type="secondary">—</Typography.Text>;

function actions(label: string, onEdit: () => void, onDelete: () => void, inUse: boolean, inUseHint: string) {
  return (
    <Space size={4}>
      <Tooltip title="Edit">
        <Button type="text" icon={<EditOutlined />} aria-label={`Edit ${label}`} onClick={(e) => { e.stopPropagation(); onEdit(); }} />
      </Tooltip>
      <Tooltip title={inUse ? inUseHint : "Delete"}>
        <Button type="text" danger disabled={inUse} icon={<DeleteOutlined />} aria-label={`Delete ${label}`} onClick={(e) => { e.stopPropagation(); onDelete(); }} />
      </Tooltip>
    </Space>
  );
}

export default function ServiceCatalogPage() {
  const { user, can } = useSession();
  // the catalog is shared by every branch: only chain-level staff change it (API: requireChainScope)
  const canManage = can("SERVICE_MANAGE") && user?.scopeLevel === "CHAIN";
  const categories = useApiData(fetchCategories, "service-categories");
  const services = useApiData(fetchServices, "services");
  const reloadAll = () => {
    categories.reload();
    services.reload();
  };

  const categoryEditor = useCrudEditor<ServiceCategory, ServiceCategoryInput>({
    noun: "category",
    label: (c) => c.categoryName,
    create: createCategory,
    update: (c, input) => updateCategory(c.categoryId, input),
    remove: (c) => deleteCategory(c.categoryId),
    removeWarning: "This cannot be undone. A category that still has services cannot be deleted.",
    onChanged: reloadAll,
  });
  const serviceEditor = useCrudEditor<Service, ServiceInput>({
    noun: "service",
    label: (s) => s.serviceName,
    create: createService,
    update: (s, input) => updateService(s.serviceId, input),
    remove: (s) => deleteService(s.serviceId),
    removeWarning: "This cannot be undone. A service that a branch sells cannot be deleted — set it Inactive instead.",
    onChanged: reloadAll,
  });

  const categoryColumns: TableColumnsType<ServiceCategory> = [
    { title: "Code", dataIndex: "categoryCode", sorter: sortText<ServiceCategory>((c) => c.categoryCode), render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
    { title: "Name", dataIndex: "categoryName", defaultSortOrder: "ascend", sorter: sortText<ServiceCategory>((c) => c.categoryName) },
    { title: "Services", dataIndex: "serviceCount", align: "right", sorter: sortNumber<ServiceCategory>((c) => c.serviceCount) },
    {
      title: "Status",
      dataIndex: "categoryStatus",
      sorter: sortByOrder<ServiceCategory>((c) => c.categoryStatus, ACTIVE_STATUSES),
      render: (v: ServiceCategory["categoryStatus"]) => <StatusTag value={v} palette={ACTIVE_STATUS} />,
    },
    ...(canManage
      ? [{
          title: "",
          key: "actions",
          fixed: "right" as const,
          width: 96,
          render: (_: unknown, c: ServiceCategory) =>
            actions(c.categoryName, () => categoryEditor.openEdit(c), () => categoryEditor.remove(c), c.serviceCount > 0, "Has services"),
        }]
      : []),
  ];

  const serviceColumns: TableColumnsType<Service> = [
    {
      title: "Service",
      key: "service",
      sorter: sortText<Service>((s) => s.serviceName),
      render: (_, s) => (
        <>
          <Typography.Text strong>{s.serviceName}</Typography.Text> <Typography.Text type="secondary">{s.serviceCode}</Typography.Text>
        </>
      ),
    },
    { title: "Category", dataIndex: "categoryName", defaultSortOrder: "ascend", sorter: sortText<Service>((s) => s.categoryName) },
    {
      title: "Default price",
      key: "price",
      align: "right",
      sorter: sortNumber<Service>((s) => s.defaultPrice),
      render: (_, s) => `${formatMoney(s.defaultPrice)} / ${s.unit}`,
    },
    { title: "Chargeable", dataIndex: "isChargeable", align: "center", sorter: sortNumber<Service>((s) => Number(s.isChargeable)), render: (v: boolean) => (v ? yes : no) },
    { title: "Needs staff", dataIndex: "needAssignment", align: "center", sorter: sortNumber<Service>((s) => Number(s.needAssignment)), render: (v: boolean) => (v ? yes : no) },
    { title: "Takes", dataIndex: "estMinutes", align: "right", sorter: sortNumber<Service>((s) => s.estMinutes), render: (v: number | null) => (v ? `${v} min` : no) },
    { title: "Branches", dataIndex: "branchCount", align: "right", sorter: sortNumber<Service>((s) => s.branchCount) },
    {
      title: "Status",
      dataIndex: "serviceStatus",
      sorter: sortByOrder<Service>((s) => s.serviceStatus, ACTIVE_STATUSES),
      render: (v: Service["serviceStatus"]) => <StatusTag value={v} palette={ACTIVE_STATUS} />,
    },
    ...(canManage
      ? [{
          title: "",
          key: "actions",
          fixed: "right" as const,
          width: 96,
          render: (_: unknown, s: Service) =>
            actions(s.serviceName, () => serviceEditor.openEdit(s), () => serviceEditor.remove(s), s.branchCount > 0, "Sold by a branch"),
        }]
      : []),
  ];

  const error = categories.error ?? services.error;

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      {error && <LoadError error={error} onRetry={reloadAll} />}
      <Card
        variant="outlined"
        title="Services"
        styles={{ body: { padding: 0 } }}
        extra={canManage && <Button type="primary" icon={<PlusOutlined />} onClick={serviceEditor.openCreate}>New service</Button>}
      >
        {!services.loading && !services.error && (services.data ?? []).length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No services in the catalog yet." style={{ padding: 32 }} />
        ) : (
          <Table<Service>
            rowKey="serviceId"
            size="middle"
            loading={services.loading}
            columns={serviceColumns}
            dataSource={services.data ?? []}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
            onRow={(s) => (canManage ? { onClick: () => serviceEditor.openEdit(s), style: { cursor: "pointer" } } : {})}
          />
        )}
      </Card>
      <Card
        variant="outlined"
        title="Categories"
        styles={{ body: { padding: 0 } }}
        extra={canManage && <Button icon={<PlusOutlined />} onClick={categoryEditor.openCreate}>New category</Button>}
      >
        <Table<ServiceCategory>
          rowKey="categoryId"
          size="middle"
          loading={categories.loading}
          columns={categoryColumns}
          dataSource={categories.data ?? []}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
          onRow={(c) => (canManage ? { onClick: () => categoryEditor.openEdit(c), style: { cursor: "pointer" } } : {})}
        />
      </Card>
      <ServiceModal
        open={serviceEditor.open}
        service={serviceEditor.editing}
        categories={categories.data ?? []}
        saving={serviceEditor.saving}
        onCancel={serviceEditor.close}
        onSubmit={serviceEditor.save}
      />
      <CategoryModal
        open={categoryEditor.open}
        category={categoryEditor.editing}
        saving={categoryEditor.saving}
        onCancel={categoryEditor.close}
        onSubmit={categoryEditor.save}
      />
    </Space>
  );
}
