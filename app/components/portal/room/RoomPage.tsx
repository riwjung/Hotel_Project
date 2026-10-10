"use client";

import { useState } from "react";
import { Card, Empty, Select, Space } from "antd";
import { useSession } from "@/app/lib/auth-client";
import { ROOM_STATUS, statusOptions } from "@/app/lib/status";
import { useApiData } from "@/app/lib/use-api-data";
import LoadError from "../LoadError";
import { fetchBranches } from "../branch/branch.api";
import { fetchRooms } from "./room.api";
import RoomTable from "./RoomTable";
import type { RoomFilter } from "./types";

export default function RoomPage() {
  const { user, can } = useSession();
  // Branch filter only makes sense for chain-wide users; branch staff are scoped by the API.
  const chainWide = user?.scopeLevel === "CHAIN" && can("BRANCH_VIEW");
  const [filter, setFilter] = useState<RoomFilter>({});

  const rooms = useApiData((signal) => fetchRooms(filter, signal), JSON.stringify(filter));
  const branches = useApiData(
    (signal) => (chainWide ? fetchBranches(signal) : Promise.resolve([])),
    `branches:${chainWide}`,
  );

  const data = rooms.data ?? [];

  return (
    <>
      {rooms.error && <LoadError error={rooms.error} onRetry={rooms.reload} />}

      <Card
        variant="outlined"
        title="Rooms"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            {chainWide && (
              <Select
                allowClear
                placeholder="All branches"
                style={{ width: 200 }}
                loading={branches.loading}
                value={filter.branchId}
                onChange={(branchId) => setFilter((f) => ({ ...f, branchId }))}
                options={(branches.data ?? []).map((b) => ({
                  value: b.branchId,
                  label: `${b.branchCode} · ${b.branchName}`,
                }))}
              />
            )}
            <Select
              allowClear
              placeholder="All statuses"
              style={{ width: 170 }}
              value={filter.status}
              onChange={(status) => setFilter((f) => ({ ...f, status }))}
              options={statusOptions(ROOM_STATUS)}
            />
          </Space>
        }
      >
        {!rooms.loading && !rooms.error && data.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              filter.branchId || filter.status
                ? "No rooms match these filters. Clear a filter to see more."
                : "No rooms yet. Rooms are added under Room setup (planned)."
            }
            style={{ padding: 32 }}
          />
        ) : (
          <RoomTable rooms={data} loading={rooms.loading} showBranch={user?.scopeLevel === "CHAIN"} />
        )}
      </Card>
    </>
  );
}
