"use client";

import { useState } from "react";
import { Alert, App, Button, Card, Checkbox, Space, Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ACTIVE_STATUS, SCOPE_LEVEL } from "@/app/lib/status";
import { sortByOrder, sortNumber, sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import { useCrudEditor } from "@/app/lib/use-crud-editor";
import LoadError from "../LoadError";
import StatusTag from "../StatusTag";
import { createRole, deleteRole, fetchRoleMatrix, setGrant, updateRole } from "./role.api";
import RoleModal from "./RoleModal";
import { ROLE_STATUSES, SCOPE_LEVELS, type PermissionRow, type RoleInput, type RoleRow } from "./types";

// ROLE_MANAGE (owner) reaches this page.
export default function RolePage() {
  const { message } = App.useApp();
  const matrix = useApiData(fetchRoleMatrix, "role-matrix");
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const data = matrix.data;
  const granted = (roleId: number, permissionId: number) =>
    !!data?.grants.some((g) => g.roleId === roleId && g.permissionId === permissionId);

  const editor = useCrudEditor<RoleRow, RoleInput>({
    noun: "role",
    label: (r) => r.roleCode,
    create: async (input) => {
      await createRole(input);
      return { roleId: 0, employeeCount: 0, ...input };
    },
    update: async (r, input) => {
      await updateRole(r.roleId, input);
      return { ...r, ...input };
    },
    remove: (r) => deleteRole(r.roleId),
    removeWarning: "This cannot be undone. A role that employees still hold cannot be deleted — set it Inactive instead.",
    onChanged: () => matrix.reload(),
  });

  const toggle = async (role: RoleRow, permission: PermissionRow, value: boolean) => {
    const key = `${role.roleId}:${permission.permissionId}`;
    setSavingCell(key);
    try {
      await setGrant(role.roleId, { permissionId: permission.permissionId, granted: value });
      message.success(`${role.roleName}: ${permission.permissionCode} ${value ? "granted" : "removed"}`);
      matrix.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not change the permission");
    } finally {
      setSavingCell(null);
    }
  };

  const roleColumns: TableColumnsType<RoleRow> = [
    { title: "Code", dataIndex: "roleCode", sorter: sortText<RoleRow>((r) => r.roleCode), render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
    { title: "Name", dataIndex: "roleName", sorter: sortText<RoleRow>((r) => r.roleName) },
    {
      title: "Works across",
      dataIndex: "scopeLevel",
      sorter: sortByOrder<RoleRow>((r) => r.scopeLevel, SCOPE_LEVELS),
      render: (v: RoleRow["scopeLevel"]) => <StatusTag value={v} palette={SCOPE_LEVEL} />,
    },
    { title: "Employees", dataIndex: "employeeCount", align: "right", sorter: sortNumber<RoleRow>((r) => r.employeeCount) },
    {
      title: "Status",
      dataIndex: "roleStatus",
      sorter: sortByOrder<RoleRow>((r) => r.roleStatus, ROLE_STATUSES),
      render: (v: RoleRow["roleStatus"]) => <StatusTag value={v} palette={ACTIVE_STATUS} />,
    },
    {
      title: "",
      key: "actions",
      fixed: "right",
      width: 96,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} aria-label={`Edit ${r.roleCode}`} onClick={() => editor.openEdit(r)} />
          </Tooltip>
          <Tooltip title={r.employeeCount ? "Employees hold this role" : "Delete"}>
            <Button type="text" danger disabled={r.employeeCount > 0} icon={<DeleteOutlined />} aria-label={`Delete ${r.roleCode}`} onClick={() => editor.remove(r)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const matrixColumns: TableColumnsType<PermissionRow> = [
    { title: "Module", dataIndex: "moduleName", sorter: sortText<PermissionRow>((p) => p.moduleName) },
    {
      title: "Permission",
      dataIndex: "permissionCode",
      sorter: sortText<PermissionRow>((p) => p.permissionCode),
      render: (v: string, p) => (
        <>
          <Typography.Text code>{v}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {p.description}
          </Typography.Text>
        </>
      ),
    },
    ...(data?.roles ?? []).map((role) => ({
      title: role.roleName,
      key: `r${role.roleId}`,
      align: "center" as const,
      sorter: sortNumber<PermissionRow>((p) => Number(granted(role.roleId, p.permissionId))),
      render: (_: unknown, p: PermissionRow) => (
        <Checkbox
          checked={granted(role.roleId, p.permissionId)}
          disabled={savingCell === `${role.roleId}:${p.permissionId}`}
          aria-label={`${role.roleName} ${p.permissionCode}`}
          onChange={(e) => void toggle(role, p, e.target.checked)}
        />
      ),
    })),
  ];

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      {matrix.error && <LoadError error={matrix.error} onRetry={matrix.reload} />}
      <Alert
        type="info"
        showIcon
        title="Changes apply at the next sign-in"
        description="Permissions are read when an employee signs in, so people already signed in keep their old rights until they sign in again."
      />
      <Card
        variant="outlined"
        title="Roles"
        styles={{ body: { padding: 0 } }}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={editor.openCreate}>New role</Button>}
      >
        <Table<RoleRow>
          rowKey="roleId"
          size="middle"
          loading={matrix.loading}
          columns={roleColumns}
          dataSource={data?.roles ?? []}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
        />
      </Card>
      <Card variant="outlined" title="Permissions by role" styles={{ body: { padding: 0 } }}>
        <Table<PermissionRow>
          rowKey="permissionId"
          size="middle"
          loading={matrix.loading}
          columns={matrixColumns}
          dataSource={data?.permissions ?? []}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
        />
      </Card>
      <RoleModal open={editor.open} role={editor.editing} saving={editor.saving} onCancel={editor.close} onSubmit={editor.save} />
    </Space>
  );
}
