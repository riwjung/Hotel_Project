"use client";

import dayjs, { type Dayjs } from "dayjs";
import { Col, DatePicker, Form, Input, Modal, Row, Select } from "antd";
import { EMPLOYEE_STATUS, statusOptions } from "@/app/lib/status";
import { useApiData } from "@/app/lib/use-api-data";
import { useBranchOptions } from "../branch/useBranchOptions";
import type { RoleOption } from "../role/types";
import { employeeSelectOptions, fetchEmployeeOptions } from "./employee.api";
import type { Employee, EmployeeInput } from "./types";

type Props = {
  open: boolean;
  employee: Employee | null; // null = create
  roles: RoleOption[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: EmployeeInput) => void;
};

type FormValues = Omit<EmployeeInput, "hireDate" | "managerId" | "branchId"> & {
  hireDate: Dayjs;
  managerId?: number;
  branchId?: number;
  confirm?: string;
};

export default function EmployeeModal({ open, employee, roles, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { chainWide, options: branchOptions } = useBranchOptions({ activeOnly: true });
  const roleId = Form.useWatch("roleId", form) ?? employee?.roleId;
  const pickedBranch = Form.useWatch("branchId", form);
  const role = roles.find((r) => r.roleId === roleId);
  const chainRole = role?.scopeLevel === "CHAIN";
  // branch users always work in their own branch (the API pins it); chain users pick one for branch roles
  const branchId = chainWide ? (chainRole ? undefined : pickedBranch ?? employee?.branchId ?? undefined) : undefined;
  const managers = useApiData(
    (signal) => (open && (!chainWide || branchId) ? fetchEmployeeOptions(branchId, signal, true) : Promise.resolve([])),
    `managers:${open}:${branchId}:${chainWide}`,
  );

  const initialValues: Partial<FormValues> = employee
    ? {
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        roleId: employee.roleId,
        branchId: employee.branchId ?? undefined,
        managerId: employee.managerId ?? undefined,
        hireDate: dayjs(employee.hireDate),
        employeeStatus: employee.employeeStatus,
      }
    : { hireDate: dayjs(), employeeStatus: "ACTIVE" };

  const finish = (v: FormValues) =>
    onSubmit({
      branchId: chainWide ? (chainRole ? null : v.branchId ?? null) : null,
      roleId: v.roleId,
      managerId: v.managerId ?? null,
      employeeCode: v.employeeCode.trim().toUpperCase(),
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      phone: v.phone?.trim() || null,
      email: v.email.trim().toLowerCase(),
      hireDate: v.hireDate.format("YYYY-MM-DD"),
      employeeStatus: v.employeeStatus,
      password: employee ? undefined : v.password,
    });

  return (
    <Modal
      open={open}
      title={employee ? `Edit ${employee.firstName} ${employee.lastName}` : "New employee"}
      okText={employee ? "Save changes" : "Create employee"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
      width={720}
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark="optional"
        initialValues={initialValues}
        onFinish={finish}
        disabled={saving}
      >
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item label="Employee code" name="employeeCode" rules={[{ required: true, message: "Required" }, { pattern: /^[A-Za-z0-9_-]{2,20}$/, message: "2–20 letters or digits" }]}>
              <Input maxLength={20} style={{ textTransform: "uppercase" }} placeholder="EMP-0105" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item label="First name" name="firstName" rules={[{ required: true, message: "Required" }]}>
              <Input maxLength={50} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item label="Last name" name="lastName" rules={[{ required: true, message: "Required" }]}>
              <Input maxLength={50} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Email (sign-in)" name="email" rules={[{ required: true, message: "Required" }, { type: "email", message: "Enter a valid email" }]}>
              <Input maxLength={100} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Phone" name="phone">
              <Input maxLength={20} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Role"
              name="roleId"
              rules={[{ required: true, message: "Select a role" }]}
              extra="Only roles with no more rights than your own are offered"
            >
              <Select
                options={roles.map((r) => ({ value: r.roleId, label: `${r.roleName}${r.scopeLevel === "CHAIN" ? " (whole chain)" : ""}` }))}
                onChange={() => form.setFieldValue("managerId", undefined)}
              />
            </Form.Item>
          </Col>
          {chainWide && (
            <Col xs={24} sm={12}>
              <Form.Item
                label="Branch"
                name="branchId"
                rules={[{ required: !chainRole, message: "Select a branch" }]}
                extra={chainRole ? "Whole-chain roles have no branch" : undefined}
              >
                <Select
                  options={branchOptions}
                  disabled={chainRole}
                  placeholder={chainRole ? "—" : "Select a branch"}
                  onChange={() => form.setFieldValue("managerId", undefined)}
                />
              </Form.Item>
            </Col>
          )}
          <Col xs={24} sm={12}>
            <Form.Item label="Manager" name="managerId">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                loading={managers.loading}
                placeholder="Same branch, or the owner"
                options={employeeSelectOptions((managers.data ?? []).filter((m) => m.employeeId !== employee?.employeeId))}
              />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Hired" name="hireDate" rules={[{ required: true, message: "Required" }]}>
              <DatePicker format="D MMM YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Status" name="employeeStatus" rules={[{ required: true }]}>
              <Select options={statusOptions(EMPLOYEE_STATUS)} />
            </Form.Item>
          </Col>
          {!employee && (
            <>
              <Col xs={24} sm={12}>
                <Form.Item label="Password" name="password" rules={[{ required: true, message: "Required" }, { min: 8, message: "At least 8 characters" }]}>
                  <Input.Password autoComplete="new-password" maxLength={72} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Confirm password"
                  name="confirm"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Required" },
                    ({ getFieldValue }) => ({
                      validator: (_, value) =>
                        !value || value === getFieldValue("password") ? Promise.resolve() : Promise.reject(new Error("Passwords do not match")),
                    }),
                  ]}
                >
                  <Input.Password autoComplete="new-password" maxLength={72} />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>
      </Form>
    </Modal>
  );
}
