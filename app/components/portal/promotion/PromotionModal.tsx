"use client";

import dayjs, { type Dayjs } from "dayjs";
import { Alert, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select } from "antd";
import { PROMOTION_STATUS, statusOptions } from "@/app/lib/status";
import type { Promotion, PromotionInput } from "./types";

type Props = {
  open: boolean;
  promotion: Promotion | null; // null = create
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: PromotionInput) => void;
};

type FormValues = Omit<PromotionInput, "startDate" | "endDate" | "usageLimit"> & {
  period: [Dayjs, Dayjs];
  usageLimit?: number | null;
};

export default function PromotionModal({ open, promotion, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();
  const discountType = Form.useWatch("discountType", form) ?? promotion?.discountType ?? "PERCENT";
  // R18: a promotion that bookings already use keeps its discount terms
  const locked = promotion?.inUse ?? false;

  const initialValues: Partial<FormValues> = promotion
    ? {
        promotionCode: promotion.promotionCode,
        promotionName: promotion.promotionName,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        minimumAmount: promotion.minimumAmount,
        period: [dayjs(promotion.startDate), dayjs(promotion.endDate)],
        usageLimit: promotion.usageLimit,
        promotionStatus: promotion.promotionStatus,
      }
    : { discountType: "PERCENT", minimumAmount: 0, promotionStatus: "ACTIVE" };

  const finish = (v: FormValues) =>
    onSubmit({
      promotionCode: v.promotionCode.trim().toUpperCase(),
      promotionName: v.promotionName.trim(),
      discountType: v.discountType,
      discountValue: v.discountValue,
      minimumAmount: v.minimumAmount,
      startDate: v.period[0].format("YYYY-MM-DD"),
      endDate: v.period[1].format("YYYY-MM-DD"),
      usageLimit: v.usageLimit ?? null,
      promotionStatus: v.promotionStatus,
    });

  return (
    <Modal
      open={open}
      title={promotion ? `Edit promotion ${promotion.promotionCode}` : "New promotion"}
      okText={promotion ? "Save changes" : "Create promotion"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
      width={640}
    >
      {locked && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title="Discount terms are locked"
          description={`${promotion?.usedCount} active booking(s) already use this promotion. Changing the discount would reprice them, so create a new promotion for new terms.`}
        />
      )}
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
              name="promotionCode"
              rules={[
                { required: true, message: "Enter a code" },
                { pattern: /^[A-Za-z0-9_-]{2,30}$/, message: "2–30 letters, digits, - or _" },
              ]}
            >
              <Input maxLength={30} style={{ textTransform: "uppercase" }} placeholder="EARLYBIRD" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={16}>
            <Form.Item label="Name" name="promotionName" rules={[{ required: true, message: "Enter a name" }]}>
              <Input maxLength={100} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item label="Discount type" name="discountType" rules={[{ required: true }]}>
              <Select
                disabled={locked}
                options={[
                  { value: "PERCENT", label: "Percent" },
                  { value: "FIXED", label: "Fixed amount" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item
              label="Discount"
              name="discountValue"
              rules={[{ required: true, message: "Enter the discount" }]}
            >
              <InputNumber
                disabled={locked}
                min={0.01}
                max={discountType === "PERCENT" ? 100 : undefined}
                precision={2}
                prefix={discountType === "FIXED" ? "฿" : undefined}
                suffix={discountType === "PERCENT" ? "%" : undefined}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Minimum spend" name="minimumAmount" rules={[{ required: true, message: "Required" }]}>
              <InputNumber disabled={locked} min={0} precision={2} prefix="฿" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Valid for bookings made"
              name="period"
              rules={[{ required: true, message: "Choose the period" }]}
            >
              <DatePicker.RangePicker format="D MMM YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Usage limit" name="usageLimit" extra="Empty = unlimited">
              <InputNumber min={1} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Status" name="promotionStatus" rules={[{ required: true }]}>
              <Select options={statusOptions(PROMOTION_STATUS)} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
