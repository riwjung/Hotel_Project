"use client";

import { useMemo, useState } from "react";
import { Button, Card, Empty, Input, Space, Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { sortNumber, sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import { useCrudEditor } from "@/app/lib/use-crud-editor";
import LoadError from "../LoadError";
import { createAmenity, deleteAmenity, fetchAmenities, updateAmenity } from "./amenity.api";
import { AMENITY_ICONS } from "./amenity-icons";
import AmenityModal from "./AmenityModal";
import type { Amenity, AmenityInput } from "./types";

export default function AmenityPage() {
  const { user, can } = useSession();
  // amenities are shared by every branch: only chain-level staff change them (API: requireChainScope)
  const canManage = can("ROOM_MANAGE") && user?.scopeLevel === "CHAIN";
  const amenities = useApiData(fetchAmenities, "amenities");
  const [search, setSearch] = useState("");
  const editor = useCrudEditor<Amenity, AmenityInput>({
    noun: "amenity",
    label: (a) => a.amenityName,
    create: createAmenity,
    update: (a, input) => updateAmenity(a.amenityId, input),
    remove: (a) => deleteAmenity(a.amenityId),
    removeWarning: "This cannot be undone. The amenity is also removed from every room type that lists it.",
    onChanged: () => amenities.reload(),
  });

  const all = useMemo(() => amenities.data ?? [], [amenities.data]);
  const groups = useMemo(() => [...new Set(all.map((a) => a.amenityGroup))].sort(), [all]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? all.filter((a) => `${a.amenityName} ${a.amenityGroup}`.toLowerCase().includes(q)) : all;
  }, [all, search]);

  const columns: TableColumnsType<Amenity> = [
    {
      title: "Amenity",
      dataIndex: "amenityName",
      sorter: sortText<Amenity>((a) => a.amenityName),
      render: (value: string, a) => (
        <Space size={8}>
          {(a.icon && AMENITY_ICONS[a.icon]) ?? null}
          <Typography.Text strong>{value}</Typography.Text>
        </Space>
      ),
    },
    { title: "Group", dataIndex: "amenityGroup", defaultSortOrder: "ascend", sorter: sortText<Amenity>((a) => a.amenityGroup) },
    {
      title: "Icon",
      dataIndex: "icon",
      sorter: sortText<Amenity>((a) => a.icon),
      render: (value: string | null) => value ?? <Typography.Text type="secondary">—</Typography.Text>,
    },
    { title: "Room types", dataIndex: "roomTypeCount", align: "right", sorter: sortNumber<Amenity>((a) => a.roomTypeCount) },
  ];
  if (canManage) {
    columns.push({
      title: "",
      key: "actions",
      fixed: "right",
      width: 96,
      render: (_, a) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} aria-label={`Edit ${a.amenityName}`} onClick={(e) => { e.stopPropagation(); editor.openEdit(a); }} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Delete ${a.amenityName}`} onClick={(e) => { e.stopPropagation(); editor.remove(a); }} />
          </Tooltip>
        </Space>
      ),
    });
  }

  return (
    <>
      {amenities.error && <LoadError error={amenities.error} onRetry={amenities.reload} />}
      <Card
        variant="outlined"
        title="Amenities"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <Input allowClear prefix={<SearchOutlined />} placeholder="Name or group" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} />
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={editor.openCreate}>
                New amenity
              </Button>
            )}
          </Space>
        }
      >
        {!amenities.loading && !amenities.error && rows.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={search ? "No amenities match the search." : "No amenities yet."} style={{ padding: 32 }} />
        ) : (
          <Table<Amenity>
            rowKey="amenityId"
            size="middle"
            loading={amenities.loading}
            columns={columns}
            dataSource={rows}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
            onRow={(a) => (canManage ? { onClick: () => editor.openEdit(a), style: { cursor: "pointer" } } : {})}
          />
        )}
      </Card>
      <AmenityModal open={editor.open} amenity={editor.editing} groups={groups} saving={editor.saving} onCancel={editor.close} onSubmit={editor.save} />
    </>
  );
}
