"use client";

import dayjs, { type Dayjs } from "dayjs";
import { Col, Form, Input, Modal, Row, Select, TimePicker } from "antd";
import { BRANCH_STATUS, statusOptions } from "@/app/lib/status";
import type { Branch, BranchInput } from "./types";

type Props = {
  open: boolean;
  branch: Branch | null; // null = create
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: BranchInput) => void;
};

type FormValues = Omit<BranchInput, "checkInTime" | "checkOutTime"> & {
  checkInTime: Dayjs;
  checkOutTime: Dayjs;
};

// 'HH:mm' → Dayjs for TimePicker (no customParseFormat plugin needed)
const toTime = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return dayjs().hour(h).minute(m).second(0).millisecond(0);
};

export default function BranchModal({ open, branch, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();

  // Values go in via initialValues (not setFieldsValue before open — the Form
  // is not mounted yet then, see ui-standard.md §9).
  const initialValues: Partial<FormValues> = branch
    ? {
        branchCode: branch.branchCode,
        branchName: branch.branchName,
        province: branch.province,
        address: branch.address,
        phone: branch.phone,
        checkInTime: toTime(branch.checkInTime),
        checkOutTime: toTime(branch.checkOutTime),
        branchStatus: branch.branchStatus,
      }
    : { checkInTime: toTime("14:00"), checkOutTime: toTime("12:00"), branchStatus: "ACTIVE" };

  const finish = (v: FormValues) =>
    onSubmit({
      ...v,
      branchCode: v.branchCode.trim().toUpperCase(),
      address: v.address || null,
      phone: v.phone || null,
      checkInTime: v.checkInTime.format("HH:mm"),
      checkOutTime: v.checkOutTime.format("HH:mm"),
    });

  return (
    <Modal
      open={open}
      title={branch ? `Edit branch ${branch.branchCode}` : "New branch"}
      okText={branch ? "Save changes" : "Create branch"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
      width={640}
    >
      {/* destroyOnHidden + preserve={false}: never call form.resetFields() on close */}
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
            <Form.Item
              label="Code"
              name="branchCode"
              rules={[
                { required: true, message: "Enter a branch code" },
                { min: 2, max: 10, message: "2–10 characters" },
              ]}
            >
              <Input placeholder="BKK" maxLength={10} style={{ textTransform: "uppercase" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={16}>
            <Form.Item label="Name" name="branchName" rules={[{ required: true, message: "Enter the branch name" }]}>
              <Input maxLength={100} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Province" name="province" rules={[{ required: true, message: "Enter the province" }]}>
              <Input maxLength={50} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Phone" name="phone">
              <Input maxLength={20} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Address" name="address">
              <Input.TextArea maxLength={255} autoSize={{ minRows: 2, maxRows: 4 }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item label="Check-in time" name="checkInTime" rules={[{ required: true, message: "Required" }]}>
              <TimePicker format="HH:mm" minuteStep={15} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item label="Check-out time" name="checkOutTime" rules={[{ required: true, message: "Required" }]}>
              <TimePicker format="HH:mm" minuteStep={15} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Status" name="branchStatus" rules={[{ required: true }]}>
              <Select options={statusOptions(BRANCH_STATUS)} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
