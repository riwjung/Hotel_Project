"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { App, Button, Card, DatePicker, Empty, Space, Table, Typography, type TableColumnsType } from "antd";
import { EditOutlined, LoginOutlined, LogoutOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { formatDate, formatDateTime } from "@/app/lib/format";
import { ATTENDANCE_STATUS, SCHEDULE_STATUS } from "@/app/lib/status";
import { sortByOrder, sortDate, sortNumber, sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import BranchFilter from "../BranchFilter";
import LoadError from "../LoadError";
import StatusTag from "../StatusTag";
import { clock, fetchDay, fetchMine, fetchMonthly, recordAttendance } from "./attendance.api";
import CorrectModal from "./CorrectModal";
import { ATTENDANCE_STATUSES, type AttendanceInput, type AttendanceRow, type MonthlyRow } from "./types";

const dash = <Typography.Text type="secondary">—</Typography.Text>;
const status = (r: AttendanceRow) =>
  r.attendanceStatus ? <StatusTag value={r.attendanceStatus} palette={ATTENDANCE_STATUS} /> : <StatusTag value={r.scheduleStatus} palette={SCHEDULE_STATUS} />;

export default function AttendancePage() {
  const { message } = App.useApp();
  const { user, can } = useSession();
  const canManage = can("ATTENDANCE_MANAGE");
  const [branchId, setBranchId] = useState<number | undefined>();
  const [date, setDate] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [month, setMonth] = useState(() => dayjs().format("YYYY-MM"));
  const [actingId, setActingId] = useState<number | null>(null);
  const [correcting, setCorrecting] = useState<AttendanceRow | null>(null);
  const [saving, setSaving] = useState(false);
  const mine = useApiData(fetchMine, "attendance-mine");
  const day = useApiData((signal) => fetchDay(branchId, date, signal), `attendance:${branchId}:${date}`);
  const monthly = useApiData((signal) => fetchMonthly(branchId, month, signal), `attendance-month:${branchId}:${month}`);
  const reloadAll = () => {
    mine.reload();
    day.reload();
    monthly.reload();
  };

  const punch = async (r: AttendanceRow, action: "in" | "out") => {
    setActingId(r.scheduleId);
    try {
      await clock({ scheduleId: r.scheduleId, action });
      message.success(action === "in" ? `Clocked in for ${r.shiftName}` : `Clocked out of ${r.shiftName}`);
      reloadAll();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not clock");
    } finally {
      setActingId(null);
    }
  };

  const correct = async (input: AttendanceInput) => {
    if (!correcting) return;
    setSaving(true);
    try {
      await recordAttendance(correcting.scheduleId, input);
      message.success(`Attendance saved for ${correcting.employeeName}`);
      setCorrecting(null);
      reloadAll();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not save attendance");
    } finally {
      setSaving(false);
    }
  };

  const mineColumns: TableColumnsType<AttendanceRow> = [
    { title: "Day", dataIndex: "workDate", sorter: sortDate<AttendanceRow>((r) => r.workDate), render: formatDate },
    { title: "Shift", key: "shift", sorter: sortText<AttendanceRow>((r) => r.startTime), render: (_, r) => `${r.shiftName} ${r.startTime}–${r.endTime}` },
    { title: "In", dataIndex: "clockIn", sorter: sortDate<AttendanceRow>((r) => r.clockIn), render: formatDateTime },
    { title: "Out", dataIndex: "clockOut", sorter: sortDate<AttendanceRow>((r) => r.clockOut), render: formatDateTime },
    { title: "Status", key: "status", sorter: sortText<AttendanceRow>((r) => r.attendanceStatus ?? r.scheduleStatus), render: (_, r) => status(r) },
    {
      title: "",
      key: "clock",
      fixed: "right",
      render: (_, r) =>
        r.scheduleStatus !== "SCHEDULED" ? null : !r.clockIn ? (
          <Button size="small" type="primary" icon={<LoginOutlined />} loading={actingId === r.scheduleId} onClick={() => punch(r, "in")}>
            Clock in
          </Button>
        ) : !r.clockOut ? (
          <Button size="small" icon={<LogoutOutlined />} loading={actingId === r.scheduleId} onClick={() => punch(r, "out")}>
            Clock out
          </Button>
        ) : null,
    },
  ];

  const dayColumns: TableColumnsType<AttendanceRow> = [
    ...(user?.scopeLevel === "CHAIN" ? [{ title: "Branch", dataIndex: "branchCode", sorter: sortText<AttendanceRow>((r) => r.branchCode) }] : []),
    { title: "Employee", dataIndex: "employeeName", sorter: sortText<AttendanceRow>((r) => r.employeeName), render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
    { title: "Shift", key: "shift", sorter: sortText<AttendanceRow>((r) => r.startTime), render: (_, r) => `${r.shiftName} ${r.startTime}–${r.endTime}` },
    { title: "Clock in", dataIndex: "clockIn", sorter: sortDate<AttendanceRow>((r) => r.clockIn), render: formatDateTime },
    { title: "Clock out", dataIndex: "clockOut", sorter: sortDate<AttendanceRow>((r) => r.clockOut), render: formatDateTime },
    {
      title: "Status",
      key: "status",
      sorter: sortByOrder<AttendanceRow>((r) => r.attendanceStatus, ATTENDANCE_STATUSES),
      render: (_, r) => status(r),
    },
    { title: "Remark", dataIndex: "remark", sorter: sortText<AttendanceRow>((r) => r.remark), render: (v: string | null) => v ?? dash },
  ];
  if (canManage) {
    dayColumns.push({
      title: "",
      key: "correct",
      fixed: "right",
      render: (_, r) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => setCorrecting(r)}>
          Correct
        </Button>
      ),
    });
  }

  const monthColumns: TableColumnsType<MonthlyRow> = [
    { title: "Employee", dataIndex: "employeeName", sorter: sortText<MonthlyRow>((r) => r.employeeName) },
    { title: "Shifts", dataIndex: "scheduledShifts", align: "right", sorter: sortNumber<MonthlyRow>((r) => r.scheduledShifts) },
    { title: "On time", dataIndex: "onTime", align: "right", sorter: sortNumber<MonthlyRow>((r) => r.onTime) },
    { title: "Late", dataIndex: "late", align: "right", sorter: sortNumber<MonthlyRow>((r) => r.late) },
    { title: "Left early", dataIndex: "earlyLeave", align: "right", sorter: sortNumber<MonthlyRow>((r) => r.earlyLeave) },
    { title: "Absent", dataIndex: "absent", align: "right", defaultSortOrder: "descend", sorter: sortNumber<MonthlyRow>((r) => r.absent) },
    { title: "Minutes late", dataIndex: "lateMinutes", align: "right", sorter: sortNumber<MonthlyRow>((r) => r.lateMinutes) },
  ];

  const error = day.error ?? mine.error ?? monthly.error;
  const myRows = mine.data ?? [];

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      {error && <LoadError error={error} onRetry={reloadAll} />}
      {myRows.length > 0 && (
        <Card variant="outlined" title="My shifts" styles={{ body: { padding: 0 } }}>
          <Table<AttendanceRow>
            rowKey="scheduleId"
            size="middle"
            columns={mineColumns}
            dataSource={myRows}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
          />
        </Card>
      )}
      <Card
        variant="outlined"
        title="Attendance"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <BranchFilter value={branchId} onChange={setBranchId} />
            <DatePicker
              allowClear={false}
              value={dayjs(date)}
              format="D MMM YYYY"
              onChange={(d) => d && setDate(d.format("YYYY-MM-DD"))}
            />
          </Space>
        }
      >
        {!day.loading && !day.error && (day.data ?? []).length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No shifts scheduled for this day." style={{ padding: 32 }} />
        ) : (
          <Table<AttendanceRow>
            rowKey="scheduleId"
            size="middle"
            loading={day.loading}
            columns={dayColumns}
            dataSource={day.data ?? []}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
          />
        )}
      </Card>
      <Card
        variant="outlined"
        title="Monthly report"
        styles={{ body: { padding: 0 } }}
        extra={
          <DatePicker
            picker="month"
            allowClear={false}
            value={dayjs(`${month}-01`)}
            format="MMM YYYY"
            onChange={(d) => d && setMonth(d.format("YYYY-MM"))}
          />
        }
      >
        <Table<MonthlyRow>
          rowKey="employeeId"
          size="middle"
          loading={monthly.loading}
          columns={monthColumns}
          dataSource={monthly.data ?? []}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
        />
      </Card>
      <CorrectModal row={correcting} saving={saving} onCancel={() => setCorrecting(null)} onSubmit={correct} />
    </Space>
  );
}
