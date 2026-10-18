"use client";

import dayjs, { type Dayjs } from "dayjs";
import { Col, DatePicker, Form, Input, Modal, Row, Typography } from "antd";
import type { AttendanceInput, AttendanceRow } from "./types";

type Props = {
  row: AttendanceRow | null; // open when set
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: AttendanceInput) => void;
};

type FormValues = { clockIn?: Dayjs | null; clockOut?: Dayjs | null; remark?: string };

export default function CorrectModal({ row, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();
  const initialValues: FormValues = row
    ? { clockIn: row.clockIn ? dayjs(row.clockIn) : null, clockOut: row.clockOut ? dayjs(row.clockOut) : null, remark: row.remark ?? undefined }
    : {};
  return (
    <Modal
      open={!!row}
      title={row ? `Correct attendance · ${row.employeeName}, ${row.shiftName} ${row.startTime}–${row.endTime}` : "Correct attendance"}
      okText="Save attendance"
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        Leave both times empty to record the shift as absent. The status (on time, late, left early) is worked out from the
        times, with a 5-minute grace period.
      </Typography.Paragraph>
      <Form<FormValues>
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark="optional"
        initialValues={initialValues}
        onFinish={(v) =>
          onSubmit({
            clockIn: v.clockIn ? v.clockIn.toISOString() : null,
            clockOut: v.clockOut ? v.clockOut.toISOString() : null,
            remark: v.remark?.trim() || null,
          })
        }
        disabled={saving}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Clock in" name="clockIn">
              <DatePicker showTime={{ format: "HH:mm" }} format="D MMM HH:mm" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Clock out"
              name="clockOut"
              dependencies={["clockIn"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator: (_, value?: Dayjs | null) => {
                    const start = getFieldValue("clockIn") as Dayjs | null | undefined;
                    if (value && !start) return Promise.reject(new Error("Clock in first"));
                    if (value && start && value.isBefore(start)) return Promise.reject(new Error("Clock-out cannot be before clock-in"));
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker showTime={{ format: "HH:mm" }} format="D MMM HH:mm" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Remark" name="remark">
              <Input maxLength={255} placeholder="e.g. Traffic, sick leave" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
