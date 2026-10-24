"use client";

import { Button, Card, Empty, Space, Table, Tooltip, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { formatMoney } from "@/app/lib/format";
import { sortNumber, sortText } from "@/app/lib/table-sort";
import { useApiData } from "@/app/lib/use-api-data";
import { useCrudEditor } from "@/app/lib/use-crud-editor";
import { fetchAmenities } from "../amenity/amenity.api";
import AmenityTag from "../amenity/AmenityTag";
import LoadError from "../LoadError";
import { createRoomType, deleteRoomType, fetchRoomTypes, updateRoomType } from "./room-type.api";
import RoomTypeModal from "./RoomTypeModal";
import type { RoomType, RoomTypeInput } from "./types";

export default function RoomTypePage() {
  const { user, can } = useSession();
  // shared by every branch: only chain-level staff change them (API: requireChainScope)
  const canManage = can("ROOM_MANAGE") && user?.scopeLevel === "CHAIN";
  const types = useApiData(fetchRoomTypes, "room-types");
  const amenities = useApiData(fetchAmenities, "room-type-amenities");
  const amenitiesById = new Map((amenities.data ?? []).map((amenity) => [amenity.amenityId, amenity]));
  const editor = useCrudEditor<RoomType, RoomTypeInput>({
    noun: "room type",
    label: (t) => t.typeCode,
    create: createRoomType,
    update: (t, input) => updateRoomType(t.roomTypeId, input),
    remove: (t) => deleteRoomType(t.roomTypeId),
    removeWarning: "This cannot be undone. A type that rooms or rates still use cannot be deleted.",
    onChanged: () => {
      types.reload();
      amenities.reload();
    },
  });

  const columns: TableColumnsType<RoomType> = [
    {
      title: "Type",
      key: "type",
      sorter: sortText<RoomType>((t) => t.typeName),
      render: (_, t) => (
        <>
          <Typography.Text strong>{t.typeName}</Typography.Text> <Typography.Text type="secondary">{t.typeCode}</Typography.Text>
        </>
      ),
    },
    { title: "Sleeps", dataIndex: "capacity", align: "right", sorter: sortNumber<RoomType>((t) => t.capacity) },
    { title: "Bed", dataIndex: "bedType", sorter: sortText<RoomType>((t) => t.bedType) },
    { title: "Base price", dataIndex: "basePrice", align: "right", defaultSortOrder: "ascend", sorter: sortNumber<RoomType>((t) => t.basePrice), render: formatMoney },
    {
      title: "Amenities",
      key: "amenities",
      sorter: sortNumber<RoomType>((t) => t.amenityNames.length),
      render: (_, t) =>
        t.amenityNames.length ? (
          <Space size={[4, 4]} wrap style={{ maxWidth: 360 }}>
            {t.amenityNames.map((name, index) => (
              <AmenityTag key={t.amenityIds[index]} amenityName={name} icon={amenitiesById.get(t.amenityIds[index])?.icon} />
            ))}
          </Space>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    { title: "Rooms", dataIndex: "roomCount", align: "right", sorter: sortNumber<RoomType>((t) => t.roomCount) },
    { title: "Rates", dataIndex: "rateCount", align: "right", sorter: sortNumber<RoomType>((t) => t.rateCount) },
  ];
  if (canManage) {
    columns.push({
      title: "",
      key: "actions",
      fixed: "right",
      width: 96,
      render: (_, t) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} aria-label={`Edit ${t.typeCode}`} onClick={(e) => { e.stopPropagation(); editor.openEdit(t); }} />
          </Tooltip>
          <Tooltip title={t.roomCount || t.rateCount ? "Rooms or rates use this type" : "Delete"}>
            <Button
              type="text"
              danger
              disabled={t.roomCount > 0 || t.rateCount > 0}
              icon={<DeleteOutlined />}
              aria-label={`Delete ${t.typeCode}`}
              onClick={(e) => { e.stopPropagation(); editor.remove(t); }}
            />
          </Tooltip>
        </Space>
      ),
    });
  }

  const data = types.data ?? [];
  const error = types.error ?? amenities.error;

  return (
    <>
      {error && <LoadError error={error} onRetry={() => { types.reload(); amenities.reload(); }} />}
      <Card
        variant="outlined"
        title="Room types"
        styles={{ body: { padding: 0 } }}
        extra={
          canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={editor.openCreate}>
              New room type
            </Button>
          )
        }
      >
        {!types.loading && !types.error && data.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No room types yet." style={{ padding: 32 }} />
        ) : (
          <Table<RoomType>
            rowKey="roomTypeId"
            size="middle"
            loading={types.loading}
            columns={columns}
            dataSource={data}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
            onRow={(t) => (canManage ? { onClick: () => editor.openEdit(t), style: { cursor: "pointer" } } : {})}
          />
        )}
      </Card>
      <RoomTypeModal
        open={editor.open}
        roomType={editor.editing}
        amenities={amenities.data ?? []}
        saving={editor.saving}
        onCancel={editor.close}
        onSubmit={editor.save}
      />
    </>
  );
}
