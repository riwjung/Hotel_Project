"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { App, Button, Card, Dropdown, Empty, Space, Table, Tag, Tooltip, Typography, type TableColumnsType } from "antd";
import { LeftOutlined, PlusOutlined, RightOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { ATTENDANCE_STATUS, SCHEDULE_STATUS } from "@/app/lib/status";
import { sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import BranchFilter from "../BranchFilter";
import LoadError from "../LoadError";
import AddShiftModal, { type AddTarget } from "./AddShiftModal";
import { createSchedule, fetchWeek, setScheduleStatus } from "./schedule.api";
import type { ScheduleEntry, ScheduleStatusInput, WeekSchedule } from "./types";

type Row = WeekSchedule["employees"][number];

/** Monday of the week containing `d`. */
const monday = (d: dayjs.Dayjs) => d.subtract((d.day() + 6) % 7, "day").startOf("day");

export default function SchedulePage() {
  const { message, modal } = App.useApp();
  const { user, can, selectedBranchId } = useSession();
  const canManage = can("SCHEDULE_MANAGE");
  const chainWide = user?.scopeLevel === "CHAIN" && !selectedBranchId;
  const [branchId, setBranchId] = useState<number | undefined>();
  const [from, setFrom] = useState(() => monday(dayjs()).format("YYYY-MM-DD"));
  const [adding, setAdding] = useState<AddTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const ready = !chainWide || branchId !== undefined;
  const week = useApiData(
    (signal) => (ready ? fetchWeek(branchId, from, signal) : Promise.resolve(null)),
    `week:${branchId}:${from}:${ready}`,
  );
  const data = week.data;
  const days = Array.from({ length: 7 }, (_, i) => dayjs(from).add(i, "day"));
  const today = dayjs().format("YYYY-MM-DD");

  const add = async (shiftId: number) => {
    if (!adding) return;
    setSaving(true);
    try {
      await createSchedule({ employeeId: adding.employeeId, shiftId, workDate: adding.workDate });
      message.success(`Shift added for ${adding.fullName}`);
      setAdding(null);
      week.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not add the shift");
    } finally {
      setSaving(false);
    }
  };

  const change = async (entry: ScheduleEntry, status: ScheduleStatusInput["scheduleStatus"], done: string) => {
    try {
      await setScheduleStatus(entry.scheduleId, status);
      message.success(done);
      week.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not change the shift");
    }
  };

  const tag = (entry: ScheduleEntry, row: Row) => {
    const meta = SCHEDULE_STATUS[entry.scheduleStatus];
    const label = (
      <Tag color={meta.color} icon={meta.icon} style={{ marginInlineEnd: 0, cursor: canManage ? "pointer" : "default" }}>
        {entry.shiftName} {entry.startTime}–{entry.endTime}
      </Tag>
    );
    const tip = `${meta.label}${entry.attendanceStatus ? ` · ${ATTENDANCE_STATUS[entry.attendanceStatus].label}` : ""}`;
    const actionable = canManage && !entry.attendanceStatus && entry.scheduleStatus !== "COMPLETED";
    if (!actionable) return <Tooltip key={entry.scheduleId} title={tip}>{label}</Tooltip>;
    const items =
      entry.scheduleStatus === "CANCELLED"
        ? [{ key: "SCHEDULED", label: "Restore shift" }]
        : [
            ...(entry.scheduleStatus === "SCHEDULED" ? [{ key: "ABSENT", label: "Mark absent" }] : [{ key: "SCHEDULED", label: "Back to scheduled" }]),
            { key: "CANCELLED", label: "Cancel shift", danger: true },
          ];
    return (
      <Dropdown
        key={entry.scheduleId}
        trigger={["click"]}
        menu={{
          items,
          onClick: ({ key }) => {
            if (key === "CANCELLED") {
              modal.confirm({
                title: `Cancel ${row.fullName}'s ${entry.shiftName} shift on ${dayjs(entry.workDate).format("D MMM")}?`,
                content: "The shift stays in the history as cancelled and no longer counts for attendance.",
                okText: "Cancel shift",
                cancelText: "Keep it",
                okButtonProps: { danger: true },
                onOk: () => change(entry, "CANCELLED", "Shift cancelled"),
              });
            } else {
              void change(entry, key as ScheduleStatusInput["scheduleStatus"], key === "ABSENT" ? "Marked absent" : "Shift restored");
            }
          },
        }}
      >
        <Tooltip title={tip}>{label}</Tooltip>
      </Dropdown>
    );
  };

  const columns: TableColumnsType<Row> = [
    {
      title: "Employee",
      key: "employee",
      fixed: "left",
      sorter: sortText<Row>((r) => r.fullName),
      render: (_, r) => (
        <>
          <Typography.Text strong>{r.fullName}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{r.roleName}</Typography.Text>
        </>
      ),
    },
    ...days.map((d) => {
      const iso = d.format("YYYY-MM-DD");
      return {
        title: (
          <span style={{ fontWeight: iso === today ? 700 : undefined }}>
            {d.format("ddd D MMM")}
          </span>
        ),
        key: iso,
        width: 170,
        render: (_: unknown, r: Row) => {
          const entries = (data?.schedules ?? []).filter((s) => s.employeeId === r.employeeId && s.workDate === iso);
          return (
            <Space orientation="vertical" size={4}>
              {entries.map((e) => tag(e, r))}
              {canManage && (
                <Button
                  size="small"
                  type="dashed"
                  icon={<PlusOutlined />}
                  aria-label={`Add shift ${r.fullName} ${iso}`}
                  onClick={() => setAdding({ employeeId: r.employeeId, fullName: r.fullName, workDate: iso })}
                />
              )}
            </Space>
          );
        },
      };
    }),
  ];

  return (
    <>
      {week.error && <LoadError error={week.error} onRetry={week.reload} />}
      <Card
        variant="outlined"
        title="Work schedules"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <BranchFilter value={branchId} onChange={setBranchId} />
            <Space.Compact>
              <Button icon={<LeftOutlined />} aria-label="Previous week" onClick={() => setFrom(dayjs(from).subtract(7, "day").format("YYYY-MM-DD"))} />
              <Button onClick={() => setFrom(monday(dayjs()).format("YYYY-MM-DD"))}>This week</Button>
              <Button icon={<RightOutlined />} aria-label="Next week" onClick={() => setFrom(dayjs(from).add(7, "day").format("YYYY-MM-DD"))} />
            </Space.Compact>
            <Typography.Text type="secondary">
              {dayjs(from).format("D MMM")} – {dayjs(from).add(6, "day").format("D MMM YYYY")}
            </Typography.Text>
          </Space>
        }
      >
        {!ready ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Choose a branch to see its rota." style={{ padding: 32 }} />
        ) : !week.loading && !week.error && (data?.employees.length ?? 0) === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No staff in this branch yet." style={{ padding: 32 }} />
        ) : (
          <Table<Row>
            rowKey="employeeId"
            size="middle"
            loading={week.loading}
            columns={columns}
            dataSource={data?.employees ?? []}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
          />
        )}
      </Card>
      <AddShiftModal target={adding} shifts={data?.shifts ?? []} saving={saving} onCancel={() => setAdding(null)} onSubmit={add} />
    </>
  );
}
