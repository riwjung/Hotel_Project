"use client";

import { Col, Form, Input, InputNumber, Modal, Row, Typography } from "antd";
import type { MemberTierInput, MemberTierRow } from "./types";

type Props = {
  open: boolean;
  tier: MemberTierRow | null; // null = create
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: MemberTierInput) => void;
};

export default function MemberTierModal({ open, tier, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<MemberTierInput>();
  const initialValues: Partial<MemberTierInput> = tier
    ? { tierName: tier.tierName, minPoint: tier.minPoint, discountRate: tier.discountRate, tierBenefit: tier.tierBenefit }
    : { discountRate: 0 };

  return (
    <Modal
      open={open}
      title={tier ? `Edit tier ${tier.tierName}` : "New member tier"}
      okText={tier ? "Save changes" : "Create tier"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        Customers move between tiers by their points automatically. Changing a threshold re-tiers every customer
        straight away; bookings already made keep the discount rate they were booked with.
      </Typography.Paragraph>
      <Form<MemberTierInput>
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark="optional"
        initialValues={initialValues}
        onFinish={(v) => onSubmit({ ...v, tierName: v.tierName.trim(), tierBenefit: v.tierBenefit?.trim() || null })}
        disabled={saving}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Tier name" name="tierName" rules={[{ required: true, message: "Enter a name" }]}>
              <Input maxLength={30} />
            </Form.Item>
          </Col>
          <Col xs={12}>
            <Form.Item
              label="Starts at (points)"
              name="minPoint"
              rules={[{ required: true, message: "Required" }]}
              extra="The lowest tier must start at 0"
            >
              <InputNumber min={0} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12}>
            <Form.Item label="Discount" name="discountRate" rules={[{ required: true, message: "Required" }]} extra="Applied after any promotion">
              <InputNumber min={0} max={100} precision={2} suffix="%" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Benefits" name="tierBenefit">
              <Input.TextArea maxLength={255} autoSize={{ minRows: 2, maxRows: 4 }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
