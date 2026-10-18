"use client";

import dayjs, { type Dayjs } from "dayjs";
import { Col, Form, Input, Modal, Row, Select, Switch, TimePicker } from "antd";
import { useBranchOptions } from "../branch/useBranchOptions";
import type { Shift, ShiftInput } from "./types";

type Props = {
  open: boolean;
  shift: Shift | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: ShiftInput) => void;
};

type FormValues = Omit<ShiftInput, "startTime" | "endTime"> & { startTime: Dayjs; endTime: Dayjs };

const toTime = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return dayjs().hour(h).minute(m).second(0).millisecond(0);
};

export default function ShiftModal({ open, shift, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { chainWide, options: branchOptions } = useBranchOptions({ activeOnly: true });
  const initialValues: Partial<FormValues> = shift
    ? { shiftName: shift.shiftName, startTime: toTime(shift.startTime), endTime: toTime(shift.endTime), isOvernight: shift.isOvernight }
    : { startTime: toTime("07:00"), endTime: toTime("15:00"), isOvernight: false };

  const finish = (v: FormValues) =>
    onSubmit({
      branchId: chainWide && !shift ? v.branchId : null,
      shiftName: v.shiftName.trim(),
      startTime: v.startTime.format("HH:mm"),
      endTime: v.endTime.format("HH:mm"),
      isOvernight: v.isOvernight,
    });

  return (
    <Modal
      open={open}
      title={shift ? `Edit shift ${shift.shiftName} · ${shift.branchCode}` : "New shift"}
      okText={shift ? "Save changes" : "Create shift"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
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
          {chainWide && !shift && (
            <Col span={24}>
              <Form.Item label="Branch" name="branchId" rules={[{ required: true, message: "Select a branch" }]}>
                <Select options={branchOptions} placeholder="Select a branch" />
              </Form.Item>
            </Col>
          )}
          <Col span={24}>
            <Form.Item label="Name" name="shiftName" rules={[{ required: true, message: "Enter a name" }]}>
              <Input maxLength={50} placeholder="e.g. Morning" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item label="Starts" name="startTime" rules={[{ required: true, message: "Required" }]}>
              <TimePicker format="HH:mm" minuteStep={15} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item label="Ends" name="endTime" rules={[{ required: true, message: "Required" }]}>
              <TimePicker format="HH:mm" minuteStep={15} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Ends next day" name="isOvernight" valuePropName="checked" tooltip="For shifts like 23:00–07:00">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
