"use client";

import { useMemo, useState } from "react";
import { Button, Card, Empty, Input, Select, Space } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { PROMOTION_STATUS, statusOptions } from "@/app/lib/status";
import { useApiData } from "@/app/lib/use-api-data";
import { useCrudEditor } from "@/app/lib/use-crud-editor";
import LoadError from "../LoadError";
import { createPromotion, deletePromotion, fetchPromotions, updatePromotion } from "./promotion.api";
import PromotionModal from "./PromotionModal";
import PromotionTable from "./PromotionTable";
import type { Promotion, PromotionInput, PromotionStatus } from "./types";

// Only PROMOTION_MANAGE (owner) reaches this page, so every action is available.
export default function PromotionPage() {
  const promotions = useApiData(fetchPromotions, "promotions");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PromotionStatus | undefined>();
  const editor = useCrudEditor<Promotion, PromotionInput>({
    noun: "promotion",
    label: (p) => p.promotionCode,
    create: createPromotion,
    update: (p, input) => updatePromotion(p.promotionId, input),
    remove: (p) => deletePromotion(p.promotionId),
    removeWarning: "This cannot be undone. Only promotions no booking has used can be deleted.",
    onChanged: () => promotions.reload(),
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (promotions.data ?? []).filter(
      (p) =>
        (!status || p.promotionStatus === status) &&
        (!q || p.promotionCode.toLowerCase().includes(q) || p.promotionName.toLowerCase().includes(q)),
    );
  }, [promotions.data, search, status]);

  return (
    <>
      {promotions.error && <LoadError error={promotions.error} onRetry={promotions.reload} />}
      <Card
        variant="outlined"
        title="Promotions"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Code or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              allowClear
              placeholder="All statuses"
              style={{ width: 140 }}
              value={status}
              onChange={setStatus}
              options={statusOptions(PROMOTION_STATUS)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={editor.openCreate}>
              New promotion
            </Button>
          </Space>
        }
      >
        {!promotions.loading && !promotions.error && rows.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={search || status ? "No promotions match. Clear the search or status filter." : "No promotions yet. Create one with “New promotion”."}
            style={{ padding: 32 }}
          />
        ) : (
          <PromotionTable promotions={rows} loading={promotions.loading} onEdit={editor.openEdit} onDelete={editor.remove} />
        )}
      </Card>
      <PromotionModal
        open={editor.open}
        promotion={editor.editing}
        saving={editor.saving}
        onCancel={editor.close}
        onSubmit={editor.save}
      />
    </>
  );
}
