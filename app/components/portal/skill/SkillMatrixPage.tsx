"use client";

import { useState } from "react";
import { App, Card, Empty, Select, Table, Typography, type TableColumnsType } from "antd";
import { SKILL_LEVEL, statusOptions } from "@/app/lib/status";
import { sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import BranchFilter from "../BranchFilter";
import LoadError from "../LoadError";
import { fetchSkillMatrix, setSkill } from "./skill.api";
import type { SkillLevel, SkillMatrix } from "./types";

type Row = SkillMatrix["employees"][number];
const NONE = "NONE";

// ASSIGNMENT_MANAGE reaches this page. Skills decide who may be assigned (R5).
export default function SkillMatrixPage() {
  const { message } = App.useApp();
  const [branchId, setBranchId] = useState<number | undefined>();
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const matrix = useApiData((signal) => fetchSkillMatrix(branchId, signal), `skills:${branchId}`);
  const data = matrix.data;
  const level = (employeeId: number, serviceId: number) =>
    data?.skills.find((s) => s.employeeId === employeeId && s.serviceId === serviceId)?.skillLevel;

  const change = async (row: Row, serviceId: number, serviceName: string, value: SkillLevel | typeof NONE) => {
    const key = `${row.employeeId}:${serviceId}`;
    setSavingCell(key);
    try {
      await setSkill({ employeeId: row.employeeId, serviceId, skillLevel: value === NONE ? null : value });
      message.success(
        value === NONE ? `${row.fullName} no longer does ${serviceName}` : `${row.fullName}: ${serviceName} — ${SKILL_LEVEL[value].label}`,
      );
      matrix.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not save the skill");
    } finally {
      setSavingCell(null);
    }
  };

  const options = [{ value: NONE, label: "—" }, ...statusOptions(SKILL_LEVEL)];
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
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {r.branchCode} · {r.roleName}
          </Typography.Text>
        </>
      ),
    },
    ...(data?.services ?? []).map((s) => ({
      title: s.serviceName,
      key: `s${s.serviceId}`,
      width: 150,
      sorter: sortText<Row>((r) => level(r.employeeId, s.serviceId) ?? ""),
      render: (_: unknown, r: Row) => (
        <Select
          size="small"
          style={{ width: 120 }}
          value={level(r.employeeId, s.serviceId) ?? NONE}
          loading={savingCell === `${r.employeeId}:${s.serviceId}`}
          options={options}
          aria-label={`${r.fullName} ${s.serviceName}`}
          onChange={(v: SkillLevel | typeof NONE) => void change(r, s.serviceId, s.serviceName, v)}
        />
      ),
    })),
  ];

  return (
    <>
      {matrix.error && <LoadError error={matrix.error} onRetry={matrix.reload} />}
      <Card
        variant="outlined"
        title="Staff skills"
        styles={{ body: { padding: 0 } }}
        extra={<BranchFilter value={branchId} onChange={setBranchId} />}
      >
        {!matrix.loading && !matrix.error && (data?.employees.length ?? 0) === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active staff here." style={{ padding: 32 }} />
        ) : (
          <Table<Row>
            rowKey="employeeId"
            size="middle"
            loading={matrix.loading}
            columns={columns}
            dataSource={data?.employees ?? []}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
            title={() => (
              <Typography.Text type="secondary">
                Only services that need staff are listed. An order can be assigned only to someone with its skill.
              </Typography.Text>
            )}
          />
        )}
      </Card>
    </>
  );
}
