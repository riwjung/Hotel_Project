"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { Button, Card, DatePicker, Empty, Segmented, Space } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { useApiData } from "@/app/lib/use-api-data";
import BranchFilter from "../BranchFilter";
import LoadError from "../LoadError";
import { fetchAvailabilityGrid } from "./availability.api";
import AvailabilityGrid from "./AvailabilityGrid";
import { GRID_DAYS, type GridDays, type GridFilter } from "./types";

export default function AvailabilityPage() {
  const { user, can } = useSession();
  const [branchId, setBranchId] = useState<number>();
  const [from, setFrom] = useState(() => dayjs().startOf("day"));
  const [days, setDays] = useState<GridDays>(14);

  const filter: GridFilter = { branchId, from: from.format("YYYY-MM-DD"), days };
  const grid = useApiData((signal) => fetchAvailabilityGrid(filter, signal), JSON.stringify(filter));
  const rooms = grid.data ?? [];

  return (
    <>
      {grid.error && <LoadError error={grid.error} onRetry={grid.reload} />}

      <Card
        variant="outlined"
        title="Availability"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <BranchFilter value={branchId} onChange={setBranchId} width={200} />
            <Button onClick={() => setFrom(dayjs().startOf("day"))}>Today</Button>
            <Space.Compact>
              <Button
                icon={<LeftOutlined />}
                aria-label={`Previous ${days} nights`}
                onClick={() => setFrom((f) => f.subtract(days, "day"))}
              />
              <DatePicker
                value={from}
                allowClear={false}
                format="D MMM YYYY"
                style={{ width: 140 }}
                onChange={(d) => d && setFrom(d.startOf("day"))}
              />
              <Button
                icon={<RightOutlined />}
                aria-label={`Next ${days} nights`}
                onClick={() => setFrom((f) => f.add(days, "day"))}
              />
            </Space.Compact>
            <Segmented<GridDays>
              value={days}
              onChange={setDays}
              options={GRID_DAYS.map((d) => ({ value: d, label: `${d} nights` }))}
            />
          </Space>
        }
      >
        {!grid.loading && !grid.error && rooms.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={branchId ? "This branch has no rooms yet." : "No rooms yet. Add rooms on the Rooms page."}
            style={{ padding: 32 }}
          />
        ) : (
          <AvailabilityGrid
            rooms={rooms}
            loading={grid.loading}
            from={from}
            days={days}
            showBranch={user?.scopeLevel === "CHAIN" && !branchId}
            canBook={can("BOOKING_MANAGE")}
          />
        )}
      </Card>
    </>
  );
}
