"use client";

import { useState } from "react";
import { Button, Card, Empty, Space, Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { sortNumber, sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import { useCrudEditor } from "@/app/lib/use-crud-editor";
import BranchFilter from "../BranchFilter";
import LoadError from "../LoadError";
import { createShift, deleteShift, fetchShifts, updateShift } from "./shift.api";
import ShiftModal from "./ShiftModal";
import type { Shift, ShiftInput } from "./types";

export default function ShiftPage() {
  const { user, can } = useSession();
  const canManage = can("SCHEDULE_MANAGE");
  const [branchId, setBranchId] = useState<number | undefined>();
  const shifts = useApiData((signal) => fetchShifts(branchId, signal), `shifts:${branchId}`);
  const editor = useCrudEditor<Shift, ShiftInput>({
    noun: "shift",
    label: (s) => `${s.shiftName} (${s.branchCode})`,
    create: createShift,
    update: (s, input) => updateShift(s.shiftId, input),
    remove: (s) => deleteShift(s.shiftId),
    removeWarning: "This cannot be undone. A shift that has been scheduled cannot be deleted.",
    onChanged: () => shifts.reload(),
  });

  const columns: TableColumnsType<Shift> = [
    ...(user?.scopeLevel === "CHAIN" ? [{ title: "Branch", dataIndex: "branchCode", sorter: sortText<Shift>((s) => s.branchCode) }] : []),
    { title: "Shift", dataIndex: "shiftName", sorter: sortText<Shift>((s) => s.shiftName), render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
    {
      title: "Hours",
      key: "hours",
      defaultSortOrder: "ascend",
      sorter: sortText<Shift>((s) => s.startTime),
      render: (_, s) => (
        <>
          {s.startTime} – {s.endTime}
          {s.isOvernight && <Typography.Text type="secondary"> (next day)</Typography.Text>}
        </>
      ),
    },
    { title: "Times scheduled", dataIndex: "scheduleCount", align: "right", sorter: sortNumber<Shift>((s) => s.scheduleCount) },
  ];
  if (canManage) {
    columns.push({
      title: "",
      key: "actions",
      fixed: "right",
      width: 96,
      render: (_, s) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} aria-label={`Edit ${s.shiftName}`} onClick={(e) => { e.stopPropagation(); editor.openEdit(s); }} />
          </Tooltip>
          <Tooltip title={s.scheduleCount ? "Already scheduled" : "Delete"}>
            <Button type="text" danger disabled={s.scheduleCount > 0} icon={<DeleteOutlined />} aria-label={`Delete ${s.shiftName}`} onClick={(e) => { e.stopPropagation(); editor.remove(s); }} />
          </Tooltip>
        </Space>
      ),
    });
  }

  const data = shifts.data ?? [];
  return (
    <>
      {shifts.error && <LoadError error={shifts.error} onRetry={shifts.reload} />}
      <Card
        variant="outlined"
        title="Shifts"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <BranchFilter value={branchId} onChange={setBranchId} />
            {canManage && <Button type="primary" icon={<PlusOutlined />} onClick={editor.openCreate}>New shift</Button>}
          </Space>
        }
      >
        {!shifts.loading && !shifts.error && data.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No shifts yet. Create the branch's shifts before planning the rota." style={{ padding: 32 }} />
        ) : (
          <Table<Shift>
            rowKey="shiftId"
            size="middle"
            loading={shifts.loading}
            columns={columns}
            dataSource={data}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
            onRow={(s) => (canManage ? { onClick: () => editor.openEdit(s), style: { cursor: "pointer" } } : {})}
          />
        )}
      </Card>
      <ShiftModal open={editor.open} shift={editor.editing} saving={editor.saving} onCancel={editor.close} onSubmit={editor.save} />
    </>
  );
}
