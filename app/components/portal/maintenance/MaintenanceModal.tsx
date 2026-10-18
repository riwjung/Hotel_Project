"use client";

import { Col, Form, Input, Modal, Row, Select } from "antd";
import { MAINTENANCE_PRIORITY, statusOptions } from "@/app/lib/status";
import { useApiData } from "@/app/lib/use-api-data";
import { useBranchOptions } from "../branch/useBranchOptions";
import { employeeSelectOptions, fetchEmployeeOptions } from "../employee/employee.api";
import { fetchRooms } from "../room/room.api";
import type { MaintenanceInput, MaintenanceRequest } from "./types";

type Props = {
  open: boolean;
  request: MaintenanceRequest | null; // null = report a new issue
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: MaintenanceInput) => void;
};

// Select cannot hold null as an option value, so "common area" is 0 in the form.
const COMMON_AREA = 0;
type FormValues = Omit<MaintenanceInput, "roomId" | "assignedToEmpId"> & {
  roomId: number;
  assignedToEmpId?: number;
};

export default function MaintenanceModal({ open, request, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { chainWide, options: branchOptions } = useBranchOptions({ activeOnly: true });
  const pickedBranch = Form.useWatch("branchId", form);
  const branchId = request?.branchId ?? (chainWide ? (pickedBranch ?? undefined) : undefined);
  const needsBranch = chainWide && !request && !branchId;

  const rooms = useApiData(
    (signal) => (open && !needsBranch ? fetchRooms({ branchId }, signal) : Promise.resolve([])),
    `maintenance-rooms:${open}:${branchId}:${needsBranch}`,
  );
  const employees = useApiData(
    (signal) => (open && !needsBranch ? fetchEmployeeOptions(branchId, signal) : Promise.resolve([])),
    `maintenance-staff:${open}:${branchId}:${needsBranch}`,
  );

  const initialValues: Partial<FormValues> = request
    ? {
        roomId: request.roomId ?? COMMON_AREA,
        issueTitle: request.issueTitle,
        priority: request.priority,
        assignedToEmpId: request.assignedToEmpId ?? undefined,
      }
    : { roomId: COMMON_AREA, priority: "MEDIUM" };

  const finish = (v: FormValues) =>
    onSubmit({
      branchId: chainWide && !request ? v.branchId : null,
      roomId: v.roomId === COMMON_AREA ? null : v.roomId,
      issueTitle: v.issueTitle.trim(),
      priority: v.priority,
      assignedToEmpId: v.assignedToEmpId ?? null,
    });

  return (
    <Modal
      open={open}
      title={request ? `Edit request · ${request.issueTitle}` : "Report an issue"}
      okText={request ? "Save changes" : "Report issue"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
      width={640}
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
          {chainWide && !request && (
            <Col span={24}>
              <Form.Item label="Branch" name="branchId" rules={[{ required: true, message: "Select a branch" }]}>
                <Select
                  options={branchOptions}
                  placeholder="Select a branch"
                  onChange={() => form.setFieldsValue({ roomId: COMMON_AREA, assignedToEmpId: undefined })}
                />
              </Form.Item>
            </Col>
          )}
          <Col span={24}>
            <Form.Item label="Issue" name="issueTitle" rules={[{ required: true, message: "Describe the issue" }]}>
              <Input maxLength={100} placeholder="e.g. Air conditioner leaking" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Room"
              name="roomId"
              rules={[{ required: true }]}
              extra="A free room becomes Maintenance until the request is closed."
            >
              <Select
                showSearch
                optionFilterProp="label"
                disabled={needsBranch}
                loading={rooms.loading}
                options={[
                  { value: COMMON_AREA, label: "Common area (no room)" },
                  ...(rooms.data ?? []).map((r) => ({ value: r.roomId, label: `${r.roomNumber} · ${r.typeName}` })),
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Priority" name="priority" rules={[{ required: true }]}>
              <Select options={statusOptions(MAINTENANCE_PRIORITY)} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Assign to" name="assignedToEmpId">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Not assigned yet"
                disabled={needsBranch}
                loading={employees.loading}
                options={employeeSelectOptions(employees.data ?? [])}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
