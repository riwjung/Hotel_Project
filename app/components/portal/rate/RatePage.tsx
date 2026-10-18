"use client";

import { useState } from "react";
import { Button, Card, Empty, Select, Space, Table, Tag, Tooltip, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { formatDate, formatMoney } from "@/app/lib/format";
import { ACTIVE_STATUS, statusOptions } from "@/app/lib/status";
import { sortByOrder, sortDate, sortNumber, sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import { useCrudEditor } from "@/app/lib/use-crud-editor";
import BranchFilter from "../BranchFilter";
import LoadError from "../LoadError";
import { fetchRoomTypes } from "../room-type/room-type.api";
import StatusTag from "../StatusTag";
import { createRate, deleteRate, fetchRates, updateRate } from "./rate.api";
import RateModal from "./RateModal";
import { RATE_STATUSES, type RateFilter, type RateInput, type RoomRate } from "./types";

// RATE_MANAGE reaches this page (owner: every branch; manager: own branch).
export default function RatePage() {
  const { user } = useSession();
  const [filter, setFilter] = useState<RateFilter>({});
  const rates = useApiData((signal) => fetchRates(filter, signal), JSON.stringify(filter));
  const types = useApiData(fetchRoomTypes, "rate-room-types");
  const editor = useCrudEditor<RoomRate, RateInput>({
    noun: "rate",
    label: (r) => `${r.typeName} “${r.rateName}”`,
    create: createRate,
    update: (r, input) => updateRate(r.rateId, input),
    remove: (r) => deleteRate(r.rateId),
    removeWarning: "This cannot be undone. A rate already used by bookings cannot be deleted — set it Inactive instead.",
    onChanged: () => rates.reload(),
  });

  const columns: TableColumnsType<RoomRate> = [
    ...(user?.scopeLevel === "CHAIN"
      ? [{ title: "Branch", dataIndex: "branchCode", sorter: sortText<RoomRate>((r) => r.branchCode) }]
      : []),
    { title: "Room type", dataIndex: "typeName", sorter: sortText<RoomRate>((r) => r.typeName) },
    {
      title: "Rate",
      dataIndex: "rateName",
      sorter: sortText<RoomRate>((r) => r.rateName),
      render: (value: string, r) => (
        <Space size={6}>
          <Typography.Text strong>{value}</Typography.Text>
          {r.isCurrent && <Tag color="blue">In use today</Tag>}
        </Space>
      ),
    },
    { title: "From", dataIndex: "startDate", sorter: sortDate<RoomRate>((r) => r.startDate), render: formatDate },
    { title: "To", dataIndex: "endDate", sorter: sortDate<RoomRate>((r) => r.endDate), render: formatDate },
    { title: "Per night", dataIndex: "pricePerNight", align: "right", sorter: sortNumber<RoomRate>((r) => r.pricePerNight), render: formatMoney },
    { title: "Min nights", dataIndex: "minNights", align: "right", sorter: sortNumber<RoomRate>((r) => r.minNights) },
    { title: "Booked rooms", dataIndex: "bookingCount", align: "right", sorter: sortNumber<RoomRate>((r) => r.bookingCount) },
    {
      title: "Status",
      dataIndex: "rateStatus",
      sorter: sortByOrder<RoomRate>((r) => r.rateStatus, RATE_STATUSES),
      render: (value: RoomRate["rateStatus"]) => <StatusTag value={value} palette={ACTIVE_STATUS} />,
    },
    {
      title: "",
      key: "actions",
      fixed: "right",
      width: 96,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} aria-label={`Edit ${r.rateName}`} onClick={(e) => { e.stopPropagation(); editor.openEdit(r); }} />
          </Tooltip>
          <Tooltip title={r.bookingCount ? "Booked rooms use this rate" : "Delete"}>
            <Button
              type="text"
              danger
              disabled={r.bookingCount > 0}
              icon={<DeleteOutlined />}
              aria-label={`Delete ${r.rateName}`}
              onClick={(e) => { e.stopPropagation(); editor.remove(r); }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const data = rates.data ?? [];
  const filtered = Boolean(filter.branchId || filter.roomTypeId || filter.status);

  return (
    <>
      {(rates.error || types.error) && <LoadError error={(rates.error ?? types.error) as string} onRetry={() => { rates.reload(); types.reload(); }} />}
      <Card
        variant="outlined"
        title="Room rates"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <BranchFilter value={filter.branchId} onChange={(branchId) => setFilter((f) => ({ ...f, branchId }))} />
            <Select
              allowClear
              placeholder="All room types"
              style={{ width: 160 }}
              loading={types.loading}
              value={filter.roomTypeId}
              onChange={(roomTypeId) => setFilter((f) => ({ ...f, roomTypeId }))}
              options={(types.data ?? []).map((t) => ({ value: t.roomTypeId, label: t.typeName }))}
            />
            <Select
              allowClear
              placeholder="All statuses"
              style={{ width: 130 }}
              value={filter.status}
              onChange={(status) => setFilter((f) => ({ ...f, status }))}
              options={statusOptions(ACTIVE_STATUS)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={editor.openCreate}>
              New rate
            </Button>
          </Space>
        }
      >
        {!rates.loading && !rates.error && data.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={filtered ? "No rates match these filters." : "No rates yet. Rooms can only be booked once their type has an active rate."}
            style={{ padding: 32 }}
          />
        ) : (
          <Table<RoomRate>
            rowKey="rateId"
            size="middle"
            loading={rates.loading}
            columns={columns}
            dataSource={data}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
            onRow={(r) => ({ onClick: () => editor.openEdit(r), style: { cursor: "pointer" } })}
          />
        )}
      </Card>
      <RateModal
        open={editor.open}
        rate={editor.editing}
        roomTypes={types.data ?? []}
        saving={editor.saving}
        onCancel={editor.close}
        onSubmit={editor.save}
      />
    </>
  );
}
