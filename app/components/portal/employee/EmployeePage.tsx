"use client";

import { useMemo, useState } from "react";
import { App, Button, Card, Empty, Input, Select, Space, Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { EditOutlined, KeyOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { formatDate } from "@/app/lib/format";
import { EMPLOYEE_STATUS, SCOPE_LEVEL, statusOptions } from "@/app/lib/status";
import { sortByOrder, sortDate, sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import { useCrudEditor } from "@/app/lib/use-crud-editor";
import BranchFilter from "../BranchFilter";
import LoadError from "../LoadError";
import StatusTag from "../StatusTag";
import { createEmployee, fetchEmployees, fetchRoleOptions, resetEmployeePassword, updateEmployee } from "./employee.api";
import EmployeeModal from "./EmployeeModal";
import PasswordModal from "./PasswordModal";
import { EMPLOYEE_STATUSES, type Employee, type EmployeeFilter, type EmployeeInput } from "./types";

const dash = <Typography.Text type="secondary">—</Typography.Text>;

export default function EmployeePage() {
  const { message } = App.useApp();
  const { user, can } = useSession();
  const canManage = can("EMPLOYEE_MANAGE");
  const [filter, setFilter] = useState<EmployeeFilter>({});
  const [search, setSearch] = useState("");
  const [resetting, setResetting] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const employees = useApiData((signal) => fetchEmployees(filter, signal), JSON.stringify(filter));
  const roles = useApiData(fetchRoleOptions, "role-options");
  const editor = useCrudEditor<Employee, EmployeeInput>({
    noun: "employee",
    label: (e) => `${e.firstName} ${e.lastName}`,
    create: createEmployee,
    update: (e, input) => updateEmployee(e.employeeId, input),
    onChanged: () => employees.reload(),
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = employees.data ?? [];
    return q ? all.filter((e) => `${e.employeeCode} ${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(q)) : all;
  }, [employees.data, search]);

  const resetPassword = async (password: string) => {
    if (!resetting) return;
    setSaving(true);
    try {
      await resetEmployeePassword(resetting.employeeId, password);
      message.success(`Password reset for ${resetting.firstName} ${resetting.lastName}`);
      setResetting(null);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not reset the password");
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnsType<Employee> = [
    { title: "Code", dataIndex: "employeeCode", sorter: sortText<Employee>((e) => e.employeeCode), render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
    { title: "Name", key: "name", sorter: sortText<Employee>((e) => `${e.firstName} ${e.lastName}`), render: (_, e) => `${e.firstName} ${e.lastName}` },
    { title: "Role", dataIndex: "roleName", sorter: sortText<Employee>((e) => e.roleName) },
    ...(user?.scopeLevel === "CHAIN"
      ? [{
          title: "Branch",
          key: "branch",
          sorter: sortText<Employee>((e) => e.branchCode),
          render: (_: unknown, e: Employee) => e.branchCode ?? <StatusTag value={e.scopeLevel} palette={SCOPE_LEVEL} />,
        }]
      : []),
    { title: "Manager", dataIndex: "managerName", sorter: sortText<Employee>((e) => e.managerName), render: (v: string | null) => v ?? dash },
    { title: "Email", dataIndex: "email", sorter: sortText<Employee>((e) => e.email) },
    { title: "Phone", dataIndex: "phone", sorter: sortText<Employee>((e) => e.phone), render: (v: string | null) => v ?? dash },
    { title: "Hired", dataIndex: "hireDate", sorter: sortDate<Employee>((e) => e.hireDate), render: formatDate },
    {
      title: "Status",
      dataIndex: "employeeStatus",
      sorter: sortByOrder<Employee>((e) => e.employeeStatus, EMPLOYEE_STATUSES),
      render: (v: Employee["employeeStatus"]) => <StatusTag value={v} palette={EMPLOYEE_STATUS} />,
    },
  ];
  if (canManage) {
    columns.push({
      title: "",
      key: "actions",
      fixed: "right",
      width: 96,
      render: (_, e) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} aria-label={`Edit ${e.employeeCode}`} onClick={(ev) => { ev.stopPropagation(); editor.openEdit(e); }} />
          </Tooltip>
          <Tooltip title="Reset password">
            <Button type="text" icon={<KeyOutlined />} aria-label={`Reset password ${e.employeeCode}`} onClick={(ev) => { ev.stopPropagation(); setResetting(e); }} />
          </Tooltip>
        </Space>
      ),
    });
  }

  const error = employees.error ?? roles.error;
  return (
    <>
      {error && <LoadError error={error} onRetry={() => { employees.reload(); roles.reload(); }} />}
      <Card
        variant="outlined"
        title="Employees"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <Input allowClear prefix={<SearchOutlined />} placeholder="Code, name, email" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} />
            <BranchFilter value={filter.branchId} onChange={(branchId) => setFilter((f) => ({ ...f, branchId }))} />
            <Select
              allowClear
              placeholder="All statuses"
              style={{ width: 140 }}
              value={filter.status}
              onChange={(status) => setFilter((f) => ({ ...f, status }))}
              options={statusOptions(EMPLOYEE_STATUS)}
            />
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={editor.openCreate}>
                New employee
              </Button>
            )}
          </Space>
        }
      >
        {!employees.loading && !employees.error && rows.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={search || filter.status || filter.branchId ? "No employees match." : "No employees yet."} style={{ padding: 32 }} />
        ) : (
          <Table<Employee>
            rowKey="employeeId"
            size="middle"
            loading={employees.loading}
            columns={columns}
            dataSource={rows}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
            onRow={(e) => (canManage ? { onClick: () => editor.openEdit(e), style: { cursor: "pointer" } } : {})}
          />
        )}
      </Card>
      <EmployeeModal
        open={editor.open}
        employee={editor.editing}
        roles={roles.data ?? []}
        saving={editor.saving}
        onCancel={editor.close}
        onSubmit={editor.save}
      />
      <PasswordModal employee={resetting} saving={saving} onCancel={() => setResetting(null)} onSubmit={resetPassword} />
    </>
  );
}
