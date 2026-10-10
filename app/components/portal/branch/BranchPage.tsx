"use client";

import { Button, Card, Empty, Input, Space } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import LoadError from "../LoadError";
import BranchModal from "./BranchModal";
import BranchTable from "./BranchTable";
import { useBranchData } from "./useBranchData";
import { useBranchEditor } from "./useBranchEditor";

export default function BranchPage() {
  const { can } = useSession();
  const canManage = can("BRANCH_MANAGE");
  const { branches, total, loading, error, reload, search, setSearch } = useBranchData();
  const editor = useBranchEditor(reload);

  return (
    <>
      {error && <LoadError error={error} onRetry={reload} />}

      <Card
        variant="outlined"
        title="Branches"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search code, name, province"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={editor.openCreate}>
                New branch
              </Button>
            )}
          </Space>
        }
      >
        {!loading && !error && total === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={canManage ? "No branches yet. Create the first one with “New branch”." : "No branches yet."}
            style={{ padding: 32 }}
          />
        ) : (
          <BranchTable
            branches={branches}
            loading={loading}
            canManage={canManage}
            onEdit={editor.openEdit}
            onDelete={editor.remove}
          />
        )}
      </Card>

      <BranchModal
        open={editor.open}
        branch={editor.editing}
        saving={editor.saving}
        onCancel={editor.close}
        onSubmit={editor.save}
      />
    </>
  );
}
