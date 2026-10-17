"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dayjs, { type Dayjs } from "dayjs";
import { Button, Card, DatePicker, Empty, Input, Select, Space } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { BOOKING_STATUS, statusOptions } from "@/app/lib/status";
import { useApiData } from "@/app/lib/use-api-data";
import LoadError from "../LoadError";
import { fetchBranches } from "../branch/branch.api";
import { fetchBookings } from "./booking.api";
import BookingTable from "./BookingTable";
import type { BookingFilter } from "./types";

export default function BookingListPage() {
  const router = useRouter();
  const { user, can } = useSession();
  const chainWide = user?.scopeLevel === "CHAIN" && can("BRANCH_VIEW");
  const [filter, setFilter] = useState<BookingFilter>({});
  const bookings = useApiData((signal) => fetchBookings(filter, signal), JSON.stringify(filter));
  const branches = useApiData(
    (signal) => (chainWide ? fetchBranches(signal) : Promise.resolve([])),
    `booking-branches:${chainWide}`,
  );
  const data = bookings.data ?? [];
  const rangeValue: [Dayjs, Dayjs] | null = filter.from && filter.to ? [dayjs(filter.from), dayjs(filter.to)] : null;

  return (
    <>
      {bookings.error && <LoadError error={bookings.error} onRetry={bookings.reload} />}
      <Card
        variant="outlined"
        title="Bookings"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Booking or customer"
              value={filter.q}
              onChange={(event) => setFilter((current) => ({ ...current, q: event.target.value || undefined }))}
              style={{ width: 210 }}
            />
            {chainWide && (
              <Select
                allowClear
                placeholder="All branches"
                style={{ width: 180 }}
                loading={branches.loading}
                value={filter.branchId}
                onChange={(branchId) => setFilter((current) => ({ ...current, branchId }))}
                options={(branches.data ?? []).map((branch) => ({
                  value: branch.branchId,
                  label: `${branch.branchCode} · ${branch.branchName}`,
                }))}
              />
            )}
            <Select
              allowClear
              placeholder="All statuses"
              style={{ width: 160 }}
              value={filter.status}
              onChange={(status) => setFilter((current) => ({ ...current, status }))}
              options={statusOptions(BOOKING_STATUS)}
            />
            <DatePicker.RangePicker
              value={rangeValue}
              onChange={(range) =>
                setFilter((current) => ({
                  ...current,
                  from: range?.[0]?.format("YYYY-MM-DD"),
                  to: range?.[1]?.format("YYYY-MM-DD"),
                }))
              }
            />
            {can("BOOKING_MANAGE") && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/bookings/new")}>
                New booking
              </Button>
            )}
          </Space>
        }
      >
        {!bookings.loading && !bookings.error && data.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No bookings match these filters. Clear a filter to see more."
            style={{ padding: 32 }}
          />
        ) : (
          <BookingTable bookings={data} loading={bookings.loading} showBranch={user?.scopeLevel === "CHAIN"} />
        )}
      </Card>
    </>
  );
}
