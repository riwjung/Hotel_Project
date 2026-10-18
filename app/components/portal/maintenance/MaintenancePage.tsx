"use client";

import { useState } from "react";
import { App, Button, Card, Empty, Select, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { MAINTENANCE_PRIORITY, MAINTENANCE_STATUS, statusOptions } from "@/app/lib/status";
import { useApiData } from "@/app/lib/use-api-data";
import { useCrudEditor } from "@/app/lib/use-crud-editor";
import BranchFilter from "../BranchFilter";
import LoadError from "../LoadError";
import {
  changeMaintenanceStatus,
  createMaintenance,
  fetchMaintenance,
  updateMaintenance,
} from "./maintenance.api";
import MaintenanceModal from "./MaintenanceModal";
import MaintenanceTable from "./MaintenanceTable";
import ResolveModal from "./ResolveModal";
import type { MaintenanceFilter, MaintenanceInput, MaintenanceRequest, MaintenanceStatusInput } from "./types";

export default function MaintenancePage() {
  const { message, modal } = App.useApp();
  const { user, can } = useSession();
  const canManage = can("MAINTENANCE_MANAGE");
  const [filter, setFilter] = useState<MaintenanceFilter>({});
  const [actingId, setActingId] = useState<number | null>(null);
  const [resolving, setResolving] = useState<MaintenanceRequest | null>(null);
  const requests = useApiData((signal) => fetchMaintenance(filter, signal), JSON.stringify(filter));
  const data = requests.data ?? [];

  const editor = useCrudEditor<MaintenanceRequest, MaintenanceInput>({
    noun: "request",
    label: (r) => `“${r.issueTitle}”`,
    create: createMaintenance,
    update: (r, input) => updateMaintenance(r.maintenanceId, input),
    onChanged: () => requests.reload(),
  });

  const changeStatus = async (r: MaintenanceRequest, input: MaintenanceStatusInput, done: string) => {
    setActingId(r.maintenanceId);
    try {
      await changeMaintenanceStatus(r.maintenanceId, input);
      message.success(done);
      setResolving(null);
      requests.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update the request");
    } finally {
      setActingId(null);
    }
  };

  const cancelRequest = (r: MaintenanceRequest) =>
    modal.confirm({
      title: `Cancel “${r.issueTitle}”?`,
      content: r.roomNumber
        ? `The request is closed for good. Room ${r.roomNumber} is released if no other repair is open.`
        : "The request is closed for good.",
      okText: "Cancel request",
      cancelText: "Keep it",
      okButtonProps: { danger: true },
      onOk: () => changeStatus(r, { toStatus: "CANCELLED" }, "Request cancelled"),
    });

  const filtered = Boolean(filter.branchId || filter.status || filter.priority);

  return (
    <>
      {requests.error && <LoadError error={requests.error} onRetry={requests.reload} />}
      <Card
        variant="outlined"
        title="Maintenance"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <BranchFilter value={filter.branchId} onChange={(branchId) => setFilter((f) => ({ ...f, branchId }))} />
            <Select
              allowClear
              placeholder="All statuses"
              style={{ width: 150 }}
              value={filter.status}
              onChange={(status) => setFilter((f) => ({ ...f, status }))}
              options={statusOptions(MAINTENANCE_STATUS)}
            />
            <Select
              allowClear
              placeholder="All priorities"
              style={{ width: 150 }}
              value={filter.priority}
              onChange={(priority) => setFilter((f) => ({ ...f, priority }))}
              options={statusOptions(MAINTENANCE_PRIORITY)}
            />
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={editor.openCreate}>
                Report issue
              </Button>
            )}
          </Space>
        }
      >
        {!requests.loading && !requests.error && data.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={filtered ? "No requests match these filters. Clear a filter to see more." : "No maintenance requests yet."}
            style={{ padding: 32 }}
          />
        ) : (
          <MaintenanceTable
            requests={data}
            loading={requests.loading}
            showBranch={user?.scopeLevel === "CHAIN"}
            canManage={canManage}
            actingId={actingId}
            onEdit={editor.openEdit}
            onStart={(r) => changeStatus(r, { toStatus: "IN_PROGRESS" }, "Work started")}
            onResolve={setResolving}
            onCancelRequest={cancelRequest}
          />
        )}
      </Card>

      <MaintenanceModal
        open={editor.open}
        request={editor.editing}
        saving={editor.saving}
        onCancel={editor.close}
        onSubmit={editor.save}
      />
      <ResolveModal
        request={resolving}
        saving={actingId !== null}
        onCancel={() => setResolving(null)}
        onSubmit={(cost) => resolving && changeStatus(resolving, { toStatus: "RESOLVED", cost }, "Request resolved")}
      />
    </>
  );
}
