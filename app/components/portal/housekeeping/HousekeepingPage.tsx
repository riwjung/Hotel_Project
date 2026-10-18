"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { App, Card, DatePicker, Empty, Select, Space } from "antd";
import { useSession } from "@/app/lib/auth-client";
import { HOUSEKEEPING_STATUS, statusOptions } from "@/app/lib/status";
import { useApiData } from "@/app/lib/use-api-data";
import LoadError from "../LoadError";
import { fetchBranches } from "../branch/branch.api";
import { fetchHousekeeping, updateHousekeepingStatus } from "./housekeeping.api";
import HousekeepingTable from "./HousekeepingTable";
import type { HousekeepingFilter, HousekeepingStatus, HousekeepingTask } from "./types";

type NextStatus = Extract<HousekeepingStatus, "IN_PROGRESS" | "DONE" | "VERIFIED">;

export default function HousekeepingPage() {
  const { message, modal } = App.useApp();
  const { user, can, selectedBranchId } = useSession();
  const chainWide = user?.scopeLevel === "CHAIN" && !selectedBranchId && can("BRANCH_VIEW");
  const [filter, setFilter] = useState<HousekeepingFilter>({ date: dayjs().format("YYYY-MM-DD") });
  const [actingId, setActingId] = useState<number | null>(null);
  const tasks = useApiData((signal) => fetchHousekeeping(filter, signal), JSON.stringify(filter));
  const branches = useApiData(
    (signal) => (chainWide ? fetchBranches(signal) : Promise.resolve([])),
    `housekeeping-branches:${chainWide}`,
  );
  const data = tasks.data ?? [];

  const advance = async (task: HousekeepingTask, toStatus: NextStatus) => {
    setActingId(task.taskId);
    try {
      await updateHousekeepingStatus(task.taskId, toStatus);
      message.success(`Room ${task.roomNumber} marked ${HOUSEKEEPING_STATUS[toStatus].label.toLowerCase()}`);
      tasks.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update the task");
    } finally {
      setActingId(null);
    }
  };

  const requestAdvance = (task: HousekeepingTask, toStatus: NextStatus) => {
    if (toStatus !== "VERIFIED") {
      void advance(task, toStatus);
      return;
    }
    modal.confirm({
      title: `Verify cleaning for room ${task.roomNumber}?`,
      content:
        "This completes the task. A room waiting for cleaning becomes Available; an occupied room stays occupied. The final status cannot be reversed.",
      okText: "Verify task",
      okButtonProps: { danger: true },
      onOk: () => advance(task, toStatus),
    });
  };

  return (
    <>
      {tasks.error && <LoadError error={tasks.error} onRetry={tasks.reload} />}
      <Card
        variant="outlined"
        title="Housekeeping"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            {chainWide && (
              <Select
                allowClear
                placeholder="All branches"
                style={{ width: 180 }}
                loading={branches.loading}
                value={filter.branchId}
                onChange={(branchId) => setFilter((current) => ({ ...current, branchId }))}
                options={(branches.data ?? []).map((branch) => ({ value: branch.branchId, label: `${branch.branchCode} · ${branch.branchName}` }))}
              />
            )}
            <DatePicker
              allowClear
              value={filter.date ? dayjs(filter.date) : null}
              onChange={(date) => setFilter((current) => ({ ...current, date: date?.format("YYYY-MM-DD") }))}
            />
            <Select
              allowClear
              placeholder="All statuses"
              style={{ width: 160 }}
              value={filter.status}
              onChange={(status) => setFilter((current) => ({ ...current, status }))}
              options={statusOptions(HOUSEKEEPING_STATUS)}
            />
          </Space>
        }
      >
        {!tasks.loading && !tasks.error && data.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No housekeeping tasks match these filters." style={{ padding: 32 }} />
        ) : (
          <HousekeepingTable
            tasks={data}
            loading={tasks.loading}
            showBranch={user?.scopeLevel === "CHAIN" && !selectedBranchId}
            canManage={can("HOUSEKEEPING_MANAGE")}
            actingId={actingId}
            onAdvance={requestAdvance}
          />
        )}
      </Card>
    </>
  );
}
