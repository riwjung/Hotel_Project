"use client";

import { useState } from "react";
import { App, Button, Card, Empty, Select, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useSession } from "@/app/lib/auth-client";
import { ROOM_STATUS, statusOptions } from "@/app/lib/status";
import { useApiData } from "@/app/lib/use-api-data";
import { useCrudEditor } from "@/app/lib/use-crud-editor";
import BranchFilter from "../BranchFilter";
import LoadError from "../LoadError";
import { fetchRoomTypes } from "../room-type/room-type.api";
import { createRoom, deleteRoom, fetchRooms, setRoomStatus, updateRoom } from "./room.api";
import RoomModal from "./RoomModal";
import RoomTable from "./RoomTable";
import type { ManualRoomStatus, Room, RoomFilter, RoomInput } from "./types";

export default function RoomPage() {
  const { message } = App.useApp();
  const { user, can } = useSession();
  const canManage = can("ROOM_MANAGE");
  const [filter, setFilter] = useState<RoomFilter>({});

  const rooms = useApiData((signal) => fetchRooms(filter, signal), JSON.stringify(filter));
  const types = useApiData((signal) => (canManage ? fetchRoomTypes(signal) : Promise.resolve([])), `room-page-types:${canManage}`);
  const editor = useCrudEditor<Room, RoomInput>({
    noun: "room",
    label: (r) => r.roomNumber,
    create: createRoom,
    update: (r, input) => updateRoom(r.roomId, input),
    remove: (r) => deleteRoom(r.roomId),
    removeWarning: "This cannot be undone. A room with bookings, cleaning tasks or repairs on record cannot be deleted — set it Out of service instead.",
    onChanged: () => rooms.reload(),
  });

  const changeStatus = async (room: Room, status: ManualRoomStatus) => {
    try {
      const { roomStatus } = await setRoomStatus(room.roomId, status);
      if (roomStatus === status) {
        message.success(`Room ${room.roomNumber} is now ${ROOM_STATUS[status].label}`);
      } else {
        message.warning(`Room ${room.roomNumber} stays ${ROOM_STATUS[roomStatus].label} while a repair is open`);
      }
      rooms.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not change the room status");
    }
  };

  const data = rooms.data ?? [];

  return (
    <>
      {rooms.error && <LoadError error={rooms.error} onRetry={rooms.reload} />}

      <Card
        variant="outlined"
        title="Rooms"
        styles={{ body: { padding: 0 } }}
        extra={
          <Space wrap>
            <BranchFilter value={filter.branchId} onChange={(branchId) => setFilter((f) => ({ ...f, branchId }))} width={200} />
            <Select
              allowClear
              placeholder="All statuses"
              style={{ width: 170 }}
              value={filter.status}
              onChange={(status) => setFilter((f) => ({ ...f, status }))}
              options={statusOptions(ROOM_STATUS)}
            />
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={editor.openCreate}>
                New room
              </Button>
            )}
          </Space>
        }
      >
        {!rooms.loading && !rooms.error && data.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              filter.branchId || filter.status
                ? "No rooms match these filters. Clear a filter to see more."
                : canManage
                  ? "No rooms yet. Add one with “New room”."
                  : "No rooms yet."
            }
            style={{ padding: 32 }}
          />
        ) : (
          <RoomTable
            rooms={data}
            loading={rooms.loading}
            showBranch={user?.scopeLevel === "CHAIN"}
            canManage={canManage}
            onEdit={editor.openEdit}
            onDelete={editor.remove}
            onSetStatus={changeStatus}
          />
        )}
      </Card>

      <RoomModal
        open={editor.open}
        room={editor.editing}
        roomTypes={types.data ?? []}
        saving={editor.saving}
        onCancel={editor.close}
        onSubmit={editor.save}
      />
    </>
  );
}
