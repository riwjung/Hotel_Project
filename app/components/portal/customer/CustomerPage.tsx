"use client";

import { Button, Card, Empty, Input, Select, Space } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import LoadError from "../LoadError";
import CustomerModal from "./CustomerModal";
import CustomerTable from "./CustomerTable";
import { useCustomerData } from "./useCustomerData";
import { useCustomerEditor } from "./useCustomerEditor";

export default function CustomerPage() {
  const { can } = useSession();
  const canManage = can("CUSTOMER_MANAGE");
  const data = useCustomerData();
  const editor = useCustomerEditor(() => data.reload());
  const filtered = Boolean(data.search.trim() || data.tierId);

  return (
    <>
      {data.error && <LoadError error={data.error} onRetry={data.reload} />}

      <Card
        variant="outlined"
        title="Customers"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Name, email, phone, ID"
              value={data.search}
              onChange={(e) => data.setSearch(e.target.value)}
              style={{ width: 230 }}
            />
            <Select
              allowClear
              placeholder="All tiers"
              style={{ width: 140 }}
              loading={data.tiersLoading}
              value={data.tierId}
              onChange={data.setTierId}
              options={data.tiers.map((tier) => ({ value: tier.tierId, label: tier.tierName }))}
            />
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={editor.openCreate}>
                New customer
              </Button>
            )}
          </Space>
        }
      >
        {!data.loading && !data.error && data.customers.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              filtered
                ? "No customers match this search. Clear the search or tier filter."
                : canManage
                  ? "No customers yet. Add one with “New customer”."
                  : "No customers yet."
            }
            style={{ padding: 32 }}
          />
        ) : (
          <CustomerTable
            customers={data.customers}
            loading={data.loading}
            canManage={canManage}
            onEdit={editor.openEdit}
            onDelete={editor.remove}
          />
        )}
      </Card>

      <CustomerModal
        open={editor.open}
        customer={editor.editing}
        tiers={data.tiers}
        saving={editor.saving}
        onCancel={editor.close}
        onSubmit={editor.save}
      />
    </>
  );
}
