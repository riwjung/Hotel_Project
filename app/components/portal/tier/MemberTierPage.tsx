"use client";

import { Button, Card, Empty, Space, Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { sortNumber, sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import { useCrudEditor } from "@/app/lib/use-crud-editor";
import LoadError from "../LoadError";
import { createMemberTier, deleteMemberTier, fetchMemberTierRows, updateMemberTier } from "./member-tier.api";
import MemberTierModal from "./MemberTierModal";
import type { MemberTierInput, MemberTierRow } from "./types";

// Only PROMOTION_MANAGE (owner) reaches this page.
export default function MemberTierPage() {
  const tiers = useApiData(fetchMemberTierRows, "member-tiers");
  const editor = useCrudEditor<MemberTierRow, MemberTierInput>({
    noun: "tier",
    label: (t) => t.tierName,
    create: createMemberTier,
    update: (t, input) => updateMemberTier(t.tierId, input),
    remove: (t) => deleteMemberTier(t.tierId),
    removeWarning: "This cannot be undone. Only a tier no customer holds can be deleted.",
    onChanged: () => tiers.reload(),
  });

  const columns: TableColumnsType<MemberTierRow> = [
    {
      title: "Tier",
      dataIndex: "tierName",
      sorter: sortText<MemberTierRow>((t) => t.tierName),
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: "Starts at",
      dataIndex: "minPoint",
      align: "right",
      defaultSortOrder: "ascend",
      sorter: sortNumber<MemberTierRow>((t) => t.minPoint),
      render: (value: number) => `${value.toLocaleString("en-US")} pts`,
    },
    {
      title: "Discount",
      dataIndex: "discountRate",
      align: "right",
      sorter: sortNumber<MemberTierRow>((t) => t.discountRate),
      render: (value: number) => (value ? `${value}%` : <Typography.Text type="secondary">—</Typography.Text>),
    },
    {
      title: "Benefits",
      dataIndex: "tierBenefit",
      sorter: sortText<MemberTierRow>((t) => t.tierBenefit),
      render: (value: string | null) => value ?? <Typography.Text type="secondary">—</Typography.Text>,
    },
    { title: "Customers", dataIndex: "customerCount", align: "right", sorter: sortNumber<MemberTierRow>((t) => t.customerCount) },
    {
      title: "",
      key: "actions",
      fixed: "right",
      width: 96,
      render: (_, t) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label={`Edit ${t.tierName}`}
              onClick={(e) => {
                e.stopPropagation();
                editor.openEdit(t);
              }}
            />
          </Tooltip>
          <Tooltip title={t.customerCount ? "Customers hold this tier" : "Delete"}>
            <Button
              type="text"
              danger
              disabled={t.customerCount > 0}
              icon={<DeleteOutlined />}
              aria-label={`Delete ${t.tierName}`}
              onClick={(e) => {
                e.stopPropagation();
                editor.remove(t);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const data = tiers.data ?? [];

  return (
    <>
      {tiers.error && <LoadError error={tiers.error} onRetry={tiers.reload} />}
      <Card
        variant="outlined"
        title="Member tiers"
        styles={{ body: { padding: 0 } }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={editor.openCreate}>
            New tier
          </Button>
        }
      >
        {!tiers.loading && !tiers.error && data.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tiers yet. Start with a tier at 0 points." style={{ padding: 32 }} />
        ) : (
          <Table<MemberTierRow>
            rowKey="tierId"
            size="middle"
            loading={tiers.loading}
            columns={columns}
            dataSource={data}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
            onRow={(t) => ({ onClick: () => editor.openEdit(t), style: { cursor: "pointer" } })}
          />
        )}
      </Card>
      <MemberTierModal
        open={editor.open}
        tier={editor.editing}
        saving={editor.saving}
        onCancel={editor.close}
        onSubmit={editor.save}
      />
    </>
  );
}
