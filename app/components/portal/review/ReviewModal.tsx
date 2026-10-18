"use client";

import { Col, Form, Input, Modal, Rate, Row, Select, Typography } from "antd";
import { formatDate } from "@/app/lib/format";
import { useApiData } from "@/app/lib/use-api-data";
import { fetchReviewableBookings } from "./review.api";
import type { ReviewInput } from "./types";

type Props = {
  open: boolean;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: ReviewInput) => void;
};

const RATINGS = [
  { name: "roomRating", label: "Room" },
  { name: "serviceRating", label: "Service" },
  { name: "staffRating", label: "Staff" },
] as const;

/** Types in a guest comment card. Only checked-out stays without a review are offered (R10). */
export default function ReviewModal({ open, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<ReviewInput>();
  const bookings = useApiData(
    (signal) => (open ? fetchReviewableBookings(signal) : Promise.resolve([])),
    `reviewable:${open}`,
  );

  return (
    <Modal
      open={open}
      title="Record a guest review"
      okText="Save review"
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        Reviews are saved as Pending; publish them from the list once checked.
      </Typography.Paragraph>
      <Form<ReviewInput>
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark="optional"
        initialValues={{ roomRating: 5, serviceRating: 5, staffRating: 5 }}
        onFinish={(v) => onSubmit({ ...v, comment: v.comment?.trim() || null })}
        disabled={saving}
      >
        <Form.Item label="Stay" name="bookingId" rules={[{ required: true, message: "Select a checked-out stay" }]}>
          <Select
            showSearch
            optionFilterProp="label"
            loading={bookings.loading}
            placeholder="Checked-out stays without a review"
            notFoundContent="Every checked-out stay already has a review"
            options={(bookings.data ?? []).map((b) => ({
              value: b.bookingId,
              label: `${b.bookingCode} · ${b.customerName} · out ${formatDate(b.checkOutDate)}`,
            }))}
          />
        </Form.Item>
        <Row gutter={16}>
          {RATINGS.map((r) => (
            <Col xs={24} sm={8} key={r.name}>
              <Form.Item label={r.label} name={r.name} rules={[{ required: true, message: "Rate 1–5" }]}>
                <Rate allowClear={false} />
              </Form.Item>
            </Col>
          ))}
        </Row>
        <Form.Item label="Comment" name="comment">
          <Input.TextArea maxLength={500} showCount autoSize={{ minRows: 3, maxRows: 6 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
