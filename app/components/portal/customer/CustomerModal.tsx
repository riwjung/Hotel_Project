"use client";

import { Col, Form, Input, InputNumber, Modal, Row, Typography } from "antd";
import type { Customer, CustomerInput, MemberTier } from "./types";

type Props = {
  open: boolean;
  customer: Customer | null; // null = create
  tiers: MemberTier[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: CustomerInput) => void;
};

/**
 * Preview of the tier the points reach (tiers sorted by minPoint). The database
 * sets the real tier on save (rule R13); this only shows it before saving.
 */
export function tierForPoints(tiers: MemberTier[], points: number): MemberTier | undefined {
  return [...tiers].reverse().find((tier) => points >= tier.minPoint);
}

export default function CustomerModal({ open, customer, tiers, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<CustomerInput>();
  const points = Form.useWatch("memberPoint", form);
  const tier = tierForPoints(tiers, points ?? customer?.memberPoint ?? 0);

  const initialValues: Partial<CustomerInput> = customer
    ? {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        idCardNo: customer.idCardNo,
        address: customer.address,
        memberPoint: customer.memberPoint,
      }
    : { memberPoint: 0 };

  const finish = (v: CustomerInput) =>
    onSubmit({
      ...v,
      email: v.email.trim().toLowerCase(),
      phone: v.phone || null,
      idCardNo: v.idCardNo || null,
      address: v.address || null,
    });

  return (
    <Modal
      open={open}
      title={customer ? `Edit ${customer.firstName} ${customer.lastName}` : "New customer"}
      okText={customer ? "Save changes" : "Create customer"}
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
      width={640}
    >
      <Form<CustomerInput>
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark="optional"
        initialValues={initialValues}
        onFinish={finish}
        disabled={saving}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="First name" name="firstName" rules={[{ required: true, message: "Enter the first name" }]}>
              <Input maxLength={50} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Last name" name="lastName" rules={[{ required: true, message: "Enter the last name" }]}>
              <Input maxLength={50} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Enter an email" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input maxLength={100} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Phone" name="phone">
              <Input maxLength={20} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="ID card / passport" name="idCardNo">
              <Input maxLength={30} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Member points"
              name="memberPoint"
              rules={[{ required: true, message: "Required" }]}
              extra={
                tier && (
                  <>
                    Tier <Typography.Text strong>{tier.tierName}{tier.discountRate ? ` · ${tier.discountRate}% off` : ""}</Typography.Text>
                    {" "}— set automatically from points
                  </>
                )
              }
            >
              <InputNumber min={0} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Address" name="address">
              <Input.TextArea maxLength={255} autoSize={{ minRows: 2, maxRows: 4 }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
