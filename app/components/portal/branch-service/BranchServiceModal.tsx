"use client";

import dayjs, { type Dayjs } from "dayjs";
import { Col, Form, InputNumber, Modal, Row, Select, Switch, TimePicker } from "antd";
import { formatMoney } from "@/app/lib/format";
import { useBranchOptions } from "../branch/useBranchOptions";
import type { Service } from "../service/types";
import type { BranchService, BranchServiceInput } from "./types";

type Props = {
  open: boolean;
  row: BranchService | null; // null = add a service to a branch
  services: Service[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: BranchServiceInput) => void;
};

type FormValues = Omit<BranchServiceInput, "openTime" | "closeTime"> & { hours?: [Dayjs, Dayjs] | null };

const toTime = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return dayjs().hour(h).minute(m).second(0).millisecond(0);
};

export default function BranchServiceModal({ open, row, services, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { chainWide, options: branchOptions } = useBranchOptions({ activeOnly: true });
  const serviceId = Form.useWatch("serviceId", form);
  const picked = services.find((s) => s.serviceId === (row?.serviceId ?? serviceId));
  const initialValues: Partial<FormValues> = row
    ? {
        serviceId: row.serviceId,
        branchPrice: row.branchPrice,
        isAvailable: row.isAvailable,
        hours: row.openTime && row.closeTime ? [toTime(row.openTime), toTime(row.closeTime)] : null,
      }
    : { isAvailable: true };

  const finish = (v: FormValues) =>
    onSubmit({
      branchId: chainWide && !row ? v.branchId : null,
      serviceId: row?.serviceId ?? v.serviceId,
      branchPrice: v.branchPrice,
      isAvailable: v.isAvailable,
      openTime: v.hours?.[0]?.format("HH:mm") ?? null,
      closeTime: v.hours?.[1]?.format("HH:mm") ?? null,
    });

  return (
    <Modal
      open={open}
      title={row ? `${row.serviceName} · ${row.branchCode}` : "Offer a service"}
      okText={row ? "Save changes" : "Add service"}
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
          {chainWide && !row && (
            <Col span={24}>
              <Form.Item label="Branch" name="branchId" rules={[{ required: true, message: "Select a branch" }]}>
                <Select options={branchOptions} placeholder="Select a branch" />
              </Form.Item>
            </Col>
          )}
          {!row && (
            <Col span={24}>
              <Form.Item label="Service" name="serviceId" rules={[{ required: true, message: "Select a service" }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={services
                    .filter((s) => s.serviceStatus === "ACTIVE")
                    .map((s) => ({ value: s.serviceId, label: `${s.serviceName} · ${s.categoryName}` }))}
                  onChange={(id) => {
                    const s = services.find((x) => x.serviceId === id);
                    if (s) form.setFieldValue("branchPrice", s.defaultPrice);
                  }}
                />
              </Form.Item>
            </Col>
          )}
          <Col xs={14}>
            <Form.Item
              label={picked ? `Price per ${picked.unit}` : "Branch price"}
              name="branchPrice"
              rules={[{ required: true, message: "Required" }]}
              extra={picked ? `Catalog price ${formatMoney(picked.defaultPrice)}; orders keep the price they were made at` : undefined}
            >
              <InputNumber min={0} precision={2} prefix="฿" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={10}>
            <Form.Item label="Available" name="isAvailable" valuePropName="checked" tooltip="Unavailable services cannot be ordered">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Opening hours" name="hours" extra="Leave empty when the service has no fixed hours">
              <TimePicker.RangePicker format="HH:mm" minuteStep={15} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
