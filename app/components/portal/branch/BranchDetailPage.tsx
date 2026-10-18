"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftOutlined, BankOutlined, CalendarOutlined, HomeOutlined, TeamOutlined } from "@ant-design/icons";
import { Button, Card, Col, Descriptions, Row, Space, Statistic, Typography } from "antd";
import { BRANCH_STATUS } from "@/app/lib/status";
import { useApiData } from "@/app/lib/use-api-data";
import LoadError from "../LoadError";
import StatusTag from "../StatusTag";
import { fetchBranch } from "./branch.api";

export default function BranchDetailPage({ branchId }: { branchId: number }) {
  const router = useRouter();
  const state = useApiData((signal) => fetchBranch(branchId, signal), String(branchId));
  if (state.error) return <LoadError error={state.error} onRetry={state.reload} />;
  if (!state.data) return <Card variant="outlined" loading />;
  const branch = state.data;

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Space wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/branches")}>Back to branches</Button>
        <Typography.Title level={3} style={{ margin: 0 }}>{branch.branchCode} · {branch.branchName}</Typography.Title>
        <StatusTag value={branch.branchStatus} palette={BRANCH_STATUS} />
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}><Card variant="outlined"><Statistic title="Rooms" value={branch.roomCount} prefix={<HomeOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card variant="outlined"><Statistic title="Current staff" value={branch.employeeCount} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card variant="outlined"><Statistic title="Active bookings" value={branch.activeBookingCount} prefix={<CalendarOutlined />} /></Card></Col>
      </Row>

      <Card variant="outlined" title={<Space><BankOutlined />Branch information</Space>}>
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2 }}
          styles={{ label: { fontWeight: 600 } }}
          items={[
            { key: "code", label: "Code", children: branch.branchCode },
            { key: "province", label: "Province", children: branch.province },
            { key: "address", label: "Address", children: branch.address || "—", span: 2 },
            { key: "phone", label: "Phone", children: branch.phone || "—" },
            { key: "hours", label: "Check-in / check-out", children: `${branch.checkInTime} – ${branch.checkOutTime}` },
          ]}
        />
      </Card>
    </Space>
  );
}
