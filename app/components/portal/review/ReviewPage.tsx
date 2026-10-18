"use client";

import { useState } from "react";
import { App, Button, Card, Empty, Select, Space, Table, Typography, type TableColumnsType } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { REVIEW_STATUS, statusOptions } from "@/app/lib/status";
import { sortNumber, sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import BranchFilter from "../BranchFilter";
import LoadError from "../LoadError";
import { createReview, fetchReviews, fetchReviewSummary, moderateReview } from "./review.api";
import ReviewModal from "./ReviewModal";
import ReviewTable from "./ReviewTable";
import type { Review, ReviewFilter, ReviewInput, ReviewSummaryRow } from "./types";

const avg = (value: number | null) => (value === null ? <Typography.Text type="secondary">—</Typography.Text> : value.toFixed(2));

const summaryColumns: TableColumnsType<ReviewSummaryRow> = [
  {
    title: "Branch",
    key: "branch",
    sorter: sortText<ReviewSummaryRow>((r) => r.branchCode),
    render: (_, r) => (
      <>
        <Typography.Text strong>{r.branchCode}</Typography.Text> <Typography.Text type="secondary">{r.branchName}</Typography.Text>
      </>
    ),
  },
  { title: "Published", dataIndex: "publishedCount", align: "right", sorter: sortNumber<ReviewSummaryRow>((r) => r.publishedCount) },
  { title: "Pending", dataIndex: "pendingCount", align: "right", sorter: sortNumber<ReviewSummaryRow>((r) => r.pendingCount) },
  { title: "Room", dataIndex: "roomAvg", align: "right", sorter: sortNumber<ReviewSummaryRow>((r) => r.roomAvg), render: avg },
  { title: "Service", dataIndex: "serviceAvg", align: "right", sorter: sortNumber<ReviewSummaryRow>((r) => r.serviceAvg), render: avg },
  { title: "Staff", dataIndex: "staffAvg", align: "right", sorter: sortNumber<ReviewSummaryRow>((r) => r.staffAvg), render: avg },
  { title: "Overall", dataIndex: "overallAvg", align: "right", sorter: sortNumber<ReviewSummaryRow>((r) => r.overallAvg), render: avg },
];

export default function ReviewPage() {
  const { message } = App.useApp();
  const { user, can } = useSession();
  const canModerate = can("REVIEW_REPLY");
  const [filter, setFilter] = useState<ReviewFilter>({});
  const [actingId, setActingId] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const reviews = useApiData((signal) => fetchReviews(filter, signal), JSON.stringify(filter));
  const summary = useApiData(fetchReviewSummary, "review-summary");
  const data = reviews.data ?? [];

  const reloadAll = () => {
    reviews.reload();
    summary.reload();
  };

  const moderate = async (r: Review, toStatus: "PUBLISHED" | "HIDDEN") => {
    setActingId(r.reviewId);
    try {
      await moderateReview(r.reviewId, toStatus);
      message.success(`Review for ${r.bookingCode} ${toStatus === "PUBLISHED" ? "published" : "hidden"}`);
      reloadAll();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update the review");
    } finally {
      setActingId(null);
    }
  };

  const record = async (input: ReviewInput) => {
    setSaving(true);
    try {
      await createReview(input);
      message.success("Review saved as pending");
      setRecording(false);
      reloadAll();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not save the review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      {(reviews.error || summary.error) && (
        <LoadError error={(reviews.error ?? summary.error) as string} onRetry={reloadAll} />
      )}
      <Card variant="outlined" title="Ratings by branch (published reviews)" styles={{ body: { padding: 0 } }}>
        <Table<ReviewSummaryRow>
          rowKey="branchId"
          size="middle"
          loading={summary.loading}
          columns={summaryColumns}
          dataSource={summary.data ?? []}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
        />
      </Card>
      <Card
        variant="outlined"
        title="Reviews"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <BranchFilter value={filter.branchId} onChange={(branchId) => setFilter((f) => ({ ...f, branchId }))} />
            <Select
              allowClear
              placeholder="All statuses"
              style={{ width: 140 }}
              value={filter.status}
              onChange={(status) => setFilter((f) => ({ ...f, status }))}
              options={statusOptions(REVIEW_STATUS)}
            />
            {canModerate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setRecording(true)}>
                Record review
              </Button>
            )}
          </Space>
        }
      >
        {!reviews.loading && !reviews.error && data.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={filter.branchId || filter.status ? "No reviews match these filters." : "No reviews yet. Guests can review after they check out."}
            style={{ padding: 32 }}
          />
        ) : (
          <ReviewTable
            reviews={data}
            loading={reviews.loading}
            showBranch={user?.scopeLevel === "CHAIN"}
            canModerate={canModerate}
            actingId={actingId}
            onModerate={moderate}
          />
        )}
      </Card>
      <ReviewModal open={recording} saving={saving} onCancel={() => setRecording(false)} onSubmit={record} />
    </Space>
  );
}
